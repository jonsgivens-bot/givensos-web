import { NextResponse } from 'next/server';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

export async function GET(req: Request) {
  try {
    if (
      !process.env.GOOGLE_SERVICE_ACCOUNT_JSON &&
      (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY)
    ) {
      // Mock data for UI development
      return NextResponse.json({
        chores: [
          { index: 1, name: "Dishwasher (Unload)", assignedTo: "Noah", points: 10, status: "Pending" },
          { index: 2, name: "Walk Dog", assignedTo: "Noah", points: 15, status: "Complete" },
          { index: 3, name: "Set Table", assignedTo: "Kate", points: 5, status: "Pending" },
          { index: 4, name: "Take Out Trash", assignedTo: "Jake", points: 10, status: "Pending" },
        ]
      });
    }

    let serviceAccountAuth;
    if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
      const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
      serviceAccountAuth = new JWT({
        email: credentials.client_email,
        key: credentials.private_key,
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
      });
    } else {
      serviceAccountAuth = new JWT({
        email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        key: process.env.GOOGLE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
      });
    }

    const doc = new GoogleSpreadsheet('1X04WuSQTN5aSQY-WTHTYNWRznU73964yCDz0-vsOcp4', serviceAccountAuth);
    await doc.loadInfo();
    
    const choreSheet = doc.sheetsByTitle['Chore_Master'];
    if (!choreSheet) {
        return NextResponse.json({ chores: [] });
    }

    await choreSheet.loadHeaderRow();
    const rows = await choreSheet.getRows();

    // Get current day of week (e.g., "Monday") locked to central time
    const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'long', timeZone: 'America/Chicago' });

    const chores = rows.map((r, index) => {
      const frequency = r.get('Frequency') || '';
      const dayOfWeek = r.get('Day of Week') || '';
      
      // Filter logic: Daily, or Day of Week matches today
      if (frequency.toLowerCase() === 'daily' || dayOfWeek.toLowerCase() === todayStr.toLowerCase()) {
         return {
           index: r.rowNumber, // Google Sheets row number for updating
           name: r.get('Chore Name') || 'Unnamed Chore',
           assignedTo: r.get('Assigned To') || 'Unassigned',
           points: parseInt(r.get('Points') || '0', 10),
           status: r.get('Status') || 'Pending',
         };
      }
      return null;
    }).filter(Boolean);

    return NextResponse.json({ chores });
  } catch (error: any) {
    console.error("Failed to fetch chores", error);
    return NextResponse.json({ error: "Failed to fetch chores", details: error.message }, { status: 500 });
  }
}
