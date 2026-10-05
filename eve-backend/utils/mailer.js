function getEmailConfig() {
  const scriptUrl = process.env.GOOGLE_APPS_SCRIPT_URL;
  const secret = process.env.GOOGLE_APPS_SCRIPT_SECRET;

  if (!scriptUrl || !secret) {
    const error = new Error("Set GOOGLE_APPS_SCRIPT_URL and GOOGLE_APPS_SCRIPT_SECRET in the backend environment.");
    error.code = "EMAIL_NOT_CONFIGURED";
    throw error;
  }

  return { scriptUrl, secret };
}

async function sendMail(message) {
  const { scriptUrl, secret } = getEmailConfig();
  const response = await fetch(scriptUrl, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      secret,
      to: message.to,
      subject: message.subject,
      text: message.text,
    }),
    signal: AbortSignal.timeout(20000),
  });

  const responseText = await response.text();
  let result;
  try {
    result = responseText ? JSON.parse(responseText) : null;
  } catch {
    const error = new Error("Google Apps Script returned a non-JSON response. Check the deployed web app URL and access settings.");
    error.code = "EMAIL_INVALID_RESPONSE";
    throw error;
  }

  if (!response.ok || result?.success !== true) {
    const detail = result?.message || response.statusText || "Unknown email delivery error";
    const error = new Error(`Google Apps Script email delivery failed: ${detail}`);
    error.code = "EMAIL_DELIVERY_FAILED";
    throw error;
  }

  return result;
}

function verifyEmailConfiguration() {
  getEmailConfig();
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
  const certificateUrl = process.env.FRONTEND_URL && registration._id
    ? `${process.env.FRONTEND_URL.replace(/\/+$/, "")}/event-e-certificates/${registration._id}`
    : null;

  return sendMail({
    to: registration.studentEmail,
    subject: `Your Eventexa certificate for ${registration.eventName}`,
    text: `Hi ${registration.studentName},\n\nYour certificate for ${registration.eventName} has been generated.\n\nCertificate ID: ${registration.certificateId}${certificateUrl ? `\n\nView your certificate:\n${certificateUrl}` : "\n\nSign in to Eventexa to view your certificate."}\n\nEventexa`,
  });
}

function sendEventFeedbackEmail(student, event, googleFormUrl, appFeedbackUrl) {
  const eventName = event.title || event.name;

  if (!googleFormUrl && !appFeedbackUrl) {
    throw new Error("Neither a Google Form URL nor an Eventexa feedback page is configured");
  }

  return sendMail({
    to: student.email,
    subject: `Feedback for ${eventName}`,
    text: `Hi ${student.name},\n\nThank you for attending ${eventName}. We would appreciate your feedback.${googleFormUrl ? `\n\nComplete the Google Form:\n${googleFormUrl}` : ""}${appFeedbackUrl ? `\n\nYou can also submit feedback in your Eventexa account:\n${appFeedbackUrl}` : ""}\n\nEventexa`,
  });
}

function sendFeedbackSubmissionEmail(admin, registration) {
  return sendMail({
    to: admin.email,
    subject: `Student feedback received: ${registration.eventName}`,
    text: `Hello ${admin.name || "Admin"},\n\n${registration.studentName} (${registration.studentEmail}) submitted feedback for ${registration.eventName}.\n\nRating: ${registration.feedbackRating}/5\n\nFeedback:\n${registration.feedbackText}\n\nEventexa`,
  });
}

module.exports = {
  sendMail,
  verifyEmailConfiguration,
  sendStudentWelcomeEmail,
  sendEventRegistrationEmail,
  sendCertificateEmail,
  sendEventFeedbackEmail,
  sendFeedbackSubmissionEmail,
};