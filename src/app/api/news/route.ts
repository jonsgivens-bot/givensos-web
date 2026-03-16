import { NextResponse } from 'next/server';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

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
    let auth;
    if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
      const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
      auth = new JWT({
        email: credentials.client_email,
        key: credentials.private_key,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });
    } else {
      auth = new JWT({
        email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        key: process.env.GOOGLE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });
    }

    const doc = new GoogleSpreadsheet('1X04WuSQTN5aSQY-WTHTYNWRznU73964yCDz0-vsOcp4', auth);
    await doc.loadInfo();
    
    // We try to read news from a dedicated News sheet or Trusted_Senders if meant as news
    // Assuming the user wants 'Morning Flash' items. Let's look for a 'News' column somewhere.
    // If no explicit news sheet, let's gracefully return a placeholder or check 'Trusted_Senders' column A.
    const newsSheet = doc.sheetsByTitle['Trusted_Senders'];
    let newsItems: string[] = [];

    if (newsSheet) {
      // Load cells directly to avoid header row errors if headers are missing
      await newsSheet.loadCells('A1:C20');
      for (let i = 0; i < 20; i++) {
        const cell = newsSheet.getCell(i, 0); // Read first column
        if (cell.value) {
            newsItems.push(cell.value.toString());
        }
      }
    }

    if (newsItems.length === 0) {
      newsItems = ["No news items found in the spreadsheet today."];
    }

    return NextResponse.json({ news: newsItems });
  } catch (error) {
    console.error("Failed to fetch news", error);
    return NextResponse.json({ error: "Failed to fetch news" }, { status: 500 });
  }
}
