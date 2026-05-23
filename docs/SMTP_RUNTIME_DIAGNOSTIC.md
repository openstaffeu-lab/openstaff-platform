# SMTP Runtime Diagnostic

Last updated: 2026-05-23

## Scope

EXEC-59 focused on separating three possible blockers:

1. missing runtime mounts
2. broken SMTP URL parsing
3. SMTP authentication failure at the mail server

## Diagnostic Tooling

The repo now includes:

- `apps/admin/api/scripts/exec-59-smtp-check.js`

The script reads:

- `EMAIL_PROVIDER`
- `EMAIL_FROM`
- `SMTP_URL`

It then:

- normalizes provider mode safely
- parses SMTP connection details without printing the secret URL
- runs `nodemailer.verify()`
- optionally supports a send-to smoke check for a trusted operator inbox

## Live Production Result

Fresh EXEC-59 live proof on `openstaff-api-00021-2b7` showed:

- `configuredProvider = SMTP`
- `resolvedProvider = smtp`
- `emailFromPresent = true`
- `host = mail.openstaff.eu`
- `port = 465`
- `secure = true`
- `authUserPresent = true`
- `valid = true`

SMTP verification still failed with:

- `errorCode = EAUTH`
- `responseCode = 535`
- `command = AUTH PLAIN`
- `message = Invalid login: 535 Incorrect authentication data`

## Diagnostic Conclusion

The blocking layer is now explicit:

- runtime mount exists
- provider-mode casing is accepted
- SMTP URL parsing is valid
- the server rejects the mounted credentials during authentication

So the next fix is external/runtime:

- correct the SMTP credentials for `mail.openstaff.eu`
- or change the SMTP server-side auth policy so the mounted credentials are accepted
