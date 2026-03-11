"use client";
import { useState } from "react";
import html2canvas from "html2canvas";
import {
  PlusIcon,
  MinusIcon,
  PrinterIcon,
  CheckCircleIcon,
  ChatBubbleLeftRightIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/solid";

export default function CheckInView() {
  const [mobile, setMobile] = useState("");
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [bagCount, setBagCount] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [isResending, setIsResending] = useState(false);

  const handleCheckIn = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile, name, city: city || "N/A", bagCount }),
      });
      const data = await response.json();

      if (data.success) {
        // Prepare data for the hidden component tick
        setSuccessData({ tokenId: data.tokenId, name, mobile, bagCount });

        // DYNAMIC PRINTING MODE SELECTOR
        if (data.printAsImage) {
          // --- IMAGE MODE ---
          printAsImageTokens(data.tokenId, data.enablePageCut);
        } else {
          // --- NATIVE MODE (Old ESC/POS) ---
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
          // FIX: successData.tokenId is already fully formatted as "9-0094"
          tokenId: successData.tokenId,
          name: successData.name,
          bagCount: successData.bagCount,
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert("SMS Sent Successfully!");
      } else {
        alert("Failed to send: " + data.error);
      }
    } catch (err) {
      alert("Check connection.");
    } finally {
      setIsResending(false);
    }
  };

  const shareToSMS = () => {
    if (!successData) return;

    const dateCode = new Date().getDate();
    const displayToken = `${String(successData.tokenId).padStart(4, "0")}`;
    const { name, mobile, bagCount } = successData;

    // Build the short, clean SMS message
    const messageText = `JSCA ${name.toUpperCase()},\nToken: ${displayToken} for ${bagCount} bag(s).\nClose time: 09:00PM`;

    // Encode it for the URL
    const encodedText = encodeURIComponent(messageText);

    // Use the native 'sms:' protocol.
    // We use _self instead of _blank so the phone knows to open the native app.
    const url = `sms:+91${mobile}?body=${encodedText}`;
    window.open(url, "_self");
  };

  //whatasapp share
  const shareToWhatsApp = () => {
    if (!successData) return;

    const dateCode = new Date().getDate();
    const displayToken = `${String(successData.tokenId).padStart(4, "0")}`;

    // 1. Format the token correctly
    const { tokenId, name, mobile, bagCount } = successData;
    // Create the display token (e.g., 12-0045)
    // const tokenStr = `#${String(tokenId).padStart(4, "0")}`;

    // 2. Build the message string
    const messageText =
      `*SAMAN GHAR PUNE*\n` +
      `Jai Satchitanand!\n\n` +
      `Date: ${dateCode} March\n` +
      `Token: *${displayToken}*\n` +
      `Name: *${name.toUpperCase()}*\n` +
      `Bags: *${bagCount}*\n\n` +
      `Please show this message to collect your bags.`;

    // 3. ENCODE the entire message for the URL
    const encodedText = encodeURIComponent(messageText);

    // 4. Open WhatsApp
    window.open(`https://wa.me/91${mobile}?text=${encodedText}`, "_blank");
  };

  //reset form
  const resetForm = () => {
    setSuccessData(null);
    setName("");
    setMobile("");
    setCity("");
    setBagCount(1);
  };

  if (successData) {
    const dateCode = new Date().getDate();
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
            <ChatBubbleLeftRightIcon className="h-7 w-7" />
            SHARE ON WHATSAPP
          </button>

          {/* NEW NATIVE SMS BUTTON */}
          <button
            onClick={shareToSMS}
            className="w-full p-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all"
          >
            <ChatBubbleLeftRightIcon className="h-7 w-7" />
            SEND NATIVE SMS (Personal)
          </button>

          {/* NEW RESEND SMS BUTTON */}
          <button
            onClick={resendSMS}
            disabled={isResending}
            className={`w-full p-4 rounded-2xl font-bold flex items-center justify-center gap-3 border-2 transition-all ${
              isResending
                ? "bg-gray-800 border-gray-700 text-gray-500"
                : "bg-blue-600/10 border-blue-600 text-blue-400 hover:bg-blue-600/20"
            }`}
          >
            <ChatBubbleLeftRightIcon className="h-5 w-5" />
            {isResending ? "SENDING..." : "RESEND SYSTEM SMS"}
          </button>

          <button
            onClick={resetForm}
            className="w-full p-5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-2xl font-bold flex items-center justify-center gap-3"
          >
            <ArrowPathIcon className="h-5 w-5" />
            NEXT MAHATMA
          </button>
        </div>
      </div>
    );
  }

  // --- ADD THIS RIGHT ABOVE YOUR RETURN STATEMENT ---
  let displayBigToken = "93"; // Placeholder for the hidden template before a scan
  let scanPayload = "93";

  if (successData && successData.tokenId) {
    const baseNumberStr = String(successData.tokenId);
    let extractedStr = baseNumberStr;

    // Safely extract just "94" from "9-0094"
    if (baseNumberStr.includes("-")) {
      extractedStr = baseNumberStr.split("-")[1];
    }
    const pureNum = Number(extractedStr.replace(/\D/g, "")) || 0;

    displayBigToken = String(pureNum); // This becomes "94"
    scanPayload = displayBigToken; // Keeping it lightweight for barcodes
  }

  return (
    <div className="bg-gray-900 rounded-2xl shadow-2xl p-6 max-w-md mx-auto border border-gray-800 mt-1 mb-40">
      <h2 className="text-2xl font-black mb-6 text-center text-blue-400 uppercase tracking-tight">
        Pune Cloakroom 3.10
      </h2>

      <form onSubmit={handleCheckIn} className="space-y-4">
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

          {/* FIX: Removed readOnly, added onChange, onFocus, and onBlur */}
          <input
            type="number"
            value={bagCount}
            onChange={(e) => {
              const val = e.target.value;
              setBagCount(val === "" ? "" : parseInt(val, 10));
            }}
            onFocus={(e) => e.target.select()} // Highlights the number instantly when tapped!
            onBlur={() => setBagCount(Math.max(1, Number(bagCount) || 1))} // Safety net if left blank
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

        <div className="space-y-3">
          <input
            type="text"
            inputMode="numeric"
            value={mobile}
            onChange={(e) =>
              setMobile(e.target.value.replace(/[^0-9]/g, "").slice(0, 10))
            }
            placeholder="Mobile Number"
            className="w-full p-4 bg-black border-2 border-gray-700 rounded-xl text-xl font-bold text-center text-white outline-none"
            required
          />
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Mahatma Name"
            className="w-full p-4 bg-black border-2 border-gray-700 rounded-xl text-xl font-bold text-center text-white outline-none"
            required
          />
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="City / Village (Optional)"
            className="w-full p-4 bg-black border-2 border-gray-700 rounded-xl text-xl font-bold text-center text-white outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full mt-4 p-5 rounded-xl text-xl font-bold text-white flex items-center justify-center space-x-2 ${isLoading ? "bg-gray-400" : "bg-green-600"}`}
        >
          <PrinterIcon className="h-7 w-7" />
          <span>{isLoading ? "Saving..." : `Print ${bagCount} Labels`}</span>
        </button>
      </form>

      {/* ======================================================= */}
      {/* HIDDEN THERMAL LABEL TEMPLATE (ONLY USED FOR IMAGE MODE) */}
      {/* ======================================================= */}
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
            width: "576px", // Exact dot-width of an 80mm thermal printer
            height: "360px", // Exact proportional height for 50mm
            padding: "20px",
            boxSizing: "border-box",
          }}
        >
          {/* Header */}
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

          {/* Middle: The Barcode Placeholder */}
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

          {/* Bottom: Giant Token */}
          <div
            id="img-big-token"
            style={{
              fontSize: "150px", // Massive, but safely inside the 360px box!
              fontWeight: "900",
              lineHeight: "1",
              marginTop: "10px",
            }}
          >
            93
          </div>
        </div>
      </div>
      {/* ======================================================= */}
    </div>
  );
}

// Ensure printTokens is defined globally or inside the same file
const printTokens = (
  startTokenId, // e.g., "9-0094"
  name,
  mobile,
  city,
  bagCount,
  mode = "PER_MAHATMA",
  printBagLabels = true,
  enablePageCut = false,
  useQrCode = false, // <--- NEW PARAMETER
) => {
  const SUPER_GIANT = "\x1D\x21\x77"; // 7x Width & 7x Height (Massive!)
  const MAX_SIZE = "\x1D\x21\x33";
  const JUMBO = "\x1D\x21\x11";
  const NORMAL_SIZE = "\x1D\x21\x00\x1B\x21\x00";

  const BOLD_ON = "\x1BE\x01";
  const BOLD_OFF = "\x1BE\x00";
  const CENTER = "\x1Ba\x01";
  const FF = "\x0C";
  const CUT = enablePageCut ? "\x1D\x56\x00" : "";

  const todayDate = new Date().getDate();
  const displayDate = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).toUpperCase();
  let fullPrint = "";

  // ==========================================
  // FORMAT CONVERTER & EXTRACTOR
  // ==========================================
  let prefix = String(todayDate);
  let baseNumberStr = String(startTokenId);

  if (baseNumberStr.includes("-")) {
    const parts = baseNumberStr.split("-");
    prefix = parts[0];
    baseNumberStr = parts[1];
  }

  const safeNumberStr = baseNumberStr.replace(/\D/g, "");
  const firstTokenNum = Number(safeNumberStr) || 0;
  const bigToken = String(firstTokenNum);

  const pureFourDigitToken = String(firstTokenNum).padStart(4, "0"); // "0094"
  const qrDataString = `${prefix}-${pureFourDigitToken}`; // "9-0094"

  // ==========================================
  // DYNAMIC CODE GENERATOR (BARCODE vs QR)
  // ==========================================
  let scanCodeCommand = "";
  const lightPayload = bigToken;

  if (useQrCode) {
    // Heavy QR Code Generation
    const dataLen = lightPayload.length + 3;
    const pL = String.fromCharCode(dataLen % 256);
    const pH = String.fromCharCode(Math.floor(dataLen / 256));

    const qrSize = "\x1D\x28\x6B\x03\x00\x31\x43\x06";
    const qrError = "\x1D\x28\x6B\x03\x00\x31\x45\x31";
    const qrStore = `\x1D\x28\x6B${pL}${pH}\x31\x50\x30${lightPayload}`;
    const qrPrint = "\x1D\x28\x6B\x03\x00\x31\x51\x30";

    // THE DOT-FEED FIX:
    // \x1B\x4A is the command for "Feed Paper by Dots".
    // \x1E is the hexadecimal number for 30 dots (exactly half of a normal \n line).
    const halfLineFeed = "\x1B\x4A\x1E";

    scanCodeCommand = `${qrSize}${qrError}${qrStore}${qrPrint}${halfLineFeed}`;
  } else {
    // Ultra-Safe 1D Barcode (CODE39)
    const BARCODE_HEIGHT = "\x1D\x68\x40";
    const BARCODE_WIDTH = "\x1D\x77\x04";
    const BARCODE_TEXT_OFF = "\x1D\x48\x00";

    // FIX: Added the " \n \n" right after the \x00 terminator!
    // This forces the printer to physically roll the paper down after the barcode.
    scanCodeCommand = `\n ${BARCODE_HEIGHT}${BARCODE_WIDTH}${BARCODE_TEXT_OFF}\x1D\x6B\x04${lightPayload}\x00 \n \n`;
  }

  if (mode === "PER_MAHATMA") {
    // --- A. MASTER MAHATMA TOKEN (TESTING: 3 COPIES) ---
    // for (let testLoop = 0; testLoop < 3; testLoop++) {//for testing only
    fullPrint +=
      `${CENTER}${NORMAL_SIZE}` +
      `\n DATE: ${displayDate}\n` +
      `${scanCodeCommand}` + // Dynamically injects Barcode OR QR
      `${MAX_SIZE}${BOLD_ON}${bigToken}${BOLD_OFF}${NORMAL_SIZE}\n\n` +
      `${BOLD_ON}${bagCount} Bags - ${name.toUpperCase()}${BOLD_OFF}\n\n\n` +
      `${FF}${CUT}`;
    // }

    // --- B. INDIVIDUAL BAG LABELS (Temporarily active for testing layout) ---
    if (printBagLabels) {
      for (let i = 1; i <= bagCount; i++) {
        fullPrint +=
          `${CENTER} \n \n\n` +
          `${SUPER_GIANT}${BOLD_ON}${bigToken}${BOLD_OFF}${NORMAL_SIZE}\n\n\n` +
          `${JUMBO}(${i}/${bagCount})${NORMAL_SIZE}\n\n\n` +
          `${BOLD_ON}${mobile} (${bagCount}B)${BOLD_OFF}\n` +
          ` \n \n` +
          `${FF}${CUT}`;
      }
    }
  }
  // ==========================================
  // MODE 2: TOKEN PER BAG (Individual Mode)
  // ==========================================
  else if (mode === "PER_BAG") {
    let otherTokensStr = "";
    if (bagCount > 1) {
      const otherTokens = [];
      for (let i = 1; i < bagCount; i++) {
        otherTokens.push(
          `${prefix}-${String(firstTokenNum + i).padStart(4, "0")}`,
        );
      }
      otherTokensStr = `& ${otherTokens.join(",")}\n`;
    }

    // Printing this 3 times for your test as well
    // for (let testLoop = 0; testLoop < 3; testLoop++) {
    // fullPrint +=
    //   `${CENTER}${NORMAL_SIZE}` +
    //   `DATE: ${todayDate} MARCH 2026\n\n` +
    //   `${scanCodeCommand}` + // <--- FIX: Changed from nativeQRCode to scanCodeCommand
    //   `${MAX_SIZE}${BOLD_ON}${bigToken}${BOLD_OFF}${NORMAL_SIZE}\n` +
    //   `${otherTokensStr}` +
    //   `${BOLD_ON}${bagCount} Bags - ${name.toUpperCase()}${BOLD_OFF}\n\n` +
    //   `${FF}${CUT}`;
    // }

    if (printBagLabels) {
      for (let i = 0; i < bagCount; i++) {
        let currentToken = firstTokenNum + i;
        let bagBigToken = String(currentToken);

        fullPrint +=
          `${CENTER} \n \n \n` + // Forced top margin
          `${MAX_SIZE}${BOLD_ON}${bagBigToken}${BOLD_OFF}${NORMAL_SIZE}\n\n` +
          `${JUMBO}(BAG)${NORMAL_SIZE}\n\n` +
          `${BOLD_ON}${mobile} (${bagCount}B)${BOLD_OFF}\n` +
          ` \n \n` + // Forced bottom margin
          `${FF}${CUT}`;
      }
    }
  }

  const encodedData = btoa(unescape(encodeURIComponent(fullPrint)));
  const link = document.createElement("a");
  link.href = `intent:base64,${encodedData}#Intent;scheme=rawbt;package=ru.a402d.rawbtprinter;end;`;
  link.click();
};

// --- IMAGE MODE PRINTER (Using html2canvas + RawBT) ---
// --- IMAGE MODE PRINTER (Using html2canvas + RawBT) ---
// --- IMAGE MODE PRINTER (Using html2canvas + RawBT) ---
const printAsImageTokens = async (formattedTokenId, enablePageCut = false) => {
  const labelElement = document.getElementById("thermal-label-template");
  if (!labelElement) return;

  // 1. EXTRACT THE NUMBER AND INJECT IT DIRECTLY (Bypasses React delays!)
  const baseNumberStr = String(formattedTokenId);
  let displayBigToken = baseNumberStr;
  if (baseNumberStr.includes("-")) {
    displayBigToken = baseNumberStr.split("-")[1];
  }
  const pureNum = Number(displayBigToken.replace(/\D/g, "")) || 0;
  displayBigToken = String(pureNum);

  // Directly update the HTML text right before the screenshot
  document.getElementById("img-scan-payload").innerText =
    `Scan Payload: ${displayBigToken}`;
  document.getElementById("img-big-token").innerText = displayBigToken;
  document.getElementById("img-date").innerText =
    `JSCA SAMAN GHAR / ${new Date().getDate()} MARCH 2026`;

  try {
    // 2. Take the screenshot
    const canvas = await html2canvas(labelElement, {
      scale: 1,
      backgroundColor: "#ffffff",
      logging: false,
    });

    // 3. Convert to Data URL
    const imageDataUrl = canvas.toDataURL("image/png");

    // 4. Send to RawBT
    const link = document.createElement("a");
    link.href = `intent:${imageDataUrl}#Intent;scheme=rawbt;package=ru.a402d.rawbtprinter;end;`;
    link.click();
  } catch (err) {
    console.error("Screenshot error:", err);
    alert("Image printing failed!");
  }
};
