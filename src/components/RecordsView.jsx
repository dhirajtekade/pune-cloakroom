"use client";
import { useState } from "react";
import {
  MagnifyingGlassIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/solid";

export default function RecordsView() {
  const [searchTerm, setSearchTerm] = useState("");

  // Dummy data placeholder
  const [records, setRecords] = useState([
    {
      id: 1045,
      name: "Rajesh Kumar",
      mobile: "9876543210",
      bags: 2,
      status: "STORED",
      time: "10:30 AM",
    },
    {
      id: 1044,
      name: "Anita Desai",
      mobile: "9988776655",
      bags: 1,
      status: "STORED",
      time: "10:15 AM",
    },
    {
      id: 1043,
      name: "Suresh Bhai",
      mobile: "9123456789",
      bags: 3,
      status: "RETURNED",
      time: "09:45 AM",
    },
  ]);

  const handleReturn = (id) => {
    if (window.confirm(`Mark Token #${id} as returned?`)) {
      setRecords(
        records.map((rec) =>
          rec.id === id ? { ...rec, status: "RETURNED" } : rec,
        ),
      );
    }
  };

  const filteredRecords = records.filter(
    (rec) =>
      rec.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.mobile.includes(searchTerm) ||
      rec.id.toString().includes(searchTerm),
  );

  return (
    <div className="max-w-md mx-auto">
      {/* Sticky Search Bar */}
      <div className="sticky top-[72px] z-10 bg-gray-100 pt-2 pb-4">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-4 top-4 h-6 w-6 text-gray-400" />
          <input
            type="text"
            placeholder="Search Token or Mobile..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl text-lg font-medium focus:border-blue-500 focus:outline-none shadow-sm"
          />
        </div>
      </div>

      {/* List */}
      <div className="space-y-4">
        {filteredRecords.map((record) => (
          <div
            key={record.id}
            className={`p-5 rounded-2xl shadow-sm border-l-8 ${record.status === "RETURNED" ? "bg-green-50 border-green-500" : "bg-white border-blue-600"}`}
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-3xl font-black text-gray-900">
                  #{record.id}
                </h3>
                <p className="text-xl font-bold text-gray-700 mt-1">
                  {record.name}
                </p>
                <p className="text-gray-500 font-medium">{record.mobile}</p>
              </div>
              <div className="text-right">
                <span className="bg-blue-100 text-blue-900 text-sm font-bold px-3 py-1 rounded-full">
                  {record.bags} Bag{record.bags > 1 ? "s" : ""}
                </span>
                <p className="text-xs text-gray-400 mt-2 font-medium">
                  {record.time}
                </p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100">
              {record.status === "STORED" ? (
                <button
                  onClick={() => handleReturn(record.id)}
                  className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-xl active:scale-[0.98] transition-transform shadow-sm"
                >
                  Mark as Returned
                </button>
              ) : (
                <div className="flex items-center justify-center text-green-700 font-bold text-xl py-2">
                  <CheckCircleIcon className="h-7 w-7 mr-2" />
                  Returned
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
