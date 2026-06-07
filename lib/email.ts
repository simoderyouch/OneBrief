import { Resend } from 'resend';

let resendSingleton: Resend | null = null;

function getResend(): Resend {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    throw new Error('RESEND_API_KEY is not configured');
  }
  if (!resendSingleton) {
    resendSingleton = new Resend(key);
  }
  return resendSingleton;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

/**
 * Send an email using Resend
 */
export async function sendEmail({ to, subject, html }: SendEmailParams) {
  try {
    const resend = getResend();
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'noreply@freelancer.com',
      to,
      subject,
      html,
    });

    if (error) {
      console.error('Email send error:', error);
      throw new Error('Failed to send email');
    }

    return data;
  } catch (error) {
    console.error('Email error:', error);
    throw error;
  }
}

/**
 * Email template: Feedback received (to freelancer)
 */
export function feedbackReceivedEmail(
  freelancerName: string,
  projectTitle: string,
  feedbackType: string,
  feedbackMessage: string,
  projectUrl: string,
  submitterName?: string | null
) {
  const fromLine =
    submitterName && submitterName.trim()
      ? `<p style="margin: 12px 0 0;"><strong>From (client):</strong> ${escapeHtml(submitterName.trim())}</p>`
      : "";
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #000; color: #fff; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .badge { display: inline-block; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
          .badge-change { background-color: #fef3c7; color: #92400e; }
          .badge-approval { background-color: #d1fae5; color: #065f46; }
          .badge-question { background-color: #dbeafe; color: #1e40af; }
          .button { display: inline-block; padding: 12px 24px; background-color: #000; color: #fff; text-decoration: none; border-radius: 4px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>New Feedback Received</h1>
          </div>
          <div class="content">
            <p>Hi ${freelancerName},</p>
            <p>Your client has left feedback on <strong>${projectTitle}</strong>.</p>
            ${fromLine}
            <p>
              <span class="badge badge-${feedbackType === 'CHANGE_REQUEST' ? 'change' : feedbackType === 'APPROVAL' ? 'approval' : 'question'}">${feedbackType.replace('_', ' ')}</span>
            </p>
            <p style="background: #fff; padding: 15px; border-left: 3px solid #000; margin: 20px 0;">
              ${feedbackMessage}
            </p>
            <a href="${projectUrl}" class="button">View Project</a>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Email template: New version uploaded (to client)
 */
export function newVersionEmail(
  clientName: string,
  projectTitle: string,
  versionNumber: number,
  freelancerNote: string,
  projectUrl?: string
) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #000; color: #fff; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .version-badge { display: inline-block; padding: 4px 12px; background-color: #000; color: #fff; border-radius: 4px; font-weight: 600; }
          .button { display: inline-block; padding: 12px 24px; background-color: #000; color: #fff; text-decoration: none; border-radius: 4px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>New Version Available</h1>
          </div>
          <div class="content">
            <p>Hi ${clientName},</p>
            <p>A new version of <strong>${projectTitle}</strong> is ready for your review.</p>
            <p><span class="version-badge">Version ${versionNumber}</span></p>
            ${freelancerNote ? `<p style="background: #fff; padding: 15px; border-left: 3px solid #000; margin: 20px 0;">${freelancerNote}</p>` : ''}
            ${
              projectUrl
                ? `<a href="${projectUrl}" class="button">View Project</a>`
                : `<p style="margin-top:20px;color:#666;font-size:14px;">Open the private project link your designer sent you.</p>`
            }
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Email template: project status changed (to client)
 */
export function projectStatusChangedEmail(
  clientName: string,
  projectTitle: string,
  statusLabel: string,
  projectUrl?: string
) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #000; color: #fff; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .button { display: inline-block; padding: 12px 24px; background-color: #000; color: #fff; text-decoration: none; border-radius: 4px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Project update</h1>
          </div>
          <div class="content">
            <p>Hi ${clientName || "there"},</p>
            <p><strong>${projectTitle}</strong> is now: <strong>${statusLabel}</strong>.</p>
            ${
              projectUrl
                ? `<a href="${projectUrl}" class="button">View project</a>`
                : "<p style=\"margin-top:16px;color:#666;font-size:14px;\">Use the private link your designer sent you to view the project.</p>"
            }
          </div>
        </div>
      </body>
    </html>
  `;
}
