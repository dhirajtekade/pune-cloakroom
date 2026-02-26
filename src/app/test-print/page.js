"use client";

export default function TestPrint() {
  //   const handlePrint2 = () => {
  //     window.print();
  //   };

  //   const handleRawBTPrint = () => {
  //   // 1. Define your print content in a simple HTML string
  //   const printContent = `
  //     <div style="width: 80mm; font-family: monospace;">
  //       <center>
  //         <h1 style="font-size: 30px;">MAHATMA TOKEN</h1>
  //         <h1 style="font-size: 80px;">#888</h1>
  //         <p>PUNE SEVA 2026</p>
  //       </center>
  //     </div>
  //     <div style="page-break-after: always;"></div>
  //     <div style="width: 80mm; font-family: monospace;">
  //       <center>
  //         <h1 style="font-size: 30px;">BAG TAG</h1>
  //         <h1 style="font-size: 60px;">2 BAGS</h1>
  //       </center>
  //     </div>
  //   `;

  //   // 2. Encode it for RawBT
  //   const encodedContent = btoa(unescape(encodeURIComponent(printContent)));

  //   // 3. Trigger the RawBT App directly
  //   window.location.href = `intent:#Intent;content-type=text/html;base64,${encodedContent};scheme=rawbt;end;`;
  // };

  // const printSamanGharLabels = (tokenId, bagCount, name) => {
  //   // \x0C is the Form Feed command that triggers the P80H gap sensor
  //   const FF = "\x0C";

  //   // Construct the data as separate labels
  //   const labelData =
  //     `SAMANGHAR - PUNE\n` +
  //     `MAHATMA TOKEN\n` +
  //     `#${tokenId}\n` +
  //     `${name}\n` +
  //     FF + // <--- This tells printer: "Go to next gap"

  //     `BAG TAG\n` +
  //     `TOKEN #${tokenId}\n` +
  //     `BAGS: ${bagCount}\n` +
  //     FF;  // <--- This tells printer: "Go to next gap"

  //   // Base64 encode for the Intent
  //   const encoded = btoa(unescape(encodeURIComponent(labelData)));

  //   // Trigger RawBT using 'text/plain' for fastest, cleanest printing
  //   window.location.href = `intent:#Intent;content-type=text/plain;base64,${encoded};scheme=rawbt;end;`;
  // };

  //   const handlePrint = (tokenId, bagCount, name) => {
  //     // \x0C is the standard ESC/POS 'Form Feed' command for label printers
  //     const FF = "\x0C";

  //     // Design your label text
  //     const labelText =
  //       `SAMANGHAR - PUNE\n` +
  //       `TOKEN: #${tokenId}\n` +
  //       `BAG: ${bagCount} BAGS\n` +
  //       `----------------\n` + // A simple separator line
  //       FF +
  //       `BAG TAG\n` +
  //       `TOKEN: #${tokenId}\n` +
  //       `DO NOT LOSE\n` +
  //       FF;

  //     // 1. Encode the text to Base64
  //     const encoded = btoa(unescape(encodeURIComponent(labelText)));

  //     // 2. Redirect to the RawBT Intent
  //     // 'text/plain' tells RawBT to treat this as standard printer text commands
  //     window.location.href = `intent:#Intent;content-type=text/plain;base64,${encoded};scheme=rawbt;end;`;
  //   };

  //   const handlePrint = (tokenId, bagCount, name) => {
  //     console.log("Print button clicked for Token:", tokenId);

  //     // \x0C is the Form Feed command
  //     const FF = "\x0C";

  //     const labelText =
  //       `SAMANGHAR - PUNE\n` +
  //       `TOKEN: #${tokenId}\n` +
  //       `NAME: ${name}\n` +
  //       `BAGS: ${bagCount}\n` +
  //       FF +
  //       `BAG TAG\n` +
  //       `TOKEN: #${tokenId}\n` +
  //       FF;

  //     try {
  //       // 1. Properly encode for UTF-8 and Base64
  //       const base64 = btoa(unescape(encodeURIComponent(labelText)));

  //       // 2. Construct the Intent URL
  //       const intentUrl = `intent:#Intent;content-type=text/plain;base64,${base64};scheme=rawbt;end;`;

  //       // 3. Trigger the redirect
  //       window.location.href = intentUrl;
  //       alert("after intentURL");
  //       alert(intentUrl);
  //     } catch (err) {
  //         alert("Err");
  //       console.error("Print Error:", err);
  //       alert("Printing failed. Make sure RawBT is installed.");
  //     }
  //   };

  const handlePrint = (tokenId, bagCount, name) => {
    const FF = "\x0C";
    const labelText =
      `SAMANGHAR - PUNE\n` +
      `TOKEN: #${tokenId}\n` +
      `NAME: ${name}\n` +
      `BAGS: ${bagCount}\n` +
      FF +
      `BAG TAG\n` +
      `TOKEN: #${tokenId}\n` +
      FF;

    try {
      const base64 = btoa(unescape(encodeURIComponent(labelText)));
      const intentUrl = `intent:#Intent;content-type=text/plain;base64,${base64};scheme=rawbt;end;`;

      // DO NOT use alert() here. It blocks the "User Gesture" required for Intents.
      window.location.assign(intentUrl);
    } catch (err) {
      console.error("Print Error:", err);
    }
  };

  const printDirectly = async (tokenId, bags) => {
    try {
      // 1. Request the printer
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ namePrefix: "P80H" }],
        optionalServices: ["00001101-0000-1000-8000-00805f9b34fb"], // Standard SPP UUID
      });

      const server = await device.gatt.connect();
      const service = await server.getPrimaryService(
        "00001101-0000-1000-8000-00805f9b34fb",
      );
      const characteristic = await service.getCharacteristic(
        "00001101-0000-1000-8000-00805f9b34fb",
      );

      // 2. Prepare ESC/POS commands
      const encoder = new TextEncoder();
      const FF = "\x0C"; // Form Feed for your 3x2 labels
      const data = encoder.encode(`TOKEN: #${tokenId}\nBAGS: ${bags}\n` + FF);

      // 3. Send to printer
      await characteristic.writeValue(data);
    } catch (err) {
      console.error("Bluetooth Print Error:", err);
    }
  };

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <div className="max-w-md mx-auto no-print">
        <h1 className="text-2xl font-black mb-4">🖨️ Printer Test Bench</h1>
        <p className="mb-6 text-sm text-gray-600">
          This will generate 3 separate labels. Ensure your printer driver is
          set to
          <strong> "Label with Gaps"</strong> and margins are set to{" "}
          <strong>"None"</strong>.
        </p>
        <button
          onClick={() => handlePrint(888, 2, "John Doe")}
          className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl shadow-lg active:scale-95 transition-all"
        >
          PRINT 3.0 TEST LABELS
        </button>

        <button
          onClick={() => printDirectly(888, 2)}
          className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl shadow-lg active:scale-95 transition-all"
        >
          PRINT 4.0 TEST LABELS
        </button>

        <a
          href={`intent:#Intent;content-type=text/plain;base64,${btoa("TOKEN #888" + "\x0C")};scheme=rawbt;end;`}
          className="block text-center bg-blue-600 text-white font-black py-4 rounded-2xl shadow-lg"
        >
          LAUNCH RAWBT PRINT
        </a>
      </div>

      {/* --- PRINTABLE AREA --- */}
      <div className="print-container">
        {/* LABEL 1: TOKEN */}
        <div className="label-sticker">
          <h2 className="text-center font-black text-sm uppercase">Token</h2>
          <div className="text-center text-4xl font-black leading-none">
            #888
          </div>
          <p className="text-center text-[10px] font-bold">PUNE SEVA 2026</p>
        </div>

        {/* LABEL 2: BAG TAG */}
        <div className="label-sticker">
          <h2 className="text-center font-black text-sm uppercase">Bag Tag</h2>
          <div className="text-center text-3xl font-black leading-none">
            2 BAGS
          </div>
          <p className="text-center text-[10px] font-bold tracking-tighter">
            KEEP WITH LUGGAGE
          </p>
        </div>

        {/* LABEL 3: QR CODE */}
        <div className="label-sticker flex flex-col items-center justify-center">
          <h2 className="text-center font-black text-sm uppercase">
            Scan to Checkout
          </h2>
          <div className="w-32 h-32 border-4 border-black mt-2 flex items-center justify-center font-bold">
            [ QR ]
          </div>
          <p className="mt-2 text-[10px] font-bold italic text-center">
            Valid for 13-15 March
          </p>
        </div>
      </div>

      <style jsx>{`
        /* Hide UI elements during print */
        @media print {
          .no-print {
            display: none;
          }
          body {
            background: white;
            margin: 0;
            padding: 0;
          }
        }

        /* Update these values inside your <style jsx> block */
        .label-sticker {
          width: 76mm; /* 3 inches */
          height: 50mm; /* 2 inches - matches your physical sticker height */
          padding: 2mm; /* Reduced padding because the label is smaller now */
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center; /* Center everything */
          border: 1px dashed #ccc;
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
