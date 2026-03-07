export const runtime = "edge";
import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

// --- HELPER FUNCTION: Send SMS via Fast2SMS Quick Route ---
async function sendCloakroomSMS(mobileNumber, tokenId, bagCount) {
  const apiKey = process.env.FAST2SMS_API_KEY;
  
  if (!apiKey) {
    console.error("Missing Fast2SMS API Key in environment variables!");
    return false;
  }

  // Ensure we just have the 10-digit number (removes +91 if the frontend sent it)
  const cleanNumber = mobileNumber.replace(/\D/g, '').slice(-10);

  // A clean, generic transactional message that passes Quick Route filters easily
  const messageText = `Saman Ghar Token: ${tokenId}. Bags stored: ${bagCount}. Please show this token number when collecting your belongings.`;

  try {
    const response = await fetch("https://www.fast2sms.com/dev/bulkV2", {
      method: "POST",
      headers: {
        "authorization": apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        route: "q", 
        message: messageText,
        language: "english",
        flash: 0,
        numbers: cleanNumber, 
      })
    });

    const result = await response.json();
    console.log("Fast2SMS Response:", result);
    return result.return === true; 
  } catch (error) {
    console.error("Fast2SMS Network Error:", error);
    return false;
  }
}

// --- MAIN POST ROUTE: Handle Check-in ---
export async function POST(request) {
  try {
    const sql = neon(process.env.DATABASE_URL);
    const body = await request.json();
    const { name, mobile, city, bagCount } = body;

    // 1. Get the current numbering system from settings
    const settingResult = await sql`SELECT value FROM settings WHERE key = 'system_mode'`;
    const mode = settingResult[0]?.value || "PER_MAHATMA";

    // 2. Insert the Mahatma and get their starting Token ID
    const insertResult = await sql`
      INSERT INTO checkins (name, mobile, city, bag_count, status) 
      VALUES (${name}, ${mobile}, ${city}, ${bagCount}, 'STORED') 
      RETURNING token_id;
    `;
    
    const startTokenId = insertResult[0].token_id;

    // 3. Advance the database sequence if we are in "PER_BAG" mode
    if (mode === "PER_BAG" && bagCount > 1) {
      const tokensToSkip = bagCount - 1;
      await sql`
        SELECT setval(
          pg_get_serial_sequence('checkins', 'token_id'), 
          nextval(pg_get_serial_sequence('checkins', 'token_id')) + ${tokensToSkip} - 1, 
          true
        );
      `;
    }

    // 4. Trigger the SMS (We don't 'await' heavily here so the frontend doesn't hang)
    if (mobile && mobile.length >= 10) {
      const formattedToken = `#${String(startTokenId).padStart(4, '0')}`;
      
      sendCloakroomSMS(mobile, formattedToken, bagCount)
        .catch(err => console.error("Background SMS silently failed:", err));
    }

    // 5. Return success to the frontend to trigger the thermal print
    return NextResponse.json({ 
      success: true, 
      tokenId: startTokenId,
      mode: mode 
    });

  } catch (error) {
    console.error("Check-In API Error:", error);
    return NextResponse.json(
      { error: "Failed to process check-in" },
      { status: 500 }
    );
  }
}