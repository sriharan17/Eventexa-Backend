# React + Vite

## Backend email notifications

Set `EMAIL_USER` and `EMAIL_PASS` in `eve-backend/.env` to enable student welcome and event registration emails. For Gmail, use an app password for the sending account. Keep this file private and do not commit it. Email delivery failures are logged by the backend and do not undo a completed registration.

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Google Forms Event Registration

Registrations are recorded only after the linked Google Form is submitted. For each event form:

1. Enable **Collect email addresses** in the form settings. The submitted email must match a student account in Eventexa.
2. In the form, open **Extensions > Apps Script** and add this submit handler:

```javascript
function onFormSubmit(event) {
  const properties = PropertiesService.getScriptProperties();
  const backendUrl = properties.getProperty("BACKEND_URL");
  const eventId = properties.getProperty("EVENT_ID");
  const secret = properties.getProperty("GOOGLE_FORM_WEBHOOK_SECRET");
  const studentEmail = event.response.getRespondentEmail();

  if (!backendUrl || !eventId || !secret || !studentEmail) {
    throw new Error("Set callback properties and collect respondent email.");
  }

  const response = UrlFetchApp.fetch(
    `${backendUrl}/api/registerations/google-form-submit`,
    {
      method: "post",
      contentType: "application/json",
      headers: { Authorization: `Bearer ${secret}` },
      payload: JSON.stringify({ eventId, studentEmail }),
      muteHttpExceptions: true,
    },
  );

  if (response.getResponseCode() < 200 || response.getResponseCode() >= 300) {
    throw new Error(`Eventexa callback failed: ${response.getContentText()}`);
  }
}
```

3. In **Project Settings > Script properties**, set `BACKEND_URL` to the publicly reachable backend base URL (without `/api`), `EVENT_ID` to the event's MongoDB ID, and `GOOGLE_FORM_WEBHOOK_SECRET` to the same private value configured in the backend environment.
4. In **Triggers**, add an installable trigger for `onFormSubmit`, selecting **From form** and **On form submit**.

The backend must be publicly reachable over HTTPS for Google Apps Script to call it. Keep the shared secret private and do not commit it.
