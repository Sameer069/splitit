import nodemailer, { Transporter } from 'nodemailer';
import { env } from '../utils/env';
import { logger } from '../utils/logger';

class EmailService {
  private transporter: Transporter | null = null;

  constructor() {
    if (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS) {
      this.transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_PORT === 465,
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS,
        },
      });
      logger.info('Email service initialized');
    } else {
      logger.warn('Email service not configured - emails will be logged only');
    }
  }

  private async send(to: string, subject: string, html: string): Promise<void> {
    if (!this.transporter) {
      logger.info({ to, subject }, 'Email would be sent (SMTP not configured):');
      logger.info(html);
      return;
    }

    try {
      await this.transporter.sendMail({
        from: env.EMAIL_FROM,
        to,
        subject,
        html,
      });
      logger.info({ to, subject }, 'Email sent successfully');
    } catch (error) {
      logger.error({ error, to, subject }, 'Failed to send email');
      throw error;
    }
  }

  async sendPasswordResetEmail(email: string, resetToken: string): Promise<void> {
    const resetUrl = `${env.WEB_APP_URL}/reset-password?token=${resetToken}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .button { 
              display: inline-block; 
              padding: 12px 24px; 
              background-color: #4F46E5; 
              color: white; 
              text-decoration: none; 
              border-radius: 6px;
              margin: 20px 0;
            }
            .footer { margin-top: 30px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>Reset Your Password</h2>
            <p>You requested to reset your password for your SplitIt account.</p>
            <p>Click the button below to set a new password:</p>
            <a href="${resetUrl}" class="button">Reset Password</a>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #4F46E5;">${resetUrl}</p>
            <p>This link will expire in 1 hour.</p>
            <p>If you didn't request this, you can safely ignore this email.</p>
            <div class="footer">
              <p>This is an automated email from SplitIt. Please do not reply.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await this.send(email, 'Reset Your Password - SplitIt', html);
  }

  async sendGroupInviteEmail(
    email: string,
    groupName: string,
    inviterName: string,
    inviteToken: string
  ): Promise<void> {
    // Deep link for mobile app with web fallback
    const inviteUrl = `${env.WEB_APP_URL}/invite/${inviteToken}`;
    const deepLink = `splitwiseapp://invite/${inviteToken}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .button { 
              display: inline-block; 
              padding: 12px 24px; 
              background-color: #16A34A; 
              color: white; 
              text-decoration: none; 
              border-radius: 6px;
              margin: 20px 0;
            }
            .group-name { font-weight: bold; color: #4F46E5; }
            .footer { margin-top: 30px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>You're Invited to Join a Group!</h2>
            <p><strong>${inviterName}</strong> has invited you to join <span class="group-name">"${groupName}"</span> on SplitIt.</p>
            <p>Accept this invitation to start sharing expenses with your group.</p>
            <a href="${inviteUrl}" class="button">Accept Invitation</a>
            <p>Or open this link on your mobile device:</p>
            <p style="word-break: break-all; color: #4F46E5;">${deepLink}</p>
            <p>This invitation will expire in 7 days.</p>
            <div class="footer">
              <p>This is an automated email from SplitIt. Please do not reply.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await this.send(
      email,
      `${inviterName} invited you to join "${groupName}" on SplitIt`,
      html
    );
  }

  async sendWelcomeEmail(email: string, name: string): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .footer { margin-top: 30px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>Welcome to SplitIt, ${name}! 🎉</h2>
            <p>Your account has been created successfully.</p>
            <p>You can now create groups, add expenses, and split bills with your friends and roommates.</p>
            <p>Get started by creating your first group!</p>
            <div class="footer">
              <p>This is an automated email from SplitIt. Please do not reply.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await this.send(email, 'Welcome to SplitIt!', html);
  }
}

export const emailService = new EmailService();
