"use client";
import { useEffect } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { XMarkIcon } from "@heroicons/react/24/solid";

export default function CameraScannerModal({ onScan, onClose }) {
  useEffect(() => {
    // Initialize the scanner with a 250x250 scanning box
    const scanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 250, height: 100 } }, // 100 height is great for 1D barcodes
      false,
    );

    scanner.render(
      (decodedText) => {
        // When it successfully reads a barcode, stop the camera and pass the text back!
        scanner.clear();
        onScan(decodedText);
      },
      (errorMessage) => {
        // It throws errors constantly while trying to focus, we just ignore them silently
      },
    );

    // Cleanup when the modal closes
    return () => {
      scanner
        .clear()
        .catch((error) => console.error("Failed to clear scanner", error));
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 bg-black/95 z-50 flex flex-col items-center justify-center p-4 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white rounded-3xl overflow-hidden relative shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-[60] bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-lg active:scale-95 transition-transform"
        >
          <XMarkIcon className="h-6 w-6 font-black" />
        </button>

        <div className="p-4 bg-gray-900 text-center border-b-4 border-blue-500">
          <h2 className="text-white font-black uppercase tracking-widest text-lg">
            Scan Barcode
          </h2>
        </div>

        {/* The Camera Feed gets injected into this div */}
        <div id="reader" className="w-full bg-black"></div>
      </div>
    </div>
  );
}
