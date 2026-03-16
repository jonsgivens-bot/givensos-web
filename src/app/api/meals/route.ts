import { NextResponse } from 'next/server';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

export async function GET() {
  try {
    let serviceAccountAuth;
    if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
      const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
      serviceAccountAuth = new JWT({
        email: credentials.client_email,
        key: credentials.private_key,
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
      });
    } else {
      serviceAccountAuth = new JWT({
        email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        key: process.env.GOOGLE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
      });
    }

    const doc = new GoogleSpreadsheet('1X04WuSQTN5aSQY-WTHTYNWRznU73964yCDz0-vsOcp4', serviceAccountAuth);
    await doc.loadInfo();

    // Fetch Weekly Plan
    const mealSheet = doc.sheetsByTitle['Weekly_Meal_Planner'];
    let weeklyMeals: {day: string, selectedMeal: string}[] = [];
    if (mealSheet) {
      await mealSheet.loadHeaderRow();
      const rows = await mealSheet.getRows();
      weeklyMeals = rows.map(r => ({
        day: r.get('Day') || '',
        selectedMeal: r.get('Selected Meal') || ''
      }));
    }

    // Fetch Recipe Library to get all available meals
    const recipeSheet = doc.sheetsByTitle['Recipe_Library'];
    let availableMeals = new Set<string>();
    if (recipeSheet) {
      await recipeSheet.loadHeaderRow();
      const rows = await recipeSheet.getRows();
      rows.forEach(r => {
         const mealName = r.get('Meal Name');
         if (mealName) availableMeals.add(mealName);
      });
    }

    return NextResponse.json({ 
       weeklyPlan: weeklyMeals,
       availableMeals: Array.from(availableMeals).sort()
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch meals";
    console.error("Failed to fetch meals", error);
    return NextResponse.json({ error: "Failed to fetch meals", details: errorMessage }, { status: 500 });
  }
}
