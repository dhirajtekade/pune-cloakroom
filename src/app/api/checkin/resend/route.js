export const runtime = "edge";
import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

// --- HELPER FUNCTION: Send SMS ---
async function sendCloakroomSMS(mobileNumber, finalMessage) {
  const apiKey = process.env.FAST2SMS_API_KEY;

  if (!apiKey) {
    console.error("Missing Fast2SMS API Key!");
    return false;
  }

  const cleanNumber = mobileNumber.replace(/\D/g, "").slice(-10);

  try {
    const response = await fetch("https://www.fast2sms.com/dev/bulkV2", {
      method: "POST",
      headers: {
        authorization: apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        route: "q",
        message: finalMessage,
        language: "english",
        flash: 0,
        numbers: cleanNumber,
      }),
    });

    const result = await response.json();
    return result.return === true;
  } catch (error) {
    console.error("Fast2SMS Network Error:", error);
    return false;
  }
}

export async function POST(request) {
  try {
    const sql = neon(process.env.DATABASE_URL);
    // 1. Get the pre-formatted token ("9-0094") from the frontend
    const { mobile, tokenId, name, bagCount } = await request.json();

    // 2. Fetch the SMS template from settings
    const settingResult = await sql`
      SELECT value FROM settings WHERE key = 'sms_template'
    `;
    let smsTemplate =
      "JSCA {{name}}, Token: {{tokenId}} for {{bagCount}} bags. Close time:09:00PM";
    if (settingResult.length > 0) smsTemplate = settingResult[0].value;

    // 3. FIX: Replace the template variables using the provided 'tokenId'
    const finalMessage = smsTemplate
      .replace(/{{name}}/g, name)
      .replace(/{{tokenId}}/g, tokenId)
      .replace(/{{bagCount}}/g, (bagCount || 1).toString());

    // 4. Send the SMS
    const success = await sendCloakroomSMS(mobile, finalMessage);

    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({
        success: false,
        error: "Fast2SMS rejected the message",
      });
    }
  } catch (error) {
    console.error("Resend API Error:", error);
    // This catches the crash and sends the exact error message to your frontend alert
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
