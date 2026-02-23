"use client";
import { useState, useEffect } from "react";
import {
  MagnifyingGlassIcon,
  CheckCircleIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/solid";

export default function RecordsView() {
  const [searchTerm, setSearchTerm] = useState("");
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/records");
      const data = await res.json();
      setRecords(data.records || []);
    } catch (err) {
      console.error("Fetch error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleReturn = async (id) => {
    if (!window.confirm(`Confirm Checkout for Token #${id}?`)) return;

    try {
      const res = await fetch("/api/records", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "RETURN" }),
      });
      if (res.ok) fetchRecords(); // Refresh list after update
    } catch (err) {
      alert("Failed to update status.");
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
      <div className="sticky top-[72px] z-10 bg-gray-100 pt-2 pb-4 flex gap-2">
        <div className="relative flex-grow">
          <MagnifyingGlassIcon className="absolute left-4 top-4 h-6 w-6 text-gray-400" />
          <input
            type="text"
            placeholder="Search Token or Mobile..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl text-lg font-medium shadow-sm focus:outline-none"
          />
        </div>
        <button
          onClick={fetchRecords}
          className="bg-white border-2 border-gray-200 p-4 rounded-xl shadow-sm active:bg-gray-100"
        >
          <ArrowPathIcon
            className={`h-6 w-6 text-blue-600 ${loading ? "animate-spin" : ""}`}
          />
        </button>
      </div>

      <div className="space-y-4">
        {loading && (
          <p className="text-center py-10 font-bold text-gray-500">
            Loading live data...
          </p>
        )}

        {!loading &&
          filteredRecords.map((record) => (
            <div
              key={record.id}
              className={`p-5 rounded-2xl shadow-sm border-l-8 ${record.status === "RETURNED" ? "bg-gray-50 border-gray-300 opacity-60" : "bg-white border-blue-600"}`}
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
                  <span
                    className={`text-sm font-bold px-3 py-1 rounded-full ${record.status === "RETURNED" ? "bg-gray-200" : "bg-blue-100 text-blue-900"}`}
                  >
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
                    className="w-full py-4 bg-amber-500 text-white rounded-xl font-bold text-xl active:scale-[0.98] transition-transform shadow-sm"
                  >
                    Mark as Returned
                  </button>
                ) : (
                  <div className="flex items-center justify-center text-gray-500 font-bold text-xl py-2">
                    <CheckCircleIcon className="h-7 w-7 mr-2" />
                    Returned
                  </div>
                )}
              </div>
            </div>
          ))}
        {!loading && filteredRecords.length === 0 && (
          <p className="text-center py-10 text-gray-400">
            No records found matching "{searchTerm}"
          </p>
        )}
      </div>
    </div>
  );
}
