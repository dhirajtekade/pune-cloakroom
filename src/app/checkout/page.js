"use client";
import { useState, useEffect, useRef } from "react";
import {
  BackspaceIcon,
  CameraIcon,
  BoltIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/solid";

// Import your new components!
import CameraScannerModal from "../../components/CameraScannerModal"; // Adjust path if needed
import QueueGrid from "../../components/QueueGrid"; // Adjust path if needed

export default function CheckoutView() {
  const [inputValue, setInputValue] = useState("");
  const [manualToken, setManualToken] = useState("");
  const [queue, setQueue] = useState([]);
  const [availableTokens, setAvailableTokens] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPeakHours, setIsPeakHours] = useState(false);

  // --- NEW CAMERA STATE ---
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const inputRef = useRef(null);
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
      if (!isCameraOpen) inputRef.current?.focus();
    }
  };

  useEffect(() => {
    fetchQueue();
    let interval;
    if (isPeakHours) interval = setInterval(fetchQueue, 3000);
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPeakHours]);

  // --- REUSABLE API ADD FUNCTION ---
  const addToQueueAPI = async (tokenId) => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      await fetch("/api/queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tokenId, action: "ADD_TO_QUEUE" }),
      });
      fetchQueue();
    } catch (err) {
      alert("Scan failed!");
    } finally {
      setIsProcessing(false);
      setIsCameraOpen(false); // Close camera if it was open
      inputRef.current?.focus();
    }
  };

  const handleScanSubmit = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    addToQueueAPI(inputValue.trim());
    setInputValue("");
  };

  // --- NEW CAMERA SCAN HANDLER ---
  const handleCameraScan = (scannedText) => {
    addToQueueAPI(scannedText);
  };

  const handleManualSelect = (e) => {
    const val = e.target.value;
    setManualToken(val);

    const matchedToken = availableTokens.find((t) => {
      const comboString = `${formatShortToken(t.display_token)} - ${t.name}`;
      return comboString === val;
    });

    if (matchedToken) addToQueueAPI(matchedToken.token_id);
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

  return (
    <div className="min-h-screen bg-black p-4 flex flex-col font-sans">
      {/* --- MOUNT CAMERA MODAL IF ACTIVE --- */}
      {isCameraOpen && (
        <CameraScannerModal
          onScan={handleCameraScan}
          onClose={() => {
            setIsCameraOpen(false);
            inputRef.current?.focus();
          }}
        />
      )}

      {/* --- CONTROL TRAY --- */}
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
            className="w-full pl-10 pr-4 py-2 bg-black border border-gray-700 focus:border-blue-500 rounded-xl text-lg font-bold text-white uppercase tracking-widest outline-none transition-colors shadow-inner"
            disabled={isProcessing && !isPeakHours}
          />
        </form>

        <div className="flex flex-wrap md:flex-nowrap gap-2 w-full xl:w-auto shrink-0">
          <button
            onClick={handleCorrectLast}
            disabled={isProcessing || queue.length === 0}
            className="flex-1 md:flex-none px-4 py-2 bg-red-950/40 text-red-500 border border-red-900 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-red-900 transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <BackspaceIcon className="h-5 w-5" />
            <span className="text-sm uppercase tracking-wider">Correct</span>
          </button>

          <button
            onClick={() => setIsCameraOpen(true)}
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
            >
              <ArrowPathIcon
                className={`h-5 w-5 ${isProcessing && isPeakHours ? "animate-spin" : ""}`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* --- IMPORTED QUEUE GRID COMPONENT --- */}
      <div className="flex-grow flex flex-col">
        <QueueGrid
          queue={queue}
          formatShortToken={formatShortToken}
          handleDoubleClickFinish={handleDoubleClickFinish}
          currentTime={currentTime}
        />
      </div>
    </div>
  );
}
