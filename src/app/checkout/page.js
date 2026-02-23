'use client';
import { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { ClockIcon, CheckBadgeIcon } from '@heroicons/react/24/solid';

export default function CheckoutPage() {
  const [queue, setQueue] = useState([]);
  const [manualId, setManualId] = useState('');
  const [scanStatus, setScanStatus] = useState('');

  // 1. Fetch the live queue
  const fetchQueue = async () => {
    const res = await fetch('/api/records');
    const data = await res.json();
    // Only show people waiting for pickup (STORED but requested)
    setQueue(data.records.filter(r => r.pickup_requested_at && r.status === 'STORED'));
  };

  // 2. Setup Scanner and Auto-Refresh
  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 5000); // Refresh every 5s

    const scanner = new Html5QrcodeScanner("reader", { 
      fps: 10, 
      qrbox: { width: 250, height: 250 } 
    });

    scanner.render((decodedText) => {
      // Logic: Extract ID from URL: https://samanghar.vercel.app/status/123
      const id = decodedText.split('/').pop();
      if (!isNaN(id)) {
        handleAction(id, 'REQUEST_PICKUP');
        setScanStatus(`Token #${id} Requested!`);
        setTimeout(() => setScanStatus(''), 3000);
      }
    }, (err) => {});

    return () => {
      clearInterval(interval);
      scanner.clear();
    };
  }, []);

  const handleAction = async (id, action) => {
    await fetch('/api/records', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action }),
    });
    fetchQueue();
    setManualId('');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] bg-gray-50">
      {/* SCANNER SECTION */}
      <div className="bg-white p-4 shadow-md z-10">
        <div id="reader" className="rounded-2xl overflow-hidden border-4 border-orange-500 bg-black aspect-video"></div>
        
        {scanStatus && (
          <div className="mt-2 text-center bg-green-600 text-white font-black py-2 rounded-lg animate-bounce">
            {scanStatus}
          </div>
        )}

        <div className="flex gap-2 mt-4">
          <input 
            type="number" 
            placeholder="Manual Token #" 
            value={manualId} 
            onChange={(e) => setManualId(e.target.value)}
            className="flex-grow p-4 border-2 border-gray-200 rounded-2xl font-black text-center text-lg"
          />
          <button 
            onClick={() => handleAction(manualId, 'REQUEST_PICKUP')}
            className="bg-orange-600 text-white px-8 rounded-2xl font-black shadow-lg active:scale-95"
          >
            ADD
          </button>
        </div>
      </div>

      {/* LIVE QUEUE SECTION */}
      <div className="flex-grow overflow-y-auto p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-black text-gray-400 text-xs uppercase tracking-widest flex items-center gap-2">
            <ClockIcon className="w-4 h-4" /> Priority Pickup Queue
          </h2>
          <span className="bg-blue-600 text-white text-[10px] font-black px-2 py-1 rounded-md">
            {queue.length} WAITING
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {queue.map(item => {
            const wait = Math.floor((new Date() - new Date(item.pickup_requested_at)) / 60000);
            const isUrgent = wait >= 5;

            return (
              <div 
                key={item.id}
                onDoubleClick={() => handleAction(item.id, 'FINAL_CHECKOUT')}
                className={`p-5 rounded-[2rem] border-4 flex justify-between items-center transition-all active:scale-95 select-none ${
                  isUrgent ? 'bg-red-600 border-yellow-400 text-white shadow-xl animate-pulse' : 'bg-white border-blue-600 text-gray-900 shadow-sm'
                }`}
              >
                <div>
                  <div className="text-4xl font-black">#{item.id}</div>
                  <div className={`text-xs font-bold uppercase tracking-wide ${isUrgent ? 'text-red-100' : 'text-gray-500'}`}>
                    {item.name} • {item.bags} BAGS
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-2xl font-black">{wait}m</div>
                  <div className={`text-[10px] font-black uppercase ${isUrgent ? 'text-red-100' : 'text-blue-400'}`}>
                    Waiting
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {queue.length === 0 && (
          <div className="text-center mt-12 opacity-30 grayscale italic font-bold">
            <CheckBadgeIcon className="w-12 h-12 mx-auto mb-2" />
            No pending pickups.
          </div>
        )}
      </div>
    </div>
  );
}