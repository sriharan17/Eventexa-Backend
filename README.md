# React + Vite

## Backend email notifications

The backend sends email through Google Apps Script and Gmail over HTTPS, so it does not need outbound SMTP access or a purchased domain. A free Gmail account currently has a daily quota of 100 email recipients through Apps Script; see [Google's quota documentation](https://developers.google.com/apps-script/guides/services/quotas) for current limits.

1. Open [Google Apps Script](https://script.google.com/) while signed in to the Gmail account you want to send from. Create a project and paste in [`Code.gs`](./eve-backend/apps-script/Code.gs).
2. In **Project Settings > Script Properties**, add `EVENTEXA_MAIL_SECRET` with a long, random secret value. Keep it private.
3. Click **Deploy > New deployment**, select **Web app**, set **Execute as** to **Me**, and set **Who has access** to **Anyone**. Deploy and copy the web app URL ending in `/exec`.
4. In the backend environment (for local development, `eve-backend/.env`; for production, the backend service's Render environment), set:
   - `EVENTEXA_MAIL_URL`: the deployed `/exec` URL.
   - `EVENTEXA_MAIL_SECRET`: the exact same secret you set in Apps Script.
   - `FRONTEND_URL`: the deployed Eventexa frontend origin, so certificate emails can link directly to the in-app certificate.
5. Redeploy the backend after changing its environment variables. When you edit the Apps Script later, create a new deployment version and update the existing web app deployment to that version.

The Apps Script web app must be accessible to anyone because the backend calls it without a Google login; the shared secret protects the mail endpoint. Keep the secret private. Email delivery failures are logged by the backend and do not undo a completed registration.

When an admin generates a certificate, the student must first be marked present. Eventexa emails a certificate notice with a link to the student's in-app certificate and lists the certificate under **Event E-Certificates**. If the email still looks like a registration confirmation, update the Apps Script web app deployment to the latest `Code.gs` version and redeploy the backend; older deployments may not recognize certificate email requests.

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
