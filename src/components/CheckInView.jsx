"use client";
import { useState } from "react";
import { PlusIcon, MinusIcon, PrinterIcon } from "@heroicons/react/24/solid";

export default function CheckInView() {
  const [mobile, setMobile] = useState("");
  const [name, setName] = useState("");
  const [bagCount, setBagCount] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const adjustBags = (amount) => {
    setBagCount((prev) => Math.max(1, prev + amount));
  };

  const handleCheckIn = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    // Placeholder: We will add the database and RawBT logic here next
    setTimeout(() => {
      setIsLoading(false);
      alert(`Ready to print ${bagCount + 1} labels for ${name}!`);
      setName("");
      setMobile("");
      setBagCount(1);
    }, 500);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 max-w-md mx-auto border border-gray-100">
      <h2 className="text-2xl font-black text-gray-800 mb-6 text-center">
        New Visitor
      </h2>

      <form onSubmit={handleCheckIn} className="space-y-5">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Mobile Number *
          </label>
          <input
            type="tel"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            placeholder="e.g. 9876543210"
            className="w-full p-4 bg-gray-50 border-2 border-gray-200 rounded-xl text-xl font-medium focus:border-blue-500 focus:bg-white focus:outline-none transition-colors"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Mahatma Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter full name"
            className="w-full p-4 bg-gray-50 border-2 border-gray-200 rounded-xl text-xl font-medium focus:border-blue-500 focus:bg-white focus:outline-none transition-colors"
            required
          />
        </div>

        <input 
  type="number" 
  inputMode="numeric" // Forces the large number pad on mobile, not the full keyboard
  pattern="[0-9]*"
  value={bagCount}
  onChange={(e) => setBagCount(parseInt(e.target.value) || '')}
  className="w-full p-4 text-3xl font-black text-center border-2 border-gray-300 rounded-xl"
/>

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full mt-4 p-5 rounded-xl text-xl font-bold text-white flex items-center justify-center space-x-2 transition-all shadow-md
            ${isLoading ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700 active:scale-[0.98]"}
          `}
        >
          <PrinterIcon className="h-7 w-7" />
          <span>
            {isLoading ? "Saving..." : `Save & Print (${bagCount + 1})`}
          </span>
        </button>
      </form>
    </div>
  );
}
