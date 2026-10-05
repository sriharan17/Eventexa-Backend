function getEmailConfig() {
  const scriptUrl = process.env.EVENTEXA_MAIL_URL;
  const secret = process.env.EVENTEXA_MAIL_SECRET;

  if (!scriptUrl || !secret) {
    const error = new Error("Set EVENTEXA_MAIL_URL and EVENTEXA_MAIL_SECRET in the backend environment.");
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
      name: message.name || "",
      eventName: message.eventName || "",
      eventDate: message.eventDate || "",
      eventTime: message.eventTime || "",
      eventVenue: message.eventVenue || "",
      messageType: message.messageType || "general",
      certificateId: message.certificateId || "",
      certificateIssuedDate: message.certificateIssuedDate || "",
      certificateUrl: message.certificateUrl || "",
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

function firstText(...values) {
  return values.find((value) => typeof value === "string" && value.trim())?.trim() || "";
}

function formatEventDate(value) {
  const date = firstText(value);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) return date;

  return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])))
    .toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "UTC",
    });
}

function getEventDetails(event) {
  const startTime = firstText(event.startTime, event.time, event.eventTime);
  const endTime = firstText(event.endTime);

  return {
    eventName: firstText(event.title, event.name, event.eventName) || "Campus event",
    eventDate: formatEventDate(event.date || event.eventDate),
    eventTime: [startTime, endTime].filter(Boolean).join(" - "),
    eventVenue: firstText(event.venue, event.location, event.eventVenue),
  };
}

function sendEventRegistrationEmail(student, event) {
  const { eventName, eventDate, eventTime, eventVenue } = getEventDetails(event);
  const eventDetails = [
    eventDate && `Date: ${eventDate}`,
    eventTime && `Time: ${eventTime}`,
    eventVenue && `Venue: ${eventVenue}`,
    firstText(event.category) && `Category: ${firstText(event.category)}`,
    firstText(event.organizer) && `Organizer: ${firstText(event.organizer)}`,
  ].filter(Boolean);
  const detailsText = eventDetails.length
    ? `\n\nEvent details:\n${eventDetails.join("\n")}`
    : "\n\nEvent details will be shared by the organizer.";
  const studentName = firstText(student.name, student.fullName) || "there";

  return sendMail({
    to: student.email,
    subject: `Registration confirmed: ${eventName}`,
    text: `Hello ${studentName},\n\nYour registration for ${eventName} is confirmed. We look forward to welcoming you.\n${detailsText}\n\nPlease keep this email for your event details. If you have questions, contact the event organizer.\n\nBest regards,\nEventexa`,
    name: studentName,
    eventName,
    eventDate,
    eventTime,
    eventVenue,
    messageType: "registration",
  });
}

function sendCertificateEmail(registration) {
  const relatedEvent = registration.eventId?.toObject
    ? registration.eventId.toObject()
    : registration.eventId || {};
  const eventDetails = getEventDetails({
    ...relatedEvent,
    eventName: registration.eventName || relatedEvent.title || relatedEvent.name,
  });
  const studentName = firstText(registration.studentName) || "there";
  const certificateUrl = process.env.FRONTEND_URL && registration._id
    ? `${process.env.FRONTEND_URL.replace(/\/+$/, "")}/event-e-certificates/${registration._id}`
    : null;
  const certificateIssuedDate = registration.certificateIssuedAt
    ? new Date(registration.certificateIssuedAt).toLocaleDateString("en-US", { dateStyle: "long" })
    : "";
  const certificateDetails = [
    `Event: ${eventDetails.eventName}`,
    eventDetails.eventDate && `Date: ${eventDetails.eventDate}`,
    eventDetails.eventTime && `Time: ${eventDetails.eventTime}`,
    eventDetails.eventVenue && `Venue: ${eventDetails.eventVenue}`,
    registration.certificateId && `Certificate ID: ${registration.certificateId}`,
    certificateIssuedDate && `Date issued: ${certificateIssuedDate}`,
  ].filter(Boolean);

  return sendMail({
    to: registration.studentEmail,
    subject: `Your certificate for ${eventDetails.eventName}`,
    text: `Hello ${studentName},\n\nCongratulations! You have received a certificate recognizing your participation in ${eventDetails.eventName}.\n\nCERTIFICATE DETAILS\n${certificateDetails.join("\n")}${certificateUrl ? `\n\nView and download your certificate:\n${certificateUrl}` : "\n\nSign in to your Eventexa account to view and download your certificate."}\n\nCongratulations again,\nEventexa`,
    name: studentName,
    eventName: eventDetails.eventName,
    eventDate: eventDetails.eventDate,
    eventTime: eventDetails.eventTime,
    eventVenue: eventDetails.eventVenue,
    messageType: "certificate",
    certificateId: registration.certificateId || "",
    certificateIssuedDate,
    certificateUrl: certificateUrl || "",
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