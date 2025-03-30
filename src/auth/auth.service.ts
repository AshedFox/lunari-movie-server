import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { UserEntity } from '../user/entities/user.entity';
import * as argon2 from 'argon2';
import { SignUpInput } from './dto/sign-up.input';
import { AuthResult } from './dto/auth.result';
import ms, { StringValue } from 'ms';
import { ConfigService } from '@nestjs/config';
import { StripeService } from '../stripe/stripe.service';
import { LoginInput } from './dto/login.input';
import { AlreadyExistsError } from '@utils/errors';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { MailingService } from '../mailing/services/mailing.service';
import { ResetPasswordInput } from './dto/reset-password.input';

@Injectable()
export class AuthService {
  private refreshLifetime: number;
  private resetPasswordTokenLifetime: number;

  constructor(
    private readonly configService: ConfigService,
    @Inject('ACCESS_JWT_SERVICE')
    private readonly accessJwtService: JwtService,
    @Inject('REFRESH_JWT_SERVICE')
    private readonly refreshJwtService: JwtService,
    @Inject('RESET_PASSWORD_JWT_SERVICE')
    private readonly resetPasswordJwtService: JwtService,
    @InjectRedis()
    private readonly redis: Redis,
    private readonly userService: UserService,
    private readonly stripeService: StripeService,
    private readonly mailingService: MailingService,
  ) {
    this.refreshLifetime = ms(
      this.configService.getOrThrow<StringValue>('REFRESH_TOKEN_LIFETIME'),
    );
    this.resetPasswordTokenLifetime = ms(
      this.configService.getOrThrow<StringValue>(
        'RESET_PASSWORD_TOKEN_LIFETIME',
      ),
    );
  }

  private generateResetPasswordToken = async (
    userId: string,
  ): Promise<string> => {
    const token = await this.resetPasswordJwtService.signAsync({
      sub: userId,
    });

    await this.redis.set(
      `reset-password:${userId}`,
      token,
      'PX',
      this.resetPasswordTokenLifetime,
    );

    return token;
  };

  private generateRefreshToken = async (user: UserEntity): Promise<string> => {
    const token = await this.refreshJwtService.signAsync({
      sub: user.id,
      role: user.role,
    });

    await this.redis.set(
      `refresh:${user.id}:${token}`,
      token,
      'PX',
      this.refreshLifetime,
    );

    return token;
  };

  private generateAccessToken = async (user: UserEntity): Promise<string> =>
    this.accessJwtService.signAsync({
      sub: user.id,
      role: user.role,
    });

  private makeAuthResult = async (user: UserEntity): Promise<AuthResult> => ({
    user,
    refreshToken: await this.generateRefreshToken(user),
    accessToken: await this.generateAccessToken(user),
  });

  login = async (loginInput: LoginInput): Promise<AuthResult> => {
    const user = await this.userService.readOneByEmail(loginInput.email);

    if (await argon2.verify(user.password, loginInput.password)) {
      return this.makeAuthResult(user);
    } else {
      throw new UnauthorizedException('User password incorrect!');
    }
  };

  signUp = async (signUpInput: SignUpInput): Promise<AuthResult> => {
    if (signUpInput.password !== signUpInput.passwordRepeat) {
      throw new BadRequestException(
        'Password and password repetition are not equal!',
      );
    }

    const customer = await this.stripeService.createCustomer(
      signUpInput.email,
      signUpInput.name,
    );

    try {
      const user = await this.userService.create({
        email: signUpInput.email,
        name: signUpInput.name,
        customerId: customer.id,
        password: await argon2.hash(signUpInput.password),
      });

      return this.makeAuthResult(user);
    } catch (e) {
      await this.stripeService.removeCustomer(customer.id);

      if (e instanceof AlreadyExistsError) {
        throw new ConflictException('User already exists!');
      }
      throw new InternalServerErrorException('Something went wrong!');
    }
  };

  refresh = async (refreshToken: string): Promise<AuthResult> => {
    const payload = this.refreshJwtService.verify<{ sub: string }>(
      refreshToken,
    );
    const storedToken = await this.redis.getdel(
      `refresh:${payload.sub}:${refreshToken}`,
    );

    if (!storedToken) {
      throw new UnauthorizedException('Invalid refresh token!');
    }

    const user = await this.userService.readOneById(payload.sub);

    return this.makeAuthResult(user);
  };

  logout = async (userId: string, refreshToken: string): Promise<boolean> => {
    return (await this.redis.del(`refresh:${userId}:${refreshToken}`)) > 0;
  };

  updatePassword = async (
    userId: string,
    oldPassword: string,
    newPassword: string,
  ) => {
    const user = await this.userService.readOneById(userId);
    if (!user) {
      throw new NotFoundException(`User not found!`);
    }

    if (!(await argon2.verify(user.password, oldPassword))) {
      throw new UnauthorizedException('User password incorrect!');
    }

    return this.userService.updatePassword(
      userId,
      await argon2.hash(newPassword),
    );
  };

  forgotPassword = async (email: string) => {
    const user = await this.userService.readOneByEmail(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const token = await this.generateResetPasswordToken(user.id);

    await this.redis.set(
      `reset-password:${user.id}`,
      token,
      'PX',
      this.resetPasswordTokenLifetime,
    );

    await this.mailingService.sendPasswordReset(user.email, token);
    return true;
  };

  resetPassword = async ({ token, newPassword }: ResetPasswordInput) => {
    const payload = this.refreshJwtService.verify<{ sub: string }>(token);
    const storedToken = await this.redis.getdel(
      `reset-password:${payload.sub}`,
    );

    if (!storedToken || storedToken !== token) {
      throw new UnauthorizedException('Invalid reset token!');
    }

    return this.userService.updatePassword(
      payload.sub,
      await argon2.hash(newPassword),
    );
  };
}
