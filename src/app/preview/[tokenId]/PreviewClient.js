"use client";
import Link from "next/link";
import {
  ArrowLeftIcon,
  PrinterIcon,
  PhotoIcon,
  DocumentDuplicateIcon,
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

  // --- 1. RELIABLE NATIVE PRINT LOGIC (WITH 5 SEC PAUSE) ---
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

  return (
    <div className="min-h-screen bg-gray-900 p-4 md:p-8 flex flex-col items-center">
      {/* --- CRITICAL: PRINTER DIMENSION SETTINGS FOR WINDOW PRINT --- */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media print {
          @page { size: 75mm 50mm; margin: 0; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white; margin: 0; padding: 0; }
          .page-break { page-break-after: always; break-after: page; }
          
          /* This tells the browser to automatically scale the 576px box to fit the 75mm page */
          .print-container { 
            width: 75mm !important; 
            max-width: 75mm !important; 
          }
          .print-box {
            width: 75mm !important;
            height: 50mm !important;
            border: none !important;
          }
        }
      `,
        }}
      />

      {/* --- CONTROLS --- */}
      <div className="w-full max-w-sm flex flex-col gap-3 mb-8 shrink-0 print:hidden">
        {/* Top Row: Back & Native Print */}
        <div className="flex justify-between gap-3 w-full">
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
          className={`w-full text-white p-4 rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform ${isPrinting ? "bg-gray-700 cursor-wait" : "bg-blue-900 border border-blue-700 hover:bg-blue-800"}`}
        >
          <PhotoIcon className="h-5 w-5 text-blue-400" />{" "}
          {isPrinting ? "PROCESSING..." : "TEST IMAGE PRINT"}
        </button>
      </div>

      {/* --- PRINTABLE RECEIPT AREA --- */}
      <div className="w-full overflow-x-auto flex justify-center pb-12 print:pb-0">
        {/* Added 'print-container' for native window printing */}
        <div
          id="printable-receipt"
          className="bg-[#ffffff] flex flex-col w-[576px] shrink-0 shadow-2xl rounded-sm print:shadow-none print-container"
        >
          {/* MASTER MAHATMA TOKEN */}
          {/* Added 'page-break' and 'print-box' */}
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

          {/* INDIVIDUAL BAG TOKENS */}
          {bags.map((_, index) => (
            <div
              key={`bag-${index}`}
              className="flex flex-col items-center justify-center font-sans w-[576px] h-[384px] p-4 border-b-4 border-dashed border-[#cccccc] overflow-hidden relative box-border page-break print-box"
            >
              <div className="text-[180px] font-black leading-none tracking-tighter mt-4 text-[#000000]">
                {pureNum}
              </div>

              <div className="text-4xl font-black uppercase mt-2 mb-4 text-[#000000]">
                {index + 1} / {tokenData.bag_count}
              </div>

              <div className="text-2xl font-black uppercase tracking-wider text-[#000000]">
                {tokenData.mobile} ({tokenData.bag_count}B)
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
