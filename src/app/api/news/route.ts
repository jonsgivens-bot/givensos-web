import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  // If no credentials, return mocked data so design looks good
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL) {
    return NextResponse.json({
      news: [
        "SCHOOL ALERT: Early dismissal this Friday at 1:00 PM.",
        "Coach Davis: Don't forget practice tomorrow on Field 4.",
        "Reminder: Sign up for the summer league closes tonight."
      ]
    });
  }

  try {
    // 1. Authenticate with Google Sheets using google-spreadsheet
    // 2. Load doc ID 1X04WuSQTN5aSQY-WTHTYNWRznU73964yCDz0-vsOcp4
    // 3. Navigate to 'Trusted_Senders' tab
    // 4. Map rows to string array

    // Placeholder until credentials injected
    return NextResponse.json({
      news: ["Live data will stream here once Google API credentials are added to .env.local."]
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch news" }, { status: 500 });
  }
}
