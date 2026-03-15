import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

async function verify() {
  const serviceAccountAuth = new JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const doc = new GoogleSpreadsheet('1X04WuSQTN5aSQY-WTHTYNWRznU73964yCDz0-vsOcp4', serviceAccountAuth);

  try {
    await doc.loadInfo();
    const rewardsSheet = doc.sheetsByTitle['Family_Rewards'];
    await rewardsSheet.loadHeaderRow();
    const rows = await rewardsSheet.getRows();
    
    console.log('--- Family Rewards Verification ---');
    for (const row of rows) {
      if (row.get('Name') === 'Noah') {
        console.log(`Noah Points: ${row.get('Points')}`);
      }
    }
  } catch (e) {
    console.error('Error:', e);
  }
}

verify();
