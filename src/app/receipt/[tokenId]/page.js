"use client";
import { QRCodeSVG } from "qrcode.react"; // This requires the npm install above
import { useParams } from "next/navigation";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

export default function DigitalReceipt() {
  const params = useParams();
  const tokenId = params.tokenId;
  const formattedToken = `#${String(tokenId).padStart(4, "0")}`;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center">
      {/* Small header/back button */}
      <Link
        href="/"
        className="absolute top-10 left-6 flex items-center gap-2 text-gray-500 text-sm"
      >
        <ArrowLeftIcon className="h-4 w-4" /> Back
      </Link>

      <h1 className="text-2xl font-black mb-2 uppercase tracking-tighter">
        Saman Ghar
      </h1>
      <p className="text-gray-400 mb-8 text-sm">Pune 2026 • Digital Token</p>

      {/* The QR Code Card */}
      <div className="bg-white p-6 rounded-[2.5rem] mb-8 shadow-[0_0_50px_rgba(59,130,246,0.3)]">
        <QRCodeSVG
          value={formattedToken}
          size={220}
          level="H" // High error correction
          includeMargin={false}
        />
      </div>

      <div className="text-7xl font-black mb-2 tracking-tighter text-blue-500">
        {formattedToken}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 mt-4 w-full max-w-xs">
        <p className="text-sm text-gray-300">
          Show this QR code at the counter to collect your belongings.
        </p>
      </div>

      <footer className="mt-12 text-[10px] text-gray-600 uppercase tracking-widest">
        Jai Satchitanand
      </footer>
    </div>
  );
}
