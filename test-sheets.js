require('dotenv').config({ path: '.env.local' });
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');

async function test() {
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
      console.log('Family_Rewards headers:', rewardsSheet.headerValues);
      const rows = await rewardsSheet.getRows();
      console.log('Row 0:', rows[0].toObject());
    } else {
      console.log('Tab Family_Rewards not found');
    }

    const choreSheet = doc.sheetsByTitle['Chore_Master'];
    if (choreSheet) {
      await choreSheet.loadHeaderRow();
      console.log('Chore_Master headers:', choreSheet.headerValues);
      const rows = await choreSheet.getRows();
      console.log('Row 0:', rows[0].toObject());
    } else {
      console.log('Tab Chore_Master not found');
    }

  } catch (e) {
    console.error('Error:', e);
  }
}

test();
