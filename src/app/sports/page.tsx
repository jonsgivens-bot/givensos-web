"use client";

import { useState, useEffect } from "react";
import { Lock, Calendar as CalendarIcon, MapPin, AlertTriangle, Users } from "lucide-react";
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
  const [selectedChildFilter, setSelectedChildFilter] = useState<string | null>("All");

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

  const uniqueChildrenFilters = ["All", ...Array.from(new Set(events.map(e => e.childName).filter((name): name is string => Boolean(name))))];
  const filteredEvents = selectedChildFilter === "All" || !selectedChildFilter 
     ? events 
     : events.filter(e => e.childName === selectedChildFilter);

  // Filter into Today and Coming Up
  const todayStart = startOfDay(new Date()).getTime();
  const todayEnd = endOfDay(new Date()).getTime();
  
  const todayEvents = filteredEvents.filter(e => {
    const time = new Date(e.rawDate).getTime();
    return time >= todayStart && time <= todayEnd;
  });
  
  const comingUpEvents = filteredEvents.filter(e => {
    const time = new Date(e.rawDate).getTime();
    return time > todayEnd;
  });

  return (
    <main className="min-h-screen bg-[#FDFBF7] text-[#2C3333]">
      {/* Premium Header */}
      <div className="bg-[#4F6F52] text-[#FDFBF7] pt-12 pb-20 px-8 relative overflow-hidden flex justify-between items-start">
        <div className="absolute top-0 right-0 p-12 opacity-10">
           <CalendarIcon size={200} />
        </div>
        <div className="max-w-4xl mx-auto flex flex-col gap-2 relative z-10 w-full">
           <div className="flex items-center justify-between w-full">
             <div className="flex items-center gap-3 text-[#E9E4D9] mb-4">
                <Users size={20} />
                <span className="text-sm font-semibold uppercase tracking-widest">Givens Family</span>
             </div>
             <button 
               onClick={() => { localStorage.removeItem("sports_auth"); setIsAuthenticated(false); }}
               className="px-4 py-2 rounded-full text-sm font-medium bg-white/20 hover:bg-white/30 transition-colors"
             >
               Sign Out <Lock size={12} className="inline ml-1" />
             </button>
           </div>
           <h1 className="text-4xl md:text-5xl font-light tracking-tight">Master Sports Schedule</h1>
           <p className="text-lg opacity-80 max-w-xl font-light">Your complete internal view of all practices, games, and events.</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-8 -mt-10 relative z-20 pb-20">
        <div className="bg-white/90 backdrop-blur-xl border border-[#E9E4D9] rounded-3xl p-6 md:p-10 shadow-xl">
          
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-[#E9E4D9] pb-6">
            <h2 className="text-2xl font-light text-[#4F6F52] flex items-center gap-3">
              <CalendarIcon className="text-[#4F6F52]" /> Active Schedules
            </h2>
            
            {uniqueChildrenFilters.length > 1 && (
              <div className="flex flex-wrap gap-2">
                 {uniqueChildrenFilters.map(child => (
                    <button
                      key={child}
                      onClick={() => setSelectedChildFilter(child as string)}
                      className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all duration-300 ${
                        selectedChildFilter === child 
                        ? 'bg-[#4F6F52] text-[#FDFBF7] border-[#4F6F52] shadow-md scale-105' 
                        : 'bg-[#F8F6F1] text-[#2C3333] border-[#E9E4D9] hover:bg-[#E9E4D9]'
                      }`}
                    >
                      {child}
                    </button>
                 ))}
              </div>
            )}
          </header>

          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-4 text-[#4F6F52] opacity-60">
              <div className="w-8 h-8 rounded-full border-4 border-current border-t-transparent animate-spin"></div>
              <p className="font-medium animate-pulse">Loading schedules from Google...</p>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-20 px-4 bg-[#F8F6F1] rounded-2xl border border-dashed border-[#E9E4D9]">
               <CalendarIcon size={48} className="mx-auto text-[#4F6F52] opacity-30 mb-4" />
               <p className="text-xl font-light text-[#2C3333]">No upcoming events right now.</p>
               <p className="text-sm opacity-60 mt-2">Check back later or adjust your filters above.</p>
            </div>
          ) : (
            <div className="space-y-12">
               {todayEvents.length > 0 && (
                  <section>
                     <h3 className="text-xl font-medium mb-5 flex items-center gap-3 text-[#4F6F52]">
                       <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                       Playing Today
                     </h3>
                     <div className="grid gap-4">
                       {todayEvents.map((evt, i) => (
                          <GameCard key={`today-${i}`} evt={evt} isToday={true} />
                       ))}
                     </div>
                  </section>
               )}
               
               {comingUpEvents.length > 0 && (
                  <section>
                     <h3 className="text-xl font-light mb-5 text-[#2C3333] border-b border-[#E9E4D9] pb-2 inline-block">
                       Coming Up
                     </h3>
                     <div className="grid gap-4">
                       {comingUpEvents.map((evt, i) => (
                          <GameCard key={`upcoming-${i}`} evt={evt} isToday={false} />
                       ))}
                     </div>
                  </section>
               )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function GameCard({ evt, isToday }: { evt: CalendarEvent, isToday: boolean }) {
  const mapLink = evt.location ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(evt.location)}` : null;

  return (
    <div className={`p-6 rounded-2xl border transition-all group hover:shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-6 overflow-hidden relative ${
      isToday ? 'bg-gradient-to-r from-[#FDFBF7] to-[#F8F6F1] border-[#E9E4D9] shadow-sm' : 'bg-white border-[#E9E4D9] hover:border-[#4F6F52]'
    } ${evt.isConflict ? 'border-[#EAD196] bg-[#FCF8EC]/30 hover:border-[#EAD196]' : ''}`}>
      
      {/* Decorative side border for conflict */}
      {evt.isConflict && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#EAD196]"></div>}
      
      {/* Time block */}
      <div className={`flex flex-col items-center justify-center p-4 rounded-xl min-w-[120px] transition-colors ${
        evt.isConflict ? 'bg-[#EAD196] text-[#A68121]' :
        isToday ? 'bg-[#4F6F52] text-[#FDFBF7]' : 'bg-[#F8F6F1] text-[#2C3333] group-hover:bg-[#E9E4D9]'
      }`}>
         <span className={`text-xs uppercase font-medium tracking-wide ${isToday && !evt.isConflict ? 'opacity-80' : 'opacity-100'}`}>
           {evt.date.split(' ')[0]}
         </span>
         <span className="text-2xl font-light">
           {evt.date.split(' ')[1]?.replace(',', '') || evt.date}
         </span>
         <span className={`text-sm mt-1 font-medium ${isToday && !evt.isConflict ? 'opacity-90' : 'opacity-80'}`}>
           {evt.time}
         </span>
      </div>

      {/* Details */}
      <div className="flex-1 space-y-3 w-full">
        <div className="flex items-center gap-3 flex-wrap">
           <h4 className="font-medium text-xl text-[#2C3333] leading-tight">{evt.title}</h4>
           {evt.isConflict && (
             <span className="flex items-center gap-1 text-xs font-bold bg-[#FDEDBF] text-[#9D7614] px-2.5 py-1 rounded-md border border-[#F2DEAA] shadow-sm">
               <AlertTriangle size={14} /> DOUBLE BOOKED
             </span>
           )}
        </div>
        
        <div className="flex flex-wrap gap-3 items-center">
           <div className="flex items-center gap-2 bg-[#F8F6F1] px-3 py-1.5 rounded-lg border border-[#E9E4D9] shadow-sm">
              {evt.colorAccent && (
                 <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: evt.colorAccent }}></div>
              )}
              <span className="text-sm font-medium" style={{ color: evt.colorAccent || '#4F6F52' }}>
                 {evt.childName || evt.calendar}
              </span>
           </div>
        </div>
        
        {mapLink && (
          <a 
            href={mapLink} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="inline-flex items-center gap-1.5 text-sm text-[#4F6F52] hover:text-[#506e53] font-medium bg-[#4F6F52]/5 px-3 py-1.5 rounded-lg transition-colors hover:bg-[#4F6F52]/10"
          >
             <MapPin size={16} /> Get Directions
          </a>
        )}
      </div>
    </div>
  );
}
