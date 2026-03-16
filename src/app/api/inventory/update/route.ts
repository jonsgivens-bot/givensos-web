import { NextResponse } from 'next/server';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

export async function POST(req: Request) {
  try {
    const { name, quantity, threshold, action, increment } = await req.json();

    if (!name) {
      return NextResponse.json({ error: "Item name required" }, { status: 400 });
    }

    if (
    !process.env.GOOGLE_SERVICE_ACCOUNT_JSON &&
    (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY)
  ) {
      console.log(`[MOCK] Inventory Action: ${action} - Item: ${name}`);
      return NextResponse.json({ success: true });
    }

    let serviceAccountAuth;
    if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
      const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
      serviceAccountAuth = new JWT({
        email: credentials.client_email,
        key: credentials.private_key,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });
    } else {
      serviceAccountAuth = new JWT({
        email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        key: process.env.GOOGLE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });
    }

    const doc = new GoogleSpreadsheet('1X04WuSQTN5aSQY-WTHTYNWRznU73964yCDz0-vsOcp4', serviceAccountAuth);
    await doc.loadInfo();
    
    const sheet = doc.sheetsByTitle['Inventory'];
    if (!sheet) return NextResponse.json({ error: "Inventory tab not found" }, { status: 404 });

    const rows = await sheet.getRows();
    const itemRow = rows.find(r => String(r.get('Item Name')) === name);

    if (action === 'update' && itemRow) {
      // Adjust existing 
      let currentQty = parseInt(itemRow.get('Current Qty') || '0', 10);
      let newQty = currentQty + (increment || 0);
      if (newQty < 0) newQty = 0;
      
      itemRow.set('Current Qty', newQty);
      await itemRow.save();

    } else if (action === 'add') {
      // Add entirely new
      if (itemRow) {
         return NextResponse.json({ error: "Item already exists" }, { status: 400 });
      } else {
         await sheet.addRow({
           'Item Name': name,
           'Current Qty': quantity,
           'Threshold': threshold || 0
         });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to update inventory", error);
    return NextResponse.json({ error: "Failed to update inventory: " + error.message }, { status: 500 });
  }
}
