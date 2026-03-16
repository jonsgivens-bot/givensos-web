"use client";

import { useState, useEffect } from "react";
import { Plus, Minus, Search, ShoppingBag, Package, Carrot } from "lucide-react";

interface InventoryItem {
  name: string;
  quantity: number;
  threshold: number;
  status?: string;
}

export default function PantryHub() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newItem, setNewItem] = useState({ name: "", qty: 1, threshold: 1 });
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const fetchInventory = async () => {
    try {
      const res = await fetch("/api/inventory");
      const data = await res.json();
      setItems(data.items || []);
    } catch (e) {
      console.error("Failed to load inventory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const updateQuantity = async (name: string, increment: number) => {
    // Optimistic UI Update
    setItems(currentItems => 
      currentItems.map(item => {
        if (item.name === name) {
          const newQty = Math.max(0, item.quantity + increment);
          return { ...item, quantity: newQty };
        }
        return item;
      })
    );

    try {
      await fetch("/api/inventory/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, action: "update", increment }),
      });
      showToast("Saved!");
    } catch (e) {
      console.error("Failed to sync inventory update.");
      // In a robust app, we'd revert the optimistic update here on fail.
    }
  };

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name) return;

    // Optimistic Add
    const itemToAdd = { name: newItem.name, quantity: newItem.qty, threshold: newItem.threshold };
    setItems(prev => [...prev, itemToAdd]);
    setIsModalOpen(false);
    setNewItem({ name: "", qty: 1, threshold: 1 });

    try {
      await fetch("/api/inventory/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name: itemToAdd.name, 
          quantity: itemToAdd.quantity, 
          threshold: itemToAdd.threshold, 
          action: "add" 
        }),
      });
      showToast("Saved!");
    } catch (e) {
      console.error("Failed to save new item.");
    }
  };

  const handleInstacartOrder = () => {
    const reorderItems = items.filter(i => i.status === 'REORDER');
    if (reorderItems.length === 0) {
      alert("No items are currently marked for 'REORDER'.");
      return;
    }
    // Open a single tab bundling all REORDER items into one search query
    const searchQuery = reorderItems.map(item => item.name).join(', ');
    const url = `https://www.instacart.com/store/s?k=${encodeURIComponent(searchQuery)}`;
    window.open(url, '_blank');
  };

  // Sort logic: 'REORDER' status first, then alphabetically
  const sortItems = (a: InventoryItem, b: InventoryItem) => {
    if (a.status === 'REORDER' && b.status !== 'REORDER') return -1;
    if (a.status !== 'REORDER' && b.status === 'REORDER') return 1;
    return a.name.localeCompare(b.name);
  };

  const shoppingList = items.filter(i => i.quantity <= i.threshold).sort(sortItems);
  const pantryItems = items.filter(i => i.quantity > i.threshold).sort(sortItems);

  return (
    <main className="p-8 max-w-6xl mx-auto">
      <header className="flex justify-between items-center mb-10 pb-6 border-b border-[#E9E4D9]">
        <div>
          <h1 className="text-3xl font-light tracking-tight text-[#4F6F52] flex items-center gap-3">
            <Package className="text-[#4F6F52]" size={32} /> Pantry Hub
          </h1>
          <p className="text-sm opacity-60 mt-1">Manage kitchen inventory and automated shopping lists.</p>
        </div>
        <div className="flex gap-4">
          <a href="/" className="px-5 py-2 rounded-full text-sm font-medium border border-[#E9E4D9] text-[#2C3333] hover:bg-[#F8F6F1] transition-colors shadow-sm">
            Back to Dashboard
          </a>
          <button 
            onClick={handleInstacartOrder}
            className="flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium border border-[#4F6F52] text-[#4F6F52] hover:bg-[#F8F6F1] transition-colors shadow-sm"
          >
            <Carrot size={16} className="text-[#FF7A00]" /> Send Low Items to Instacart
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium bg-[#4F6F52] text-[#FDFBF7] hover:bg-[#3e5a41] transition-colors shadow-sm"
          >
            <Plus size={16} /> Quick Add
          </button>
        </div>
      </header>

      {loading ? (
        <div className="text-center opacity-60 py-20">Syncing with Google Sheets Pantry...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Pantry section - 2 columns wide */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-xl font-medium text-[#4F6F52] mb-4">Current Stock</h2>
            {pantryItems.length === 0 ? (
              <p className="text-sm opacity-60 italic">All items are below their thresholds.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pantryItems.map((item, i) => (
                  <InventoryCard 
                    key={i} 
                    item={item} 
                    onUpdate={(inc) => updateQuantity(item.name, inc)} 
                  />
                ))}
              </div>
            )}
          </div>

          {/* Shopping List section - 1 column wide */}
          <div className="bg-[#FDF0EF] border border-[#F2D6D3] rounded-3xl p-6 shadow-sm self-start">
            <h2 className="text-xl font-medium text-[#A44236] mb-2 flex items-center gap-2">
              <ShoppingBag size={20} /> Shopping List
            </h2>
            <p className="text-sm text-[#A44236] opacity-80 mb-6">Items currently at or below threshold.</p>
            
            {shoppingList.length === 0 ? (
              <p className="text-sm opacity-60 text-[#A44236] italic">You're fully stocked!</p>
            ) : (
              <div className="flex flex-col gap-3">
                {shoppingList.map((item, i) => (
                  <InventoryCard 
                    key={i} 
                    item={item} 
                    onUpdate={(inc) => updateQuantity(item.name, inc)} 
                    isShoppingList 
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[#2C3333]/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form onSubmit={handleQuickAdd} className="bg-[#FDFBF7] w-full max-w-md rounded-3xl p-8 shadow-xl border border-[#E9E4D9]">
            <h3 className="text-2xl font-light text-[#4F6F52] mb-6">Add New Item</h3>
            
            <div className="space-y-4 mb-8">
              <div>
                <label className="block text-sm opacity-80 mb-1">Item Name</label>
                <input 
                  type="text" required autoFocus
                  value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})}
                  className="w-full p-3 rounded-xl border border-[#E9E4D9] bg-white outline-none focus:border-[#4F6F52]" 
                  placeholder="e.g. Almond Milk"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm opacity-80 mb-1">Starting Qty</label>
                  <input 
                    type="number" required min="0"
                    value={newItem.qty} onChange={e => setNewItem({...newItem, qty: parseInt(e.target.value) || 0})}
                    className="w-full p-3 rounded-xl border border-[#E9E4D9] bg-white outline-none focus:border-[#4F6F52]" 
                  />
                </div>
                <div>
                  <label className="block text-sm opacity-80 mb-1">Threshold</label>
                  <input 
                    type="number" required min="0"
                    value={newItem.threshold} onChange={e => setNewItem({...newItem, threshold: parseInt(e.target.value) || 0})}
                    className="w-full p-3 rounded-xl border border-[#E9E4D9] bg-white outline-none focus:border-[#4F6F52]" 
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button 
                type="button" onClick={() => setIsModalOpen(false)}
                className="px-5 py-2 rounded-xl text-sm font-medium hover:bg-[#E9E4D9] text-[#2C3333] transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="px-5 py-2 rounded-xl text-sm font-medium bg-[#4F6F52] text-[#FDFBF7] hover:bg-[#3e5a41] transition-colors"
              >
                Save to Pantry
              </button>
            </div>
          </form>
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

function InventoryCard({ item, onUpdate, isShoppingList = false }: { item: InventoryItem, onUpdate: (inc: number) => void, isShoppingList?: boolean }) {
  // Calculate progress bar width based on threshold buffer (max 2x threshold for visual scale)
  const maxScale = Math.max(item.threshold * 3, 5); 
  const progressPercent = Math.min((item.quantity / maxScale) * 100, 100);

  // Dynamic coloring based on status
  const cardBg = isShoppingList ? 'bg-white border-[#F2D6D3] shadow-sm' : 'bg-white/70 backdrop-blur-sm border-[#E9E4D9] hover:shadow-md';
  const textColor = isShoppingList ? 'text-[#A44236]' : 'text-[#2C3333]';
  const progressColor = isShoppingList ? 'bg-[#A44236]' : 'bg-[#4F6F52]';
  const progressBg = isShoppingList ? 'bg-[#FDF0EF]' : 'bg-[#E9E4D9]';

  return (
    <div className={`p-5 rounded-2xl border transition-all ${cardBg}`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className={`font-medium text-lg ${textColor}`}>{item.name}</h3>
          <p className="text-xs opacity-60 uppercase tracking-wide">Threshold: {item.threshold}</p>
        </div>
        
        {/* elegant quantity controls */}
        <div className="flex items-center gap-3 bg-[#F8F6F1] rounded-full p-1 border border-[#E9E4D9]">
          <button 
            onClick={() => onUpdate(-1)}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white hover:text-[#A44236] hover:shadow-sm transition-all text-[#2C3333]"
          >
            <Minus size={16} />
          </button>
          <span className={`font-medium min-w-[20px] text-center ${textColor}`}>{item.quantity}</span>
          <button 
            onClick={() => onUpdate(1)}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white hover:text-[#4F6F52] hover:shadow-sm transition-all text-[#2C3333]"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className={`w-full h-1.5 rounded-full ${progressBg} overflow-hidden`}>
        <div 
          className={`h-full ${progressColor} transition-all duration-500 ease-out`} 
          style={{ width: `${progressPercent}%` }}
        ></div>
      </div>
    </div>
  );
}
