"use client";
import { useState } from "react";
import html2canvas from "html2canvas";
import Link from "next/link";
import {
  ArrowLeftIcon,
  PrinterIcon,
  PhotoIcon,
} from "@heroicons/react/24/solid";

export default function TestPrintLab() {
  const [isPrinting, setIsPrinting] = useState(false);

  const pureNum = "209";
  const bagCount = 2;
  const mobile = "9876543210";

  // ==========================================
  // 1. NATIVE PRINT LAB (Added 8 Extra Lines)
  // ==========================================
  const handleNativePrint = (hexSizeCode) => {
    const NORMAL_SIZE = "\x1D\x21\x00\x1B\x21\x00";
    const BOLD_ON = "\x1BE\x01";
    const BOLD_OFF = "\x1BE\x00";
    const CENTER = "\x1Ba\x01";
    const FF = "\x0C";

    let fullPrint =
      `${CENTER} \n \n` +
      `${hexSizeCode}${BOLD_ON}${pureNum}${BOLD_OFF}${NORMAL_SIZE}\n\n` +
      `\x1D\x21\x11(1/${bagCount})${NORMAL_SIZE}\n\n` +
      `${BOLD_ON}${mobile} (${bagCount}B)${BOLD_OFF}\n` +
      ` \n \n \n \n \n \n \n \n` + // <--- 8 LINES FOR MAXIMUM FEED
      `${FF}`;

    const encodedData = btoa(unescape(encodeURIComponent(fullPrint)));
    const link = document.createElement("a");
    link.href = `intent:base64,${encodedData}#Intent;scheme=rawbt;package=ru.a402d.rawbtprinter;end;`;
    link.click();
  };

  // ==========================================
  // 2. IMAGE PRINT LAB
  // ==========================================
  const handleImagePrint = async (divId) => {
    setIsPrinting(true);
    try {
      const element = document.getElementById(divId);
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
      });
      const imageDataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = `intent:${imageDataUrl}#Intent;scheme=rawbt;package=ru.a402d.rawbtprinter;end;`;
      link.click();
    } catch (err) {
      alert("Print failed: " + err.message);
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 p-4 pb-20 font-sans text-white">
      <div className="max-w-2xl mx-auto no-print">
        <div className="flex items-center gap-4 mb-8 border-b border-gray-700 pb-4">
          <Link
            href="/"
            className="bg-gray-800 p-2 rounded-lg hover:bg-gray-700"
          >
            <ArrowLeftIcon className="h-6 w-6" />
          </Link>
          <h1 className="text-2xl font-black uppercase tracking-widest text-blue-400">
            Print Sizing Lab
          </h1>
        </div>

        {/* --- NATIVE PRINTING --- */}
        <div className="bg-gray-800 p-4 rounded-2xl mb-8 border border-gray-700">
          <h2 className="text-lg font-black uppercase text-gray-400 mb-4">
            1. Native Print (With Massive Feed)
          </h2>
          <button
            onClick={() => handleNativePrint("\x1D\x21\x77")}
            className="w-full bg-green-600 hover:bg-green-500 p-4 rounded-xl font-black shadow-lg flex justify-center items-center gap-2"
          >
            <PrinterIcon className="h-6 w-6" /> TEST NATIVE + 8-LINE FEED
          </button>
        </div>

        {/* --- IMAGE PRINTING --- */}
        <div className="bg-gray-800 p-4 rounded-2xl mb-8 border border-gray-700">
          <h2 className="text-lg font-black uppercase text-gray-400 mb-4">
            2. Image Print Tests
          </h2>

          <div className="space-y-8">
            {/* LAYOUT E: The Overscale Trick */}
            {/* LAYOUT E: The Overscale Trick */}
            {/* LAYOUT E: The Overscale Trick (Tuned) */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-yellow-400">
                  Layout E: Overscaled 800x800 (Top Space + More Scroll)
                </span>
                <button
                  onClick={() => handleImagePrint("layout-e")}
                  className="bg-green-600 px-4 py-2 rounded-lg font-black text-sm flex items-center gap-2 border border-green-400 shadow-[0_0_15px_rgba(34,197,94,0.4)]"
                >
                  <PhotoIcon className="h-4 w-4" /> RAWBT E
                </button>
              </div>

              <div className="overflow-x-auto bg-[#111827] p-4 rounded-xl">
                {/* Total height reduced to 850px to pull back exactly 1 line! */}
                <div
                  id="layout-e"
                  className="bg-[#ffffff] flex flex-col font-sans w-[800px] h-[850px] box-border relative overflow-hidden text-[#000000]"
                >
                  {/* Actual Label Content Area (Top 550px) */}
                  <div className="w-full h-[550px] flex flex-col items-center justify-center p-8 border-b-4 border-dashed border-[#cccccc]">
                    <div className="text-center text-5xl font-black uppercase">
                      1 / {bagCount}
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
                      {mobile} ({bagCount}B)
                    </div>
                  </div>

                  {/* THE PAPER FEED HACK (Reduced to 300px to stay safely inside the current label) */}
                  <div className="w-full h-[300px] bg-[#ffffff] flex items-end justify-center pb-2">
                    <span style={{ color: "#cccccc" }} className="text-xs">
                      .
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
