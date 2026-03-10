"use client";
import { useState, useEffect } from "react";
import {
  Cog8ToothIcon,
  TicketIcon,
  BriefcaseIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  PrinterIcon,
  ScissorsIcon, // Added for the cutter toggle
} from "@heroicons/react/24/outline";

export default function AdminSettings() {
  const [mode, setMode] = useState("PER_MAHATMA");
  const [smsTemplate, setSmsTemplate] = useState("");
  const [checkoutTemplate, setCheckoutTemplate] = useState("");
  const [printBagLabels, setPrintBagLabels] = useState(true);
  const [printAsImage, setPrintAsImage] = useState(false);
  const [enableAutoSms, setEnableAutoSms] = useState(false);

  // NEW STATE FOR PAGE CUTTER
  const [enablePageCut, setEnablePageCut] = useState(false);
  const [useQrCode, setUseQrCode] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        // Updated to fetch 6 keys now (added imgRes and the fetch URL)
        const [
          modeRes,
          smsRes,
          checkoutRes,
          printRes,
          cutRes,
          imgRes,
          qrRes,
          autoSmsRes,
        ] = await Promise.all([
          fetch("/api/settings?key=system_mode"),
          fetch("/api/settings?key=sms_template"),
          fetch("/api/settings?key=checkout_sms_template"),
          fetch("/api/settings?key=print_bag_labels"),
          fetch("/api/settings?key=enable_page_cut"),
          fetch("/api/settings?key=print_as_image"), // <-- ADDED THIS
          fetch("/api/settings?key=use_qr_code"), // <-- ADDED THIS
          fetch("/api/settings?key=enable_auto_sms"),
        ]);

        const modeData = await modeRes.json();
        const smsData = await smsRes.json();
        const checkoutData = await checkoutRes.json();
        const printData = await printRes.json();
        const cutData = await cutRes.json();
        const imgData = await imgRes.json(); // Now imgRes exists!
        const qrData = await qrRes.json(); // Now imgRes exists!
        const autoSmsData = await autoSmsRes.json();

        if (modeData.value) setMode(modeData.value);
        if (smsData.value) setSmsTemplate(smsData.value);
        if (checkoutData.value) setCheckoutTemplate(checkoutData.value);
        if (printData.value) setPrintBagLabels(printData.value === "true");
        if (cutData.value) setEnablePageCut(cutData.value === "true");
        if (imgData.value) setPrintAsImage(imgData.value === "true");
        if (qrData.value) setUseQrCode(qrData.value === "true");
        if (autoSmsData.value) setEnableAutoSms(autoSmsData.value === "true");

        setLoading(false);
      } catch (err) {
        console.error("Error loading settings", err);
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleEndOfDaySweep = async () => {
    // Strict confirmation to prevent accidental clicks!
    const confirmation = prompt(
      "WARNING: This will check out ALL remaining bags currently inside the cloakroom.\n\nType 'CONFIRM' to proceed:",
    );

    if (confirmation !== "CONFIRM") {
      alert("End of Day sweep cancelled.");
      return;
    }

    try {
      const res = await fetch("/api/records", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "END_OF_DAY" }),
      });

      const data = await res.json();
      if (data.success) {
        alert("Success! All remaining bags have been marked as RETURNED.");
      } else {
        alert("Failed to run sweep.");
      }
    } catch (err) {
      alert("Connection error during End of Day sweep.");
    }
  };

  const updateSetting = async (key, value) => {
    await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value: String(value) }), // Ensure it's a string
    });

    // Show saved status for templates
    if (key.includes("template")) {
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

        {/* PRINTER CONTROL SECTION */}
        <div className="space-y-4 mb-12">
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">
            Printer Configuration
          </p>

          <button
            onClick={() => {
              const newValue = !printBagLabels;
              setPrintBagLabels(newValue);
              updateSetting("print_bag_labels", newValue);
            }}
            className={`w-full p-5 rounded-2xl border-2 flex items-center gap-4 transition-all ${
              printBagLabels
                ? "border-orange-600 bg-orange-600/10"
                : "border-gray-800 bg-gray-900/50 opacity-40"
            }`}
          >
            <PrinterIcon
              className={`h-8 w-8 ${printBagLabels ? "text-orange-400" : "text-gray-500"}`}
            />
            <div className="text-left flex-grow">
              <p className="font-black text-lg uppercase">Print Bag Labels</p>
              <p className="text-xs text-gray-400 leading-tight">
                {printBagLabels
                  ? "ON: Printing both Mahatma & Bag tokens"
                  : "OFF: Printing Master Mahatma token only"}
              </p>
            </div>
            {/* Small Toggle Visual */}
            <div
              className={`w-4 h-4 rounded-full ${printBagLabels ? "bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.8)]" : "bg-gray-700"}`}
            ></div>
          </button>

          {/* NEW PAGE CUTTER TOGGLE */}
          <button
            onClick={() => {
              const newValue = !enablePageCut;
              setEnablePageCut(newValue);
              updateSetting("enable_page_cut", newValue);
            }}
            className={`w-full p-5 rounded-2xl border-2 flex items-center gap-4 transition-all ${
              enablePageCut
                ? "border-red-600 bg-red-600/10"
                : "border-gray-800 bg-gray-900/50 opacity-40"
            }`}
          >
            <ScissorsIcon
              className={`h-8 w-8 ${enablePageCut ? "text-red-400" : "text-gray-500"}`}
            />
            <div className="text-left flex-grow">
              <p className="font-black text-lg uppercase">
                Hardware Page Cutter
              </p>
              <p className="text-xs text-gray-400 leading-tight">
                {enablePageCut
                  ? "ON: Printer will cut after every slip"
                  : "OFF: Continuous roll (Tear manually)"}
              </p>
            </div>
            {/* Small Toggle Visual */}
            <div
              className={`w-4 h-4 rounded-full ${enablePageCut ? "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]" : "bg-gray-700"}`}
            ></div>
          </button>

          {/* IMAGE RENDERING TOGGLE */}
          <button
            onClick={() => {
              const newValue = !printAsImage;
              setPrintAsImage(newValue);
              updateSetting("print_as_image", newValue);
            }}
            className={`w-full p-5 rounded-2xl border-2 flex items-center gap-4 transition-all ${
              printAsImage
                ? "border-pink-600 bg-pink-600/10"
                : "border-gray-800 bg-gray-900/50 opacity-40"
            }`}
          >
            <div className="text-left flex-grow">
              <p
                className={`font-black text-lg uppercase ${printAsImage ? "text-pink-400" : "text-gray-500"}`}
              >
                Rendering Mode:{" "}
                {printAsImage ? "Image (Screenshot)" : "Native (ESC/POS)"}
              </p>
              <p className="text-xs text-gray-400 leading-tight">
                {printAsImage
                  ? "IMAGE MODE: Best for giant numbers, perfect scaling, zero squishing. Slightly slower print speed."
                  : "NATIVE MODE: Ultra-fast printing, lighter on memory, but giant numbers might compress/squish."}
              </p>
            </div>
            <div
              className={`w-4 h-4 rounded-full ${printAsImage ? "bg-pink-500 shadow-[0_0_10px_rgba(219,39,119,0.8)]" : "bg-gray-700"}`}
            ></div>
          </button>

          {/* QR / BARCODE TOGGLE */}
          <button
            onClick={() => {
              const newValue = !useQrCode;
              setUseQrCode(newValue);
              updateSetting("use_qr_code", newValue);
            }}
            className={`w-full p-5 rounded-2xl border-2 flex items-center gap-4 transition-all ${
              useQrCode
                ? "border-pink-600 bg-pink-600/10"
                : "border-gray-800 bg-gray-900/50 opacity-40"
            }`}
          >
            <div className="text-left flex-grow">
              <p
                className={`font-black text-lg uppercase ${useQrCode ? "text-pink-400" : "text-gray-500"}`}
              >
                Scan Format: {useQrCode ? "QR Code" : "1D Barcode"}
              </p>
              <p className="text-xs text-gray-400 leading-tight">
                {useQrCode
                  ? "QR MODE: Best scanning, but may cause some budget printers to hang."
                  : "BARCODE MODE: 100% stable, ultra-fast printing, never crashes."}
              </p>
            </div>
            <div
              className={`w-4 h-4 rounded-full ${useQrCode ? "bg-pink-500 shadow-[0_0_10px_rgba(219,39,119,0.8)]" : "bg-gray-700"}`}
            ></div>
          </button>

          {/* AUTO-SMS TOGGLE */}
          <button
            onClick={() => {
              const newValue = !enableAutoSms;
              setEnableAutoSms(newValue);
              updateSetting("enable_auto_sms", newValue);
            }}
            className={`w-full p-5 rounded-2xl border-2 flex items-center gap-4 transition-all ${
              enableAutoSms
                ? "border-green-500 bg-green-500/10"
                : "border-gray-800 bg-gray-900/50 opacity-40"
            }`}
          >
            <div className="text-left flex-grow">
              <p
                className={`font-black text-lg uppercase ${enableAutoSms ? "text-green-400" : "text-gray-500"}`}
              >
                Auto-Send SMS: {enableAutoSms ? "ON" : "OFF"}
              </p>
              <p className="text-xs text-gray-400 leading-tight">
                {enableAutoSms
                  ? "WARNING: Costs ₹5.00 per check-in! SMS will send automatically."
                  : "SAVING MONEY: Auto-SMS is disabled. Volunteers must use WhatsApp or 'Resend SMS' manually."}
              </p>
            </div>
            <div
              className={`w-4 h-4 rounded-full ${enableAutoSms ? "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)]" : "bg-gray-700"}`}
            ></div>
          </button>
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
                Individual IDs for every bag
              </p>
            </div>
          </button>
        </div>

        {/* SECTION 2: SMS TEMPLATE */}
        <div className="space-y-4">
          <div className="flex justify-between items-end px-1">
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">
              Checkin SMS Template
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

        {/* CHECKOUT SMS TEMPLATE */}
        {/* CHECKOUT SMS TEMPLATE */}
        <div className="space-y-4 mt-8">
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">
            Checkout SMS Template
          </p>
          <div className="bg-gray-900/50 border-2 border-gray-800 rounded-2xl p-4 focus-within:border-blue-600 transition-colors">
            <div className="flex items-start gap-3 mb-3">
              <ChatBubbleLeftRightIcon className="h-5 w-5 text-gray-400 mt-1" />
              <textarea
                value={checkoutTemplate}
                onChange={(e) => setCheckoutTemplate(e.target.value)}
                onBlur={() =>
                  updateSetting("checkout_sms_template", checkoutTemplate)
                }
                placeholder="Type your Checkout SMS content..."
                className="w-full bg-transparent outline-none text-sm text-white resize-none h-24 leading-relaxed"
              />
            </div>

            {/* HELPER CHIPS FOR CHECKOUT */}
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
        </div>

        {/* ========================================== */}
        {/* DANGER ZONE: END OF DAY */}
        {/* ========================================== */}
        <div className="mt-12 pt-8 border-t border-gray-800">
          <h3 className="text-xl font-black text-red-500 mb-4 uppercase tracking-widest">
            Danger Zone
          </h3>
          <button
            onClick={handleEndOfDaySweep}
            className="w-full p-6 rounded-2xl border-2 border-red-900 bg-red-950/30 hover:bg-red-900/50 flex flex-col items-center justify-center gap-2 transition-all group"
          >
            <p className="font-black text-2xl uppercase text-red-500 group-hover:text-red-400 transition-colors">
              Run End of Day Sweep
            </p>
            <p className="text-sm text-red-700 font-bold max-w-sm text-center">
              Instantly checks out every single bag left in the system. Cannot
              be undone.
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}
