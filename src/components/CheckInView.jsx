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
        // Trigger the updated label printing
        printTokens(data.tokenId, name, mobile, bagCount);

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
        New Check-In 1.0
      </h2>

      <form onSubmit={handleCheckIn} className="space-y-5">
        <div>
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
              onFocus={(e) => e.target.select()}
              onClick={(e) => e.target.select()}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                setBagCount(isNaN(val) ? "" : val);
              }}
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
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={mobile}
            onChange={(e) => {
              const onlyNums = e.target.value.replace(/[^0-9]/g, "");
              if (onlyNums.length <= 10) setMobile(onlyNums);
            }}
            placeholder="Enter 10-digit Mobile"
            className="w-full p-4 bg-white border-2 border-gray-200 rounded-xl text-xl font-bold text-center text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none"
            required
          />
        </div>

        <div>
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
  const today = new Date().getDate();

  // Format token to 4 digits (e.g., 0025)
  const token4Digit = tokenId.toString().padStart(4, "0");
  // const aliasQR = `pune26-13-${token4Digit}`;
  const aliasQR = `pune26-${today}-${token4Digit}`;

  // HTML Content for the 3x2 inch labels (76mm x 50mm)
  const printHTML = `
    <div style="width: 76mm; font-family: sans-serif; text-align: center;">
      
      <div style="height: 48mm; padding: 2mm; box-sizing: border-box; overflow: hidden; page-break-after: always;">
        <h3 style="margin: 0; font-size: 14px;">SAMANGHAR PUNE 2026</h3>
        <img src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${aliasQR}" 
             style="width: 28mm; height: 28mm; margin: 1mm 0;" />
        <div style="display: flex; justify-content: space-around; align-items: center; font-weight: 900; font-size: 18px;">
          <span>TOKEN: ${tokenId}</span>
          <span>BAGS: ${bagCount}</span>
        </div>
        <div style="font-size: 10px; margin-top: 1mm;">${name.toUpperCase()}</div>
      </div>

      ${Array.from({ length: bagCount })
        .map(
          (_, i) => `
        <div style="height: 48mm; padding: 2mm; box-sizing: border-box; overflow: hidden; page-break-after: always; display: flex; flex-direction: column; justify-content: center;">
          <div style="font-size: 85px; font-weight: 900; margin: 0; line-height: 1;">
            ${tokenId} <span style="font-size: 30px;">(${i + 1}/${bagCount})</span>
          </div>
          <div style="font-size: 16px; font-weight: bold; margin-top: 5px; text-transform: uppercase;">
             ${name}
          </div>
          <div style="font-size: 10px; border-top: 1px solid black; margin-top: 5px; padding-top: 2px;">
            KEEP WITH LUGGAGE
          </div>
        </div>
      `,
        )
        .join("")}
    </div>
  `;

  // Base64 encode the HTML
  const encodedData = btoa(unescape(encodeURIComponent(printHTML)));

  // Send via Intent using content-type=text/html to trigger RawBT's silent rendering
  window.location.href = `intent:#Intent;content-type=text/html;base64,${encodedData};scheme=rawbt;end;`;
};
