export const runtime = 'edge';
import { NextResponse } from "next/server";
import { sql } from "@neondatabase/serverless";

// Fetch all records for the Records View
export async function GET() {
  try {
    const records = await sql`
      SELECT 
        token_id as id, 
        name, 
        mobile, 
        bag_count as bags, 
        status, 
        to_char(created_at AT TIME ZONE 'Asia/Kolkata', 'HH:MI AM') as time 
      FROM checkins 
      ORDER BY created_at DESC;
    `;

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
export async function PUT(request) {
  try {
    const { id, action, newBagCount } = await request.json();

    if (action === "RETURN") {
      await sql`UPDATE checkins SET status = 'RETURNED' WHERE token_id = ${id}`;
    } else if (action === "EDIT_BAGS") {
      await sql`UPDATE checkins SET bag_count = ${newBagCount} WHERE token_id = ${id}`;
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
