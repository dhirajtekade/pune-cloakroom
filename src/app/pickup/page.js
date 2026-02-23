"use client";
import { useState, useEffect } from "react";

export default function PickupDashboard() {
  const [queue, setQueue] = useState([]);

  const fetchQueue = async () => {
    const res = await fetch("/api/records");
    const data = await res.json();
    // Filter for tokens that have a request time and are not yet returned
    const pending = data.records.filter(
      (r) => r.pickup_requested_at && r.status === "STORED",
    );
    setQueue(pending);
  };

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 5000); // Check every 5s
    return () => clearInterval(interval);
  }, []);

  const completeCheckout = async (id) => {
    const res = await fetch("/api/records", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: "FINAL_CHECKOUT" }),
    });
    if (res.ok) fetchQueue();
  };

  return (
    <div className="min-h-screen bg-black p-4 text-white">
      <div className="flex justify-between items-center mb-8 border-b-2 border-gray-800 pb-4">
        <h1 className="text-3xl font-black text-orange-500 uppercase tracking-tighter">
          SamanGhar Pickup Queue
        </h1>
        <div className="bg-blue-600 px-4 py-1 rounded-full font-bold text-sm">
          {queue.length} PENDING
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
        {queue.map((item) => {
          // Calculate wait time
          const waitTime = Math.floor(
            (new Date() - new Date(item.pickup_requested_at)) / 60000,
          );
          const isUrgent = waitTime >= 5;

          return (
            <div
              key={item.id}
              onDoubleClick={() => completeCheckout(item.id)}
              className={`relative flex flex-col items-center justify-center aspect-square rounded-[2rem] shadow-2xl transition-all duration-500 border-8 cursor-pointer select-none ${
                isUrgent
                  ? "bg-red-600 border-yellow-400 scale-105"
                  : "bg-gray-900 border-blue-900"
              }`}
            >
              <span className="text-sm font-black text-gray-400 uppercase tracking-widest mb-1">
                Token
              </span>
              <span
                className={`text-6xl font-black ${isUrgent ? "text-white" : "text-blue-500"}`}
              >
                {item.id}
              </span>
              <span
                className={`mt-2 text-xl font-black ${isUrgent ? "text-white" : "text-gray-300"}`}
              >
                {item.bags} BAGS
              </span>

              <div
                className={`mt-4 px-3 py-1 rounded-lg font-black text-xs ${isUrgent ? "bg-red-900" : "bg-gray-800 text-gray-500"}`}
              >
                {waitTime} MINS WAIT
              </div>

              {isUrgent && (
                <div className="absolute -top-4 -right-4 bg-yellow-400 text-black text-[10px] font-black px-2 py-1 rounded transform rotate-12">
                  PRIORITY
                </div>
              )}
            </div>
          );
        })}
      </div>

      {queue.length === 0 && (
        <div className="flex flex-col items-center justify-center mt-32">
          <div className="text-6xl mb-4">🙏</div>
          <p className="text-gray-600 font-black text-2xl uppercase">
            All Clear
          </p>
        </div>
      )}
    </div>
  );
}
