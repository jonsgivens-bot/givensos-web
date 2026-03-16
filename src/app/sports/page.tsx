"use client";

import { useState, useEffect } from "react";
import { Lock, Calendar as CalendarIcon, MapPin, AlertTriangle } from "lucide-react";
import { startOfDay, endOfDay } from "date-fns";

export interface CalendarEvent {
  title: string;
  calendar: string;
  childName: string;
  colorAccent: string;
  date: string;
  time: string;
  rawDate: string;
  endTime: string | null;
  location: string | null;
  isConflict?: boolean;
}

export default function SportsPortal() {
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState("");
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check local storage for session
    if (localStorage.getItem("sports_auth") === "true") {
      setIsAuthenticated(true);
      fetchSchedules();
    }
  }, []);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/calendar?full=true");
      const data = await res.json();
      
      const fetchedEvents = data.events || [];
      
      // Determine conflicts
      const conflicts = new Set<number>();
      for (let i = 0; i < fetchedEvents.length; i++) {
        for (let j = i + 1; j < fetchedEvents.length; j++) {
           const a = fetchedEvents[i];
           const b = fetchedEvents[j];
           if (a.endTime && b.endTime && a.rawDate && b.rawDate) {
              const startA = new Date(a.rawDate).getTime();
              const endA = new Date(a.endTime).getTime();
              const startB = new Date(b.rawDate).getTime();
              const endB = new Date(b.endTime).getTime();
              
              if (startA < endB && startB < endA) {
                 conflicts.add(i);
                 conflicts.add(j);
              }
           }
        }
      }
      
      const eventsWithConflicts = fetchedEvents.map((evt: Record<string, unknown>, i: number) => ({
        ...evt,
        isConflict: conflicts.has(i)
      }));
      
      setEvents(eventsWithConflicts);
    } catch (e) {
      console.error("Failed to load schedules", e);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/verify-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        setIsAuthenticated(true);
        localStorage.setItem("sports_auth", "true");
        fetchSchedules();
      } else {
        setError("Incorrect password");
      }
    } catch {
      setError("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <form onSubmit={handleLogin} className="bg-white/70 backdrop-blur-md p-10 rounded-3xl border border-[#E9E4D9] shadow-sm max-w-sm w-full">
          <div className="flex justify-center mb-6 text-[#4F6F52]">
            <Lock size={40} />
          </div>
          <h1 className="text-2xl font-light text-center mb-2 text-[#4F6F52]">Sports Portal</h1>
          <p className="text-sm text-center mb-8 opacity-60">Enter the family password to access game schedules.</p>
          
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-4 rounded-xl border border-[#E9E4D9] mb-4 outline-none focus:border-[#4F6F52] bg-[#FDFBF7]"
            placeholder="Password"
            required
          />
          
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          
          <button 
            disabled={loading}
            className="w-full py-4 rounded-xl font-medium text-[#FDFBF7] bg-[#4F6F52] hover:bg-[#3e5a41] transition-colors disabled:opacity-50"
          >
            {loading ? "Verifying..." : "Access Schedules"}
          </button>
        </form>
      </div>
    );
  }

  // Filter into Today and Coming Up
  const todayStart = startOfDay(new Date()).getTime();
  const todayEnd = endOfDay(new Date()).getTime();
  
  const todayEvents = events.filter(e => {
    const time = new Date(e.rawDate).getTime();
    return time >= todayStart && time <= todayEnd;
  });
  
  const comingUpEvents = events.filter(e => {
    const time = new Date(e.rawDate).getTime();
    return time > todayEnd;
  });

  return (
    <main className="p-8 max-w-4xl mx-auto">
      <header className="flex justify-between items-center mb-10 pb-6 border-b border-[#E9E4D9]">
        <h1 className="text-3xl font-light tracking-tight text-[#4F6F52] flex items-center gap-3">
          <CalendarIcon className="text-[#4F6F52]" /> Full Sports Schedule
        </h1>
        <button 
          onClick={() => { localStorage.removeItem("sports_auth"); setIsAuthenticated(false); }}
          className="text-sm opacity-60 hover:opacity-100 hover:text-[#4F6F52] transition-colors"
        >
          Sign Out
        </button>
      </header>

      {loading ? (
        <p className="text-center opacity-60 py-10">Loading schedules from Google Calendar...</p>
      ) : events.length === 0 ? (
        <p className="text-center opacity-60 py-10">No upcoming games found.</p>
      ) : (
        <div className="space-y-12">
           {todayEvents.length > 0 && (
              <section>
                 <h2 className="text-2xl font-medium mb-4 pb-2 border-b-2 border-[#4F6F52] inline-block text-[#4F6F52]">Today</h2>
                 <div className="grid gap-4">
                   {todayEvents.map((evt, i) => (
                      <EventCard key={`today-${i}`} evt={evt} />
                   ))}
                 </div>
              </section>
           )}
           
           {comingUpEvents.length > 0 && (
              <section>
                 <h2 className="text-2xl font-light mb-4 pb-2 border-b border-[#E9E4D9]">Coming Up</h2>
                 <div className="grid gap-4">
                   {comingUpEvents.map((evt, i) => (
                      <EventCard key={`upcoming-${i}`} evt={evt} />
                   ))}
                 </div>
              </section>
           )}
        </div>
      )}
    </main>
  );
}

function EventCard({ evt }: { evt: CalendarEvent }) {
  const mapLink = evt.location ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(evt.location)}` : null;

  return (
    <div className={`bg-white/70 backdrop-blur-sm p-6 rounded-2xl border ${evt.isConflict ? 'border-[#EAD196] shadow-sm bg-[#FCF8EC]/50' : 'border-[#E9E4D9]'} flex flex-col md:flex-row justify-between items-start gap-4 hover:shadow-md transition-all relative overflow-hidden`}>
      {/* Decorative side border for conflict */}
      {evt.isConflict && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#EAD196]"></div>}
      
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-1">
          <h3 className="font-medium text-lg text-[#2C3333]">{evt.title}</h3>
          {evt.isConflict && (
            <span className="flex items-center gap-1 text-xs font-semibold bg-[#EAD196] text-[#A68121] px-2 py-0.5 rounded-full">
              <AlertTriangle size={12} /> Double Booked
            </span>
          )}
        </div>
        
        <div className="flex flex-col gap-1 mt-2">
           <div className="flex items-center gap-2">
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[#F8F6F1] border border-[#E9E4D9]" style={{ color: evt.colorAccent || '#4F6F52' }}>
                 {evt.childName || evt.calendar}
              </span>
              <span className="text-sm opacity-60">{evt.calendar}</span>
           </div>
           
           {mapLink && (
             <a href={mapLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-[#4F6F52] hover:underline mt-1 w-fit">
                <MapPin size={14} /> {evt.location}
             </a>
           )}
        </div>
      </div>
      <div className="text-right bg-[#FDFBF7] px-5 py-3 rounded-xl border border-[#E9E4D9] min-w-[140px] shadow-sm">
        <p className="font-medium text-[#4F6F52] text-lg">{evt.date}</p>
        <p className="text-sm opacity-80">{evt.time}</p>
      </div>
    </div>
  );
}
