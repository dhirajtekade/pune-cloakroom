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

const shareToWhatsApp = (mobile, tokenId, name, bagCount) => {
  const formattedToken = `#${String(tokenId).padStart(4, "0")}`;

  // Professional, clear text message
  const text =
    `*SAMAN GHAR TOKEN*%0A%0A` +
    `Jai Satchitanand!%0A` +
    `Name: *${name}*%0A` +
    `Token: *${formattedToken}*%0A` +
    `Bags: *${bagCount}*%0A%0A` +
    `Please show this message or the paper slip to collect your bags.`;

  // Standard WhatsApp Web/App Link
  const url = `https://wa.me/91${mobile.replace(/\D/g, "")}?text=${text}`;

  window.open(url, "_blank");
};

export async function POST(request) {
  try {
    const sql = neon(process.env.DATABASE_URL);
    const body = await request.json();
    const { name, mobile, city, bagCount } = body;

    // 1. Fetch settings
    const settingResult = await sql`
      SELECT key, value FROM settings 
      WHERE key IN ('system_mode', 'sms_template', 'print_bag_labels', 'enable_page_cut', 'print_as_image', 'use_qr_code')
    `;

    let printBagLabels = "true";
    let enablePageCut = "false";
    let printAsImage = "false";
    let mode = "PER_MAHATMA";
    let useQrCode = "false";
    let smsTemplate =
      "JSCA {{name}}, Token: {{tokenId}} for {{bagCount}} bags.";

    settingResult.forEach((row) => {
      if (row.key === "system_mode") mode = row.value;
      if (row.key === "sms_template") smsTemplate = row.value;
      if (row.key === "print_bag_labels") printBagLabels = row.value;
      if (row.key === "enable_page_cut") enablePageCut = row.value;
      if (row.key === "print_as_image") printAsImage = row.value;
      if (row.key === "use_qr_code") useQrCode = row.value;
    });

    // 2. Get Date Code (e.g., 9 for March 9th)
    const today = new Date();
    const dateCode = today.getDate();

    // 3. Insert and get the pure integer token_id
    const insertResult = await sql`
      INSERT INTO checkins (name, mobile, city, bag_count, status) 
      VALUES (${name}, ${mobile}, ${city}, ${bagCount}, 'STORED') 
      RETURNING token_id;
    `;
    const startTokenId = insertResult[0].token_id;

    // 4. Create the final display format (e.g., "9-0093")
    const displayToken = `${dateCode}-${String(startTokenId).padStart(4, "0")}`;

    // 5. Save the formatted display_token back into the database
    await sql`
      UPDATE checkins 
      SET display_token = ${displayToken} 
      WHERE token_id = ${startTokenId};
    `;

    // 6. Handle sequence advancement for "PER_BAG"
    if (mode === "PER_BAG" && bagCount > 1) {
      await sql`SELECT setval(
        pg_get_serial_sequence('checkins', 'token_id'), 
        nextval(pg_get_serial_sequence('checkins', 'token_id')) + ${bagCount} - 2, 
        true
      );`;
    }

    // 7. Trigger SMS using the new formatted token
    if (mobile && mobile.length >= 10) {
      const finalMessage = smsTemplate
        .replace(/{{name}}/g, name)
        .replace(/{{tokenId}}/g, displayToken) // Sends "9-0093"
        .replace(/{{bagCount}}/g, (bagCount || 1).toString());

      sendCloakroomSMS(mobile, finalMessage).catch((err) =>
        console.error("Background SMS Error:", err),
      );
    }

    // 8. Return data to frontend
    return NextResponse.json({
      success: true,
      // We pass displayToken as tokenId so the print function gets "9-0093"
      tokenId: displayToken,
      displayToken: displayToken,
      mode: mode,
      printBagLabels: printBagLabels === "true",
      enablePageCut: enablePageCut === "true",
      printAsImage: printAsImage === "true",
      useQrCode: useQrCode === "true",
    });
  } catch (error) {
    console.error("Check-In API Error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
