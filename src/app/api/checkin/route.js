export const runtime = "edge";
import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

// --- HELPER FUNCTION: Updated to accept the final message directly ---
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
        message: finalMessage, // Use the dynamic message passed from the route
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

// async function sendWhatsApp(mobileNumber, finalMessage) {
//   const apiKey = process.env.FAST2SMS_API_KEY;
//   const cleanNumber = mobileNumber.replace(/\D/g, "").slice(-10);

//   try {
//     const response = await fetch("https://www.fast2sms.com/dev/whatsappV1", {
//       method: "POST",
//       headers: {
//         authorization: apiKey,
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({
//         instance_id: "YOUR_INSTANCE_ID", // You get this from Fast2SMS WhatsApp Panel
//         type: "text",
//         number: "91" + cleanNumber,
//         message: finalMessage,
//       }),
//     });
//     return (await response.json()).success;
//   } catch (error) {
//     return false;
//   }
// }

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
                          WHERE key IN ('system_mode', 'sms_template', 'print_bag_labels', 'enable_page_cut')
                        `;

    let printBagLabels = "true";
    let enablePageCut = "false"; // New variable

    let mode = "PER_MAHATMA";
    let smsTemplate =
      "JSCA {{name}}, Token: {{tokenId}} for {{bagCount}} bags.";

    settingResult.forEach((row) => {
      if (row.key === "system_mode") mode = row.value;
      if (row.key === "sms_template") smsTemplate = row.value;
      if (row.key === "print_bag_labels") printBagLabels = row.value;
      if (row.key === "enable_page_cut") enablePageCut = row.value; // Map new setting
    });

    // 2. Insert and get Token ID
    // 1. Get Today's Date String (YYYY-MM-DD)
    // Inside your POST function in api/checkin/route.js
    const today = new Date();
    const dateCode = today.getDate(); // e.g., 12

    // 2. Insert and get the count for today to use as a "Daily Token"
    const insertResult = await sql`
  INSERT INTO checkins (name, mobile, city, bag_count, status) 
  VALUES (${name}, ${mobile}, ${city}, ${bagCount}, 'STORED') 
  RETURNING token_id;
`;
    const startTokenId = insertResult[0].token_id;

    // 2. Handle sequence advancement for "PER_BAG"
    if (mode === "PER_BAG" && bagCount > 1) {
      // We already used 1 ID for the insert. We need to skip the next (bagCount - 1) IDs.
      await sql`SELECT setval(
    pg_get_serial_sequence('checkins', 'token_id'), 
    nextval(pg_get_serial_sequence('checkins', 'token_id')) + ${bagCount} - 2, 
    true
  );`;
    }

    // 3. Create the Display Token (Date-Token)
    const displayToken = `${dateCode}-${String(startTokenId).padStart(4, "0")}`;

    // 4. Trigger SMS (Corrected Variable Replacement)
    if (mobile && mobile.length >= 10) {
      const formattedToken = `#${String(startTokenId).padStart(4, "0")}`;

      const finalMessage = smsTemplate
        .replace(/{{name}}/g, name)
        .replace(/{{tokenId}}/g, displayToken) // Now sends 12-0045
        .replace(/{{bagCount}}/g, (bagCount || 1).toString()); // Ensure it's a string and not empty

      // Call with only 2 arguments: mobile and the message
      sendCloakroomSMS(mobile, finalMessage).catch((err) =>
        console.error("Background SMS Error:", err),
      );
    }

    return NextResponse.json({
      success: true,
      tokenId: startTokenId,
      displayToken: displayToken,
      mode: mode,
      printBagLabels: printBagLabels === "true",
      enablePageCut: enablePageCut === "true", // Send as boolean
    });
    
  } catch (error) {
    console.error("Check-In API Error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
