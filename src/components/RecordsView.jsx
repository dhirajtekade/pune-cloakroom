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
      if (res.ok) fetchRecords();
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
    <div className="max-w-md mx-auto px-4">
      {/* Search Bar Section */}
      <div className="sticky top-[72px] z-10 bg-gray-100 pt-2 pb-4 flex gap-2">
        <div className="relative flex-grow">
          <MagnifyingGlassIcon className="absolute left-4 top-4 h-6 w-6 text-gray-500" />
          <input
            type="text"
            placeholder="Search Token or Mobile..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            // FIXED: text-gray-900 and placeholder:text-gray-500 for maximum visibility
            className="w-full pl-12 pr-4 py-4 border-2 border-gray-300 rounded-xl text-lg font-bold text-gray-900 placeholder:text-gray-500 shadow-sm focus:border-blue-600 focus:outline-none bg-white"
          />
        </div>
        <button
          onClick={fetchRecords}
          className="bg-white border-2 border-gray-300 p-4 rounded-xl shadow-sm active:bg-gray-100"
        >
          <ArrowPathIcon
            className={`h-6 w-6 text-blue-600 ${loading ? "animate-spin" : ""}`}
          />
        </button>
      </div>

      {/* Records List */}
      <div className="space-y-4 pb-10">
        {loading && (
          <p className="text-center py-10 font-black text-gray-600 text-xl animate-pulse">
            Fetching Live Records...
          </p>
        )}

        {!loading &&
          filteredRecords.map((record) => (
            <div
              key={record.id}
              className={`p-5 rounded-2xl shadow-md border-l-8 transition-opacity ${
                record.status === "RETURNED"
                  ? "bg-gray-200 border-gray-400 opacity-70"
                  : "bg-white border-blue-600"
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-4xl font-black text-gray-900">
                    #{record.id}
                  </h3>
                  <p className="text-xl font-extrabold text-blue-900 mt-1 uppercase">
                    {record.name}
                  </p>
                  <p className="text-gray-700 font-bold text-lg">
                    {record.mobile}
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className={`text-sm font-black px-3 py-1 rounded-full ${
                      record.status === "RETURNED"
                        ? "bg-gray-400 text-white"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {record.bags} BAG{record.bags > 1 ? "S" : ""}
                  </span>
                  <p className="text-sm text-gray-600 mt-2 font-bold">
                    {record.time}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                {record.status === "STORED" ? (
                  <button
                    onClick={() => handleReturn(record.id)}
                    className="w-full py-4 bg-orange-600 text-white rounded-xl font-black text-xl active:scale-95 shadow-lg uppercase"
                  >
                    Mark as Returned
                  </button>
                ) : (
                  <div className="flex items-center justify-center text-gray-600 font-black text-xl py-2">
                    <CheckCircleIcon className="h-7 w-7 mr-2 text-green-600" />
                    CHECKED OUT
                  </div>
                )}
              </div>
            </div>
          ))}

        {!loading && filteredRecords.length === 0 && (
          <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-300">
            <p className="text-gray-600 font-black text-xl italic">
              No record found for "{searchTerm}"
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
