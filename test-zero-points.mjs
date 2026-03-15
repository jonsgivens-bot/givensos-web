import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

async function resetPoints() {
  const serviceAccountAuth = new JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const doc = new GoogleSpreadsheet('1X04WuSQTN5aSQY-WTHTYNWRznU73964yCDz0-vsOcp4', serviceAccountAuth);

  try {
    await doc.loadInfo();
    console.log(`Document title: ${doc.title}`);

    const rewardsSheet = doc.sheetsByTitle['Family_Rewards'];
    if (rewardsSheet) {
      await rewardsSheet.loadHeaderRow();
      const rows = await rewardsSheet.getRows();
      for (const kidRow of rows) {
        kidRow.set('Points', 0);
        await kidRow.save();
        console.log(`Reset ${kidRow.get('Name')} points to 0.`);
      }
    }

    console.log('Points zeroed for the week.');
  } catch (e) {
    console.error('Error:', e);
  }
}

resetPoints();
