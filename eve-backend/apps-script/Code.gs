function doPost(event) {
  try {
    var input = JSON.parse(event.postData.contents);
    var expectedSecret = PropertiesService.getScriptProperties()
      .getProperty("EVENTEXA_MAIL_SECRET");

    if (!expectedSecret || input.secret !== expectedSecret) {
      return jsonResponse({ success: false, message: "Unauthorized email request." });
    }

    if (
      typeof input.to !== "string" ||
      typeof input.subject !== "string" ||
      typeof input.text !== "string" ||
      !input.to.trim() ||
      !input.subject.trim() ||
      !input.text.trim()
    ) {
      return jsonResponse({ success: false, message: "Recipient, subject, and message are required." });
    }

    if (MailApp.getRemainingDailyQuota() < 1) {
      return jsonResponse({ success: false, message: "The Gmail daily email quota has been reached." });
    }

    var email = {
      to: input.to,
      subject: input.subject,
      body: input.text,
    };

    if (input.messageType === "certificate") {
      if (!input.eventName || !input.certificateId || !input.certificateIssuedDate) {
        return jsonResponse({
          success: false,
          message: "Event name, certificate ID, and issue date are required for certificate emails.",
        });
      }

      var studentName = input.name || "there";
      var certificateLines = [
        "Event: " + input.eventName,
        input.eventDate && "Event date: " + input.eventDate,
        input.eventTime && "Event time: " + input.eventTime,
        input.eventVenue && "Venue: " + input.eventVenue,
        "Certificate ID: " + input.certificateId,
        "Date issued: " + input.certificateIssuedDate,
      ].filter(Boolean);

      email.subject = "Your certificate for " + input.eventName;
      email.body = [
        "Hello " + studentName + ",",
        "",
        "Congratulations! You have received a certificate recognizing your participation in " + input.eventName + ".",
        "",
        "CERTIFICATE DETAILS",
        certificateLines.join("\n"),
        "",
        input.certificateUrl
          ? "View and download your certificate:\n" + input.certificateUrl
          : "Sign in to your Eventexa account to view and download your certificate.",
        "",
        "Congratulations again,",
        "Eventexa",
      ].join("\n");
    }

    MailApp.sendEmail({
      to: email.to,
      subject: email.subject,
      body: email.body,
      htmlBody: escapeHtml(email.body).replace(/\n/g, "<br>"),
      name: "Eventexa",
    });

    return jsonResponse({ success: true });
  } catch (error) {
    return jsonResponse({
      success: false,
      message: error && error.message ? error.message : "Email delivery failed.",
    });
  }
}

function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
