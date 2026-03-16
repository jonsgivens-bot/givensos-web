"use client";

import { useState, useEffect } from "react";
import { Calendar as CalendarIcon, MapPin, Trophy, Users } from "lucide-react";
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
}

export default function FanPortal() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChildFilter, setSelectedChildFilter] = useState<string | null>("All");

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      // Fetch specifically public events looking ahead 30 days
      const res = await fetch("/api/calendar?publicOnly=true&days=30");
      const data = await res.json();
      setEvents(data.events || []);
    } catch (e) {
      console.error("Failed to load schedules", e);
    } finally {
      setLoading(false);
    }
  };

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
      <div className="bg-[#4F6F52] text-[#FDFBF7] pt-12 pb-20 px-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-10">
           <Trophy size={200} />
        </div>
        <div className="max-w-4xl mx-auto flex flex-col gap-2 relative z-10">
           <div className="flex items-center gap-3 text-[#E9E4D9] mb-4">
              <Users size={20} />
              <span className="text-sm font-semibold uppercase tracking-widest">Givens Family</span>
           </div>
           <h1 className="text-4xl md:text-5xl font-light tracking-tight">Fan Portal</h1>
           <p className="text-lg opacity-80 max-w-xl font-light">Upcoming game schedules for the next 30 days. Come out and support!</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-8 -mt-10 relative z-20 pb-20">
        <div className="bg-white/90 backdrop-blur-xl border border-[#E9E4D9] rounded-3xl p-6 md:p-10 shadow-xl">
          
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-[#E9E4D9] pb-6">
            <h2 className="text-2xl font-light text-[#4F6F52] flex items-center gap-3">
              <CalendarIcon className="text-[#4F6F52]" /> Game Schedule
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
              <p className="font-medium animate-pulse">Loading games...</p>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-20 px-4 bg-[#F8F6F1] rounded-2xl border border-dashed border-[#E9E4D9]">
               <Trophy size={48} className="mx-auto text-[#4F6F52] opacity-30 mb-4" />
               <p className="text-xl font-light text-[#2C3333]">No upcoming games right now.</p>
               <p className="text-sm opacity-60 mt-2">Check back later for the latest schedules!</p>
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

function GameCard({ evt, isToday }: { evt: any, isToday: boolean }) {
  const mapLink = evt.location ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(evt.location)}` : null;

  return (
    <div className={`p-6 rounded-2xl border transition-all group hover:shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-6 overflow-hidden relative ${
      isToday ? 'bg-gradient-to-r from-[#FDFBF7] to-[#F8F6F1] border-[#E9E4D9] shadow-sm' : 'bg-white border-[#E9E4D9] hover:border-[#4F6F52]'
    }`}>
      
      {/* Time block */}
      <div className={`flex flex-col items-center justify-center p-4 rounded-xl min-w-[120px] transition-colors ${
        isToday ? 'bg-[#4F6F52] text-[#FDFBF7]' : 'bg-[#F8F6F1] text-[#2C3333] group-hover:bg-[#E9E4D9]'
      }`}>
         <span className={`text-xs uppercase font-medium tracking-wide ${isToday ? 'opacity-80' : 'text-[#4F6F52]'}`}>
           {evt.date.split(' ')[0]}
         </span>
         <span className="text-2xl font-light">
           {evt.date.split(' ')[1].replace(',', '')}
         </span>
         <span className={`text-sm mt-1 ${isToday ? 'opacity-90' : 'opacity-60'}`}>
           {evt.time}
         </span>
      </div>

      {/* Details */}
      <div className="flex-1 space-y-3 w-full">
        <div className="flex items-center gap-3 flex-wrap">
           <h4 className="font-medium text-xl text-[#2C3333] leading-tight">{evt.title}</h4>
        </div>
        
        <div className="flex flex-wrap gap-3 items-center">
           <div className="flex items-center gap-2 bg-[#F8F6F1] px-3 py-1.5 rounded-lg border border-[#E9E4D9]">
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
