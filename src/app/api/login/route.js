import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export async function POST(request) {
  const { username, password } = await request.json();
  const sql = neon(process.env.DATABASE_URL);

  const users = await sql`
    SELECT * FROM users WHERE username = ${username} AND password = ${password}
  `;

  if (users.length > 0) {
    const user = users[0];
    const response = NextResponse.json({ success: true, role: user.role });

    // Updated Cookie Settings
    response.cookies.set("samanghar_session", user.role, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Use system variable
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/", // VERY IMPORTANT: Makes cookie available to all routes
    });

    return response;
  }

  return NextResponse.json(
    { success: false, message: "Invalid credentials" },
    { status: 401 },
  );
}
