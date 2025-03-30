import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { UseGuards } from '@nestjs/common';
import { CurrentUser } from './decorators/current-user.decorator';
import { AuthResult } from './dto/auth.result';
import { SignUpInput } from './dto/sign-up.input';
import { LoginInput } from './dto/login.input';
import { GqlJwtAuthGuard } from './guards/gql-jwt-auth.guard';
import { CurrentUserDto } from '../user/dto/current-user.dto';
import { ResetPasswordInput } from './dto/reset-password.input';
import { Throttle } from '@nestjs/throttler';

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Mutation(() => AuthResult)
  login(@Args('input') loginInput: LoginInput) {
    return this.authService.login(loginInput);
  }

  @Mutation(() => AuthResult)
  signUp(@Args('input') signUpInput: SignUpInput) {
    return this.authService.signUp(signUpInput);
  }

  @Mutation(() => AuthResult)
  refresh(@Args('refreshToken') refreshToken: string) {
    return this.authService.refresh(refreshToken);
  }

  @Mutation(() => Boolean)
  @UseGuards(GqlJwtAuthGuard)
  logout(
    @CurrentUser() user: CurrentUserDto,
    @Args('refreshToken') refreshToken: string,
  ) {
    return this.authService.logout(user.id, refreshToken);
  }

  @Mutation(() => Boolean)
  @UseGuards(GqlJwtAuthGuard)
  updatePassword(
    @Args('oldPassword') oldPassword: string,
    @Args('newPassword') newPassword: string,
    @CurrentUser() currentUser: CurrentUserDto,
  ) {
    return this.authService.updatePassword(
      currentUser.id,
      oldPassword,
      newPassword,
    );
  }

  @Throttle({ default: { limit: 60000, ttl: 1 } })
  @Mutation(() => Boolean)
  forgotPassword(@Args('email') email: string) {
    return this.authService.forgotPassword(email);
  }

  @Mutation(() => Boolean)
  resetPassword(@Args('input') input: ResetPasswordInput) {
    return this.authService.resetPassword(input);
  }
}
