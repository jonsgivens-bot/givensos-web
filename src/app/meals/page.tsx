"use client";

import { useState, useEffect } from "react";
import { Utensils, Calendar as CalendarIcon, Save, ChefHat } from "lucide-react";
import Link from "next/link";

export default function MealPlanner() {
  const [weeklyPlan, setWeeklyPlan] = useState<{ day: string, selectedMeal: string }[]>([]);
  const [availableMeals, setAvailableMeals] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [reorderedItems, setReorderedItems] = useState<string[]>([]);

  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchMeals = async () => {
    try {
      const res = await fetch("/api/meals");
      const data = await res.json();
      
      // Ensure we have a slot for every day even if sheets is empty
      const plan = daysOfWeek.map(day => {
         const existing = data.weeklyPlan?.find((p: {day: string, selectedMeal: string}) => p.day === day);
         return existing || { day, selectedMeal: "" };
      });

      setWeeklyPlan(plan);
      setAvailableMeals(data.availableMeals || []);
    } catch (e) {
      console.error("Failed to load meals");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeals();
  }, []);

  const handleMealChange = (day: string, newMeal: string) => {
    setWeeklyPlan(prev => prev.map(p => p.day === day ? { ...p, selectedMeal: newMeal } : p));
  };

  const handleSaveAndSync = async () => {
    setSaving(true);
    setReorderedItems([]);
    try {
      const res = await fetch("/api/meals/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meals: weeklyPlan }),
      });
      const result = await res.json();
      
      if (result.success) {
         if (result.reorderedItems && result.reorderedItems.length > 0) {
            setReorderedItems(result.reorderedItems);
            showToast(`Saved! Automatically added ${result.reorderedItems.length} items to your shopping list.`);
         } else {
            showToast("Saved! Inventory levels look good.");
         }
      } else {
         showToast("Failed to sync. Please try again.");
      }
    } catch (e) {
      console.error("Sync failed", e);
      showToast("An error occurred while saving.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#FDFBF7] text-[#2C3333]">
      <div className="bg-[#4F6F52] text-[#FDFBF7] pt-12 pb-20 px-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-10">
           <ChefHat size={200} />
        </div>
        <div className="max-w-4xl mx-auto flex flex-col gap-2 relative z-10">
           <div className="flex items-center gap-3 text-[#E9E4D9] mb-4">
              <span className="text-sm font-semibold uppercase tracking-widest">Givens Family</span>
           </div>
           <h1 className="text-4xl md:text-5xl font-light tracking-tight flex items-center gap-4">
              <Utensils className="opacity-80" /> Meal Planner
           </h1>
           <p className="text-lg opacity-80 max-w-xl font-light">Plan your week. Automatically add low ingredients to your grocery list.</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-8 -mt-10 relative z-20 pb-20">
        <div className="bg-white/90 backdrop-blur-xl border border-[#E9E4D9] rounded-3xl p-6 md:p-10 shadow-xl">
          
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-[#E9E4D9] pb-6">
            <h2 className="text-2xl font-light text-[#4F6F52] flex items-center gap-3">
              <CalendarIcon className="text-[#4F6F52]" /> This Week&apos;s Menu
            </h2>
            <div className="flex gap-3">
               <a href="/" className="px-5 py-2.5 rounded-full text-sm font-medium border border-[#E9E4D9] text-[#2C3333] hover:bg-[#F8F6F1] transition-colors shadow-sm text-center">
                  Dashboard
               </a>
               <button 
                 onClick={handleSaveAndSync}
                 disabled={saving || loading}
                 className="flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-medium bg-[#4F6F52] text-[#FDFBF7] hover:bg-[#3e5a41] transition-transform active:scale-95 shadow-md disabled:opacity-50"
               >
                 {saving ? (
                    <span className="flex items-center gap-2">
                       <div className="w-4 h-4 rounded-full border-2 border-white/50 border-t-white animate-spin"></div> Syncing...
                    </span>
                 ) : (
                    <span className="flex items-center gap-2"><Save size={16} /> Save & Sync Grocery List</span>
                 )}
               </button>
            </div>
          </header>

          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-4 text-[#4F6F52] opacity-60">
              <div className="w-8 h-8 rounded-full border-4 border-current border-t-transparent animate-spin"></div>
              <p className="font-medium animate-pulse">Loading recipe library...</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
               {weeklyPlan.map((plan, i) => (
                  <div key={i} className="flex flex-col lg:flex-row items-start lg:items-center gap-4 p-5 rounded-2xl border border-[#E9E4D9] hover:border-[#4F6F52]/30 transition-colors bg-[#F8F6F1]">
                     <div className="w-32 flex-shrink-0">
                        <span className="text-sm uppercase tracking-widest font-bold text-[#4F6F52] opacity-70">
                           {plan.day}
                        </span>
                     </div>
                     <div className="flex-1 w-full relative">
                        <select 
                           value={plan.selectedMeal}
                           onChange={(e) => handleMealChange(plan.day, e.target.value)}
                           className="w-full appearance-none bg-white border border-[#E9E4D9] rounded-xl py-3 px-4 outline-none focus:border-[#4F6F52] focus:ring-1 focus:ring-[#4F6F52] transition-shadow text-[#2C3333] cursor-pointer"
                        >
                           <option value="">Select a meal...</option>
                           {availableMeals.map(meal => (
                              <option key={meal} value={meal}>{meal}</option>
                           ))}
                        </select>
                        <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none opacity-50">
                           <Utensils size={16} />
                        </div>
                     </div>
                  </div>
               ))}
            </div>
          )}

          {reorderedItems.length > 0 && (
             <div className="mt-8 p-6 bg-[#FDF0EF] border border-[#F2D6D3] rounded-2xl animate-fade-in-up">
                <h3 className="font-medium text-[#A44236] mb-2 flex items-center gap-2">
                   ⚠️ Low Inventory Detected
                </h3>
                <p className="text-sm opacity-80 text-[#A44236] mb-3">
                   The following ingredients were required for your meals, but your inventory was below the threshold. They have been added to your shopping list automatically.
                </p>
                <div className="flex flex-wrap gap-2">
                   {reorderedItems.map((item, idx) => (
                      <span key={idx} className="px-3 py-1 bg-white text-[#A44236] text-sm rounded-lg border border-[#F2D6D3] shadow-sm">
                         {item}
                      </span>
                   ))}
                </div>
                <div className="mt-4 pt-4 border-t border-[#F2D6D3]/50">
                   <Link href="/pantry" className="text-sm font-semibold text-[#A44236] hover:underline flex items-center gap-1 w-fit">
                      View full shopping list &rarr;
                   </Link>
                </div>
             </div>
          )}
        </div>
      </div>

      {toastMessage && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-[#4F6F52] text-[#FDFBF7] px-6 py-3 rounded-full shadow-lg flex items-center gap-2 animate-bounce z-50">
           <span className="font-medium flex items-center gap-2">
             <Save size={16} /> {toastMessage}
           </span>
        </div>
      )}
    </main>
  );
}
