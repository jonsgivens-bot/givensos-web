import { NextResponse } from 'next/server';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

export async function GET(req: Request) {
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
    return NextResponse.json({
      leaderboard: [
        { name: 'Noah', points: 10 },
        { name: 'Kate', points: 0 },
        { name: 'Laney', points: 0 },
        { name: 'Jake', points: 0 }
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

    const rewardsSheet = doc.sheetsByTitle['Family_Rewards'];
    if (!rewardsSheet) return NextResponse.json({ leaderboard: [] });

    await rewardsSheet.loadHeaderRow();
    const rows = await rewardsSheet.getRows();

    const leaderboard = rows.map(r => ({
      name: r.get('Name') || '',
      points: parseInt(r.get('Points') || '0', 10)
    })).filter(k => k.name !== '');

    // Sort by points descending
    leaderboard.sort((a, b) => b.points - a.points);

    return NextResponse.json({ leaderboard });
  } catch (error) {
    console.error("Failed to fetch leaderboard", error);
    return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 });
  }
}
