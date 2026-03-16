import { NextResponse } from 'next/server';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

export async function POST(req: Request) {
  try {
    const { meals } = await req.json(); // Array of { day, selectedMeal }

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

    // 1. SAVE: Update the Weekly_Meal_Planner sheet
    const mealSheet = doc.sheetsByTitle['Weekly_Meal_Planner'];
    if (!mealSheet) return NextResponse.json({ error: "Weekly_Meal_Planner sheet not found" }, { status: 404 });
    
    await mealSheet.loadHeaderRow();
    const mealRows = await mealSheet.getRows();
    
    const selectedMealNames = new Set<string>();

    for (const update of meals) {
      const existingRow = mealRows.find(r => r.get('Day') === update.day);
      if (existingRow) {
        existingRow.set('Selected Meal', update.selectedMeal);
        await existingRow.save();
      } else {
        await mealSheet.addRow({ 'Day': update.day, 'Selected Meal': update.selectedMeal });
      }
      
      if (update.selectedMeal && update.selectedMeal.trim() !== '') {
         selectedMealNames.add(update.selectedMeal);
      }
    }

    // 2. RECIPE LOOKUP: Find required ingredients
    const requiredIngredientsStr = new Set<string>();
    if (selectedMealNames.size > 0) {
       const recipeSheet = doc.sheetsByTitle['Recipe_Library'];
       if (recipeSheet) {
          await recipeSheet.loadHeaderRow();
          const recipeRows = await recipeSheet.getRows();
          
          for (const row of recipeRows) {
             const mName = row.get('Meal Name');
             const alwaysStock = row.get('Always in Stock?');
             const ingredient = row.get('Ingredient');
             
             if (selectedMealNames.has(mName) && (!alwaysStock || alwaysStock.toLowerCase() !== 'yes') && ingredient) {
                requiredIngredientsStr.add(ingredient.trim().toLowerCase());
             }
          }
       }
    }

    // 3. INVENTORY SYNC: Cross-reference and set REORDER
    let reorderedItems: string[] = [];
    if (requiredIngredientsStr.size > 0) {
       const inventorySheet = doc.sheetsByTitle['Inventory'];
       if (inventorySheet) {
          await inventorySheet.loadHeaderRow();
          const invRows = await inventorySheet.getRows();
          
          for (const row of invRows) {
              const itemName = row.get('Item Name')?.trim().toLowerCase() || '';
              
              if (requiredIngredientsStr.has(itemName)) {
                  const qty = parseFloat(row.get('Current Qty') || '0');
                  const threshold = parseFloat(row.get('Threshold') || '0');
                  
                  if (qty <= threshold) {
                      row.set('Status', 'REORDER');
                      await row.save();
                      reorderedItems.push(row.get('Item Name')); // Push proper cased name
                  }
              }
          }
       }
    }

    return NextResponse.json({ success: true, reorderedItems });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to sync meals to inventory";
    console.error("Failed to sync meals to inventory", error);
    return NextResponse.json({ error: "Failed to sync meals to inventory", details: errorMessage }, { status: 500 });
  }
}
