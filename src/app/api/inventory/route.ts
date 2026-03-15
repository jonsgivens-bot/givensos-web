import { NextResponse } from 'next/server';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

export async function GET(req: Request) {
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
    return NextResponse.json({
      items: [
        { name: 'Milk', quantity: 1, threshold: 1, status: 'REORDER' },
        { name: 'Eggs', quantity: 12, threshold: 6, status: 'OK' },
        { name: 'Apples', quantity: 3, threshold: 4, status: 'REORDER' }, // <= threshold
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

    const inventorySheet = doc.sheetsByTitle['Inventory'];
    if (!inventorySheet) return NextResponse.json({ items: [] });

    await inventorySheet.loadHeaderRow();
    const rows = await inventorySheet.getRows();

    const items = rows.map(r => ({
      name: r.get('Item Name') || '',
      quantity: parseInt(r.get('Current Qty') || '0', 10),
      threshold: parseInt(r.get('Threshold') || '0', 10),
      category: r.get('Category') || '',
      unit: r.get('Unit') || '',
      status: r.get('Status') || ''
    })).filter(i => i.name !== '');

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Failed to fetch inventory", error);
    return NextResponse.json({ error: "Failed to fetch inventory" }, { status: 500 });
  }
}
