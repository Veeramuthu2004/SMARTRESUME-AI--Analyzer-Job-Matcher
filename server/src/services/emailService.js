const nodemailer = require("nodemailer");
const env = require("../config/env");

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;
  const placeholderHost =
    !env.smtpHost || /example\.com|localhost|dummy/i.test(env.smtpHost);

  if (placeholderHost || !env.smtpUser || !env.smtpPass) {
    if (env.nodeEnv !== "production") {
      transporter = nodemailer.createTransport({ jsonTransport: true });
      return transporter;
    }
    return null;
  }

  transporter = nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpPort === 465,
    auth: {
      user: env.smtpUser,
      pass: env.smtpPass,
    },
  });
  return transporter;
};

const sendMail = async ({ to, subject, html, text }) => {
  const tx = getTransporter();
  if (!tx) return false;

  await tx.sendMail({
    from: env.mailFrom,
    to,
    subject,
    html,
    text,
  });
  return true;
};

const sendResetEmail = async ({ to, resetLink }) => {
  return sendMail({
    to,
    subject: "Reset your Smart Resume AI password",
    html: `<p>Reset your password here:</p><p><a href="${resetLink}">${resetLink}</a></p>`,
    text: `Reset your password here: ${resetLink}`,
  });
};

const sendSupportEmail = async ({ fromName, fromEmail, message }) => {
  const recipient = env.supportEmail || env.mailFrom;
  if (!recipient) return false;

  const safeName = fromName || "Smart Resume user";
  const safeEmail = fromEmail || "unknown@example.com";

  return sendMail({
    to: recipient,
    subject: `Support message from ${safeName}`,
    html: `
      <h3>New support message</h3>
      <p><strong>Name:</strong> ${safeName}</p>
      <p><strong>Email:</strong> ${safeEmail}</p>
      <p><strong>Message:</strong></p>
      <p>${String(message || "").replace(/\n/g, "<br />")}</p>
    `,
    text: `Name: ${safeName}\nEmail: ${safeEmail}\n\nMessage:\n${message || ""}`,
  });
};

const sendNotificationEmail = async ({
  to,
  title,
  message,
  enabled = true,
}) => {
  if (!to || !enabled) return false;

  return sendMail({
    to,
    subject: title || "Smart Resume notification",
    html: `<p>${message || "You have a new notification from Smart Resume Analyzer."}</p>`,
    text: message || "You have a new notification from Smart Resume Analyzer.",
  });
};

const sendMarketingEmail = async ({
  to,
  subject,
  html,
  text,
  enabled = true,
}) => {
  if (!to || !enabled) return false;

  return sendMail({
    to,
    subject: subject || "Smart Resume updates",
    html:
      html ||
      `<p>${text || "Here are the latest Smart Resume updates and offers."}</p>`,
    text: text || "Here are the latest Smart Resume updates and offers.",
  });
};

module.exports = {
  sendResetEmail,
  sendSupportEmail,
  sendNotificationEmail,
  sendMarketingEmail,
};
