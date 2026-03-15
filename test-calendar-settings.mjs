import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

async function seedCalendarSettings() {
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
      console.log("No credentials found. Exiting setup.");
      return;
  }

  const serviceAccountAuth = new JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const doc = new GoogleSpreadsheet('1X04WuSQTN5aSQY-WTHTYNWRznU73964yCDz0-vsOcp4', serviceAccountAuth);

  try {
    await doc.loadInfo();
    console.log(`Document loaded: ${doc.title}`);

    let calSheet = doc.sheetsByTitle['Calendar_Settings'];
    if (!calSheet) {
      console.log("Creating 'Calendar_Settings' tab...");
      calSheet = await doc.addSheet({ headerValues: ['Child Name', 'Calendar ID', 'Color Accent'], title: 'Calendar_Settings' });
      
      // Seed some test data
      // For public U.S. holidays as a test calendar since it's publicly accessible: 
      // en.usa#holiday@group.v.calendar.google.com
      await calSheet.addRows([
        { 'Child Name': 'Noah', 'Calendar ID': 'en.usa#holiday@group.v.calendar.google.com', 'Color Accent': '#B7410E' }, // Rust orange
        { 'Child Name': 'Kate', 'Calendar ID': 'en.usa#holiday@group.v.calendar.google.com', 'Color Accent': '#6E85B7' }, // Soft Blue
      ]);
      console.log("Created and seeded Calendar_Settings with public holiday test calendars.");
    } else {
      console.log("'Calendar_Settings' tab already exists. Ensuring headers...");
      await calSheet.setHeaderRow(['Child Name', 'Calendar ID', 'Color Accent']);
      console.log("Ensured headers on Calendar_Settings.");
    }

  } catch (e) {
    console.error('Error:', e);
  }
}

seedCalendarSettings();
