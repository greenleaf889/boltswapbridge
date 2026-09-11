function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function formatReport(report) {
  const lines = [
    '==============================',
    `BoltSwap ${report.type} report`,
    '==============================',
    `Severity: ${report.severity}`,
    `Message: ${report.message || '-'}`,
    `Time: ${report.timestamp}`,
  ];

  if (report.url) lines.push(`URL: ${report.url}`);
  if (report.userAgent) lines.push(`Browser: ${report.userAgent}`);

  if (report.data && Object.keys(report.data).length > 0) {
    lines.push('', 'Details:');
    for (const [key, value] of Object.entries(report.data)) {
      lines.push(`${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}`);
    }
  }

  lines.push('==============================');
  return lines.join('\n');
}

async function sendUnsafeReport(report, options = {}) {
  const {
    telegramBotToken,
    telegramChatId,
    discordWebhook,
    emailTo,
    emailFrom,
    resendApiKey
  } = options;

  const rawJson = JSON.stringify(report, null, 2);
  const formattedReport = formatReport(report);
  const deliveries = [];

  if (telegramBotToken && telegramChatId) {
    deliveries.push((async () => {
      try {
        const telegramResponse = await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            chat_id: telegramChatId,
            text: `<pre>${escapeHtml(formattedReport).slice(0, 3900)}</pre>`,
            parse_mode: 'HTML',
          }),
        });
        const telegramData = await telegramResponse.json();
        if (!telegramResponse.ok) {
          console.error('[Telegram] API error:', telegramData.description);
          return ['telegram', { ok: false, error: telegramData.description }];
        }
        return ['telegram', { ok: true, messageId: telegramData.result?.message_id }];
      } catch (error) {
        console.error('[Telegram] Fetch error:', error.message);
        return ['telegram', { ok: false, error: error.message }];
      }
    })());
  }

  if (discordWebhook) {
    deliveries.push((async () => {
      try {
        const discordResponse = await fetch(discordWebhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: `\`\`\`\n${formattedReport.slice(0, 1900)}\n\`\`\`` }),
        });
        if (!discordResponse.ok) {
          const discordError = await discordResponse.text();
          console.error('Discord API error:', discordError);
          return ['discord', { ok: false, error: discordError.slice(0, 300) || `HTTP ${discordResponse.status}` }];
        }
        return ['discord', { ok: true }];
      } catch (error) {
        console.error('Discord fetch error:', error.message);
        return ['discord', { ok: false, error: error.message }];
      }
    })());
  }

  if (resendApiKey && emailTo && emailFrom) {
    deliveries.push((async () => {
      try {
        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: emailFrom,
            to: [emailTo],
            subject: `BoltSwap ${report.type} event`,
            text: rawJson,
          }),
        });
        if (!emailResponse.ok) console.error('[Email] Resend API error:', await emailResponse.text());
        return ['email', { ok: emailResponse.ok }];
      } catch (error) {
        console.error('[Email] Fetch error:', error.message);
        return ['email', { ok: false, error: error.message }];
      }
    })());
  }

  const results = Object.fromEntries(await Promise.all(deliveries));

  return {
    ok: Object.values(results).some(r => r.ok),
    report,
    results
  };
}

export { sendUnsafeReport };
