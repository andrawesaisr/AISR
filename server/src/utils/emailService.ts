import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create reusable transporter
// For Gmail: Use App Password (not regular password)
// For other SMTP: Use your SMTP credentials
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER, // Your email
    pass: process.env.SMTP_PASS, // Your app password
  },
});

export interface InvitationEmailData {
  to: string;
  organizationName: string;
  inviterName: string;
  inviteLink: string;
  role: string;
}

export const sendInvitationEmail = async (data: InvitationEmailData): Promise<boolean> => {
  try {
    // Check if email is configured
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn('Email not configured. Invitation link:', data.inviteLink);
      return false;
    }

    const mailOptions = {
      from: `"${process.env.APP_NAME || 'AISR'}" <${process.env.SMTP_USER}>`,
      to: data.to,
      subject: `You're invited to join ${data.organizationName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #0ea5e9 0%, #a855f7 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .logo { width: 48px; height: 48px; margin: 0 auto 10px; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #0ea5e9; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            .info-box { background: white; padding: 15px; border-left: 4px solid #0ea5e9; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <img src="https://i.imgur.com/YourLogoHere.png" alt="AISR Logo" class="logo" style="width: 48px; height: 48px; margin: 0 auto 10px; display: block;" />
              <h1>🎉 You're Invited!</h1>
            </div>
            <div class="content">
              <p>Hi there!</p>
              
              <p><strong>${data.inviterName}</strong> has invited you to join <strong>${data.organizationName}</strong> on AISR.</p>
              
              <div class="info-box">
                <p><strong>Your Role:</strong> ${data.role}</p>
                <p><strong>Organization:</strong> ${data.organizationName}</p>
              </div>
              
              <p>AISR is an all-in-one project management platform combining the best of Jira, Notion, and Miro:</p>
              <ul>
                <li>📋 Issue tracking & sprint management</li>
                <li>📝 Rich document collaboration</li>
                <li>🎨 Visual whiteboards</li>
                <li>🤝 Team collaboration</li>
              </ul>
              
              <center>
                <a href="${data.inviteLink}" class="button">Accept Invitation</a>
              </center>
              
              <p style="color: #666; font-size: 14px; margin-top: 20px;">
                Or copy and paste this link into your browser:<br>
                <code style="background: #e5e7eb; padding: 5px 10px; border-radius: 4px; display: inline-block; margin-top: 5px;">${data.inviteLink}</code>
              </p>
              
              <p style="color: #ef4444; font-size: 14px; margin-top: 20px;">
                ⚠️ This invitation will expire in 7 days.
              </p>
            </div>
            <div class="footer">
              <p>This email was sent by AISR. If you didn't expect this invitation, you can safely ignore this email.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
You're invited to join ${data.organizationName}!

${data.inviterName} has invited you to join ${data.organizationName} on AISR as a ${data.role}.

AISR is an all-in-one project management platform combining:
- Issue tracking & sprint management
- Rich document collaboration  
- Visual whiteboards
- Team collaboration

Accept your invitation by visiting:
${data.inviteLink}

This invitation will expire in 7 days.

If you didn't expect this invitation, you can safely ignore this email.
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log('Invitation email sent to:', data.to);
    return true;
  } catch (error) {
    console.error('Error sending invitation email:', error);
    return false;
  }
};

// Verify email configuration on startup
export const verifyEmailConfig = async (): Promise<boolean> => {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn('⚠️  Email not configured. Set SMTP_USER and SMTP_PASS in .env file.');
      return false;
    }
    
    await transporter.verify();
    console.log('✅ Email service ready');
    return true;
  } catch (error) {
    console.error('❌ Email service error:', error);
    return false;
  }
};
