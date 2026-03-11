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

  // --- LIVE TIMER FOR 3-MIN WARNING ---
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    inputRef.current?.focus();
    const timer = setInterval(() => setCurrentTime(Date.now()), 5000);
    return () => clearInterval(timer);
  }, []);

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

  // --- FIX: UPDATED MANUAL SELECT LOGIC ---
  const handleManualSelect = async (e) => {
    const val = e.target.value;
    setManualToken(val);

    // Now we check if the input EXACTLY matches the new "Token - Name" format
    const matchedToken = availableTokens.find((t) => {
      const comboString = `${formatShortToken(t.display_token)} - ${t.name}`;
      return comboString === val;
    });

    if (matchedToken && !isProcessing) {
      setIsProcessing(true);
      try {
        await fetch("/api/queue", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tokenId: matchedToken.token_id,
            action: "ADD_TO_QUEUE",
          }),
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

  const getTokenStyle = (token) => {
    if (token.updated_at) {
      const requestedTime = new Date(token.updated_at).getTime();
      if (currentTime - requestedTime > 180000) {
        return { backgroundColor: "#dc2626", color: "#ffffff" };
      }
    }

    const pureNum = parseInt(formatShortToken(token.display_token), 10) || 0;
    const rangeGroup = Math.floor(Math.max(0, pureNum - 1) / 100) % 5;
    const colorIndex = pureNum % 2 === 0 ? 0 : 1;

    const bgCombos = [
      ["#663300", "#996633"],
      ["#666666", "#999999"],
      ["#663366", "#9900CC"],
      ["#0066CC", "#0099FF"],
      ["#336600", "#669900"],
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

  const getDynamicStyles = (count) => {
    if (count === 1)
      return {
        grid: "grid-cols-1",
        card: "min-h-[65vh]",
        token: "text-[50vw] md:text-[35vw] leading-[0.8]",
        bottomBar: "text-3xl md:text-5xl py-4",
      };
    if (count === 2)
      return {
        grid: "grid-cols-1 md:grid-cols-2",
        card: "min-h-[50vh]",
        token: "text-[35vw] md:text-[22vw] leading-[0.8]",
        bottomBar: "text-2xl md:text-3xl py-3",
      };
    if (count <= 4)
      return {
        grid: "grid-cols-2",
        card: "min-h-[35vh]",
        token: "text-[28vw] md:text-[15vw] leading-[0.8]",
        bottomBar: "text-xl md:text-2xl py-2",
      };
    if (count <= 6)
      return {
        grid: "grid-cols-2 md:grid-cols-3",
        card: "min-h-[25vh]",
        token: "text-8xl md:text-[11vw] leading-[0.8]",
        bottomBar: "text-lg md:text-xl py-2",
      };
    if (count <= 8)
      return {
        grid: "grid-cols-2 md:grid-cols-4",
        card: "min-h-[20vh]",
        token: "text-[20vw] md:text-[8vw] leading-[0.8]",
        bottomBar: "text-sm md:text-lg py-1.5",
      };
    return {
      grid: "grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6",
      card: "min-h-[15vh]",
      token: "text-[15vw] md:text-[5vw] leading-[0.8]",
      bottomBar: "text-xs md:text-sm py-1",
    };
  };

  const dynamicStyles = getDynamicStyles(queue.length);

  return (
    <div className="min-h-screen bg-black p-4 flex flex-col font-sans">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-3 mb-6 shadow-xl flex flex-col xl:flex-row gap-3 items-center justify-between shrink-0">
        <div className="flex-none bg-gray-800 px-4 py-2 rounded-xl border border-gray-700 flex items-center gap-3 w-full xl:w-auto justify-center">
          <span className="text-gray-400 font-black uppercase text-[10px] tracking-widest">
            Queue
          </span>
          <span className="text-white font-black text-xl leading-none">
            {queue.length}
          </span>
        </div>

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
              // FIX: Value is now explicitly "Token - Name" so it won't auto-submit until you click it!
              <option
                key={t.token_id}
                value={`${formatShortToken(t.display_token)} - ${t.name}`}
              >
                {t.mobile}
              </option>
            ))}
          </datalist>
        </div>

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
                Peak
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

      <div className="flex-grow flex flex-col">
        {queue.length === 0 ? (
          <div className="flex-grow flex flex-col items-center justify-center border-2 border-dashed border-gray-800 rounded-3xl opacity-50 bg-gray-900/20">
            <p className="text-2xl font-black text-gray-600 uppercase tracking-widest">
              Awaiting Scans
            </p>
          </div>
        ) : (
          <div
            className={`grid ${dynamicStyles.grid} gap-4 transition-all duration-300`}
          >
            {queue.map((token) => (
              <div
                key={token.token_id}
                onDoubleClick={() => handleDoubleClickFinish(token.token_id)}
                style={getTokenStyle(token)}
                className={`relative rounded-3xl flex flex-col justify-between text-center shadow-2xl cursor-pointer hover:brightness-110 hover:scale-105 active:scale-95 transition-all select-none border-4 border-black/20 overflow-hidden ${dynamicStyles.card}`}
                title="Double-click to mark as RETURNED"
              >
                <div className="flex-1 flex items-center justify-center w-full overflow-hidden">
                  <h1
                    className={`font-black drop-shadow-lg tracking-tighter w-full text-center ${dynamicStyles.token}`}
                  >
                    {formatShortToken(token.display_token) || token.token_id}
                  </h1>
                </div>

                <div
                  className={`w-full bg-black/25 backdrop-blur-sm flex items-center justify-center px-4 ${dynamicStyles.bottomBar}`}
                >
                  <p className="font-bold uppercase tracking-widest drop-shadow-md truncate w-full text-white/90">
                    {token.bag_count} Bag(s) - {token.name}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
