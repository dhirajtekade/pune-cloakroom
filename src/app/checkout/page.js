"use client";
import { useState, useEffect, useRef } from "react";
import {
  BackspaceIcon,
  CameraIcon,
  BoltIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/solid";

export default function CheckoutView() {
  const [inputValue, setInputValue] = useState("");
  const [manualToken, setManualToken] = useState("");

  const [queue, setQueue] = useState([]);
  const [availableTokens, setAvailableTokens] = useState([]);

  const [isProcessing, setIsProcessing] = useState(false);
  const [isPeakHours, setIsPeakHours] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // --- HELPER: STRIP TO SHORT TOKEN (e.g. "11-0093" -> "93") ---
  const formatShortToken = (displayToken) => {
    if (!displayToken) return "";
    let numStr = displayToken;
    if (displayToken.includes("-")) numStr = displayToken.split("-")[1];
    return String(parseInt(numStr.replace(/\D/g, ""), 10) || 0);
  };

  const fetchQueue = async () => {
    setIsProcessing(true);
    try {
      const res = await fetch("/api/queue");
      const data = await res.json();
      if (data.success) {
        setQueue(data.queue);
        if (data.availableTokens) setAvailableTokens(data.availableTokens);
      }
    } catch (err) {
      console.error("Failed to fetch queue");
    } finally {
      setIsProcessing(false);
      inputRef.current?.focus();
    }
  };

  useEffect(() => {
    fetchQueue();
    let interval;
    if (isPeakHours) {
      interval = setInterval(fetchQueue, 3000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPeakHours]);

  const handleScanSubmit = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isProcessing) return;
    setIsProcessing(true);

    try {
      await fetch("/api/queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tokenId: inputValue.trim(),
          action: "ADD_TO_QUEUE",
        }),
      });
      setInputValue("");
      fetchQueue();
    } catch (err) {
      alert("Scan failed!");
    } finally {
      setIsProcessing(false);
      inputRef.current?.focus();
    }
  };

  const handleManualSelect = async (e) => {
    const val = e.target.value;
    setManualToken(val);

    const isMatch = availableTokens.some((t) => {
      const shortToken = formatShortToken(t.display_token);
      return shortToken === val || t.token_id.toString() === val;
    });

    if (isMatch && !isProcessing) {
      setIsProcessing(true);
      try {
        await fetch("/api/queue", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tokenId: val, action: "ADD_TO_QUEUE" }),
        });
        fetchQueue();
      } catch (err) {
        console.error("Manual add failed");
      } finally {
        setIsProcessing(false);
        inputRef.current?.focus();
      }
    }
  };

  const handleCorrectLast = async () => {
    setIsProcessing(true);
    try {
      await fetch("/api/queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "CORRECT_LAST" }),
      });
      setManualToken("");
      fetchQueue();
    } catch (err) {
      console.error("Correction failed");
    } finally {
      setIsProcessing(false);
      inputRef.current?.focus();
    }
  };

  const handleDoubleClickFinish = async (actualDatabaseId) => {
    try {
      await fetch("/api/queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tokenId: actualDatabaseId,
          action: "FINAL_CHECKOUT",
        }),
      });
      fetchQueue();
    } catch (err) {
      console.error("Checkout failed");
    } finally {
      inputRef.current?.focus();
    }
  };

  // --- NEW HARDCODED COLOR HELPER ---
  const getTokenStyle = (displayToken) => {
    const pureNum = parseInt(formatShortToken(displayToken), 10) || 0;

    // Group into 100s, wrapping every 500 (0 to 4)
    const rangeGroup = Math.floor(Math.max(0, pureNum - 1) / 100) % 5;

    // Alternate colors exactly like your old code
    const colorIndex = pureNum % 2 === 0 ? 0 : 1;

    const bgCombos = [
      ["#663300", "#996633"], // first100
      ["#666666", "#999999"], // second100
      ["#663366", "#9900CC"], // third100
      ["#0066CC", "#0099FF"], // four100
      ["#336600", "#669900"], // five100
    ];

    const textCombos = [
      ["#FFFFFF", "#000000"],
      ["#FFFFFF", "#000000"],
      ["#FFFFFF", "#000000"],
      ["#FFFFFF", "#000000"],
      ["#FFFFFF", "#000000"],
    ];

    return {
      backgroundColor: bgCombos[rangeGroup][colorIndex],
      color: textCombos[rangeGroup][colorIndex],
    };
  };

  return (
    <div className="min-h-screen bg-black p-4 flex flex-col font-sans">
      {/* --- SINGLE UNIFIED CONTROL TRAY --- */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-3 mb-6 shadow-xl flex flex-col xl:flex-row gap-3 items-center justify-between">
        {/* 1. Queue Counter Pill */}
        <div className="flex-none bg-gray-800 px-4 py-2 rounded-xl border border-gray-700 flex items-center gap-3 w-full xl:w-auto justify-center">
          <span className="text-gray-400 font-black uppercase text-[10px] tracking-widest">
            Queue
          </span>
          <span className="text-white font-black text-xl leading-none">
            {queue.length}
          </span>
        </div>

        {/* 2. Manual Search / Dropdown */}
        <div className="flex-grow w-full xl:w-1/4 relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
          <input
            list="stored-tokens"
            type="text"
            value={manualToken}
            onChange={handleManualSelect}
            placeholder="SELECT TOKEN..."
            className="w-full pl-10 pr-4 py-2 bg-black border border-gray-700 focus:border-blue-500 rounded-xl text-sm font-bold text-gray-300 uppercase outline-none transition-colors shadow-inner"
            disabled={isProcessing && !isPeakHours}
          />
          <datalist id="stored-tokens">
            {availableTokens.map((t) => (
              <option
                key={t.token_id}
                value={formatShortToken(t.display_token)}
              >
                {t.name} - {t.mobile}
              </option>
            ))}
          </datalist>
        </div>

        {/* 3. Hardware Scanner Text Input */}
        <form
          onSubmit={handleScanSubmit}
          className="flex-grow w-full xl:w-1/4 relative"
        >
          <BoltIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-500 opacity-50" />
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="SCAN BARCODE..."
            autoFocus
            className="w-full pl-10 pr-4 py-2 bg-black border border-gray-700 focus:border-blue-500 rounded-xl text-lg font-bold text-white uppercase tracking-widest outline-none transition-colors shadow-inner"
            disabled={isProcessing && !isPeakHours}
          />
        </form>

        {/* 4. Action Buttons & Toggles */}
        <div className="flex flex-wrap md:flex-nowrap gap-2 w-full xl:w-auto shrink-0">
          <button
            onClick={handleCorrectLast}
            disabled={isProcessing || queue.length === 0}
            className="flex-1 md:flex-none px-4 py-2 bg-red-950/40 text-red-500 border border-red-900 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-red-900 hover:text-white transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <BackspaceIcon className="h-5 w-5" />
            <span className="text-sm uppercase tracking-wider">Correct</span>
          </button>

          <button
            onClick={() => {
              alert("Mobile Camera Scanner opening...");
              inputRef.current?.focus();
            }}
            className="flex-1 md:flex-none px-4 py-2 bg-gray-800 text-gray-300 border border-gray-700 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-700 transition-all active:scale-95"
          >
            <CameraIcon className="h-5 w-5" />
            <span className="text-sm uppercase tracking-wider">Camera</span>
          </button>

          <div className="flex-1 md:flex-none flex items-center justify-between gap-3 bg-black px-4 py-2 rounded-xl border border-gray-800">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isPeakHours}
                onChange={(e) => {
                  setIsPeakHours(e.target.checked);
                  inputRef.current?.focus();
                }}
                className="w-4 h-4 rounded border-gray-700 text-blue-600 focus:ring-blue-500 cursor-pointer bg-black"
              />
              <span
                className={`text-xs font-bold uppercase tracking-widest select-none ${isPeakHours ? "text-blue-400" : "text-gray-500"}`}
              >
                Peak Hrs
              </span>
            </label>

            <div className="w-px h-5 bg-gray-800"></div>

            <button
              onClick={fetchQueue}
              disabled={isProcessing}
              className="text-blue-500 hover:text-blue-400 transition-colors active:scale-95 disabled:opacity-50"
              title="Manual Refresh"
            >
              <ArrowPathIcon
                className={`h-5 w-5 ${isProcessing && isPeakHours ? "animate-spin" : ""}`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* --- THE BIG SCREEN QUEUE BOARD --- */}
      <div className="flex-grow pt-2">
        {queue.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-gray-800 rounded-3xl opacity-50 bg-gray-900/20">
            <p className="text-xl font-black text-gray-600 uppercase tracking-widest">
              Awaiting Scans
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {queue.map((token) => (
              <div
                key={token.token_id}
                onDoubleClick={() => handleDoubleClickFinish(token.token_id)}
                style={getTokenStyle(token.display_token)}
                className={`rounded-3xl p-6 flex flex-col items-center justify-center text-center shadow-2xl cursor-pointer hover:brightness-110 hover:scale-105 active:scale-95 transition-all select-none border-4 border-black/20`}
                title="Double-click to mark as RETURNED"
              >
                {/* Text color is automatically inherited from the style block above! */}
                <p className="font-bold uppercase tracking-widest text-xs mb-1 drop-shadow-md opacity-90">
                  {token.bag_count} Bag(s)
                </p>
                <h1 className="text-5xl md:text-6xl font-black drop-shadow-lg tracking-tighter">
                  {formatShortToken(token.display_token) || token.token_id}
                </h1>
                <p className="font-bold text-[10px] mt-2 truncate w-full max-w-full uppercase tracking-wider opacity-80">
                  {token.name}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
