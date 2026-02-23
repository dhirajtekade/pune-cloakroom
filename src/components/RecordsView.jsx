import { Html5QrcodeScanner } from "html5-qrcode";
import { useEffect, useState } from "react";

export default function CounterScanner() {
  const [scanResult, setScanResult] = useState(null);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner("reader", {
      fps: 10,
      qrbox: { width: 250, height: 250 },
    });

    scanner.render(onScanSuccess, onScanError);

    async function onScanSuccess(decodedText) {
      // Assuming QR contains the URL: https://.../status/123
      const tokenId = decodedText.split("/").pop();

      try {
        const res = await fetch("/api/records", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: tokenId, action: "REQUEST_PICKUP" }),
        });

        if (res.ok) {
          setScanResult(`Token #${tokenId} added to Queue!`);
          // Clear success message after 2 seconds
          setTimeout(() => setScanResult(null), 2000);
        }
      } catch (err) {
        console.error("Scan failed to sync");
      }
    }

    function onScanError(err) {
      /* silent error */
    }

    return () => scanner.clear();
  }, []);

  return (
    <div className="p-4 bg-white rounded-3xl shadow-xl">
      <h2 className="text-center font-black text-gray-800 mb-4">
        SCAN MAHAMA TOKEN
      </h2>
      <div
        id="reader"
        className="overflow-hidden rounded-xl border-4 border-blue-600"
      ></div>

      {scanResult && (
        <div className="mt-4 p-4 bg-green-600 text-white text-center font-black rounded-xl animate-bounce">
          {scanResult}
        </div>
      )}
    </div>
  );
}
