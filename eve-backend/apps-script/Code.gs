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
      htmlBody: escapeHtml(input.text).replace(/\n/g, "<br>"),
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
