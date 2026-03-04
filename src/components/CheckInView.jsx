"use client";
import { useState } from "react";
import { PlusIcon, MinusIcon, PrinterIcon } from "@heroicons/react/24/solid";

export default function CheckInView() {
  const [mobile, setMobile] = useState("");
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [bagCount, setBagCount] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const handleCheckIn = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile, name, city: city || "N/A", bagCount }), // Fallback for DB
      });

      const data = await res.json();

      if (data.success) {
        printTokens(data.tokenId, name, mobile, city, bagCount);
        setName("");
        setMobile("");
        setCity("");
        setBagCount(1);
      }
    } catch (err) {
      alert("Check connection.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-900 rounded-2xl shadow-2xl p-6 max-w-md mx-auto border border-gray-800">
      <h2 className="text-2xl font-black mb-6 text-center text-blue-400 uppercase tracking-tight">
        Pune Cloakroom 2.0
      </h2>

      <form onSubmit={handleCheckIn} className="space-y-4">
        {/* Bag Counter Section */}
        <div className="flex items-center justify-between border-2 border-gray-700 bg-gray-800 rounded-xl p-2">
          <button
            type="button"
            onClick={() => setBagCount(Math.max(1, bagCount - 1))}
            className="bg-gray-700 shadow-sm border border-gray-600 p-4 rounded-lg text-white active:bg-gray-600"
          >
            <MinusIcon className="h-7 w-7" />
          </button>

          <input
            type="number"
            inputMode="numeric"
            pattern="[0-9]*"
            value={bagCount}
            onFocus={(e) => e.target.select()}
            onClick={(e) => e.target.select()}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              setBagCount(isNaN(val) ? "" : val);
            }}
            onBlur={() => {
              if (bagCount === "" || bagCount < 1) setBagCount(1);
            }}
            className="w-full text-center text-4xl font-black bg-transparent text-white focus:outline-none"
          />

          <button
            type="button"
            onClick={() => setBagCount(bagCount + 1)}
            className="bg-blue-600 shadow-sm border border-blue-500 p-4 rounded-lg text-white active:bg-blue-500"
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
            className="w-full p-4 bg-black border-2 border-gray-700 rounded-xl text-xl font-bold text-center text-white placeholder:text-gray-500 focus:border-blue-500 outline-none transition-colors"
            required
          />

          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Mahatma Name"
            className="w-full p-4 bg-black border-2 border-gray-700 rounded-xl text-xl font-bold text-center text-white placeholder:text-gray-500 focus:border-blue-500 outline-none transition-colors"
            required
          />

          {/* City Field: REMOVED 'required' */}
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="City / Village (Optional)"
            className="w-full p-4 bg-black border-2 border-gray-700 rounded-xl text-xl font-bold text-center text-white placeholder:text-gray-500 focus:border-blue-500 outline-none transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full mt-4 p-5 rounded-xl text-xl font-bold text-white flex items-center justify-center space-x-2 shadow-lg ${
            isLoading
              ? "bg-gray-400"
              : "bg-green-600 hover:bg-green-500 active:scale-95 transition-all"
          }`}
        >
          <PrinterIcon className="h-7 w-7" />
          <span>
            {isLoading ? "Saving..." : `Print ${bagCount + 1} Labels`}
          </span>
        </button>
      </form>
    </div>
  );
}

const printTokens = (
  startTokenId,
  name,
  mobile,
  city,
  bagCount,
  mode = "PER_MAHATMA",
) => {
  const JUMBO = "\x1B\x21\x30";
  const NORMAL = "\x1B\x21\x00";
  const FF = "\x0C";
  let fullPrint = "";

  for (let i = 0; i < bagCount; i++) {
    // DYNAMIC CALCULATION:
    // If PER_BAG, add 'i' to the ID. If PER_MAHATMA, keep ID same.
    let currentToken =
      mode === "PER_BAG" ? Number(startTokenId) + i : startTokenId;
    let subtitle =
      mode === "PER_BAG"
        ? `BAG ${i + 1} OF ${bagCount}`
        : `TAG ${i + 1}/${bagCount}`;

    fullPrint +=
      `\x1Ba\x01\x1BE\x01PUNE CLOAKROOM 2026\x1BE\x00\n` +
      `--------------------------------\n` +
      `${JUMBO}TOKEN: ${currentToken}${NORMAL}\n` +
      `--------------------------------\n` +
      `${subtitle}\n` +
      `${name.toUpperCase()}\n` +
      `${city ? city.toUpperCase() : ""}\n` +
      `KEEP WITH LUGGAGE\n` +
      FF;
  }

  const encodedData = btoa(unescape(encodeURIComponent(fullPrint)));
  window.location.href = `intent:base64,${encodedData}#Intent;scheme=rawbt;package=ru.a402d.rawbtprinter;end;`;
};

const printTokens2 = (tokenId, name, mobile, bagCount) => {
  const today = new Date().getDate();
  const token4Digit = tokenId.toString().padStart(4, "0");
  const aliasQR = `pune26-${today}-${token4Digit}`;

  // ESC/POS Commands (Hardware native language)
  const ESC = "\x1B";
  const GS = "\x1D";
  const CENTER = ESC + "\x61\x01";
  const LEFT = ESC + "\x61\x00";
  const BOLD_ON = ESC + "\x45\x01";
  const BOLD_OFF = ESC + "\x45\x00";
  const JUMBO = ESC + "\x21\x30"; // Double Height + Double Width
  const NORMAL = ESC + "\x21\x00";
  const FF = "\x0C"; // Form Feed triggers your gap sensor

  // 1. MAHATMA MASTER LABEL
  let mahatmaTag =
    `${CENTER}${BOLD_ON}SAMANGHAR PUNE 2026${BOLD_OFF}\n` +
    `--------------------------------\n` +
    `QR: ${aliasQR}\n` + // Text version for safety
    `${JUMBO}TOKEN: ${tokenId}${NORMAL}\n` +
    `BAGS: ${bagCount}\n` +
    `NAME: ${name.toUpperCase()}\n` +
    `--------------------------------\n` +
    FF;

  // 2. INDIVIDUAL BAG LABELS
  let bagTags = "";
  for (let i = 1; i <= bagCount; i++) {
    bagTags +=
      `${CENTER}${BOLD_ON}BAG TAG${BOLD_OFF}\n` +
      `${JUMBO}${tokenId}${NORMAL}\n` +
      `--------------------------------\n` +
      `BAG: ${i} OF ${bagCount}\n` +
      `${name.toUpperCase()}\n` +
      FF;
  }

  const fullPrint = mahatmaTag + bagTags;

  // Use the exact Intent format from your "Working" code
  const encodedData = btoa(unescape(encodeURIComponent(fullPrint)));
  window.location.href = `intent:base64,${encodedData}#Intent;scheme=rawbt;package=ru.a402d.rawbtprinter;end;`;
};
