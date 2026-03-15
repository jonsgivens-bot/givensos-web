import { NextResponse } from 'next/server';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import { format } from 'date-fns';

export async function POST(req: Request) {
  try {
    const { name, rowNumber, points } = await req.json();

    if (!name || !rowNumber) {
      return NextResponse.json({ error: "Kid name and rowNumber required" }, { status: 400 });
    }

    if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
      console.log(`[MOCK] Marked chore at row ${rowNumber} as complete and added ${points || 0} points to ${name}`);
      return NextResponse.json({ success: true, pointsAdded: points || 0 });
    }

    const serviceAccountAuth = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const doc = new GoogleSpreadsheet('1X04WuSQTN5aSQY-WTHTYNWRznU73964yCDz0-vsOcp4', serviceAccountAuth);
    await doc.loadInfo();
    
    // Update Chore_Master
    const choreSheet = doc.sheetsByTitle['Chore_Master'];
    let choreUpdated = false;
    let chorePoints = points || 0;
    
    if (choreSheet) {
       await choreSheet.loadHeaderRow();
       const rows = await choreSheet.getRows();
       // Find the exact row by rowNumber
       const targetRow = rows.find(r => r.rowNumber === rowNumber);
       if (targetRow) {
         targetRow.set('Status', 'Complete');
         targetRow.set('Last Completed', format(new Date(), 'MMM d, yyyy h:mm a'));
         chorePoints = parseInt(targetRow.get('Points') || '0', 10);
         await targetRow.save();
         choreUpdated = true;
       }
    }

    // Update Family_Rewards with specific chore points
    let pointsAdded = false;
    if (choreUpdated && chorePoints > 0) {
      const rewardsSheet = doc.sheetsByTitle['Family_Rewards'];
      if (rewardsSheet) {
        await rewardsSheet.loadHeaderRow();
        const rows = await rewardsSheet.getRows();
        const kidRow = rows.find(r => String(r.get('Name')) === name);
        if (kidRow) {
          const currentPoints = parseInt(kidRow.get('Points') || '0', 10);
          kidRow.set('Points', currentPoints + chorePoints);
          await kidRow.save();
          pointsAdded = true;
        }
      }
    }

    if (choreUpdated) {
      return NextResponse.json({ success: true, pointsAdded: chorePoints });
    } else {
      return NextResponse.json({ error: "Chore row not found in spreadsheet" }, { status: 404 });
    }
  } catch (error: any) {
    console.error("Failed to update chore", error);
    return NextResponse.json({ error: "Failed to update chore: " + error.message }, { status: 500 });
  }
}
