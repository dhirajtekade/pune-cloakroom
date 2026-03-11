export const runtime = "edge";
import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

async function sendSMS(mobileNumber, message) {
  const apiKey = process.env.FAST2SMS_API_KEY;
  if (!apiKey) return false;

  const cleanNumber = mobileNumber.replace(/\D/g, "").slice(-10);
  try {
    const res = await fetch("https://www.fast2sms.com/dev/bulkV2", {
      method: "POST",
      headers: { authorization: apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        route: "q",
        message,
        language: "english",
        numbers: cleanNumber,
      }),
    });
    return (await res.json()).return === true;
  } catch (e) {
    return false;
  }
}

export async function POST(request) {
  try {
    const sql = neon(process.env.DATABASE_URL);
    const { tokenId } = await request.json();

    // 1. Update Status & Get Details
    // (Added display_token matching just in case the frontend sends "11-0004")
    const result = await sql`
      UPDATE checkins 
      SET status = 'COLLECTED', updated_at = NOW() 
      WHERE token_id = ${tokenId} OR display_token = ${tokenId}
      RETURNING name, mobile, bag_count, display_token;
    `;

    if (result.length === 0)
      return NextResponse.json({ error: "Token not found" }, { status: 404 });

    const { name, mobile, bag_count, display_token } = result[0];

    // 2. Get BOTH the Template AND the Auto-SMS Toggle
    const settings = await sql`
      SELECT key, value FROM settings 
      WHERE key IN ('checkout_sms_template', 'enable_auto_sms')
    `;

    let template = "Bags collected for Token {{tokenId}}.";
    let enableAutoSms = "false";

    settings.forEach((row) => {
      if (row.key === "checkout_sms_template") template = row.value;
      if (row.key === "enable_auto_sms") enableAutoSms = row.value;
    });

    // 3. Send SMS ONLY if the global toggle is ON
    if (enableAutoSms === "true" && mobile && mobile.length >= 10) {
      const msg = template
        .replace(/{{name}}/g, name)
        .replace(
          /{{tokenId}}/g,
          display_token || `#${String(tokenId).padStart(4, "0")}`,
        )
        .replace(/{{bagCount}}/g, bag_count);

      // Sending without 'await' keeps your UI fast and snappy
      sendSMS(mobile, msg).catch((err) =>
        console.error("Checkout SMS Error", err),
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
