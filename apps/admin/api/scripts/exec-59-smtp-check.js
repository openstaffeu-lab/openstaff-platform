#!/usr/bin/env node
'use strict';

require('dotenv/config');

const nodemailer = require('nodemailer');
const nodemailerShared = require('nodemailer/lib/shared');

function parseArgs(argv) {
  const args = {
    json: false,
    sendTo: null,
  };

  for (const entry of argv) {
    if (entry === '--json') {
      args.json = true;
      continue;
    }
    if (entry.startsWith('--send-to=')) {
      args.sendTo = entry.slice('--send-to='.length).trim().toLowerCase() || null;
    }
  }

  return args;
}

function maskEmail(value) {
  if (!value || !value.includes('@')) {
    return 'invalid-email';
  }

  const [localPart, domain] = value.split('@');
  return `${(localPart || '*').slice(0, 1)}***@${domain}`;
}

function describeProviderMode() {
  const configuredProvider = process.env.EMAIL_PROVIDER?.trim() ?? null;
  const normalized = configuredProvider?.toLowerCase() ?? null;
  const hasSmtpUrl = Boolean(process.env.SMTP_URL?.trim());

  let resolvedProvider = null;
  if (normalized === 'smtp' && hasSmtpUrl) {
    resolvedProvider = 'smtp';
  } else if (hasSmtpUrl) {
    resolvedProvider = 'smtp';
  }

  return {
    configuredProvider,
    resolvedProvider,
    emailFromPresent: Boolean(process.env.EMAIL_FROM?.trim()),
  };
}

function parseSmtpRuntime() {
  const smtpUrl = process.env.SMTP_URL?.trim();
  if (!smtpUrl) {
    return {
      valid: false,
      host: null,
      port: null,
      secure: false,
      authUserPresent: false,
      parseError: 'smtp_url_missing',
      transporterOptions: null,
    };
  }

  try {
    const parsed = nodemailerShared.parseConnectionUrl(smtpUrl);
    return {
      valid: Boolean(parsed.host),
      host: typeof parsed.host === 'string' && parsed.host.trim() ? parsed.host.trim() : null,
      port:
        typeof parsed.port === 'number' && Number.isFinite(parsed.port) ? parsed.port : null,
      secure: Boolean(parsed.secure),
      authUserPresent: Boolean(parsed.auth?.user),
      parseError: null,
      transporterOptions: parsed,
    };
  } catch (error) {
    return {
      valid: false,
      host: null,
      port: null,
      secure: false,
      authUserPresent: false,
      parseError: error instanceof Error ? error.message : 'smtp_url_unparsable',
      transporterOptions: null,
    };
  }
}

async function verifyTransport(parsed) {
  if (!parsed.transporterOptions || !parsed.valid || !parsed.host) {
    return {
      ok: false,
      errorCode: null,
      responseCode: null,
      command: null,
      message: parsed.parseError ?? 'smtp_url_unparsable',
    };
  }

  try {
    const transporter = nodemailer.createTransport(parsed.transporterOptions);
    await transporter.verify();
    return {
      ok: true,
      errorCode: null,
      responseCode: null,
      command: null,
      message: 'smtp_verify_passed',
      transporter,
    };
  } catch (error) {
    return {
      ok: false,
      errorCode: error && typeof error === 'object' && 'code' in error ? error.code ?? null : null,
      responseCode:
        error && typeof error === 'object' && 'responseCode' in error
          ? error.responseCode ?? null
          : null,
      command:
        error && typeof error === 'object' && 'command' in error ? error.command ?? null : null,
      message: error instanceof Error ? error.message : 'smtp_verify_failed',
    };
  }
}

async function sendTestEmail(transporter, recipient) {
  try {
    const result = await transporter.sendMail({
      from: process.env.EMAIL_FROM?.trim() || 'OpenStaff <no-reply@openstaff.eu>',
      to: recipient,
      subject: 'OpenStaff SMTP diagnostic',
      text: 'This is an operator-triggered SMTP diagnostic email from OpenStaff.',
      html: '<p>This is an operator-triggered SMTP diagnostic email from OpenStaff.</p>',
    });

    return {
      ok: true,
      recipientMasked: maskEmail(recipient),
      messageId:
        typeof result.messageId === 'string' && result.messageId.trim()
          ? result.messageId.trim()
          : null,
      response:
        typeof result.response === 'string' && result.response.trim() ? result.response.trim() : null,
    };
  } catch (error) {
    return {
      ok: false,
      recipientMasked: maskEmail(recipient),
      errorCode: error && typeof error === 'object' && 'code' in error ? error.code ?? null : null,
      responseCode:
        error && typeof error === 'object' && 'responseCode' in error
          ? error.responseCode ?? null
          : null,
      command:
        error && typeof error === 'object' && 'command' in error ? error.command ?? null : null,
      message: error instanceof Error ? error.message : 'smtp_send_failed',
    };
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const provider = describeProviderMode();
  const parsed = parseSmtpRuntime();
  const verifyResult = await verifyTransport(parsed);

  let sendResult = null;
  if (args.sendTo && verifyResult.ok && verifyResult.transporter) {
    sendResult = await sendTestEmail(verifyResult.transporter, args.sendTo);
  }

  const payload = {
    success: verifyResult.ok && (!args.sendTo || Boolean(sendResult?.ok)),
    providerMode: provider,
    smtp: {
      host: parsed.host,
      port: parsed.port,
      secure: parsed.secure,
      authUserPresent: parsed.authUserPresent,
      valid: parsed.valid,
      parseError: parsed.parseError,
    },
    verify: {
      ok: verifyResult.ok,
      errorCode: verifyResult.errorCode,
      responseCode: verifyResult.responseCode,
      command: verifyResult.command,
      message: verifyResult.message,
    },
    sendTest: sendResult,
  };

  if (args.json) {
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  console.log(JSON.stringify(payload, null, 2));
}

main().catch((error) => {
  console.error(
    JSON.stringify(
      {
        success: false,
        error: error instanceof Error ? error.message : 'unknown_error',
      },
      null,
      2,
    ),
  );
  process.exitCode = 1;
});
