import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

async function resetChores() {
  console.log("Starting Chore Reset...");
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
     console.error("Missing Google Credentials");
     return;
  }
  
  try {
    const auth = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    
    const doc = new GoogleSpreadsheet('1X04WuSQTN5aSQY-WTHTYNWRznU73964yCDz0-vsOcp4', auth);
    await doc.loadInfo();
    
    let sheet = doc.sheetsByTitle['Chore_Master'];
    if (!sheet) {
       console.log("No Chore_Master tab found. Exiting.");
       return;
    }
    
    await sheet.loadHeaderRow();
    const rows = await sheet.getRows();
    
    let updatedCount = 0;
    for (const row of rows) {
       const status = row.get('Status');
       if (status === 'Complete') {
          row.set('Status', 'Pending');
          await row.save();
          updatedCount++;
          console.log(`Reset task for ${row.get('Assigned To')}: ${row.get('Chore Name')}`);
       }
    }
    
    console.log(`\nChore Reset Complete. ${updatedCount} tasks reset to Pending.`);
  } catch (e) {
    console.error("Error during chore reset:", e);
  }
}

resetChores();
