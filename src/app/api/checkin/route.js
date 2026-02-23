import { NextResponse } from "next/server";
import { sql } from "@neondatabase/serverless";

export async function POST(request) {
  try {
    const { mobile, name, bagCount } = await request.json();

    // Insert into Postgres and immediately return the new token_id
    const result = await sql`
      INSERT INTO checkins (mobile, name, bag_count, status) 
      VALUES (${mobile}, ${name}, ${bagCount}, 'STORED')
      RETURNING token_id;
    `;

    return NextResponse.json({
      success: true,
      tokenId: result[0].token_id,
    });
  } catch (error) {
    console.error("Check-in Error:", error);
    return NextResponse.json(
      { error: "Failed to save check-in" },
      { status: 500 },
    );
  }
}
