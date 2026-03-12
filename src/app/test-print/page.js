"use client";
import { useState } from "react";
import html2canvas from "html2canvas";
import Link from "next/link";
import {
  ArrowLeftIcon,
  PrinterIcon,
  PhotoIcon,
  DocumentDuplicateIcon,
} from "@heroicons/react/24/solid";

export default function TestPrintLab() {
  const [isPrinting, setIsPrinting] = useState(false);

  const pureNum = "93";
  const bagCount = 2;
  const mobile = "9876543210";

  // ==========================================
  // 1. NATIVE PRINT LAB (Added Extra Feed)
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
      ` \n \n \n \n \n` + // <--- ADDED 3 EXTRA LINE FEEDS HERE TO PUSH THE PAPER OUT
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
            1. Native Print (With Extra Feed)
          </h2>
          <button
            onClick={() => handleNativePrint("\x1D\x21\x77")}
            className="w-full bg-green-600 hover:bg-green-500 p-4 rounded-xl font-black shadow-lg flex justify-center items-center gap-2"
          >
            <PrinterIcon className="h-6 w-6" /> TEST NATIVE + EXTRA PAPER FEED
          </button>
        </div>

        {/* --- IMAGE PRINTING --- */}
        <div className="bg-gray-800 p-4 rounded-2xl mb-8 border border-gray-700">
          <h2 className="text-lg font-black uppercase text-gray-400 mb-4">
            2. Image Print Tests
          </h2>

          <div className="space-y-8">
            {/* LAYOUT D: Centered & Padded */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-yellow-400">
                  Layout D: Centered + Bottom Feed
                </span>
                <button
                  onClick={() => handleImagePrint("layout-d")}
                  className="bg-green-600 px-4 py-2 rounded-lg font-black text-sm flex items-center gap-2 border border-green-400 shadow-[0_0_15px_rgba(34,197,94,0.4)]"
                >
                  <PhotoIcon className="h-4 w-4" /> RAWBT D
                </button>
              </div>
              <p className="text-xs text-gray-400 mb-2">
                Notice the extra white space at the bottom to force the printer
                to roll further.
              </p>

              <div className="overflow-x-auto bg-gray-950 p-4 rounded-xl">
                {/* Increased height to 400px and added pb-8 to push everything up slightly and leave a blank tail */}
                <div
                  id="layout-d"
                  className="bg-[#ffffff] flex flex-col items-center justify-center font-sans w-[576px] h-[400px] pt-4 pb-12 border-4 border-[#000000] box-border relative"
                >
                  <div className="text-center text-4xl font-black uppercase text-[#000000] mt-4">
                    1 / {bagCount}
                  </div>

                  {/* SVG perfectly centered using dominantBaseline="middle" */}
                  <div className="flex-grow flex items-center justify-center w-full overflow-hidden my-2">
                    <svg viewBox="0 0 100 60" className="w-full h-full">
                      <text
                        x="50"
                        y="30"
                        textAnchor="middle"
                        fontSize="55"
                        fontWeight="900"
                        fill="#000000"
                        dominantBaseline="middle"
                      >
                        {pureNum}
                      </text>
                    </svg>
                  </div>

                  <div className="text-center text-2xl font-black uppercase tracking-widest text-[#000000]">
                    {mobile} ({bagCount}B)
                  </div>

                  {/* Invisible block to enforce bottom padding for the gap sensor */}
                  <div className="h-8 w-full bg-transparent"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
