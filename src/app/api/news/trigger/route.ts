import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    // In a real app, this would hit Twilio, SendGrid, or another SMS API
    // targeting the subscribers fetched in /api/subscribers
    
    // Simulating a successful trigger
    console.log("🔔 [MANUAL TRIGGER] Morning Flash broadcast sent to all SMS subscribers.");

    return NextResponse.json({ success: true, message: "Morning Flash sent!" });
  } catch (error: any) {
    console.error("Failed to trigger Morning Flash", error);
    return NextResponse.json({ error: "Failed to trigger Morning Flash: " + error.message }, { status: 500 });
  }
}
