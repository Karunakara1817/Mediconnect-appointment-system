const nodemailer = require("nodemailer");

function buildHtmlTemplate({ recipientName, subject, message, type }) {
    const safeName = recipientName || "User";
    const badge = type || "NOTIFICATION";

    return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
      <div style="background: #0f766e; color: #ffffff; padding: 20px 24px;">
        <h2 style="margin: 0; font-size: 20px;">MediConnect Healthcare</h2>
        <span style="display: inline-block; margin-top: 6px; font-size: 12px; letter-spacing: 0.5px; opacity: 0.9;">${badge}</span>
      </div>
      <div style="padding: 24px; color: #1e293b; line-height: 1.6;">
        <p style="margin-top: 0;">Hello <strong>${safeName}</strong>,</p>
        <h3 style="margin: 0 0 12px 0; color: #0f172a;">${subject}</h3>
        <p style="margin: 0 0 16px 0;">${message}</p>
        <p style="margin: 24px 0 0 0; font-size: 13px; color: #64748b;">This is an automated message from MediConnect.</p>
      </div>
    </div>
  `;
}

async function dispatchEmail(payload) {
    const emailMode = (process.env.EMAIL_MODE || "console").toLowerCase();
    const hasSmtpCredentials = Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);

    if (emailMode !== "smtp" || !hasSmtpCredentials) {
        console.log("========================================");
        console.log("[NOTIFICATION DISPATCHED - CONSOLE MODE]");
        console.log(`Type:      ${payload.type || "GENERAL"}`);
        console.log(`To:        ${payload.recipientName || "User"} <${payload.recipientEmail}>`);
        console.log(`Subject:   ${payload.subject}`);
        console.log(`Message:   ${payload.message}`);
        console.log(`Timestamp: ${new Date().toISOString()}`);
        console.log("========================================");

        return {
            delivered: true,
            deliveryMode: "console",
            messageId: `local-${Date.now()}`
        };
    }

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: String(process.env.SMTP_SECURE).toLowerCase() === "true",
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });

    const info = await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: payload.recipientEmail,
        subject: payload.subject,
        text: payload.message,
        html: buildHtmlTemplate(payload)
    });

    return {
        delivered: true,
        deliveryMode: "smtp",
        messageId: info.messageId
    };
}

module.exports = { dispatchEmail };