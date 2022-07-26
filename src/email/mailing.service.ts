import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { EmailConfirmationModel } from './entities/email-confirmation.model';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailingService {
  constructor(
    private readonly configService: ConfigService,
    private readonly mailerService: MailerService,
  ) {}

  async sendConfirmation(confirmation: EmailConfirmationModel) {
    await this.mailerService.sendMail({
      to: confirmation.email,
      from: this.configService.get('MAIL_USER'),
      subject: 'Confirmation!',
      html: `<a href="https://localhost:3000/${confirmation.email}/${confirmation.id}">Click here to confirm your email</a>`,
    });
  }
}
