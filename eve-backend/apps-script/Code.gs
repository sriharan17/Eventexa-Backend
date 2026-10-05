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

    MailApp.sendEmail({
      to: input.to,
      subject: input.subject,
      body: input.text,
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

function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
