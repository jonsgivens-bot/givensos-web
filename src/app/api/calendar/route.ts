import { NextResponse } from 'next/server';
import { addDays, format, isBefore, parseISO } from 'date-fns';
import { google } from 'googleapis';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

export async function GET(req: Request) {
  if (
    !process.env.GOOGLE_SERVICE_ACCOUNT_JSON &&
    (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY)
  ) {
    const today = new Date();
    const tomorrow = addDays(today, 1);
    
    // Mock data based on the structure we are building
    return NextResponse.json({
      events: [
        {
          title: "Championship Game vs. Tigers",
          calendar: "Kate 14 Elite Red",
          childName: "Kate",
          colorAccent: "#6E85B7",
          date: format(today, 'MMM d, yyyy'),
          time: "6:00 PM",
          rawDate: today.toISOString(),
          endTime: new Date(today.getTime() + 2 * 60 * 60 * 1000).toISOString(),
          location: "123 Tiger Stadium Dr, St. Louis, MO"
        },
        {
          title: "Practice - Field C",
          calendar: "Kids Vetta Sports Calendar",
          childName: "Noah",
          colorAccent: "#B7410E",
          date: format(tomorrow, 'MMM d, yyyy'),
          time: "4:30 PM",
          rawDate: tomorrow.toISOString(),
          endTime: new Date(tomorrow.getTime() + 1.5 * 60 * 60 * 1000).toISOString(),
          location: "Vetta Sports, Concord"
        }
      ]
    });
  }

  try {
    let auth;
    if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
      const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
      auth = new JWT({
        email: credentials.client_email,
        key: credentials.private_key,
        scopes: [
          'https://www.googleapis.com/auth/spreadsheets.readonly',
          'https://www.googleapis.com/auth/calendar.readonly'
        ],
      });
    } else {
      auth = new JWT({
        email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        key: process.env.GOOGLE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
        scopes: [
          'https://www.googleapis.com/auth/spreadsheets.readonly',
          'https://www.googleapis.com/auth/calendar.readonly'
        ],
      });
    }

    // Extract search params for Fan Portal features
    const url = new URL(req.url);
    const publicOnly = url.searchParams.get('publicOnly') === 'true';
    const daysParam = url.searchParams.get('days');
    const daysToLookAhead = daysParam ? parseInt(daysParam, 10) : 14;

    // 1. Fetch settings from Google Sheets
    const doc = new GoogleSpreadsheet('1X04WuSQTN5aSQY-WTHTYNWRznU73964yCDz0-vsOcp4', auth);
    await doc.loadInfo();
    const sheet = doc.sheetsByTitle['Calendar_Settings'];
    
    let calendarConfigs: any[] = [];
    if (sheet) {
      await sheet.loadHeaderRow();
      const rows = await sheet.getRows();
      calendarConfigs = rows.map(r => ({
        calendarId: r.get('Calendar ID') || '',
        childName: r.get('Calendar Name') || 'Family',
        colorAccent: r.get('Color Accent') || '#4F6F52',
        publicView: r.get('Public View?') || 'No', // capture public view flag
      })).filter(c => c.calendarId !== '');
    }

    if (publicOnly) {
      calendarConfigs = calendarConfigs.filter(c => c.publicView?.toLowerCase() === 'yes');
    }

    if (calendarConfigs.length === 0) {
      return NextResponse.json({ events: [] });
    }

    // 2. Fetch events from Google Calendar
    const calendar = google.calendar({ version: 'v3', auth });
    const timeMin = new Date();
    const timeMax = addDays(timeMin, daysToLookAhead); // Dynamic days

    const allEvents = [];

    for (const config of calendarConfigs) {
      try {
        const response = await calendar.events.list({
          calendarId: config.calendarId,
          timeMin: timeMin.toISOString(),
          timeMax: timeMax.toISOString(),
          maxResults: 20,
          singleEvents: true,
          orderBy: 'startTime',
        });

        const events = response.data.items || [];
        for (const event of events) {
           const start = event.start?.dateTime || event.start?.date;
           if (!start) continue;

           const title = event.summary || 'Busy';
           
           // If we are looking for public fan portal events, ONLY show games
           if (publicOnly && !title.toLowerCase().includes('game')) {
             continue;
           }
           
           const dateObj = new Date(start);
           
           allEvents.push({
             title: title,
             calendar: config.calendarId, // Note: the user asked for name, but we only have ID in sheets. We might use Child Name for display.
             childName: config.childName,
             colorAccent: config.colorAccent,
             date: format(dateObj, 'MMM d, yyyy'),
             time: event.start?.dateTime ? format(dateObj, 'h:mm a') : 'All Day',
             rawDate: dateObj.toISOString(),
             endTime: event.end?.dateTime ? new Date(event.end.dateTime).toISOString() : null,
             location: event.location || null
           });
        }
      } catch (calErr) {
        console.error(`Failed to fetch calendar: ${config.calendarId}`, calErr);
      }
    }

    // Sort all events globally by date
    allEvents.sort((a, b) => new Date(a.rawDate).getTime() - new Date(b.rawDate).getTime());

    return NextResponse.json({ events: allEvents });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch calendar" }, { status: 500 });
  }
}
