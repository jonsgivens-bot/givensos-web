import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

async function init() {
  const serviceAccountAuth = new JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const doc = new GoogleSpreadsheet('1X04WuSQTN5aSQY-WTHTYNWRznU73964yCDz0-vsOcp4', serviceAccountAuth);

  try {
    await doc.loadInfo();
    console.log(`Document title: ${doc.title}`);

    const kids = ["Noah", "Kate", "Laney", "Jake"];

    // Init Family_Rewards
    const rewardsSheet = doc.sheetsByTitle['Family_Rewards'];
    if (rewardsSheet) {
      await rewardsSheet.setHeaderRow(['Name', 'Points']);
      const existing = await rewardsSheet.getRows();
      if (existing.length === 0) {
        for (const kid of kids) {
          await rewardsSheet.addRow({ Name: kid, Points: 0 });
        }
        console.log('Seeded Family_Rewards');
      } else {
        console.log('Family_Rewards already seeded');
      }
    }

    // Init Chore_Master
    const choreSheet = doc.sheetsByTitle['Chore_Master'];
    if (choreSheet) {
      await choreSheet.setHeaderRow(['Name', 'Last Completed']);
      const existing = await choreSheet.getRows();
      if (existing.length === 0) {
        for (const kid of kids) {
          await choreSheet.addRow({ Name: kid, 'Last Completed': 'Never' });
        }
        console.log('Seeded Chore_Master');
      } else {
        console.log('Chore_Master already seeded');
      }
    }

    console.log('Done mapping.');
  } catch (e) {
    console.error('Error:', e);
  }
}

init();
