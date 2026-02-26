'use client';

export default function TestPrint() {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <div className="max-w-md mx-auto no-print">
        <h1 className="text-2xl font-black mb-4">🖨️ Printer Test Bench</h1>
        <p className="mb-6 text-sm text-gray-600">
          This will generate 3 separate labels. Ensure your printer driver is set to 
          <strong> "Label with Gaps"</strong> and margins are set to <strong>"None"</strong>.
        </p>
        <button 
          onClick={handlePrint}
          className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl shadow-lg active:scale-95 transition-all"
        >
          PRINT 3 TEST LABELS
        </button>
      </div>

      {/* --- PRINTABLE AREA --- */}
      <div className="print-container">
        {/* LABEL 1: TOKEN */}
        <div className="label-sticker">
          <h2 className="text-center font-black text-xl">MAHATMA TOKEN</h2>
          <div className="text-center text-6xl font-black my-2">#888</div>
          <p className="text-center text-xs font-bold uppercase">Pune Seva 2026</p>
        </div>

        {/* LABEL 2: BAG TAG */}
        <div className="label-sticker">
          <h2 className="text-center font-black text-xl">BAG TAG</h2>
          <div className="text-center text-5xl font-black my-2">2 BAGS</div>
          <p className="text-center text-xs font-bold uppercase">Keep with Luggage</p>
        </div>

        {/* LABEL 3: QR CODE */}
        <div className="label-sticker flex flex-col items-center justify-center">
          <h2 className="text-center font-black text-sm uppercase">Scan to Checkout</h2>
          <div className="w-32 h-32 border-4 border-black mt-2 flex items-center justify-center font-bold">
            [ QR ]
          </div>
          <p className="mt-2 text-[10px] font-bold italic text-center">Valid for 13-15 March</p>
        </div>
      </div>

      <style jsx>{`
        /* Hide UI elements during print */
        @media print {
          .no-print { display: none; }
          body { background: white; margin: 0; padding: 0; }
        }

        /* Label Formatting */
        .label-sticker {
          width: 80mm;
          height: 100mm; /* ADJUST TO YOUR ACTUAL STICKER HEIGHT */
          padding: 5mm;
          display: flex;
          flex-direction: column;
          justify-content: center;
          border: 1px dashed #ccc; /* Visible on screen, hidden on print */
          page-break-after: always;
          overflow: hidden;
          box-sizing: border-box;
        }

        @media print {
          .label-sticker {
            border: none;
            page-break-after: always;
          }
        }
      `}</style>
    </div>
  );
}