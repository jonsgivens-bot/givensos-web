"use client";

import { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import { QRCodeSVG } from "qrcode.react";
import { Settings, X } from "lucide-react";

export default function Home() {
  const defaultKids = ["Noah", "Kate", "Laney", "Jake"];
  const [kids, setKids] = useState<string[]>(defaultKids);
  const [points, setPoints] = useState(0);
  const [news, setNews] = useState<string[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [chores, setChores] = useState<any[]>([]);
  const [selectedChildFilter, setSelectedChildFilter] = useState<string | null>("All");
  
  // Static Monday Forecast
  const weatherForeceast = "Monday, March 16: Light snow with a high of 28°F and northwest winds at 20 mph.";
  
  // QoL States
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [subscribers, setSubscribers] = useState<any[]>([]);

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

    // Fetch News
    fetch("/api/news")
      .then((res) => res.json())
      .then((data) => setNews(data.news || ["Loading family news..."]))
      .catch(() => setNews(["Could not load news at this time."]));

    // Fetch Calendar
    fetch("/api/calendar")
      .then((res) => res.json())
      .then((data) => setEvents(data.events || []))
      .catch(() => setEvents([]));

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
      .then((res) => res.json())
      .then((data) => setChores(data.chores || []))
      .catch(() => setChores([]));
  }, []);

  const handleChoreComplete = async (name: string, rowNumber: number, chorePoints: number) => {
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ["#4F6F52", "#DCD7C9"] });
    
    // Optimistic UI update for points
    setPoints(prev => prev + chorePoints);
    
    // Optimistic UI update for checklist
    setChores(prev => prev.map(c => c.index === rowNumber ? { ...c, status: 'Complete' } : c));

    // Persistence
    localStorage.setItem("lastSelectedKid", name);
    // Sort so this kid is first next time without reloading
    setKids([name, ...defaultKids.filter(k => k !== name)]);

    // Optimistically update Leaderboard too
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

  const triggerMorningFlash = async () => {
    try {
      const res = await fetch("/api/news/trigger", { method: "POST" });
      if (res.ok) showToast("Morning Flash Triggered!");
    } catch (e) {
      console.error("Failed to trigger API", e);
    }
  };
  const uniqueChildrenFilters = ["All", ...Array.from(new Set(events.map(e => e.childName).filter(Boolean)))];
  const filteredEvents = selectedChildFilter === "All" || !selectedChildFilter 
     ? events 
     : events.filter(e => e.childName === selectedChildFilter);

  return (
    <main className="p-8">
      {/* Morning Outlook Card */}
      <div className="max-w-6xl mx-auto mb-8 bg-[#E9E4D9]/40 backdrop-blur-md border border-[#E9E4D9] rounded-2xl p-4 flex items-center justify-between shadow-sm">
         <div className="flex items-center gap-3">
             <span className="text-2xl">⛅️</span>
             <div>
               <p className="text-sm font-medium text-[#4F6F52]">Morning Outlook</p>
               <p className="text-xs opacity-80">{weatherForeceast}</p>
             </div>
         </div>
      </div>

      <header className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-4">
        <div className="flex items-center gap-6">
          <h1 className="text-4xl font-light tracking-tight text-[#4F6F52]">GivensOS</h1>
          <a
            href="https://docs.google.com/spreadsheets/d/1X04WuSQTN5aSQY-WTHTYNWRznU73964yCDz0-vsOcp4/edit?gid=704590694#gid=704590694"
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2 rounded-full text-sm font-medium border border-[#4F6F52] text-[#4F6F52] hover:bg-[#4F6F52] hover:text-[#FDFBF7] transition-colors shadow-sm"
          >
            Open Family Spreadsheet
          </a>
        </div>
        <div className="text-left md:text-right">
          <p className="text-sm opacity-60">Family Points</p>
          <p className="text-2xl font-light text-[#4F6F52]">{points}</p>
        </div>
      </header>

      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="flex flex-col gap-8">
          <section className="bg-white/70 backdrop-blur-md border border-[#E9E4D9] rounded-3xl p-8 shadow-sm hover:shadow-md transition-shadow">
            <h2 className="text-2xl font-light mb-6">Kid Zone</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {kids.map((name) => {
                const kidChores = chores.filter(c => c.assignedTo === name);
                return (
                  <div
                    key={name}
                    className="p-6 rounded-2xl border border-[#E9E4D9] bg-[#F8F6F1] hover:shadow-md transition-all flex flex-col gap-3"
                  >
                    <span className="block text-[10px] uppercase opacity-60 text-[#4F6F52] tracking-widest font-bold">
                      {name}'s Daily Chores
                    </span>
                    
                    {kidChores.length === 0 ? (
                      <p className="text-sm opacity-60 italic mt-2">No chores scheduled for today.</p>
                    ) : (
                      <div className="space-y-2 mt-2">
                         {kidChores.map(chore => {
                           const isComplete = chore.status === 'Complete';
                           return (
                             <label 
                               key={chore.index} 
                               className={`flex items-start gap-3 cursor-pointer p-2 rounded-lg transition-colors ${isComplete ? 'opacity-50 line-through' : 'hover:bg-white border text-[#2C3333] border-transparent hover:border-[#E9E4D9]'}`}
                             >
                                <input 
                                  type="checkbox" 
                                  checked={isComplete}
                                  onChange={() => !isComplete && handleChoreComplete(name, chore.index, chore.points)}
                                  disabled={isComplete}
                                  className="mt-1 w-4 h-4 accent-[#4F6F52] rounded border-gray-300 focus:ring-[#4F6F52] focus:ring-2"
                                />
                                <div className="flex-1">
                                  <span className="text-sm font-medium block leading-tight">{chore.name}</span>
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

          <section className="bg-[#4F6F52] backdrop-blur-md border border-[#3e5a41] rounded-3xl p-8 flex flex-col gap-4 text-[#FDFBF7] shadow-lg hover:-translate-y-1 transition-transform">
             <div className="flex justify-between items-start">
                 <div>
                   <h2 className="text-2xl font-light mb-2">Manage Kitchen</h2>
                   <p className="text-sm opacity-80 max-w-[250px]">Track inventory, manage the pantry, and automatically build your shopping list.</p>
                 </div>
                 <a href="/pantry" className="bg-[#FDFBF7] text-[#4F6F52] px-6 py-3 rounded-full text-sm font-medium hover:bg-white transition-colors shadow-sm">
                   Open Pantry Hub
                 </a>
             </div>
          </section>

          <section className="bg-white/40 backdrop-blur-md border border-[#E9E4D9] rounded-3xl p-8 flex gap-6 items-center shadow-sm">
             <div>
               <h2 className="text-xl font-medium mb-2 text-[#4F6F52]">Sports Portal Access</h2>
               <p className="text-sm opacity-80 mb-4">Scan to view the shared game schedule.</p>
               <a href="/sports" className="text-sm font-medium text-[#4F6F52] underline hover:opacity-80">Go to /sports</a>
             </div>
             <div className="bg-white p-3 rounded-xl shadow-sm border border-[#E9E4D9]">
               <QRCodeSVG value="http://localhost:3000/sports" size={100} fgColor="#4F6F52" />
             </div>
          </section>

          {/* Family Leaderboard */}
          <section className="bg-white/70 backdrop-blur-md border border-[#E9E4D9] rounded-3xl p-8 shadow-sm hover:shadow-md transition-shadow">
            <h2 className="text-2xl font-light mb-6 flex items-center gap-2">Family Leaderboard</h2>
            <div className="space-y-4">
              {leaderboard.length === 0 ? (
                <p className="text-sm opacity-60">Loading scores...</p>
              ) : (
                leaderboard.map((kid, index) => {
                  // max scale at 100 for visual progress, or dynamic based on highest score
                  const maxPoints = Math.max(100, leaderboard[0].points);
                  const progressPercent = maxPoints > 0 ? (kid.points / maxPoints) * 100 : 0;
                  
                  return (
                    <div key={kid.name} className="flex flex-col gap-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium flex items-center gap-1">
                          {index === 0 && kid.points > 0 && <span title="Current Leader">👑</span>} {kid.name}
                        </span>
                        <span className="font-semibold text-[#4F6F52]">{kid.points} pts</span>
                      </div>
                      <div className="w-full h-2 bg-[#F8F6F1] rounded-full overflow-hidden border border-[#E9E4D9]">
                         <div 
                           className="h-full bg-[#4F6F52] transition-all duration-1000 ease-out"
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

        <div className="flex flex-col gap-8">
          <section className="bg-white/40 backdrop-blur-md border border-[#E9E4D9] rounded-3xl p-8 shadow-sm">
            <h2 className="text-xl font-medium mb-4 text-[#4F6F52]">Morning Flash</h2>
            <div className="space-y-3 text-sm italic opacity-80">
              {news.length === 0 ? "Loading family news..." : news.map((item, i) => (
                <p key={i} className="border-l-2 border-[#4F6F52] pl-3 py-1">{item}</p>
              ))}
            </div>
          </section>

          {/* Master Sports Schedule */}
          <section className="bg-white/70 backdrop-blur-md border border-[#E9E4D9] rounded-3xl p-8 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-center mb-6">
               <h2 className="text-xl font-light text-[#4F6F52]">Master Sports Schedule</h2>
               {uniqueChildrenFilters.length > 1 && (
                 <div className="flex gap-2">
                    {uniqueChildrenFilters.map(child => (
                       <button
                         key={child}
                         onClick={() => setSelectedChildFilter(child as string)}
                         className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${selectedChildFilter === child ? 'bg-[#4F6F52] text-[#FDFBF7] border-[#4F6F52]' : 'bg-transparent text-[#2C3333] border-[#E9E4D9] hover:bg-[#F8F6F1]'}`}
                       >
                         {child}
                       </button>
                    ))}
                 </div>
               )}
            </div>
            
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
              {filteredEvents.length === 0 ? (
                <p className="text-sm opacity-60 italic">No events found in the next 14 days.</p>
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
      </div>

      {/* Admin Toggle */}
      <button 
        onClick={() => setIsAdminModalOpen(true)}
        className="fixed bottom-6 right-6 p-3 rounded-full bg-white/50 backdrop-blur-sm border border-[#E9E4D9] text-[#2C3333] hover:bg-white hover:text-[#4F6F52] transition-colors shadow-sm"
      >
        <Settings size={20} />
      </button>

      {/* Admin Modal */}
      {isAdminModalOpen && (
        <div className="fixed inset-0 bg-[#2C3333]/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#FDFBF7] w-full max-w-lg rounded-3xl p-8 shadow-xl border border-[#E9E4D9] relative">
            <button 
              onClick={() => { setIsAdminModalOpen(false); setIsAdminAuthenticated(false); setAdminPassword(''); }}
              className="absolute top-6 right-6 text-[#2C3333] hover:text-[#4F6F52] opacity-60 hover:opacity-100 transition-colors"
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
                  className="w-full p-3 rounded-xl border border-[#E9E4D9] bg-white outline-none focus:border-[#4F6F52]" 
                  placeholder="Password"
                />
                <button type="submit" className="w-full px-5 py-3 rounded-xl text-sm font-medium bg-[#4F6F52] text-[#FDFBF7] hover:bg-[#3e5a41] transition-colors">
                  Verify Access
                </button>
              </form>
            ) : (
              <div className="space-y-8">
                 <div>
                    <h4 className="font-medium text-[#2C3333] mb-3">SMS Subscribers</h4>
                    {subscribers.length === 0 ? (
                      <p className="text-sm opacity-60 italic">No subscribers found in Trusted_Senders.</p>
                    ) : (
                      <ul className="space-y-2 text-sm max-h-[200px] overflow-y-auto">
                        {subscribers.map((sub, i) => (
                           <li key={i} className="flex justify-between border-b border-[#E9E4D9] pb-2 last:border-0">
                              <span className="opacity-80">{sub.name}</span>
                              <span className="font-medium">{sub.number}</span>
                           </li>
                        ))}
                      </ul>
                    )}
                 </div>
                 <div className="pt-4 border-t border-[#E9E4D9]">
                    <button 
                      onClick={triggerMorningFlash}
                      className="w-full mb-3 px-5 py-3 rounded-xl text-sm font-medium bg-[#4F6F52] text-[#FDFBF7] hover:bg-[#3e5a41] transition-colors shadow-sm"
                    >
                      Trigger 'Morning Flash' Test
                    </button>
                    <a 
                      href="#" 
                      className="block text-center w-full px-5 py-3 rounded-xl text-sm font-medium border border-[#4F6F52] text-[#4F6F52] hover:bg-[#F8F6F1] transition-colors shadow-sm"
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
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-[#4F6F52] text-[#FDFBF7] px-6 py-3 rounded-full shadow-lg flex items-center gap-2 animate-bounce z-50 transition-opacity">
           <span className="font-medium">{toastMessage}</span>
        </div>
      )}
    </main>
  );
}
