"use client";
import Link from "next/link";
import {
  ArrowLeftIcon,
  PrinterIcon,
  PhotoIcon,
  DocumentDuplicateIcon,
  SparklesIcon, // New icon for the hybrid print
} from "@heroicons/react/24/solid";
import { useState } from "react";
import html2canvas from "html2canvas";

export default function PreviewClient({ tokenData }) {
  const [isPrinting, setIsPrinting] = useState(false);

  if (!tokenData) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-white gap-4">
        <h1 className="text-3xl font-black text-red-500 uppercase tracking-widest">
          Token Not Found
        </h1>
        <Link
          href="/"
          className="bg-gray-800 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-gray-700 transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5" /> Back to Check-in
        </Link>
      </div>
    );
  }

  let shortToken = tokenData.display_token || tokenData.token_id;
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
  const qrData = tokenData.display_token || tokenData.token_id;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${qrData}`;
  const bags = Array.from({ length: tokenData.bag_count || 1 });

  // --- 1. RELIABLE NATIVE PRINT LOGIC ---
  const handleNativePrint = async () => {
    setIsPrinting(true);

    const SUPER_GIANT = "\x1D\x21\x55";
    const MAX_SIZE = "\x1D\x21\x33";
    const JUMBO = "\x1D\x21\x11";
    const NORMAL_SIZE = "\x1D\x21\x00\x1B\x21\x00";
    const BOLD_ON = "\x1BE\x01";
    const BOLD_OFF = "\x1BE\x00";
    const CENTER = "\x1Ba\x01";
    const FF = "\x0C";

    const BARCODE_HEIGHT = "\x1D\x68\x40";
    const BARCODE_WIDTH = "\x1D\x77\x04";
    const BARCODE_TEXT_OFF = "\x1D\x48\x00";
    const scanCodeCommand = `${BARCODE_HEIGHT}${BARCODE_WIDTH}${BARCODE_TEXT_OFF}\x1D\x6B\x04${bigToken}\x00 \n \n\n`;

    const labelsToPrint = [];

    // A. MASTER MAHATMA TOKEN
    const masterToken =
      `${CENTER}${NORMAL_SIZE}` +
      `\n DATE: ${displayDate}\n\n` +
      `${scanCodeCommand}` +
      `${MAX_SIZE}${BOLD_ON}${bigToken}${BOLD_OFF}${NORMAL_SIZE}\n\n` +
      `${BOLD_ON}${tokenData.bag_count} Bags - ${tokenData.name.toUpperCase()}${BOLD_OFF}\n\n\n` +
      `${FF}`;
    labelsToPrint.push(masterToken);

    // B. INDIVIDUAL BAG LABELS
    for (let i = 1; i <= tokenData.bag_count; i++) {
      const bagToken =
        `${CENTER} \n \n \n` +
        `${SUPER_GIANT}${BOLD_ON}${bigToken}${BOLD_OFF}${NORMAL_SIZE}\n\n\n` +
        `${JUMBO}(${i}/${tokenData.bag_count})${NORMAL_SIZE}\n\n\n` +
        `${BOLD_ON}${tokenData.mobile} (${tokenData.bag_count}B)${BOLD_OFF}\n` +
        ` \n \n` +
        `${FF}`;
      labelsToPrint.push(bagToken);
    }

    // C. SEND TO PRINTER IN CHUNKS OF 5
    const chunkSize = 5;
    for (let i = 0; i < labelsToPrint.length; i += chunkSize) {
      const chunkStr = labelsToPrint.slice(i, i + chunkSize).join("");
      const encodedData = btoa(unescape(encodeURIComponent(chunkStr)));
      const link = document.createElement("a");
      link.href = `intent:base64,${encodedData}#Intent;scheme=rawbt;package=ru.a402d.rawbtprinter;end;`;
      link.click();

      if (i + chunkSize < labelsToPrint.length) {
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }

    setIsPrinting(false);
  };

  // --- 2. IMAGE PRINT LOGIC ---
  const handleImagePrint = async () => {
    setIsPrinting(true);
    try {
      const element = document.getElementById("printable-receipt");
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
      alert("Image generation failed: " + err.message);
    } finally {
      setIsPrinting(false);
    }
  };

  // --- 3. BROWSER WINDOW PRINT ---
  const handleWindowPrint = () => {
    window.print();
  };

  // --- 4. NEW: HYBRID SVG PRINT ---
  const handleSvgPrint = async () => {
    setIsPrinting(true);
    try {
      // STEP 1: NATIVE MASTER TOKEN
      const NORMAL_SIZE = "\x1D\x21\x00\x1B\x21\x00";
      const MAX_SIZE = "\x1D\x21\x33";
      const BOLD_ON = "\x1BE\x01";
      const BOLD_OFF = "\x1BE\x00";
      const CENTER = "\x1Ba\x01";
      const FF = "\x0C";
      const BARCODE_HEIGHT = "\x1D\x68\x40";
      const BARCODE_WIDTH = "\x1D\x77\x04";
      const BARCODE_TEXT_OFF = "\x1D\x48\x00";

      const scanCodeCommand = `${BARCODE_HEIGHT}${BARCODE_WIDTH}${BARCODE_TEXT_OFF}\x1D\x6B\x04${bigToken}\x00 \n \n\n`;

      const masterTokenStr =
        `${CENTER}${NORMAL_SIZE}` +
        `\n DATE: ${displayDate}\n\n` +
        `${scanCodeCommand}` +
        `${MAX_SIZE}${BOLD_ON}${bigToken}${BOLD_OFF}${NORMAL_SIZE}\n\n` +
        `${BOLD_ON}${tokenData.bag_count} Bags - ${tokenData.name.toUpperCase()}${BOLD_OFF}\n\n\n\n\n` +
        `${FF}`;

      const encodedData = btoa(unescape(encodeURIComponent(masterTokenStr)));
      const nativeLink = document.createElement("a");
      nativeLink.href = `intent:base64,${encodedData}#Intent;scheme=rawbt;package=ru.a402d.rawbtprinter;end;`;
      nativeLink.click();

      // STEP 2: PAUSE 3 SECONDS FOR MASTER TO PRINT
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // STEP 3: SCREENSHOT AND PRINT ALL BAG SVG TOKENS
      const element = document.getElementById("svg-bag-receipts");
      if (element) {
        const canvas = await html2canvas(element, {
          scale: 2,
          backgroundColor: "#ffffff",
          useCORS: true,
        });
        const imageDataUrl = canvas.toDataURL("image/png");
        const imgLink = document.createElement("a");
        imgLink.href = `intent:${imageDataUrl}#Intent;scheme=rawbt;package=ru.a402d.rawbtprinter;end;`;
        imgLink.click();
      }
    } catch (err) {
      alert("Hybrid SVG print failed: " + err.message);
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 p-4 md:p-8 flex flex-col items-center">
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media print {
          @page { size: 75mm 50mm; margin: 0; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white; margin: 0; padding: 0; }
          .page-break { page-break-after: always; break-after: page; }
          .print-container { width: 75mm !important; max-width: 75mm !important; }
          .print-box { width: 75mm !important; height: 50mm !important; border: none !important; }
        }
      `,
        }}
      />

      {/* --- CONTROLS --- */}
      <div className="w-full max-w-sm flex flex-col gap-3 mb-8 shrink-0 print:hidden">
        {/* NEW BUTTON: SVG HYBRID PRINT (Prominent) */}
        <button
          onClick={handleSvgPrint}
          disabled={isPrinting}
          className={`w-full text-white p-5 rounded-xl font-black flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(59,130,246,0.4)] active:scale-95 transition-transform ${isPrinting ? "bg-blue-800 cursor-wait" : "bg-blue-600 hover:bg-blue-500 border-2 border-blue-400"}`}
        >
          <SparklesIcon className="h-7 w-7 text-yellow-300" />
          {isPrinting ? "PRINTING SEQUENCE..." : "SVG PRINT (BEST)"}
        </button>

        {/* Top Row: Back & Native Print */}
        <div className="flex justify-between gap-3 w-full mt-2">
          <Link
            href="/"
            className="flex-1 bg-gray-800 text-white p-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-700 transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5" /> Back
          </Link>

          <button
            onClick={handleNativePrint}
            disabled={isPrinting}
            className={`flex-[2] text-white p-4 rounded-xl font-black flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform ${isPrinting ? "bg-green-800 cursor-wait" : "bg-green-600 hover:bg-green-500"}`}
          >
            <PrinterIcon className="h-6 w-6" /> NATIVE PRINT
          </button>
        </div>

        {/* Middle Row: Window Print */}
        <button
          onClick={handleWindowPrint}
          disabled={isPrinting}
          className="w-full bg-purple-600 hover:bg-purple-500 text-white p-4 rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-lg"
        >
          <DocumentDuplicateIcon className="h-5 w-5" /> BROWSER WINDOW PRINT
        </button>

        {/* Bottom Row: Image Print */}
        <button
          onClick={handleImagePrint}
          disabled={isPrinting}
          className={`w-full text-white p-4 rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform ${isPrinting ? "bg-gray-700 cursor-wait" : "bg-gray-800 border border-gray-600 hover:bg-gray-700"}`}
        >
          <PhotoIcon className="h-5 w-5 text-gray-400" />{" "}
          {isPrinting ? "PROCESSING..." : "TEST IMAGE PRINT (FULL)"}
        </button>
      </div>

      {/* --- PRINTABLE RECEIPT AREA --- */}
      <div className="w-full overflow-x-auto flex flex-col items-center pb-12 print:pb-0">
        <div
          id="printable-receipt"
          className="bg-[#ffffff] flex flex-col w-[576px] shrink-0 shadow-2xl rounded-sm print:shadow-none print-container"
        >
          {/* MASTER MAHATMA TOKEN (Kept 576px wide for Native reference) */}
          <div className="flex flex-col items-center justify-between font-sans w-[576px] h-[384px] p-4 border-b-4 border-dashed border-[#cccccc] overflow-hidden relative box-border page-break print-box">
            <div className="text-xl font-black uppercase tracking-widest mt-2 text-[#000000]">
              {displayDate}
            </div>

            <img
              src={qrImageUrl}
              crossOrigin="anonymous"
              alt="QR Code"
              className="w-32 h-32 object-contain my-2"
            />

            <div className="text-[130px] font-black leading-none tracking-tighter text-[#000000]">
              {pureNum}
            </div>

            <div className="w-full text-center text-2xl font-black uppercase truncate px-4 mb-2 text-[#000000]">
              {tokenData.bag_count} BAGS - {tokenData.name}
            </div>
          </div>
        </div>

        {/* --- THE SVG BAG TOKENS (LAYOUT E) --- */}
        {/* We separate this into its own div block so html2canvas only grabs the bags! */}
        <div
          id="svg-bag-receipts"
          className="flex flex-col mt-4 shadow-2xl print:shadow-none"
        >
          {bags.map((_, index) => (
            <div
              key={`bag-${index}`}
              className="bg-[#ffffff] flex flex-col font-sans w-[800px] h-[850px] box-border relative overflow-hidden text-[#000000] page-break print-box"
            >
              {/* Actual Label Content Area (Top 550px) */}
              <div className="w-full h-[550px] flex flex-col items-center justify-center p-8 border-b-4 border-dashed border-[#cccccc]">
                <div className="text-center text-5xl font-black uppercase">
                  {index + 1} / {tokenData.bag_count}
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
                  {tokenData.mobile} ({tokenData.bag_count}B)
                </div>
              </div>

              {/* THE PAPER FEED HACK (Bottom 300px) */}
              <div className="w-full h-[300px] bg-[#ffffff] flex items-end justify-center pb-2">
                <span style={{ color: "#cccccc" }} className="text-xs">
                  .
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
