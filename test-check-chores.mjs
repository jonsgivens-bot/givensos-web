import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

async function checkChoreMaster() {
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) return;
  const auth = new JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  const doc = new GoogleSpreadsheet('1X04WuSQTN5aSQY-WTHTYNWRznU73964yCDz0-vsOcp4', auth);
  await doc.loadInfo();
  
  let sheet = doc.sheetsByTitle['Chore_Master'];
  if (!sheet) {
     console.log("No Chore_Master tab found. Returning.");
     return;
  }
  
  await sheet.loadHeaderRow();
  console.log("Headers:", sheet.headerValues);
  
  const rows = await sheet.getRows();
  console.log("Row 0:");
  if (rows.length > 0) {
     const rowData = {};
     sheet.headerValues.forEach(h => {
       rowData[h] = rows[0].get(h);
     });
     console.log(rowData);
  } else {
     console.log("No rows");
  }
}

checkChoreMaster();
