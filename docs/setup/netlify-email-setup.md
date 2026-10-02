# Netlify Story Form Email Setup

The Mrs. Gamage story form is wired in two ways:

1. Direct email through `/.netlify/functions/send-story-submission`
2. Netlify Forms capture with form name `business-story`

## Direct Email

Add these environment variables in Netlify:

```text
STORY_SUBMISSION_TO=hello@ceylonrylabs.io
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USER=hello@ceylonrylabs.io
SMTP_PASS=your-email-password-or-app-password
SMTP_FROM=hello@ceylonrylabs.io
```

If your email provider uses port `587`, set:

```text
SMTP_PORT=587
SMTP_SECURE=false
```

## Netlify Forms Notification

In Netlify, open:

```text
Site configuration -> Forms -> Form notifications
```

Add an email notification for:

```text
Form: business-story
Email: hello@ceylonrylabs.io
```

This keeps a backup record inside Netlify Forms even if the SMTP email service is not configured yet.
