export const runtime = "edge";
import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export async function POST(request) {
  try {
    // 1. Initialize the connection using the neon function
    const sql = neon(process.env.DATABASE_URL);

    const { mobile, name, bagCount } = await request.json();

    // 2. Execute the query using the newly created 'sql' constant
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
    console.error("Database Error:", error);
    return NextResponse.json(
      { error: "Failed to save record" },
      { status: 500 },
    );
  }
}
