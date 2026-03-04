"use client";
import { useState } from "react";
import CheckInView from "../components/CheckInView";
import RecordsView from "../components/RecordsView";
import {
  ClipboardDocumentListIcon,
  QueueListIcon,
} from "@heroicons/react/24/outline";

export default function Home() {
  const [activeTab, setActiveTab] = useState("checkin");

  return (
    <main className="bg-gray-100 min-h-screen pb-20 font-sans">
      {/* Top Header */}
      <header className="bg-blue-800 text-white p-4 text-center shadow-md fixed top-0 w-full z-10">
        <h1 className="text-xl font-bold tracking-wide">🧳 SamanGhar</h1>
      </header>

      {/* Main Content Area */}
      <div className="pt-20 px-4">
        {activeTab === "checkin" ? <CheckInView /> : <RecordsView />}
      </div>

      {/* Bottom Navigation Bar */}
      {/* <nav className="fixed bottom-0 w-full bg-white border-t border-gray-200 flex justify-around p-2 shadow-[0_-5px_10px_rgba(0,0,0,0.05)] z-10">
        <button
          onClick={() => setActiveTab("checkin")}
          className={`flex flex-col items-center p-2 w-full rounded-xl transition-colors ${activeTab === "checkin" ? "text-blue-700 bg-blue-50" : "text-gray-500"}`}
        >
          <QueueListIcon className="h-7 w-7" />
          <span className="text-xs font-bold mt-1">Check-In</span>
        </button>

        <button
          onClick={() => setActiveTab("records")}
          className={`flex flex-col items-center p-2 w-full rounded-xl transition-colors ${activeTab === "records" ? "text-blue-700 bg-blue-50" : "text-gray-500"}`}
        >
          <ClipboardDocumentListIcon className="h-7 w-7" />
          <span className="text-xs font-bold mt-1">Records</span>
        </button>
      </nav> */}
    </main>
  );
}
