import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");
  const sql = neon(process.env.DATABASE_URL);

  const result = await sql`SELECT value FROM settings WHERE key = ${key}`;
  return NextResponse.json({ value: result[0]?.value });
}

export async function POST(request) {
  const { key, value } = await request.json();
  const sql = neon(process.env.DATABASE_URL);

  await sql`
    INSERT INTO settings (key, value) 
    VALUES (${key}, ${value}) 
    ON CONFLICT (key) DO UPDATE SET value = ${value}
  `;
  return NextResponse.json({ success: true });
}
