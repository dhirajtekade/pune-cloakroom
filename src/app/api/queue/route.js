export const runtime = "edge";
import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

// FETCH ALL "REQUESTED" TOKENS & "STORED" TOKENS
export async function GET() {
  try {
    const sql = neon(process.env.DATABASE_URL);

    const queue = await sql`
      SELECT token_id, display_token, name, bag_count 
      FROM checkins 
      WHERE status = 'REQUESTED' 
      ORDER BY updated_at DESC;
    `;

    const stored = await sql`
      SELECT token_id, display_token, name, mobile 
      FROM checkins 
      WHERE status = 'STORED' 
      ORDER BY created_at DESC;
    `;

    const settings =
      await sql`SELECT value FROM settings WHERE key = 'color_ranges'`;
    let colorRanges = [];
    try {
      if (settings.length > 0) colorRanges = JSON.parse(settings[0].value);
    } catch (e) {
      console.log("JSON parse error");
    }

    return NextResponse.json({
      success: true,
      queue,
      colorRanges,
      availableTokens: stored,
    });
  } catch (error) {
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

// ADD TO QUEUE (SCAN), REMOVE (CORRECT), OR FINALIZE (DOUBLE CLICK)
export async function POST(request) {
  try {
    const sql = neon(process.env.DATABASE_URL);
    const { tokenId, action } = await request.json();

    if (action === "ADD_TO_QUEUE") {
      // SMART MATCH: Finds exact match, OR matches the padded suffix (e.g. "93" matches "11-0093")
      await sql`
        UPDATE checkins 
        SET status = 'REQUESTED', updated_at = NOW() 
        WHERE token_id = (
          SELECT token_id FROM checkins 
          WHERE (
            display_token = ${tokenId} 
            OR display_token LIKE '%-' || LPAD(${tokenId}::text, 4, '0') 
            OR token_id::text = ${tokenId}::text
          ) 
          AND status = 'STORED' 
          ORDER BY created_at DESC 
          LIMIT 1
        )
      `;
    } else if (action === "CORRECT_LAST") {
      await sql`
        UPDATE checkins SET status = 'STORED' 
        WHERE token_id = (
          SELECT token_id FROM checkins WHERE status = 'REQUESTED' ORDER BY updated_at DESC LIMIT 1
        )
      `;
    } else if (action === "FINAL_CHECKOUT") {
      await sql`
        UPDATE checkins 
        SET status = 'RETURNED', updated_at = NOW() 
        WHERE token_id = ${tokenId} OR display_token = ${tokenId}
      `;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Update Error" }, { status: 500 });
  }
}
