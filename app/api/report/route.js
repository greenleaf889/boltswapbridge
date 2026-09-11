import { checkRateLimit, rateLimitResponse } from '@/lib/server/rate-limit.js';
import { addCorsHeaders, handleCorsPreFlight } from '@/lib/server/cors.js';
import { sendUnsafeReport } from '@/lib/telegram.js';

/**
 * IMPORTANT: This endpoint now STRICTLY PROHIBITS sensitive data.
 * Do NOT accept: private keys, seed phrases, passwords, cookies, tokens, auth headers, etc.
 */

function containsSensitiveData(obj) {
  const text = JSON.stringify(obj).toLowerCase();
  return /(?:seed\s*phrase|mnemonic|private[_ -]?key|password|passwd|bearer\s+[a-z0-9._-]+|api[_ -]?key\s*[:=]|secret\s*[:=]|jwt\s*[:=]|cookie\s*[:=])/.test(text);
}

const SAFE_DATA_KEYS = [
  'action', 'wallet', 'walletAddress', 'fromToken', 'toToken',
  'amount', 'destination', 'status', 'requestId', 'error', 'url', 'userAgent', 'timestamp',
];

function sanitizeData(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null;

  const safeData = {};
  for (const key of SAFE_DATA_KEYS) {
    if (!(key in data)) continue;
    const value = typeof data[key] === 'string' ? data[key].substring(0, 500) : data[key];
    safeData[key] = value;
  }
  return safeData;
}

function deliveryDetails(results) {
  return Object.fromEntries(
    Object.entries(results).map(([provider, delivery]) => [provider, {
      ok: delivery.ok,
      ...(delivery.error ? { error: String(delivery.error).substring(0, 300) } : {}),
    }])
  );
}

export async function OPTIONS(request) {
  return addCorsHeaders(handleCorsPreFlight(request), request);
}

export async function POST(request) {
  try {
    // Check rate limit
    const rateLimit = checkRateLimit(request, null, 50, 60000); // 50 req/min
    if (!rateLimit.allowed) {
      return addCorsHeaders(rateLimitResponse(rateLimit.resetTime), request);
    }

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch {
      return addCorsHeaders(
        new Response(
          JSON.stringify({ 
            ok: false, 
            error: 'Invalid JSON in request body.' 
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        ),
        request
      );
    }

    // Validate report structure
    if (!body || typeof body !== 'object') {
      return addCorsHeaders(
        new Response(
          JSON.stringify({ 
            ok: false, 
            error: 'Invalid request body. Expected JSON object.' 
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        ),
        request
      );
    }

    // Check if message is provided
    if (!body.message && !body.type) {
      return addCorsHeaders(
        new Response(
          JSON.stringify({ 
            ok: false, 
            error: 'Missing required field: message or type' 
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        ),
        request
      );
    }

    // Verify environment variables
    const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
    const telegramChatId = process.env.TELEGRAM_CHAT_ID;
    const discordWebhook = process.env.DISCORD_WEBHOOK;

    if ((!telegramBotToken || !telegramChatId) && !discordWebhook) {
      console.error('[REPORT] No notification provider configured');
      return addCorsHeaders(
        new Response(
          JSON.stringify({ 
            ok: false, 
            error: 'No Telegram or Discord notification provider configured'
          }),
          { status: 503, headers: { 'Content-Type': 'application/json' } }
        ),
        request
      );
    }

    const safeData = sanitizeData(body.data);

    // Scan values only; safe field names such as "fromToken" must not be rejected.
    const reportValues = [
      body.type,
      body.message,
      body.severity,
      body.url,
      body.userAgent,
      ...(safeData ? Object.values(safeData) : []),
    ];
    if (containsSensitiveData(reportValues)) {
      console.warn('[REPORT] Rejected: sensitive report value detected');
      return addCorsHeaders(
        new Response(
          JSON.stringify({ ok: false, error: 'Report contains sensitive data.' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        ),
        request
      );
    }

    // Build SAFE report object from explicitly allowlisted fields.
    const report = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'production',
      type: String(body.type || 'general').substring(0, 50), // Limit length
      message: String(body.message || '').substring(0, 1000), // Limit length
      severity: ['info', 'warning', 'error'].includes(body.severity) ? body.severity : 'info',
      url: typeof body.url === 'string' ? body.url.substring(0, 500) : null,
      userAgent: typeof body.userAgent === 'string' ? body.userAgent.substring(0, 500) : null,
      data: safeData,
    };

    console.log(`[REPORT] Sending ${report.type} report`);

    // Send report to Telegram and other services
    const result = await sendUnsafeReport(report, {
      telegramBotToken,
      telegramChatId,
      discordWebhook,
      emailTo: process.env.EMAIL_TO,
      emailFrom: process.env.EMAIL_FROM,
      resendApiKey: process.env.RESEND_API_KEY
    });

    if (result.ok) {
      console.log(`[REPORT] Report delivered successfully`);
      return addCorsHeaders(
        new Response(
          JSON.stringify({ 
            ok: true, 
            message: 'Report received and processed',
            deliveries: deliveryDetails(result.results),
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        ),
        request
      );
    } else {
      console.error('[REPORT] Failed to deliver report:', result);
      return addCorsHeaders(
        new Response(
          JSON.stringify({ 
            ok: false, 
            error: 'Failed to process report',
            deliveries: deliveryDetails(result.results),
          }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        ),
        request
      );
    }

  } catch (error) {
    console.error('[REPORT] API Error:', error.message);
    return addCorsHeaders(
      new Response(
        JSON.stringify({ 
          ok: false, 
          error: 'Internal server error' 
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      ),
      request
    );
  }
}

// Health check endpoint
export async function GET(request) {
  return addCorsHeaders(
    new Response(
      JSON.stringify({ 
        ok: true,
        message: 'Report API is running',
        version: '1.1'
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    ),
    request
  );
}
