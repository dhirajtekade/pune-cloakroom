"use client";
import { useState } from "react";
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
        // Trigger Printer (Only works on Android with RawBT)
        // try {
        //   printTokens(data.tokenId, name, mobile, city, bagCount, data.mode);
        // } catch (err) {
        //   console.log("Printing skipped: Likely on Desktop");
        // }

        try {
          printTokens(data.tokenId, name, mobile, city, bagCount, data.mode);
        } catch (err) {
          console.log("Printing skipped");
        }

        setSuccessData({
          tokenId: data.tokenId,
          name: name, // Make sure this isn't empty
          mobile: mobile, // Make sure this isn't empty
          bagCount: bagCount,
        });

        setSuccessData({ tokenId: data.tokenId, name, mobile, bagCount });
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

    // ADD THIS LINE: Calculate the token format the backend expects
    const dateCode = new Date().getDate();
    const displayToken = `${dateCode}-${String(successData.tokenId).padStart(4, "0")}`;

    try {
      const res = await fetch("/api/checkin/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mobile: successData.mobile,
          tokenId: displayToken, // SEND displayToken INSTEAD of the raw ID
          name: successData.name,
          bagCount: successData.bagCount,
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert("SMS Sent Successfully!");
      } else {
        // This is where you were seeing "displayToken is not defined"
        // because the API was crashing.
        alert("Failed to send: " + data.error);
      }
    } catch (err) {
      alert("Check connection.");
    } finally {
      setIsResending(false);
    }
  };

  //whatasapp share
  const shareToWhatsApp = () => {
    if (!successData) return;

    const dateCode = new Date().getDate();
    const displayToken = `${dateCode}-${String(successData.tokenId).padStart(4, "0")}`;

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
    const displayToken = `${dateCode}-${String(successData.tokenId).padStart(4, "0")}`;

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
            {isResending ? "SENDING..." : "RESEND SMS"}
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

  return (
    <div className="bg-gray-900 rounded-2xl shadow-2xl p-6 max-w-md mx-auto border border-gray-800">
      <h2 className="text-2xl font-black mb-6 text-center text-blue-400 uppercase tracking-tight">
        Pune Cloakroom 2.10
      </h2>

      <form onSubmit={handleCheckIn} className="space-y-4">
        <div className="flex items-center justify-between border-2 border-gray-700 bg-gray-800 rounded-xl p-2">
          <button
            type="button"
            onClick={() => setBagCount(Math.max(1, bagCount - 1))}
            className="bg-gray-700 p-4 rounded-lg text-white"
          >
            <MinusIcon className="h-7 w-7" />
          </button>
          <input
            type="number"
            value={bagCount}
            readOnly
            className="w-full text-center text-4xl font-black bg-transparent text-white focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setBagCount(bagCount + 1)}
            className="bg-blue-600 p-4 rounded-lg text-white"
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
    </div>
  );
}

// Ensure printTokens is defined globally or inside the same file
const printTokens = (
  startTokenId,
  name,
  mobile,
  city,
  bagCount,
  mode = "PER_MAHATMA",
  printBagLabels = true,
  enablePageCut = false,
) => {
  // --- PERFECT PROPORTIONAL SIZES ---
  const MAX_SIZE = "\x1D\x21\x33"; // 4x Width & 4x Height (Massive & Square)
  const JUMBO = "\x1D\x21\x11"; // 2x Width & 2x Height (Safe)
  const NORMAL_SIZE = "\x1D\x21\x00\x1B\x21\x00";

  const BOLD_ON = "\x1BE\x01";
  const BOLD_OFF = "\x1BE\x00";
  const CENTER = "\x1Ba\x01";
  const FF = "\x0C";
  const CUT = enablePageCut ? "\x1D\x56\x00" : "";

  // --- SAFE BARCODE COMMANDS ---
  const BARCODE_HEIGHT = "\x1D\x68\x40";
  const BARCODE_WIDTH = "\x1D\x77\x04";
  const BARCODE_TEXT_OFF = "\x1D\x48\x00";

  const todayDate = new Date().getDate();
  let fullPrint = "";

  const firstTokenNum = Number(startTokenId);
  const cleanToken = String(firstTokenNum).padStart(4, "0");
  const bigToken = String(firstTokenNum);

  const safeBarcode = `${BARCODE_HEIGHT}${BARCODE_WIDTH}${BARCODE_TEXT_OFF}\x1D\x6B\x04${cleanToken}\x00`;

  if (mode === "PER_MAHATMA") {
    // --- A. MASTER MAHATMA TOKEN ---
    fullPrint +=
      `${CENTER}${NORMAL_SIZE}Pune Cloakroom 2026\n` +
      `DATE: ${todayDate} MARCH 2026\n` +
      `--------------------------------\n` +
      `${safeBarcode}\n` +
      `${MAX_SIZE}${BOLD_ON}${bigToken}${BOLD_OFF}${NORMAL_SIZE}\n\n` +
      `${BOLD_ON}${bagCount} Bags - ${name.toUpperCase()}${BOLD_OFF}\n` +
      `--------------------------------\n` +
      `Keep token safe!\n` +
      `${FF}${CUT}`;

    // --- B. INDIVIDUAL BAG LABELS ---
    if (printBagLabels) {
      for (let i = 1; i <= bagCount; i++) {
        fullPrint +=
          // Using " \n" (Space + Newline) forces the printer to roll the paper!
          `${CENTER} \n \n \n` +
          `${MAX_SIZE}${BOLD_ON}${bigToken}${BOLD_OFF}${NORMAL_SIZE}\n\n` +
          `${JUMBO}(${i}/${bagCount})${NORMAL_SIZE}\n\n` +
          `${BOLD_ON}${mobile} (${bagCount}B)${BOLD_OFF}\n` +
          ` \n \n` + // Forced bottom margin to trigger gap sensor perfectly
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
        otherTokens.push(String(firstTokenNum + i).padStart(4, "0"));
      }
      otherTokensStr = `& ${otherTokens.join(",")}\n`;
    }

    fullPrint +=
      `${CENTER}${BOLD_ON}Pune Cloakroom 2026${BOLD_OFF}\n` +
      `DATE: ${todayDate} MARCH 2026\n` +
      `--------------------------------\n` +
      `${safeBarcode}\n` +
      `${MAX_SIZE}${BOLD_ON}${bigToken}${BOLD_OFF}${NORMAL_SIZE}\n` +
      `${otherTokensStr}` +
      `${BOLD_ON}${bagCount} Bags - ${name.toUpperCase()}${BOLD_OFF}\n` +
      `--------------------------------\n` +
      `Keep token safe!\n${FF}`;

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
