import { NextResponse } from 'next/server';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

export async function GET(req: Request) {
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
    return NextResponse.json({
      subscribers: [
        { name: 'Mom (Fake Data)', number: '555-0100' },
        { name: 'Dad (Fake Data)', number: '555-0101' },
      ]
    });
  }

  try {
    const serviceAccountAuth = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const doc = new GoogleSpreadsheet('1X04WuSQTN5aSQY-WTHTYNWRznU73964yCDz0-vsOcp4', serviceAccountAuth);
    await doc.loadInfo();

    // Looking for a 'Trusted_Senders' tab based on the original request
    const sheet = doc.sheetsByTitle['Trusted_Senders'];
    if (!sheet) return NextResponse.json({ subscribers: [] });

    await sheet.loadHeaderRow();
    const rows = await sheet.getRows();

    // Assuming columns loosely named 'Name' and 'Number' or reading raw
    const subscribers = rows.map(r => {
        // Try to guess columns if standard headers don't exist
        const name = r.get('Name') || r.get('Sender Name') || r.get('Contact') || 'Unknown Contact';
        const number = r.get('Number') || r.get('Phone') || r.get('Contact Info') || 'Unknown Number';
        return { name, number };
    }).filter(s => s.name !== 'Unknown Contact');

    return NextResponse.json({ subscribers });
  } catch (error) {
    console.error("Failed to fetch subscribers", error);
    return NextResponse.json({ error: "Failed to fetch subscribers" }, { status: 500 });
  }
}
