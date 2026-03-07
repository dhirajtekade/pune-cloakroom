import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

// Reuse your SMS helper logic
async function sendCloakroomSMS(mobileNumber, finalMessage) {
  const apiKey = process.env.FAST2SMS_API_KEY;
  const cleanNumber = mobileNumber.replace(/\D/g, "").slice(-10);
  try {
    const response = await fetch("https://www.fast2sms.com/dev/bulkV2", {
      method: "POST",
      headers: { authorization: apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        route: "q",
        message: finalMessage,
        language: "english",
        numbers: cleanNumber,
      }),
    });
    const result = await response.json();
    return result.return === true;
  } catch (error) {
    return false;
  }
}

export async function POST(request) {
  try {
    const sql = neon(process.env.DATABASE_URL);
    const { mobile, tokenId, name, bagCount } = await request.json();

    // Fetch the template from settings
    const settingResult =
      await sql`SELECT value FROM settings WHERE key = 'sms_template'`;
    const smsTemplate =
      settingResult[0]?.value || "JSCA {{name}}, Token: {{tokenId}}";

    const formattedToken = `#${String(tokenId).padStart(4, "0")}`;
    const finalMessage = smsTemplate
      .replace(/{{name}}/g, name)
      .replace(/{{tokenId}}/g, formattedToken)
      .replace(/{{bagCount}}/g, bagCount);

    const success = await sendCloakroomSMS(mobile, finalMessage);

    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { success: false, error: "Gateway Error" },
        { status: 500 },
      );
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
