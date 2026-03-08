"use client";
import { useState, useEffect } from "react";
import {
  Cog8ToothIcon,
  TicketIcon,
  BriefcaseIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";

export default function AdminSettings() {
  const [mode, setMode] = useState("PER_MAHATMA");
  const [smsTemplate, setSmsTemplate] = useState("");
  // ADD THIS STATE:
  const [checkoutTemplate, setCheckoutTemplate] = useState("");
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        // Updated to fetch 3 keys instead of 2
        const [modeRes, smsRes, checkoutRes] = await Promise.all([
          fetch("/api/settings?key=system_mode"),
          fetch("/api/settings?key=sms_template"),
          fetch("/api/settings?key=checkout_sms_template"), // Added this
        ]);

        const modeData = await modeRes.json();
        const smsData = await smsRes.json();
        const checkoutData = await checkoutRes.json();

        if (modeData.value) setMode(modeData.value);
        if (smsData.value) setSmsTemplate(smsData.value);
        if (checkoutData.value) setCheckoutTemplate(checkoutData.value); // Added this

        setLoading(false);
      } catch (err) {
        console.error("Error loading settings", err);
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const updateSetting = async (key, value) => {
    await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value }),
    });

    if (key === "sms_template") {
      setSaveStatus(true);
      setTimeout(() => setSaveStatus(false), 2000);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        Loading...
      </div>
    );

  return (
    <div className="min-h-screen bg-black text-white p-6 pb-20">
      <div className="max-w-md mx-auto">
        <div className="flex items-center gap-3 mb-10 border-b border-gray-800 pb-6">
          <Cog8ToothIcon className="h-8 w-8 text-blue-500" />
          <h1 className="text-3xl font-black uppercase tracking-tighter">
            System Settings
          </h1>
        </div>

        {/* SECTION 1: NUMBERING MODE */}
        <div className="space-y-4 mb-12">
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">
            Token Numbering System
          </p>

          <button
            onClick={() => {
              setMode("PER_MAHATMA");
              updateSetting("system_mode", "PER_MAHATMA");
            }}
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
              <p className="font-black text-lg uppercase">Per Mahatma</p>
              <p className="text-xs text-gray-400 leading-tight">
                1 Mahatma = 1 Token ID (Labels show 1/3, 2/3...)
              </p>
            </div>
          </button>

          <button
            onClick={() => {
              setMode("PER_BAG");
              updateSetting("system_mode", "PER_BAG");
            }}
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
              <p className="font-black text-lg uppercase">Per Bag</p>
              <p className="text-xs text-gray-400 leading-tight">
                Each bag gets a unique auto-incremented ID
              </p>
            </div>
          </button>
        </div>

        {/* SECTION 2: SMS TEMPLATE */}
        <div className="space-y-4">
          <div className="flex justify-between items-end px-1">
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">
              SMS Notification Message
            </p>
            {saveStatus && (
              <span className="text-[10px] font-bold text-green-500 flex items-center gap-1">
                <CheckCircleIcon className="h-3 w-3" /> SAVED
              </span>
            )}
          </div>

          <div className="bg-gray-900/50 border-2 border-gray-800 rounded-2xl p-4 focus-within:border-blue-600 transition-colors">
            <div className="flex items-start gap-3 mb-3">
              <ChatBubbleLeftRightIcon className="h-5 w-5 text-gray-400 mt-1" />
              <textarea
                value={smsTemplate}
                onChange={(e) => setSmsTemplate(e.target.value)}
                onBlur={(e) => updateSetting("sms_template", e.target.value)}
                placeholder="Type your SMS content..."
                className="w-full bg-transparent outline-none text-sm text-white resize-none h-32 leading-relaxed"
              />
            </div>

            {/* HELPER CHIPS */}
            <div className="pt-3 border-t border-gray-800">
              <p className="text-[9px] font-bold text-gray-600 uppercase mb-2">
                Available Tags (Tap to copy/use):
              </p>
              <div className="flex flex-wrap gap-2 text-[10px] font-mono">
                {["{{name}}", "{{tokenId}}", "{{bagCount}}"].map((tag) => (
                  <span
                    key={tag}
                    className="bg-gray-800 text-blue-400 px-2 py-1 rounded border border-gray-700"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <p className="text-[11px] text-gray-500 px-2 italic">
            Tip: For Marathi, ensure the message is short to save SMS credits.
          </p>
        </div>

        {/* Add this below your check-in template section */}
        <div className="space-y-4 mt-8">
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
            Checkout SMS Template
          </p>
          <textarea
            value={checkoutTemplate}
            onChange={(e) => setCheckoutTemplate(e.target.value)}
            onBlur={() =>
              updateSetting("checkout_sms_template", checkoutTemplate)
            }
            className="w-full bg-gray-900 border-2 border-gray-800 rounded-2xl p-4 text-white h-24"
          />
        </div>
      </div>
    </div>
  );
}
