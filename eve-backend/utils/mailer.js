const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendMail(message) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    const error = new Error("Email notifications are not configured");
    error.code = "EMAIL_NOT_CONFIGURED";
    throw error;
  }

  return transporter.sendMail({
    from: {
      name: "Eventexa",
      address: process.env.EMAIL_USER,
    },
    ...message,
  });
}

async function verifyEmailTransport() {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    const error = new Error("Set EMAIL_USER and EMAIL_PASS in the backend environment.");
    error.code = "EMAIL_NOT_CONFIGURED";
    throw error;
  }

  return transporter.verify();
}

function sendStudentWelcomeEmail(student) {
  return sendMail({
    to: student.email,
    subject: "Welcome to Eventexa",
    text: `Hi ${student.name},\n\nYour Eventexa student account has been created successfully. You can now sign in and register for campus events.\n\nEventexa`,
  });
}

function sendEventRegistrationEmail(student, event) {
  const eventName = event.title || event.name;
  const eventDate = event.date ? `\nDate: ${event.date}` : "";
  const eventTime = event.startTime || event.time;
  const eventVenue = event.venue || event.location;

  return sendMail({
    to: student.email,
    subject: `Registration confirmed: ${eventName}`,
    text: `Hi ${student.name},\n\nYour registration for ${eventName} is confirmed.${eventDate}${eventTime ? `\nTime: ${eventTime}` : ""}${eventVenue ? `\nVenue: ${eventVenue}` : ""}\n\nWe look forward to seeing you there.\n\nEventexa`,
  });
}

function sendCertificateEmail(registration) {
  return sendMail({
    to: registration.studentEmail,
    subject: `Your Eventexa certificate for ${registration.eventName}`,
    text: `Hi ${registration.studentName},\n\nYour certificate for ${registration.eventName} has been generated.\n\nCertificate ID: ${registration.certificateId}\n\nEventexa\nYou can download your certificate from your Eventexa account.\n\nEventexa`,
  });
}

function sendEventFeedbackEmail(student, event, googleFormUrl) {
  const eventName = event.title || event.name;

  if (!googleFormUrl) {
    throw new Error("Google feedback form URL is not configured");
  }

  return sendMail({
    to: student.email,
    subject: `Feedback for ${eventName}`,
    text: `Hi ${student.name},\n\nThank you for attending ${eventName}. We would appreciate your feedback.\n\nPlease complete this Google Form:\n${googleFormUrl}\n\nEventexa`,
  });
}

module.exports = {
  sendMail,
  verifyEmailTransport,
  sendStudentWelcomeEmail,
  sendEventRegistrationEmail,
  sendCertificateEmail,
  sendEventFeedbackEmail,
};