import { UserModel } from '../../user/entities/user.model';
import { IsEmail, IsHash } from 'class-validator';

export class RegisterInput implements Partial<UserModel> {
  @IsEmail()
  email!: string;

  @IsHash('sha512')
  password!: string;
}
