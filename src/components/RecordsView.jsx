"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  MagnifyingGlassIcon,
  ArrowPathIcon,
  XMarkIcon,
  PrinterIcon,
} from "@heroicons/react/24/outline";

export default function RecordsView() {
  const [searchTerm, setSearchTerm] = useState("");
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- PARTIAL CHECKOUT STATES ---
  const [partialModal, setPartialModal] = useState(null); // Stores the record being edited
  const [selectedBags, setSelectedBags] = useState([]); // Array of checked bag indices
  const [isUpdating, setIsUpdating] = useState(false);

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
    if (!confirm(`Checkout ALL bags for Token #${tokenId}?`)) return;

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

  // --- PARTIAL CHECKOUT LOGIC ---
  const openPartialModal = (record) => {
    setPartialModal(record);
    setSelectedBags([]); // Reset checkboxes when opening
  };

  const toggleBag = (index) => {
    if (selectedBags.includes(index)) {
      setSelectedBags(selectedBags.filter((i) => i !== index));
    } else {
      setSelectedBags([...selectedBags, index]);
    }
  };

  const confirmPartialCheckout = async () => {
    if (selectedBags.length === 0) {
      alert("Please select at least one bag to checkout.");
      return;
    }

    setIsUpdating(true);
    // Math: Total Bags - Checked Bags = Remaining Bags
    const remainingBags = partialModal.bags - selectedBags.length;

    try {
      const res = await fetch("/api/records", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: partialModal.id,
          action: "PARTIAL_CHECKOUT",
          newBagCount: remainingBags,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setPartialModal(null); // Close modal
        fetchRecords(); // Refresh table
      } else {
        alert("Error updating bags");
      }
    } catch (e) {
      alert("Connection error");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* --- PARTIAL CHECKOUT MODAL --- */}
      {partialModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-black text-gray-900 uppercase">
                Partial Checkout
              </h3>
              <button
                onClick={() => setPartialModal(null)}
                className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"
              >
                <XMarkIcon className="h-5 w-5 text-gray-600" />
              </button>
            </div>

            <p className="text-gray-500 font-bold text-sm mb-4">
              {partialModal.name} has{" "}
              <span className="text-black">{partialModal.bags} bags</span>.
              Select the ones they are taking right now:
            </p>

            <div className="flex flex-col gap-3 mb-6 max-h-60 overflow-y-auto pr-2">
              {Array.from({ length: partialModal.bags }).map((_, idx) => (
                <label
                  key={idx}
                  className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedBags.includes(idx)
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 bg-gray-50 hover:bg-gray-100"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedBags.includes(idx)}
                    onChange={() => toggleBag(idx)}
                    className="w-6 h-6 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <span
                    className={`font-black text-lg ${selectedBags.includes(idx) ? "text-blue-700" : "text-gray-700"}`}
                  >
                    Bag {idx + 1}
                  </span>
                </label>
              ))}
            </div>

            <button
              onClick={confirmPartialCheckout}
              disabled={isUpdating || selectedBags.length === 0}
              className={`w-full p-4 rounded-xl font-black text-white uppercase tracking-wide transition-all ${
                selectedBags.length > 0 && !isUpdating
                  ? "bg-blue-600 hover:bg-blue-500 active:scale-95 shadow-lg shadow-blue-500/30"
                  : "bg-gray-300 cursor-not-allowed"
              }`}
            >
              {isUpdating
                ? "Updating..."
                : `Checkout ${selectedBags.length} Bag(s)`}
            </button>
          </div>
        </div>
      )}

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
                    <div className="flex flex-col gap-2 items-end">
                      {record.status === "STORED" ? (
                        <>
                          <button
                            onClick={() => handleCheckout(record.id)}
                            className="w-28 bg-green-600 text-white px-3 py-2 rounded-lg text-[11px] font-black tracking-wide hover:bg-green-500 active:scale-95 transition-transform"
                          >
                            CHECKOUT ALL
                          </button>
                          {record.bags > 1 && (
                            <button
                              onClick={() => openPartialModal(record)}
                              className="w-28 bg-blue-100 text-blue-700 border border-blue-200 px-3 py-2 rounded-lg text-[11px] font-black tracking-wide hover:bg-blue-200 active:scale-95 transition-transform"
                            >
                              PARTIAL OUT
                            </button>
                          )}
                        </>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-gray-200 text-gray-600">
                          {record.status}
                        </span>
                      )}

                      {/* --- NEW: REPRINT BUTTON (Available for all statuses!) --- */}
                      <Link
                        href={`/preview/${record.id}`}
                        className="w-28 bg-gray-800 text-gray-200 border border-gray-700 px-3 py-2 rounded-lg text-[11px] font-black tracking-wide hover:bg-gray-700 hover:text-white active:scale-95 transition-all flex items-center justify-center gap-2"
                      >
                        <PrinterIcon className="h-4 w-4" /> REPRINT
                      </Link>
                    </div>
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

        {/* {isAdmin && (
          <div className="p-4 text-right border-t border-gray-100 bg-gray-50">
            <button className="text-red-600 text-xs font-bold hover:underline">
              Delete Record
            </button>
          </div>
        )} */}
      </div>
    </div>
  );
}
