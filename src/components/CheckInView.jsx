"use client";
import { useState } from "react";
import { PlusIcon, MinusIcon, PrinterIcon } from "@heroicons/react/24/solid";

export default function CheckInView() {
  const [mobile, setMobile] = useState("");
  const [name, setName] = useState("");
  const [bagCount, setBagCount] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const handleCheckIn = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile, name, bagCount }),
      });

      const data = await res.json();

      if (data.success) {
        // --- START PRINTING ---
        printTokens(data.tokenId, name, mobile, bagCount);
        // --- END PRINTING ---

        setName("");
        setMobile("");
        setBagCount(1);
      }
    } catch (err) {
      alert("Check connection.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 max-w-md mx-auto border border-gray-100">
      <h2 className="text-2xl font-black text-gray-800 mb-6 text-center text-blue-800">
        New Check-In
      </h2>

      <form onSubmit={handleCheckIn} className="space-y-5">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2 text-center">
            Bag Count
          </label>
          <div className="flex items-center justify-between border-2 border-gray-200 bg-gray-50 rounded-xl p-2">
            <button
              type="button"
              onClick={() => setBagCount(Math.max(1, bagCount - 1))}
              className="bg-white shadow-sm border border-gray-200 p-4 rounded-lg text-gray-700 active:bg-gray-100"
            >
              <MinusIcon className="h-7 w-7" />
            </button>

            <input
              type="number"
              inputMode="numeric"
              pattern="[0-9]*"
              value={bagCount}
              // This is the magic line: it selects the number on tap
              onFocus={(e) => e.target.select()}
              onClick={(e) => e.target.select()}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                // If the box is empty (user deleted everything), set it to empty string
                // or 0 so they can type a fresh number easily
                setBagCount(isNaN(val) ? "" : val);
              }}
              // Ensure that if they leave the box empty, it resets to at least 1
              onBlur={() => {
                if (bagCount === "" || bagCount < 1) setBagCount(1);
              }}
              className="w-full text-center text-4xl font-black bg-transparent text-gray-900 focus:outline-none"
            />

            <button
              type="button"
              onClick={() => setBagCount(bagCount + 1)}
              className="bg-blue-100 shadow-sm border border-blue-200 p-4 rounded-lg text-blue-700 active:bg-blue-200"
            >
              <PlusIcon className="h-7 w-7" />
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2 text-center">
            Mahatma Mobile
          </label>
          <input
            type="text"
            inputMode="numeric" // Triggers the number pad on mobile phones
            pattern="[0-9]*" // Extra hint for browsers
            value={mobile}
            onChange={(e) => {
              // This regex removes any character that is NOT a number
              const onlyNums = e.target.value.replace(/[^0-9]/g, "");
              // Limit to 10 digits if needed
              if (onlyNums.length <= 10) {
                setMobile(onlyNums);
              }
            }}
            placeholder="Enter 10-digit Mobile"
            className="w-full p-4 bg-white border-2 border-gray-200 rounded-xl text-xl font-bold text-center text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2 text-center">
            Mahatma Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name"
            className="w-full p-4 bg-white border-2 border-gray-200 rounded-xl text-xl font-bold text-center text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none"
            required
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full mt-4 p-5 rounded-xl text-xl font-bold text-white flex items-center justify-center space-x-2 transition-all shadow-md
            ${isLoading ? "bg-gray-400" : "bg-green-600 active:scale-[0.98]"}
          `}
        >
          <PrinterIcon className="h-7 w-7" />
          <span>
            {isLoading ? "Saving..." : `Save & Print (${bagCount + 1} Tags)`}
          </span>
        </button>
      </form>
    </div>
  );
}

const printTokens = (tokenId, name, mobile, bagCount) => {
  const ESC = "\x1B";
  const GS = "\x1D";
  const CENTER = ESC + "\x61\x01";
  const LEFT = ESC + "\x61\x00";
  const BOLD_ON = ESC + "\x45\x01";
  const BOLD_OFF = ESC + "\x45\x00";
  const JUMBO = ESC + "\x21\x30"; // Double height + Double width
  const NORMAL = ESC + "\x21\x00";
  const FEED = "\n\n\n";

  // 1. MAHATMA MASTER LABEL
  let mahatmaTag = `
${CENTER}${BOLD_ON}PUNE SEVA CLOAKROOM${BOLD_OFF}
--------------------------------
${CENTER}MAHATMA COPY
${JUMBO}${tokenId}${NORMAL}
--------------------------------
${LEFT}NAME: ${name.toUpperCase()}
MOBILE: ${mobile}
TOTAL BAGS: ${bagCount}
TIME: ${new Date().toLocaleTimeString()}
--------------------------------
${CENTER}Please show this for pickup
${FEED}`;

  // 2. INDIVIDUAL BAG LABELS
  let bagTags = "";
  for (let i = 1; i <= bagCount; i++) {
    bagTags += `
${CENTER}${BOLD_ON}BAG TAG${BOLD_OFF}
${JUMBO}${tokenId}${NORMAL}
--------------------------------
${CENTER}BAG: ${i} OF ${bagCount}
--------------------------------
${FEED}`;
  }

  const fullPrint = mahatmaTag + bagTags;

  // Encode and send to RawBT
  const encodedData = btoa(unescape(encodeURIComponent(fullPrint)));
  window.location.href = `intent:base64,${encodedData}#Intent;scheme=rawbt;package=ru.a402d.rawbtprinter;end;`;
};

// const printTokens = (tokenId, name, mobile, bagCount) => {
//   // 1. Format the Mahatma Tag (The Master Receipt)
//   let printData = `
// --------------------------------
//       PUNE SEVA CLOAKROOM
// --------------------------------
// TOKEN ID: ${tokenId}
// NAME: ${name}
// MOBILE: ${mobile}
// TOTAL BAGS: ${bagCount}
// DATE: ${new Date().toLocaleDateString()}
// --------------------------------
//   PLEASE KEEP THIS TAG SAFE
// --------------------------------
// \n\n\n`;

//   // 2. Format the Bag Tags (One for each bag)
//   for (let i = 1; i <= bagCount; i++) {
//     printData += `
// --------------------------------
//     BAG TAG: ${i} / ${bagCount}
// --------------------------------
//       TOKEN: ${tokenId}
// --------------------------------
// \n\n\n`;
//   }

//   // 3. Send to RawBT Android App via Intent
//   const encodedData = encodeURIComponent(printData);
//   window.location.href = `intent:${encodedData}#Intent;scheme=rawbt;package=ru.a402d.rawbtprinter;end;`;
// };
