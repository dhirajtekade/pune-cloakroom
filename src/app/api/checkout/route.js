import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

async function sendSMS(mobileNumber, message) {
  const apiKey = process.env.FAST2SMS_API_KEY;
  const cleanNumber = mobileNumber.replace(/\D/g, "").slice(-10);
  try {
    const res = await fetch("https://www.fast2sms.com/dev/bulkV2", {
      method: "POST",
      headers: { "authorization": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({ route: "q", message, language: "english", numbers: cleanNumber }),
    });
    return (await res.json()).return === true;
  } catch (e) { return false; }
}

export async function POST(request) {
  try {
    const sql = neon(process.env.DATABASE_URL);
    const { tokenId } = await request.json();

    // 1. Update Status & Get Details
    const result = await sql`
      UPDATE checkins 
      SET status = 'COLLECTED', updated_at = NOW() 
      WHERE token_id = ${tokenId} 
      RETURNING name, mobile, bag_count;
    `;

    if (result.length === 0) return NextResponse.json({ error: "Token not found" }, { status: 404 });

    const { name, mobile, bag_count } = result[0];

    // 2. Get Template
    const settings = await sql`SELECT value FROM settings WHERE key = 'checkout_sms_template'`;
    const template = settings[0]?.value || "Bags collected for Token {{tokenId}}.";

    // 3. Send SMS
    const msg = template
      .replace(/{{name}}/g, name)
      .replace(/{{tokenId}}/g, `#${String(tokenId).padStart(4, '0')}`)
      .replace(/{{bagCount}}/g, bag_count);

    await sendSMS(mobile, msg);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}