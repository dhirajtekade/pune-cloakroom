"use client";
import { useState, useEffect } from "react";
import {
  MagnifyingGlassIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";

export default function RecordsView() {
  const [searchTerm, setSearchTerm] = useState("");
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = true;

  // Calculate today's date in YYYY-MM-DD format
  const getTodayString = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const [filterDate, setFilterDate] = useState(getTodayString());

  const fetchRecords = async () => {
    setLoading(true);
    try {
      // Pass the date filter to the API
      const res = await fetch(`/api/records?date=${filterDate}`);
      const data = await res.json();
      setRecords(data.records || []);
    } catch (err) {
      console.error("Fetch error", err);
    } finally {
      setLoading(false);
    }
  };

  // Trigger fetch when the component mounts AND whenever filterDate changes
  useEffect(() => {
    fetchRecords();
  }, [filterDate]);

  // Summary Logic
  const stats = {
    totalVisitors: records.length,
    activeBags: records.filter((rec) => rec.status === "STORED").length,
    checkedOut: records.filter(
      (rec) => rec.status === "COLLECTED" || rec.status === "RETURNED",
    ).length,
  };

  // Search Logic
  const filteredRecords = records.filter(
    (rec) =>
      rec.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.mobile?.includes(searchTerm) ||
      rec.display_token?.includes(searchTerm) || // Search by the formatted token!
      rec.id?.toString().includes(searchTerm),
  );

  const handleCheckout = async (tokenId) => {
    if (!confirm(`Checkout Token #${tokenId}?`)) return;

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tokenId }),
      });

      const data = await res.json();
      if (data.success) {
        fetchRecords();
      } else {
        alert("Error: " + data.error);
      }
    } catch (e) {
      alert("Connection error during checkout");
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* 1. Summary Stats Bar */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-4 rounded-2xl shadow-sm border-b-4 border-blue-500 text-center">
          <p className="text-gray-500 text-xs font-black uppercase tracking-widest">
            Total Mahatmas
          </p>
          <p className="text-3xl font-black text-gray-900">
            {stats.totalVisitors}
          </p>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border-b-4 border-orange-500 text-center">
          <p className="text-gray-500 text-xs font-black uppercase tracking-widest">
            Bags Inside
          </p>
          <p className="text-3xl font-black text-gray-900">
            {stats.activeBags}
          </p>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border-b-4 border-green-500 text-center">
          <p className="text-gray-500 text-xs font-black uppercase tracking-widest">
            Returned
          </p>
          <p className="text-3xl font-black text-gray-900">
            {stats.checkedOut}
          </p>
        </div>
      </div>

      {/* 2. Controls: Date, Search, and Refresh */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        {/* Date Filter */}
        <div className="flex items-center gap-3 bg-white px-4 py-2 border border-gray-200 rounded-xl shadow-sm">
          <label className="text-gray-400 font-bold uppercase text-xs">
            Date:
          </label>
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="text-gray-900 font-bold outline-none cursor-pointer bg-transparent"
          />
        </div>

        {/* Search Input */}
        <div className="relative flex-grow">
          <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search Token, Name, Mobile..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl font-bold text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
          />
        </div>

        {/* Refresh Button */}
        <button
          onClick={fetchRecords}
          className="p-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 shadow-sm"
        >
          <ArrowPathIcon
            className={`h-6 w-6 text-blue-600 ${loading ? "animate-spin" : ""}`}
          />
        </button>
      </div>

      {/* 3. The Data Table */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="p-4 text-xs font-black text-gray-500 uppercase">
                  Token
                </th>
                <th className="p-4 text-xs font-black text-gray-500 uppercase">
                  Mahatma Name
                </th>
                <th className="p-4 text-xs font-black text-gray-500 uppercase text-center">
                  Bags
                </th>
                <th className="p-4 text-xs font-black text-gray-500 uppercase">
                  Time In
                </th>
                <th className="p-4 text-xs font-black text-gray-500 uppercase text-right">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredRecords.map((record) => (
                <tr
                  key={record.id}
                  className={`hover:bg-blue-50/30 transition-colors ${
                    record.status === "COLLECTED" ||
                    record.status === "RETURNED"
                      ? "opacity-50 grayscale bg-gray-50/50"
                      : ""
                  }`}
                >
                  {/* Safely display the pre-formatted token straight from the database */}
                  <td className="p-4 font-black text-xl text-blue-600">
                    #{record.display_token || record.id}
                  </td>

                  <td className="p-4">
                    <p className="font-bold text-gray-900 uppercase">
                      {record.name || "Unknown"}
                    </p>
                    <p className="text-xs text-gray-500">{record.mobile}</p>
                  </td>

                  <td className="p-4 text-center">
                    <span className="inline-block px-3 py-1 bg-gray-100 rounded-lg font-black text-gray-700">
                      {record.bags || 0}
                    </span>
                  </td>

                  <td className="p-4 text-sm font-bold text-gray-600">
                    {record.time}
                  </td>

                  <td className="p-4 text-right">
                    {record.status === "STORED" ? (
                      <button
                        onClick={() => handleCheckout(record.id)}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg text-xs font-black hover:bg-green-500 active:scale-95 transition-transform shadow-md"
                      >
                        CHECKOUT
                      </button>
                    ) : (
                      <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-gray-200 text-gray-600">
                        {record.status}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredRecords.length === 0 && !loading && (
          <div className="p-20 text-center text-gray-400 font-bold italic">
            No matching records found for this date.
          </div>
        )}

        {isAdmin && (
          <div className="p-4 text-right border-t border-gray-100 bg-gray-50">
            <button className="text-red-600 text-xs font-bold hover:underline">
              Delete Record
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
