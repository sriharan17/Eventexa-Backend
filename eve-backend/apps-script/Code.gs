function doPost(event) {
  try {
    var input = JSON.parse(event.postData.contents);
    var properties = PropertiesService.getScriptProperties();

    if (input.action === "createForm" || input.action === "registerForm") {
      var setupSecret = properties.getProperty("EVENTEXA_SCRIPT_SETUP_SECRET")
        || properties.getProperty("APPS_SCRIPT_SECRET");

      var suppliedSecret = input.action === "createForm" ? input.secret : input.setupSecret;
      if (!setupSecret || suppliedSecret !== setupSecret) {
        return jsonResponse({ success: false, message: "Unauthorized form registration." });
      }

      if (!validWebhookConfiguration(input)) {
        return jsonResponse({ success: false, message: "A valid webhook URL and secret are required." });
      }

      if (input.action === "createForm") {
        if (
          typeof input.eventId !== "string" ||
          !input.eventId.trim() ||
          typeof input.title !== "string" ||
          !input.title.trim() ||
          typeof input.description !== "string"
        ) {
          return jsonResponse({ success: false, message: "Event ID, title, and description are required." });
        }

        var form = FormApp.create(input.title.trim());
        form.setDescription(input.description);
        form.setCollectEmail(true);
        form.setConfirmationMessage("Your registration has been submitted. You can return to Eventexa now.");
        configureForm(form.getId(), input.eventId.trim(), input.webhookUrl, input.webhookSecret);
        return jsonResponse({ success: true, formUrl: form.getPublishedUrl() });
      }

      if (
        typeof input.formId !== "string" ||
        !input.formId.trim() ||
        typeof input.eventId !== "string" ||
        !input.eventId.trim()
      ) {
        return jsonResponse({ success: false, message: "Form ID and event ID are required." });
      }

      configureForm(input.formId.trim(), input.eventId.trim(), input.webhookUrl, input.webhookSecret);
      return jsonResponse({ success: true });
    }

    var expectedSecret = properties.getProperty("EVENTEXA_MAIL_SECRET");

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

      email.subject = "Your Eventexa certificate is ready: " + input.eventName;
      email.body = [
        "Hello " + studentName + ",",
        "",
        "Your participation certificate for " + input.eventName + " has been generated. Sign in to Eventexa to collect and download it.",
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

function validWebhookConfiguration(input) {
  return typeof input.webhookUrl === "string" &&
    /^https:\/\/.+\/api\/registrations\/form-webhook$/.test(input.webhookUrl) &&
    typeof input.webhookSecret === "string" &&
    input.webhookSecret.trim().length > 0;
}

function configureForm(formId, eventId, webhookUrl, webhookSecret) {
  var properties = PropertiesService.getScriptProperties();
  properties.setProperty("FORM_" + formId, eventId);
  properties.setProperty("EVENTEXA_FORM_WEBHOOK_URL", webhookUrl);
  properties.setProperty("EVENTEXA_FORM_WEBHOOK_SECRET", webhookSecret);

  var hasTrigger = ScriptApp.getProjectTriggers().some(function(trigger) {
    return trigger.getHandlerFunction() === "onFormSubmit" &&
      trigger.getTriggerSourceId() === formId;
  });
  if (!hasTrigger) {
    ScriptApp.newTrigger("onFormSubmit")
      .forForm(FormApp.openById(formId))
      .onFormSubmit()
      .create();
  }
}

function onFormSubmit(event) {
  var formId = event.source.getId();
  var properties = PropertiesService.getScriptProperties();
  var eventId = properties.getProperty("FORM_" + formId);
  var webhookUrl = properties.getProperty("EVENTEXA_FORM_WEBHOOK_URL");
  var webhookSecret = properties.getProperty("EVENTEXA_FORM_WEBHOOK_SECRET");
  var studentEmail = event.response.getRespondentEmail();

  if (!eventId || !webhookUrl || !webhookSecret || !studentEmail) {
    throw new Error("The form submission is missing its Eventexa callback configuration or respondent email.");
  }

  var response = UrlFetchApp.fetch(webhookUrl, {
    method: "post",
    contentType: "application/json",
    headers: { Authorization: "Bearer " + webhookSecret },
    payload: JSON.stringify({ eventId: eventId, studentEmail: studentEmail }),
    muteHttpExceptions: true
  });

  if (response.getResponseCode() < 200 || response.getResponseCode() >= 300) {
    throw new Error("Eventexa registration callback failed: " + response.getContentText());
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
