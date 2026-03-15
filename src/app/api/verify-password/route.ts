import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { password } = await req.json();
    
    // Fallback password for immediate local testing if no google sheets env vars are present
    const envPassword = process.env.SPORTS_PORTAL_PASSWORD || "pancakes";
    
    // In a full implementation, we could read this string directly from the Google Sheet
    // Using google-spreadsheet similar to the other routes.

    if (password === envPassword) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
