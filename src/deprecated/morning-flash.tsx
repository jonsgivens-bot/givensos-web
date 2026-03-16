import { useState } from "react";

export function DeprecatedMorningFlash() {
  const [news, setNews] = useState<string[]>([]);
  
  // This was inside useEffect in page.tsx
  /*
    fetch("/api/news")
      .then((res) => res.json())
      .then((data) => setNews(data.news || ["Loading family news..."]))
      .catch((err) => setNews(["Could not load news at this time."]));
  */

  const triggerMorningFlash = async () => {
    try {
      const res = await fetch("/api/news/trigger", { method: "POST" });
      if (res.ok) alert("Morning Flash Triggered!");
    } catch (e) {
      console.error("Failed to trigger API", e);
    }
  };

  return (
    <>
      <div className="max-w-6xl mx-auto mb-8 bg-[#E9E4D9]/40 backdrop-blur-md border border-[#E9E4D9] rounded-2xl p-4 flex items-center justify-between shadow-sm">
         <div className="flex items-center gap-3">
             <span className="text-2xl">⛅️</span>
             <div>
               <p className="text-sm font-medium text-[#4F6F52]">Morning Outlook</p>
               <p className="text-xs opacity-80">Monday, March 16: Light snow with a high of 28°F and northwest winds at 20 mph.</p>
             </div>
         </div>
      </div>

      <section className="bg-white/40 backdrop-blur-md border border-[#E9E4D9] rounded-3xl p-8 shadow-sm">
        <h2 className="text-xl font-medium mb-4 text-[#4F6F52]">Morning Flash</h2>
        <div className="space-y-3 text-sm italic opacity-80">
          {news.length === 0 ? "Loading family news..." : news.map((item, i) => (
            <p key={i} className="border-l-2 border-[#4F6F52] pl-3 py-1">{item}</p>
          ))}
        </div>
      </section>

      {/* Admin Button */}
      <button 
        onClick={triggerMorningFlash}
        className="w-full mb-3 px-5 py-3 rounded-xl text-sm font-medium bg-[#4F6F52] text-[#FDFBF7]"
      >
        Trigger &apos;Morning Flash&apos; Test
      </button>
    </>
  );
}
