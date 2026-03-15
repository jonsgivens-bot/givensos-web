import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

async function initInventory() {
  const serviceAccountAuth = new JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const doc = new GoogleSpreadsheet('1X04WuSQTN5aSQY-WTHTYNWRznU73964yCDz0-vsOcp4', serviceAccountAuth);

  try {
    await doc.loadInfo();
    console.log(`Document title: ${doc.title}`);

    let inventorySheet = doc.sheetsByTitle['Inventory'];
    if (!inventorySheet) {
        console.log("Creating new 'Inventory' tab...");
        inventorySheet = await doc.addSheet({ title: 'Inventory', headerValues: ['Item Name', 'Current Qty', 'Threshold'] });
        
        // Seed some sample data
        await inventorySheet.addRow({ 'Item Name': 'Milk', 'Current Qty': 1, 'Threshold': 1 });
        await inventorySheet.addRow({ 'Item Name': 'Eggs', 'Current Qty': 12, 'Threshold': 6 });
        await inventorySheet.addRow({ 'Item Name': 'Bread', 'Current Qty': 2, 'Threshold': 1 });
        await inventorySheet.addRow({ 'Item Name': 'Apples', 'Current Qty': 5, 'Threshold': 4 });
        
        console.log('Inventory sheet created and seeded with sample data.');
    } else {
        console.log("Inventory sheet already exists. Checking headers...");
        try {
            await inventorySheet.loadHeaderRow();
            console.log("Existing Headers:", inventorySheet.headerValues);
        } catch(e) {
            console.log("No headers found. Setting headers...");
            await inventorySheet.setHeaderRow(['Item Name', 'Current Qty', 'Threshold']);
            // Seed some sample data
            await inventorySheet.addRow({ 'Item Name': 'Milk', 'Current Qty': 1, 'Threshold': 1 });
            await inventorySheet.addRow({ 'Item Name': 'Eggs', 'Current Qty': 12, 'Threshold': 6 });
            await inventorySheet.addRow({ 'Item Name': 'Bread', 'Current Qty': 2, 'Threshold': 1 });
            console.log('Headers set and sample data seeded.');
        }
    }

    console.log('Done mapping Inventory tab.');
  } catch (e) {
    console.error('Error:', e);
  }
}

initInventory();
