"use client";

import { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import { QRCodeSVG } from "qrcode.react";
import { Settings, X } from "lucide-react";

export default function Home() {
  const defaultKids = ["Noah", "Kate", "Laney", "Jake"];
  const [kids, setKids] = useState<string[]>(defaultKids);
  const [points, setPoints] = useState(0);
  const [events, setEvents] = useState<Record<string, any>[]>([]);
  const [leaderboard, setLeaderboard] = useState<Record<string, any>[]>([]);
  const [chores, setChores] = useState<Record<string, any>[]>([]);
  const [choresError, setChoresError] = useState<string | null>(null);
  const [selectedChildFilter, setSelectedChildFilter] = useState<string | null>("All");
  
  // Loading states
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingChores, setLoadingChores] = useState(true);
  
  // QoL States
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [subscribers, setSubscribers] = useState<Record<string, any>[]>([]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    // Kid Persistence
    const lastKid = localStorage.getItem("lastSelectedKid");
    if (lastKid && defaultKids.includes(lastKid)) {
       
      setKids([lastKid, ...defaultKids.filter(k => k !== lastKid)]);
    }

    // Fetch Calendar
    fetch("/api/calendar")
      .then((res) => res.json())
      .then((data) => setEvents(data.events || []))
      .catch(() => setEvents([]))
      .finally(() => setLoadingEvents(false));

    // Fetch Leaderboard
    fetch("/api/leaderboard")
       .then((res) => res.json())
       .then((data) => {
         setLeaderboard(data.leaderboard || []);
         // Sum total points for the header
         if (data.leaderboard) {
            const total = data.leaderboard.reduce((acc: number, curr: any) => acc + curr.points, 0);
            setPoints(total);
         }
       })
       .catch(() => setLeaderboard([]));

    // Fetch Chores
    fetch("/api/chores")
      .then((res) => {
        if (!res.ok) {
           return res.json().then(errData => {
              throw new Error(errData.error + (errData.details ? `: ${errData.details}` : '') || `HTTP error! status: ${res.status}`);
           });
        }
        return res.json();
      })
      .then((data) => {
        setChores(data.chores || []);
        setChoresError(null);
      })
      .catch((err) => {
        setChores([]);
        setChoresError(err.message);
      })
      .finally(() => setLoadingChores(false));
  }, []);

  const handleChoreComplete = async (name: string, rowNumber: number, chorePoints: number) => {
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ["#4F6F52", "#DCD7C9"] });
    
    // Optimistic UI update
    setPoints(prev => prev + chorePoints);
    setChores(prev => prev.map(c => c.index === rowNumber ? { ...c, status: 'Complete' } : c));
    localStorage.setItem("lastSelectedKid", name);
    setKids([name, ...defaultKids.filter(k => k !== name)]);
    
    setLeaderboard(prev => {
       const newLb = prev.map(k => k.name === name ? { ...k, points: k.points + chorePoints } : k);
       return newLb.sort((a, b) => b.points - a.points);
    });

    try {
      await fetch("/api/chore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, rowNumber, points: chorePoints }),
      });
      showToast("Saved!");
    } catch (e) {
      console.error("Failed to update chore:", e);
    }
  };

  const verifyAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/verify-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: adminPassword }),
      });
      if (res.ok) {
        setIsAdminAuthenticated(true);
        const subRes = await fetch("/api/subscribers");
        const subData = await subRes.json();
        setSubscribers(subData.subscribers || []);
      } else {
        alert("Incorrect password");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const uniqueChildrenFilters = ["All", ...Array.from(new Set(events.map(e => e.childName).filter(Boolean)))];
  const filteredEvents = selectedChildFilter === "All" || !selectedChildFilter 
     ? events 
     : events.filter(e => e.childName === selectedChildFilter);

  return (
    <main className="p-4 md:p-8 min-h-screen bg-[#FDFBF7]">
      <header className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center mb-8 md:mb-12 gap-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 w-full md:w-auto">
          <h1 className="text-4xl font-light tracking-tight text-[#4F6F52]">GivensOS</h1>
          <a
            href="https://docs.google.com/spreadsheets/d/1X04WuSQTN5aSQY-WTHTYNWRznU73964yCDz0-vsOcp4/edit?gid=704590694#gid=704590694"
            target="_blank"
            rel="noopener noreferrer"
            className="min-h-[44px] flex items-center justify-center px-6 rounded-full text-sm font-medium border border-[#4F6F52] text-[#4F6F52] hover:bg-[#4F6F52] hover:text-[#FDFBF7] transition-colors shadow-sm w-full sm:w-auto"
          >
            Open Family Spreadsheet
          </a>
        </div>
        <div className="text-left md:text-right hidden md:block">
          <p className="text-sm opacity-60">Family Points</p>
          <p className="text-2xl font-light text-[#4F6F52]">{points}</p>
        </div>
      </header>

      {/* Balanced Mobile-First Flow: Grid puts Sports on top on mobile, balanced left/right on desktop */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-start">
        
        {/* COLUMN 1: Master Sports Schedule */}
        <div className="flex flex-col gap-8 md:gap-12">
          <section className="bg-white/70 backdrop-blur-md border border-[#E9E4D9] rounded-3xl p-6 md:p-8 shadow-sm hover:shadow-md transition-shadow h-full flex flex-col">
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-6 gap-4">
               <h2 className="text-2xl font-light text-[#4F6F52]">Master Sports Schedule</h2>
               {uniqueChildrenFilters.length > 1 && (
                 <div className="flex flex-wrap items-center gap-2">
                    {uniqueChildrenFilters.map(child => (
                       <button
                         key={child}
                         onClick={() => setSelectedChildFilter(child as string)}
                         className={`min-h-[44px] px-4 rounded-full text-sm font-medium border transition-colors flex items-center justify-center ${selectedChildFilter === child ? 'bg-[#4F6F52] text-[#FDFBF7] border-[#4F6F52]' : 'bg-transparent text-[#2C3333] border-[#E9E4D9] hover:bg-[#F8F6F1]'}`}
                       >
                         {child}
                       </button>
                    ))}
                 </div>
               )}
            </div>
            
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 flex-grow">
              {loadingEvents ? (
                 <div className="space-y-4">
                    <SkeletonEvent />
                    <SkeletonEvent />
                    <SkeletonEvent />
                    <SkeletonEvent />
                    <SkeletonEvent />
                 </div>
              ) : filteredEvents.length === 0 ? (
                <p className="text-sm opacity-60 italic text-center py-10 border border-dashed border-[#E9E4D9] rounded-2xl">No events found in the next 14 days.</p>
              ) : (
                filteredEvents.map((evt, index) => (
                  <div key={index} className="flex gap-4 items-start border-b border-[#E9E4D9] pb-4 last:border-0 last:pb-0">
                    <div className="flex flex-col items-center bg-[#F8F6F1] rounded-xl px-4 py-2 min-w-[70px] border border-[#E9E4D9]">
                      <span className="text-xs uppercase font-medium text-[#4F6F52] opacity-80">{evt.date.split(' ')[0]}</span>
                      <span className="text-lg font-light text-[#2C3333]">{evt.date.split(' ')[1].replace(',', '')}</span>
                    </div>
                    <div className="flex-1 mt-1">
                      <div className="flex items-center gap-2 mb-1">
                         {evt.colorAccent && (
                           <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: evt.colorAccent }}></div>
                         )}
                         <h4 className="font-medium text-[#2C3333]">{evt.title}</h4>
                      </div>
                      <div className="flex gap-3 text-sm opacity-70">
                        <span>{evt.time}</span>
                        {evt.childName && (
                           <span className="flex items-center gap-1">
                            • <span className="font-medium px-1.5 rounded bg-[#E9E4D9]/50" style={{ color: evt.colorAccent }}>{evt.childName}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        {/* COLUMN 2: Chores, Quick Links, Admin */}
        <div className="flex flex-col gap-8 md:gap-12">
          
          {/* Chores List */}
          <section className="bg-white/70 backdrop-blur-md border border-[#E9E4D9] rounded-3xl p-6 md:p-8 shadow-sm hover:shadow-md transition-shadow">
            <h2 className="text-2xl font-light mb-6 text-[#4F6F52]">Chores List</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
              {kids.map((name) => {
                const kidChores = chores.filter(c => c.assignedTo === name);
                return (
                  <div
                    key={name}
                    className="p-5 rounded-2xl border border-[#E9E4D9] bg-[#F8F6F1] hover:shadow-md transition-all flex flex-col gap-3"
                  >
                    <span className="block text-xs uppercase opacity-70 text-[#4F6F52] tracking-widest font-bold border-b border-[#E9E4D9] pb-2">
                      {name}
                    </span>
                    
                    {choresError ? (
                      <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded flex flex-col gap-1 mt-2">
                         <span className="text-[10px] font-bold uppercase tracking-wider">Loading Error</span>
                         <span className="text-[10px]">{choresError}</span>
                      </div>
                    ) : loadingChores ? (
                       <div className="space-y-2 mt-2">
                           <SkeletonChore />
                           <SkeletonChore />
                       </div>
                    ) : kidChores.length === 0 ? (
                      <p className="text-sm opacity-60 italic mt-2 text-center py-4 bg-white/50 rounded-lg">No chores for today</p>
                    ) : (
                      <div className="space-y-1 mt-2">
                         {kidChores.map(chore => {
                           const isComplete = chore.status === 'Complete';
                           return (
                             <label 
                               key={chore.index} 
                               className={`min-h-[44px] flex items-center gap-3 cursor-pointer p-2 rounded-xl transition-colors ${isComplete ? 'opacity-50 line-through' : 'hover:bg-white text-[#2C3333] border border-transparent hover:border-[#E9E4D9] shadow-sm hover:shadow'}`}
                             >
                                <input 
                                  type="checkbox" 
                                  checked={isComplete}
                                  onChange={() => !isComplete && handleChoreComplete(name, chore.index, chore.points)}
                                  disabled={isComplete}
                                  className="w-5 h-5 accent-[#4F6F52] rounded border-gray-300 focus:ring-[#4F6F52] focus:ring-2 cursor-pointer flex-shrink-0"
                                />
                                <div className="flex-1 min-w-0">
                                  <span className="text-sm font-medium block leading-tight truncate">{chore.name}</span>
                                  <span className="text-[10px] opacity-70">+{chore.points} pts</span>
                                </div>
                             </label>
                           );
                         })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Manage Kitchen */}
          <section className="bg-[#4F6F52] backdrop-blur-md border border-[#3e5a41] rounded-3xl p-6 md:p-8 flex flex-col gap-4 text-[#FDFBF7] shadow-lg hover:-translate-y-1 transition-transform relative overflow-hidden">
             
             <div className="absolute top-0 right-0 p-8 opacity-10 pt-10">
                <span className="text-8xl">🍳</span>
             </div>

             <div className="relative z-10 flex flex-col gap-6">
                 <div>
                   <h2 className="text-2xl font-light mb-2">Manage Kitchen</h2>
                   <p className="text-sm opacity-90 max-w-[280px] leading-relaxed block">Track inventory, meal plan, and automatically build your weekly grocery list.</p>
                 </div>
                 <div className="flex gap-4">
                     <a href="/pantry" className="min-h-[44px] bg-[#FDFBF7] text-[#4F6F52] px-6 rounded-full text-sm font-bold hover:bg-white transition-colors flex items-center shadow shadow-black/10">
                       Open Pantry Hub
                     </a>
                 </div>
             </div>
          </section>

          {/* Fan Portal Quick Link & Leaderboard */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 md:gap-6">
              <section className="bg-white/40 backdrop-blur-md border border-[#E9E4D9] rounded-3xl p-6 shadow-sm flex flex-col md:items-center text-center gap-4 justify-center">
                 <div>
                   <h2 className="text-xl font-medium mb-1 text-[#4F6F52]">Sports Portal Access</h2>
                   <p className="text-xs opacity-70 mb-4 max-w-[150px] mx-auto">Scan to view the detailed schedule.</p>
                 </div>
                 <div className="bg-white p-3 rounded-2xl shadow-sm border border-[#E9E4D9] inline-block mx-auto">
                   <QRCodeSVG value="http://localhost:3000/sports" size={100} fgColor="#4F6F52" />
                 </div>
              </section>

              {/* Family Leaderboard */}
              <section className="bg-white/70 backdrop-blur-md border border-[#E9E4D9] rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <h2 className="text-xl font-light mb-6 flex items-center gap-2 text-[#4F6F52]">Family Leaderboard</h2>
                <div className="space-y-4">
                  {leaderboard.length === 0 ? (
                    <div className="space-y-3">
                        <div className="h-2 w-full bg-[#E9E4D9] rounded animate-pulse"></div>
                        <div className="h-2 w-3/4 bg-[#E9E4D9] rounded animate-pulse"></div>
                    </div>
                  ) : (
                    leaderboard.map((kid, index) => {
                      const maxPoints = Math.max(100, leaderboard[0].points);
                      const progressPercent = maxPoints > 0 ? (kid.points / maxPoints) * 100 : 0;
                      
                      return (
                        <div key={kid.name} className="flex flex-col gap-1.5">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium flex items-center gap-1 text-[#2C3333]">
                              {index === 0 && kid.points > 0 && <span title="Current Leader">👑</span>} {kid.name}
                            </span>
                            <span className="font-bold text-[#4F6F52]">{kid.points}</span>
                          </div>
                          <div className="w-full h-2.5 bg-[#F8F6F1] rounded-full overflow-hidden border border-[#E9E4D9]/50 block">
                             <div 
                               className="h-full bg-gradient-to-r from-[#4F6F52] to-[#6d9670] transition-all duration-1000 ease-out"
                               style={{ width: `${progressPercent}%` }}
                             />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </section>
          </div>
        </div>
      </div>

      {/* Admin Toggle: Huge Touch Target */}
      <button 
        onClick={() => setIsAdminModalOpen(true)}
        className="fixed bottom-6 right-6 min-h-[56px] min-w-[56px] rounded-full bg-white/70 backdrop-blur-md border border-[#E9E4D9] text-[#2C3333] hover:bg-white hover:text-[#4F6F52] transition-colors shadow-lg flex items-center justify-center p-0 z-40 focus:ring-4 focus:ring-[#4F6F52]/20 outline-none"
        aria-label="Settings"
      >
        <Settings size={28} />
      </button>

      {/* Admin Modal */}
      {isAdminModalOpen && (
        <div className="fixed inset-0 bg-[#2C3333]/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#FDFBF7] w-full max-w-lg rounded-3xl p-8 shadow-xl border border-[#E9E4D9] relative animate-in fade-in zoom-in duration-200">
            <button 
              onClick={() => { setIsAdminModalOpen(false); setIsAdminAuthenticated(false); setAdminPassword(''); }}
              className="absolute top-6 right-6 text-[#2C3333] hover:text-[#4F6F52] opacity-60 hover:opacity-100 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center -mr-2 -mt-2 rounded-full"
            >
               <X size={24} />
            </button>
            
            <h3 className="text-2xl font-light text-[#4F6F52] mb-6 flex items-center gap-2"><Settings size={24} /> Admin Controls</h3>
            
            {!isAdminAuthenticated ? (
              <form onSubmit={verifyAdmin} className="space-y-4">
                <p className="text-sm opacity-80 mb-2">Enter the family password to access admin controls.</p>
                <input 
                  type="password" required autoFocus
                  value={adminPassword} onChange={e => setAdminPassword(e.target.value)}
                  className="w-full p-4 rounded-xl border border-[#E9E4D9] bg-white outline-none focus:border-[#4F6F52] text-lg" 
                  placeholder="Password"
                />
                <button type="submit" className="w-full px-5 min-h-[56px] rounded-xl text-base font-medium bg-[#4F6F52] text-[#FDFBF7] hover:bg-[#3e5a41] transition-colors">
                  Verify Access
                </button>
              </form>
            ) : (
              <div className="space-y-8">
                 <div>
                    <h4 className="font-medium text-[#2C3333] mb-3">SMS Subscribers</h4>
                    {subscribers.length === 0 ? (
                      <p className="text-sm opacity-60 italic border border-dashed border-[#E9E4D9] p-4 rounded-xl text-center">No subscribers found in Trusted_Senders.</p>
                    ) : (
                      <ul className="space-y-2 text-sm max-h-[200px] overflow-y-auto bg-white p-4 rounded-xl border border-[#E9E4D9]">
                        {subscribers.map((sub, i) => (
                           <li key={i} className="flex justify-between border-b border-[#E9E4D9] pb-2 last:border-0 last:pb-0">
                              <span className="opacity-80">{sub.name}</span>
                              <span className="font-medium">{sub.number}</span>
                           </li>
                        ))}
                      </ul>
                    )}
                 </div>
                 <div className="pt-4 border-t border-[#E9E4D9]">
                    <a 
                      href="#" 
                      className="flex items-center justify-center w-full px-5 min-h-[56px] rounded-xl text-base font-bold bg-[#4F6F52] text-[#FDFBF7] hover:bg-[#3e5a41] transition-colors shadow-sm"
                    >
                      Enter Parent Admin
                    </a>
                 </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-10 left-1/2 transform -translate-x-1/2 bg-[#4F6F52] text-[#FDFBF7] px-6 min-h-[48px] rounded-full shadow-lg flex items-center justify-center gap-2 animate-bounce z-50 transition-opacity">
           <span className="font-bold tracking-wide">{toastMessage}</span>
        </div>
      )}
    </main>
  );
}

// Subcomponents for Skeletons
function SkeletonEvent() {
    return (
      <div className="flex gap-4 items-start border-b border-[#E9E4D9] pb-4 last:border-0 animate-pulse">
        <div className="bg-[#E9E4D9]/60 rounded-xl min-w-[70px] h-[64px]"></div>
        <div className="flex-1 mt-1 space-y-3">
          <div className="h-5 bg-[#E9E4D9]/60 rounded-md w-3/4"></div>
          <div className="h-4 bg-[#E9E4D9]/60 rounded-md w-1/2"></div>
        </div>
      </div>
    );
}

function SkeletonChore() {
    return (
      <div className="flex items-center gap-3 p-2 animate-pulse mt-1 min-h-[44px]">
        <div className="w-5 h-5 bg-[#E9E4D9]/80 rounded-md"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-[#E9E4D9]/80 rounded w-full"></div>
        </div>
      </div>
    );
}
