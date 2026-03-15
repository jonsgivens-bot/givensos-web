import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

async function verifyInventory() {
  const serviceAccountAuth = new JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const doc = new GoogleSpreadsheet('1X04WuSQTN5aSQY-WTHTYNWRznU73964yCDz0-vsOcp4', serviceAccountAuth);

  try {
    await doc.loadInfo();
    const sheet = doc.sheetsByTitle['Inventory'];
    await sheet.loadHeaderRow();
    const rows = await sheet.getRows();
    
    console.log('--- Inventory Sync Verification ---');
    for (const row of rows) {
      if (row.get('Item Name') === 'Whole Milk') {
        console.log(`Whole Milk Qty: ${row.get('Current Qty')}`);
        console.log(`Whole Milk Threshold: ${row.get('Threshold')}`);
      }
    }
  } catch (e) {
    console.error('Error:', e);
  }
}

verifyInventory();
