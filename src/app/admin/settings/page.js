"use client";
import { useState, useEffect } from "react";
import {
  Cog8ToothIcon,
  TicketIcon,
  BriefcaseIcon,
} from "@heroicons/react/24/outline";

export default function AdminSettings() {
  const [mode, setMode] = useState("PER_MAHATMA"); // Default
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch current setting from your existing table
    fetch("/api/settings?key=system_mode")
      .then((res) => res.json())
      .then((data) => {
        if (data.value) setMode(data.value);
        setLoading(false);
      });
  }, []);

  const updateSetting = async (newMode) => {
    setMode(newMode);
    await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: "system_mode", value: newMode }),
    });
  };

  if (loading)
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        Loading...
      </div>
    );

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-md mx-auto">
        <div className="flex items-center gap-3 mb-10 border-b border-gray-800 pb-6">
          <Cog8ToothIcon className="h-8 w-8 text-blue-500" />
          <h1 className="text-3xl font-black uppercase tracking-tighter">
            System Settings
          </h1>
        </div>

        <div className="space-y-4">
          <p className="text-xs font-black text-gray-500 uppercase tracking-widest ml-1">
            Token Numbering System
          </p>

          {/* Option: PER MAHATMA */}
          <button
            onClick={() => updateSetting("PER_MAHATMA")}
            className={`w-full p-5 rounded-2xl border-2 flex items-center gap-4 transition-all ${
              mode === "PER_MAHATMA"
                ? "border-blue-600 bg-blue-600/10"
                : "border-gray-800 bg-gray-900/50 opacity-40"
            }`}
          >
            <TicketIcon
              className={`h-8 w-8 ${mode === "PER_MAHATMA" ? "text-blue-400" : "text-gray-500"}`}
            />
            <div className="text-left">
              <p className="font-black text-lg">PER MAHATMA</p>
              <p className="text-xs text-gray-400">
                1 Mahatma = 1 Token (1/3, 2/3...)
              </p>
            </div>
          </button>

          {/* Option: PER BAG */}
          <button
            onClick={() => updateSetting("PER_BAG")}
            className={`w-full p-5 rounded-2xl border-2 flex items-center gap-4 transition-all ${
              mode === "PER_BAG"
                ? "border-green-600 bg-green-600/10"
                : "border-gray-800 bg-gray-900/50 opacity-40"
            }`}
          >
            <BriefcaseIcon
              className={`h-8 w-8 ${mode === "PER_BAG" ? "text-green-400" : "text-gray-500"}`}
            />
            <div className="text-left">
              <p className="font-black text-lg">PER BAG</p>
              <p className="text-xs text-gray-400">
                1 Bag = 1 New Token Number
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
