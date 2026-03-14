export const runtime = "edge";
import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const sql = neon(process.env.DATABASE_URL);

    // Grab the date from the URL (e.g., ?date=2026-03-10)
    const { searchParams } = new URL(request.url);
    const filterDate = searchParams.get("date");

    let records;

    if (filterDate) {
      // Safely filter by date using IST Timezone conversions
      records = await sql`
        SELECT 
          token_id as id,
          display_token, 
          name, 
          mobile,
          city,
          bag_count as bags, 
          initial_bag_count as initial_bags,
          status, 
          to_char(created_at AT TIME ZONE 'Asia/Kolkata', 'HH:MI AM') as time 
        FROM checkins 
        WHERE DATE(created_at AT TIME ZONE 'Asia/Kolkata') = ${filterDate}::date
        ORDER BY created_at DESC;
      `;
    } else {
      // Fallback if no date is provided
      records = await sql`
        SELECT 
          token_id as id,
          display_token, 
          name, 
          mobile,
          city,
          bag_count as bags, 
          status, 
          to_char(created_at AT TIME ZONE 'Asia/Kolkata', 'HH:MI AM') as time 
        FROM checkins 
        ORDER BY created_at DESC LIMIT 100;
      `;
    }

    return NextResponse.json({ records });
  } catch (error) {
    console.error("Fetch Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch records" },
      { status: 500 },
    );
  }
}

// Handle Check-Outs OR Bag Edits
// Handle Check-Outs OR Bag Edits
// Handle Check-Outs OR Bag Edits
export async function PUT(request) {
  try {
    const sql = neon(process.env.DATABASE_URL);
    // Note: 'id' might be null during an End of Day sweep, which is fine!
    const { id, action, newBagCount } = await request.json();

    if (action === "REQUEST_PICKUP") {
      await sql`UPDATE checkins SET updated_at = NOW() WHERE token_id = ${id}`;
    } else if (action === "FINAL_CHECKOUT") {
      await sql`UPDATE checkins SET status = 'RETURNED', updated_at = NULL WHERE token_id = ${id}`;
    } else if (action === "PARTIAL_CHECKOUT") {
      if (newBagCount <= 0) {
        await sql`UPDATE checkins SET status = 'RETURNED', bag_count = 0, updated_at = NULL WHERE token_id = ${id}`;
      } else {
        await sql`UPDATE checkins SET bag_count = ${newBagCount} WHERE token_id = ${id}`;
      }
    }
    // --- NEW: END OF DAY SWEEP ---
    else if (action === "END_OF_DAY") {
      await sql`
        UPDATE checkins 
        SET status = 'RETURNED', updated_at = NOW() 
        WHERE status = 'STORED'
      `;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update Error:", error);
    return NextResponse.json(
      { error: "Failed to update record" },
      { status: 500 },
    );
  }
}
