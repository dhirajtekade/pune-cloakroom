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
    const body = await request.json();
    const { name, mobile, city, bagCount } = body;

    // 1. Fetch settings
    const settingResult = await sql`
      SELECT key, value FROM settings 
      WHERE key IN ('system_mode', 'sms_template', 'print_bag_labels', 'enable_page_cut', 'print_as_image', 'use_qr_code', 'enable_auto_sms')
    `;

    let printBagLabels = "true";
    let enablePageCut = "false";
    let printAsImage = "false";
    let mode = "PER_MAHATMA";
    let useQrCode = "false";
    let enableAutoSms = "false";
    let smsTemplate =
      "JSCA {{name}}, Token: {{tokenId}} for {{bagCount}} bags.";

    settingResult.forEach((row) => {
      if (row.key === "system_mode") mode = row.value;
      if (row.key === "sms_template") smsTemplate = row.value;
      if (row.key === "print_bag_labels") printBagLabels = row.value;
      if (row.key === "enable_page_cut") enablePageCut = row.value;
      if (row.key === "print_as_image") printAsImage = row.value;
      if (row.key === "use_qr_code") useQrCode = row.value;
      if (row.key === "enable_auto_sms") enableAutoSms = row.value;
    });

    // 2. Get Date Code (Safely explicitly locked to India Standard Time)
    const dateCodeStr = new Date().toLocaleString("en-US", {
      timeZone: "Asia/Kolkata",
      day: "numeric",
    });
    const dateCode = parseInt(dateCodeStr, 10);

    // 3. CALCULATE DAILY SEQUENCE: Look for the highest token from TODAY
    const datePrefix = `${dateCode}-`;
    const seqResult = await sql`
      SELECT display_token, bag_count
      FROM checkins
      WHERE display_token LIKE ${datePrefix || ""} || '%'
      ORDER BY created_at DESC
      LIMIT 1;
    `;

    let nextSequence = 1;

    if (seqResult.length > 0 && seqResult[0].display_token) {
      const parts = seqResult[0].display_token.split("-");
      if (parts.length === 2) {
        const lastNumber = parseInt(parts[1], 10);
        const lastBagCount = parseInt(seqResult[0].bag_count, 10) || 1;

        // If they use PER_BAG mode, we must jump numbers to cover the bags
        // (e.g., if token 1 takes 3 bags, the next guy gets token 4)
        if (mode === "PER_BAG") {
          nextSequence = lastNumber + lastBagCount;
        } else {
          nextSequence = lastNumber + 1;
        }
      }
    }

    // 4. Create the final display format (e.g., "11-0001")
    const displayToken = `${dateCode}-${String(nextSequence).padStart(4, "0")}`;

    // 5. Insert directly into the database (Much faster, no 2nd update needed!)
    await sql`
      INSERT INTO checkins (name, mobile, city, bag_count, status, display_token) 
      VALUES (${name}, ${mobile}, ${city}, ${bagCount}, 'STORED', ${displayToken}) 
    `;

    // 6. Trigger SMS ONLY if the Admin toggle is set to true
    if (enableAutoSms === "true" && mobile && mobile.length >= 10) {
      const finalMessage = smsTemplate
        .replace(/{{name}}/g, name)
        .replace(/{{tokenId}}/g, displayToken)
        .replace(/{{bagCount}}/g, (bagCount || 1).toString());

      sendCloakroomSMS(mobile, finalMessage).catch((err) =>
        console.error("Background SMS Error:", err),
      );
    }

    // 7. Return data to frontend
    return NextResponse.json({
      success: true,
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
