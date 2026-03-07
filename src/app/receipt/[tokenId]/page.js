// src/app/receipt/[tokenId]/page.js
"use client";
import { QRCodeSVG } from "qrcode.react";
import { useParams } from "next/navigation";

export default function DigitalReceipt() {
  const { tokenId } = useParams();
  const formattedToken = `#${String(tokenId).padStart(4, "0")}`;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center">
      <h1 className="text-2xl font-black mb-2 uppercase">Saman Ghar</h1>
      <p className="text-gray-400 mb-8">Digital Bag Token</p>

      <div className="bg-white p-4 rounded-3xl mb-6">
        <QRCodeSVG value={formattedToken} size={200} />
      </div>

      <div className="text-6xl font-black mb-2 tracking-tighter text-blue-500">
        {formattedToken}
      </div>

      <p className="text-sm text-gray-500 max-w-[200px]">
        Show this QR code at the counter to collect your bags.
      </p>
    </div>
  );
}
