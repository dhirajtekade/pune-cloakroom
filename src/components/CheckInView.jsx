"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import html2canvas from "html2canvas";
import {
  PlusIcon,
  MinusIcon,
  PrinterIcon,
  CheckCircleIcon,
  ChatBubbleLeftRightIcon,
  ArrowPathIcon,
  DocumentMagnifyingGlassIcon,
  SparklesIcon,
} from "@heroicons/react/24/solid";

export default function CheckInView() {
  const router = useRouter();

  const mobileInputRef = useRef(null);

  const [mobile, setMobile] = useState("");
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [bagCount, setBagCount] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [isResending, setIsResending] = useState(false);

  const [submitAction, setSubmitAction] = useState("PRINT");
  const [hybridStep, setHybridStep] = useState(1);
  const [hybridData, setHybridData] = useState(null);
  const [isPrinting, setIsPrinting] = useState(false);

  const triggerNativeMasterPrint = (tokenId, mahatmaName, bags) => {
    let shortToken = tokenId;
    if (String(shortToken).includes("-"))
      shortToken = String(shortToken).split("-")[1];
    const pureNum = Number(String(shortToken).replace(/\D/g, "")) || 0;
    const bigToken = String(pureNum);

    const displayDate = new Date()
      .toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
      .toUpperCase();

    const INIT = "\x1B\x40";
    const NORMAL_SIZE = "\x1D\x21\x00\x1B\x21\x00";
    const MAX_SIZE = "\x1D\x21\x33";
    const BOLD_ON = "\x1BE\x01";
    const BOLD_OFF = "\x1BE\x00";
    const CENTER = "\x1Ba\x01";
    const FF = "\x0C";
    const BARCODE_HEIGHT = "\x1D\x68\x40";
    const BARCODE_WIDTH = "\x1D\x77\x04";
    const BARCODE_TEXT_OFF = "\x1D\x48\x00";

    const scanCodeCommand = `${BARCODE_HEIGHT}${BARCODE_WIDTH}${BARCODE_TEXT_OFF}\x1D\x6B\x04${bigToken}\x00`;

    const masterTokenStr =
      `${INIT}${CENTER}${NORMAL_SIZE}` +
      `DATE: ${displayDate}\n\n` +
      `${scanCodeCommand}\n\n` +
      `${MAX_SIZE}${BOLD_ON}${bigToken}${BOLD_OFF}${NORMAL_SIZE}\n\n` +
      `${BOLD_ON}${bags} Bags - ${mahatmaName.toUpperCase()}${BOLD_OFF}\n` +
      `${FF}`;

    const encodedData = btoa(unescape(encodeURIComponent(masterTokenStr)));
    const nativeLink = document.createElement("a");
    nativeLink.href = `intent:base64,${encodedData}#Intent;scheme=rawbt;package=ru.a402d.rawbtprinter;end;`;
    nativeLink.click();
  };

  // --- REVERSED: STEP 2 IS NOW THE MAHATMA TOKEN ---
  const handleHybridStep2 = () => {
    // 1. Fire Native Master Print
    triggerNativeMasterPrint(
      hybridData.tokenId,
      hybridData.name,
      hybridData.bagCount,
    );

    // 2. Finish the flow and show the final Success Screen
    setSuccessData(hybridData);
    setHybridStep(1);
    setHybridData(null);
  };

  const handleCheckIn = async (e) => {
    e.preventDefault();
    if (hybridStep === 2) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile, name, city: city || "N/A", bagCount }),
      });
      const data = await response.json();

      if (data.success) {
        if (submitAction === "SAVE") {
          router.push(`/preview/${data.tokenId}`);
          return;
        }

        // --- REVERSED: STEP 1 IS NOW THE BAG LABELS (SVG) ---
        if (submitAction === "HYBRID") {
          // 1. Lock data so the hidden SVGs can render
          setHybridData({ tokenId: data.tokenId, name, mobile, bagCount });
          setHybridStep(2); // Show the overlay immediately
          setIsPrinting(true); // Changes overlay button to "GENERATING BAGS..."

          // 2. Add a slight delay to allow React to mount the SVGs before screenshotting
          setTimeout(async () => {
            try {
              const element = document.getElementById(
                "hidden-svg-bag-receipts",
              );
              if (element) {
                const canvas = await html2canvas(element, {
                  scale: 2,
                  backgroundColor: "#ffffff",
                  useCORS: true,
                });
                const imageDataUrl = canvas.toDataURL("image/png");
                const imgLink = document.createElement("a");
                imgLink.href = `intent:${imageDataUrl}#Intent;scheme=rawbt;package=ru.a402d.rawbtprinter;end;`;
                imgLink.click(); // Fires intent to print bags
              }
            } catch (err) {
              alert("Bag print failed: " + err.message);
            } finally {
              setIsPrinting(false); // Restores the button so they can click Step 2
              setIsLoading(false);
            }
          }, 500); // 500ms safety buffer

          return; // Stop execution so it waits for user to click Step 2
        }

        // --- NORMAL FLOW (Old Native/Image Mode) ---
        setSuccessData({ tokenId: data.tokenId, name, mobile, bagCount });

        if (data.printAsImage) {
          printAsImageTokens(data.tokenId, data.enablePageCut);
        } else {
          try {
            printTokens(
              data.tokenId,
              name,
              mobile,
              city,
              bagCount,
              data.mode,
              data.printBagLabels,
              data.enablePageCut,
              data.useQrCode,
            );
          } catch (err) {
            console.log("Printing skipped");
          }
        }
      } else {
        alert("Error: " + data.error);
      }
    } catch (err) {
      alert("Check connection / Server error.");
    } finally {
      setIsLoading(false);
    }
  };

  const resendSMS = async () => {
    if (!successData) return;
    setIsResending(true);
    try {
      const res = await fetch("/api/checkin/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mobile: successData.mobile,
          tokenId: successData.tokenId,
          name: successData.name,
          bagCount: successData.bagCount,
        }),
      });
      const data = await res.json();
      if (data.success) alert("SMS Sent Successfully!");
      else alert("Failed to send: " + data.error);
    } catch (err) {
      alert("Check connection.");
    } finally {
      setIsResending(false);
    }
  };

  const shareToSMS = () => {
    if (!successData) return;
    const displayToken = `${String(successData.tokenId).padStart(4, "0")}`;
    const { name, mobile, bagCount } = successData;
    const messageText = `JSCA ${name.toUpperCase()},\nToken: ${displayToken} for ${bagCount} bag(s).\nClose time: 09:00PM`;
    const encodedText = encodeURIComponent(messageText);
    const url = `sms:+91${mobile}?body=${encodedText}`;
    window.open(url, "_self");
  };

  const shareToWhatsApp = () => {
    if (!successData) return;
    const dateCode = new Date().getDate();
    const displayToken = `${String(successData.tokenId).padStart(4, "0")}`;
    const { name, mobile, bagCount } = successData;
    const messageText =
      `*SAMAN GHAR PUNE*\n` +
      `Jai Satchitanand!\n\n` +
      `Date: ${dateCode} March\n` +
      `Token: *${displayToken}*\n` +
      `Name: *${name.toUpperCase()}*\n` +
      `Bags: *${bagCount}*\n\n` +
      `Please show this message to collect your bags.`;
    const encodedText = encodeURIComponent(messageText);
    window.open(`https://wa.me/91${mobile}?text=${encodedText}`, "_blank");
  };

  const resetForm = () => {
    setSuccessData(null);
    setName("");
    setMobile("");
    setCity("");
    setBagCount(1);
    setHybridStep(1);
    setHybridData(null);

    setTimeout(() => {
      if (mobileInputRef.current) {
        mobileInputRef.current.focus();
      }
    }, 100);
  };

  if (successData) {
    const displayToken = `${String(successData.tokenId).padStart(4, "0")}`;
    return (
      <div className="bg-gray-900 rounded-2xl shadow-2xl p-8 max-w-md mx-auto border-2 border-green-500/50 text-center">
        <div className="flex justify-center mb-4">
          <CheckCircleIcon className="h-16 w-16 text-green-500" />
        </div>
        <h2 className="text-3xl font-black text-white mb-2 uppercase">
          Checked In!
        </h2>
        <p className="text-gray-400 mb-6 font-bold tracking-widest text-xl text-blue-400">
          TOKEN: {displayToken}
        </p>

        <div className="space-y-4">
          <button
            onClick={shareToWhatsApp}
            className="w-full p-5 bg-green-600 hover:bg-green-500 text-white rounded-2xl font-black flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all"
          >
            <ChatBubbleLeftRightIcon className="h-7 w-7" /> SHARE ON WHATSAPP
          </button>
          <button
            onClick={shareToSMS}
            className="w-full p-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all"
          >
            <ChatBubbleLeftRightIcon className="h-7 w-7" /> SEND NATIVE SMS
          </button>
          <button
            onClick={resendSMS}
            disabled={isResending}
            className={`w-full p-4 rounded-2xl font-bold flex items-center justify-center gap-3 border-2 transition-all ${isResending ? "bg-gray-800 border-gray-700 text-gray-500" : "bg-blue-600/10 border-blue-600 text-blue-400 hover:bg-blue-600/20"}`}
          >
            <ChatBubbleLeftRightIcon className="h-5 w-5" />{" "}
            {isResending ? "SENDING..." : "RESEND SYSTEM SMS"}
          </button>
          <button
            onClick={resetForm}
            className="w-full p-5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-2xl font-bold flex items-center justify-center gap-3"
          >
            <ArrowPathIcon className="h-5 w-5" /> NEXT MAHATMA
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-2xl shadow-2xl p-6 max-w-md mx-auto border border-gray-800 mt-1 mb-40 relative">
      <h2 className="text-2xl font-black mb-6 text-center text-blue-400 uppercase tracking-tight">
        Pune Cloakroom 7.2
      </h2>

      {/* OVERLAY: Shows when Bag Labels are processing/printed */}
      {hybridStep === 2 && (
        <div className="absolute inset-0 bg-gray-900/80 z-10 rounded-2xl flex flex-col items-center justify-start pt-[30%]">
          <p className="text-white font-bold mb-4 px-8 text-center">
            Bag Labels saved and sent to printer!
            <br />
            Tap below to print the Mahatma Token.
          </p>
          <div className="w-full px-6">
            <button
              type="button"
              onClick={handleHybridStep2}
              disabled={isPrinting}
              className={`w-full p-6 rounded-xl font-black flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(249,115,22,0.6)] active:scale-95 transition-transform text-white ${isPrinting ? "bg-orange-800 cursor-wait border-2 border-orange-700" : "bg-orange-600 hover:bg-orange-500 border-2 border-orange-400 animate-pulse"}`}
            >
              <SparklesIcon className="h-8 w-8 text-yellow-300" />
              {isPrinting ? "GENERATING BAGS..." : "2. PRINT MAHATMA TOKEN"}
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleCheckIn} className="space-y-4">
        <div className="space-y-3">
          {/* 1. Mobile Number */}
          <input
            type="text"
            ref={mobileInputRef}
            inputMode="numeric"
            value={mobile}
            onChange={(e) =>
              setMobile(e.target.value.replace(/[^0-9]/g, "").slice(0, 10))
            }
            placeholder="Mobile Number"
            className="w-full p-4 bg-black border-2 border-gray-700 rounded-xl text-xl font-bold text-center text-white outline-none"
            required
          />

          {/* 2. Mahatma Name */}
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Mahatma Name"
            className="w-full p-4 bg-black border-2 border-gray-700 rounded-xl text-xl font-bold text-center text-white outline-none"
            required
          />

          {/* 3. Bag Count Widget (Moved Here!) */}
          <div className="flex items-center justify-between border-2 border-gray-700 bg-gray-800 rounded-xl p-2">
            <button
              type="button"
              onClick={() =>
                setBagCount(Math.max(1, (Number(bagCount) || 1) - 1))
              }
              className="bg-gray-700 p-4 rounded-lg text-white active:scale-95 transition-transform"
            >
              <MinusIcon className="h-7 w-7" />
            </button>
            <input
              type="number"
              value={bagCount}
              onChange={(e) => {
                const val = e.target.value;
                setBagCount(val === "" ? "" : parseInt(val, 10));
              }}
              onFocus={(e) => e.target.select()}
              onBlur={() => setBagCount(Math.max(1, Number(bagCount) || 1))}
              className="w-full text-center text-4xl font-black bg-transparent text-white focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setBagCount((Number(bagCount) || 0) + 1)}
              className="bg-blue-600 p-4 rounded-lg text-white active:scale-95 transition-transform"
            >
              <PlusIcon className="h-7 w-7" />
            </button>
          </div>

          {/* 4. City / Village */}
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="City / Village (Optional)"
            className="w-full p-4 bg-black border-2 border-gray-700 rounded-xl text-xl font-bold text-center text-white outline-none"
          />
        </div>

        {/* --- BUTTON 1: HYBRID PRINT (REVERSED) --- */}
        <button
          type="submit"
          onClick={() => setSubmitAction("HYBRID")}
          disabled={isLoading || hybridStep === 2}
          className="w-full mt-4 p-5 rounded-xl text-xl font-black text-white flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(59,130,246,0.4)] active:scale-95 transition-transform bg-blue-600 hover:bg-blue-500 border-2 border-blue-400"
        >
          <SparklesIcon className="h-7 w-7 text-yellow-300" />
          {isLoading && submitAction === "HYBRID"
            ? "SAVING..."
            : "1. PRINT BAG LABELS"}
        </button>

        <button
          type="submit"
          onClick={() => setSubmitAction("PRINT")}
          disabled={isLoading || hybridStep === 2}
          className={`w-full p-4 rounded-xl text-lg font-bold text-white flex items-center justify-center space-x-2 ${isLoading && submitAction === "PRINT" ? "bg-gray-400" : "bg-green-600"}`}
        >
          <PrinterIcon className="h-6 w-6" />
          <span>
            {isLoading && submitAction === "PRINT"
              ? "Saving..."
              : `Print ${bagCount} Labels (Old)`}
          </span>
        </button>
        <button
          type="submit"
          onClick={() => setSubmitAction("SAVE")}
          disabled={isLoading || hybridStep === 2}
          className={`w-full p-4 rounded-xl text-lg font-bold text-white flex items-center justify-center space-x-2 active:scale-95 transition-transform ${isLoading && submitAction === "SAVE" ? "bg-gray-600" : "bg-gray-700 hover:bg-gray-600 border border-gray-600"}`}
        >
          <DocumentMagnifyingGlassIcon className="h-6 w-6 text-blue-400" />
          <span>
            {isLoading && submitAction === "SAVE"
              ? "Saving..."
              : `Save & View Preview`}
          </span>
        </button>
      </form>

      {/* ======================================================= */}
      {/* HIDDEN SVG BAG TEMPLATES (FOR HYBRID STEP 1) */}
      {/* ======================================================= */}
      {hybridData && (
        <div
          style={{
            position: "absolute",
            left: "-9999px",
            top: "0",
            zIndex: -1000,
          }}
        >
          <div id="hidden-svg-bag-receipts" className="flex flex-col bg-white">
            {Array.from({ length: hybridData.bagCount }).map((_, index) => {
              let pureNum = 0;
              if (hybridData.tokenId) {
                let str = String(hybridData.tokenId);
                if (str.includes("-")) str = str.split("-")[1];
                pureNum = Number(str.replace(/\D/g, "")) || 0;
              }
              return (
                <div
                  key={`bag-${index}`}
                  className="bg-[#ffffff] flex flex-col font-sans w-[800px] h-[850px] box-border relative overflow-hidden text-[#000000]"
                >
                  <div className="w-full h-[550px] flex flex-col items-center justify-center p-8 border-b-4 border-dashed border-[#cccccc]">
                    <div className="text-center text-5xl font-black uppercase">
                      {index + 1} / {hybridData.bagCount}
                    </div>
                    <div className="flex-grow flex items-center justify-center w-full overflow-hidden my-4">
                      <svg viewBox="0 0 100 60" className="w-full h-full">
                        <text
                          x="60"
                          y="40"
                          textAnchor="middle"
                          fontSize="70"
                          fontWeight="500"
                          fill="#000000"
                          dominantBaseline="middle"
                        >
                          {pureNum}
                        </text>
                      </svg>
                    </div>
                    <div className="text-center text-3xl font-black uppercase tracking-widest mb-4">
                      {hybridData.mobile} ({hybridData.bagCount}B)
                    </div>
                  </div>
                  <div className="w-full h-[300px] bg-[#ffffff] flex items-end justify-center pb-2">
                    <span style={{ color: "#cccccc" }} className="text-xs">
                      .
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* HIDDEN THERMAL LABEL TEMPLATE (ONLY USED FOR OLD IMAGE MODE) */}
      <div
        style={{
          position: "absolute",
          left: "-9999px",
          top: "0",
          zIndex: -1000,
          color: "black",
          background: "white",
        }}
      >
        <div
          id="thermal-label-template"
          className="bg-white text-black flex flex-col items-center justify-between font-sans"
          style={{
            width: "576px",
            height: "360px",
            padding: "20px",
            boxSizing: "border-box",
          }}
        >
          <div
            id="img-date"
            style={{
              fontSize: "24px",
              fontWeight: "bold",
              textTransform: "uppercase",
            }}
          >
            JSCA SAMAN GHAR
          </div>
          <div
            style={{
              fontSize: "32px",
              border: "4px solid black",
              padding: "10px 20px",
              marginTop: "20px",
              fontFamily: "monospace",
              fontWeight: "bold",
            }}
          >
            <span id="img-scan-payload">Scan Payload: 93</span>
          </div>
          <div
            id="img-big-token"
            style={{
              fontSize: "150px",
              fontWeight: "900",
              lineHeight: "1",
              marginTop: "10px",
            }}
          >
            93
          </div>
        </div>
      </div>
    </div>
  );
}

// ... Ensure printTokens and printAsImageTokens remain exactly as they were below!
