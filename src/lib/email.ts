import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
  port: parseInt(process.env.SMTP_PORT || '2525'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER || 'your-mailtrap-user',
    pass: process.env.SMTP_PASS || 'your-mailtrap-pass',
  },
})

export async function sendRegistrationEmail(
  to: string,
  participantName: string,
  eventName: string,
  eventDetails: string,
  ticketPath?: string
) {
  const mailOptions = {
    from: process.env.FROM_EMAIL || 'noreply@eventmanager.com',
    to,
    subject: `Registration Confirmed - ${eventName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">Registration Confirmed!</h1>
        </div>
        <div style="padding: 30px; background: #f8f9fa;">
          <h2 style="color: #333;">Hello ${participantName},</h2>
          <p style="color: #666; line-height: 1.6;">
            Thank you for registering for <strong>${eventName}</strong>. 
            Your registration has been confirmed successfully.
          </p>
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Event Details:</h3>
            <p style="color: #666; line-height: 1.6;">${eventDetails}</p>
          </div>
          <p style="color: #666; line-height: 1.6;">
            Please keep this email for your records. If you have any questions, 
            feel free to contact our support team.
          </p>
        </div>
        <div style="padding: 20px; text-align: center; background: #333; color: white;">
          <p style="margin: 0;">Event Management System</p>
        </div>
      </div>
    `,
    attachments: ticketPath ? [
      {
        filename: 'ticket.pdf',
        path: ticketPath,
      }
    ] : []
  }

  try {
    await transporter.sendMail(mailOptions)
    return true
  } catch (error) {
    console.error('Email sending failed:', error)
    return false
  }
}

export async function sendCertificateEmail(
  to: string,
  participantName: string,
  eventName: string,
  certificatePath: string
) {
  const mailOptions = {
    from: process.env.FROM_EMAIL || 'noreply@eventmanager.com',
    to,
    subject: `Certificate - ${eventName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">Certificate Ready!</h1>
        </div>
        <div style="padding: 30px; background: #f8f9fa;">
          <h2 style="color: #333;">Congratulations ${participantName}!</h2>
          <p style="color: #666; line-height: 1.6;">
            Your certificate for <strong>${eventName}</strong> is ready. 
            Please find it attached to this email.
          </p>
          <p style="color: #666; line-height: 1.6;">
            Thank you for your participation. We hope you enjoyed the event!
          </p>
        </div>
        <div style="padding: 20px; text-align: center; background: #333; color: white;">
          <p style="margin: 0;">Event Management System</p>
        </div>
      </div>
    `,
    attachments: [
      {
        filename: 'certificate.pdf',
        path: certificatePath,
      }
    ]
  }

  try {
    await transporter.sendMail(mailOptions)
    return true
  } catch (error) {
    console.error('Certificate email sending failed:', error)
    return false
  }
}
