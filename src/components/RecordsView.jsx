"use client";
import { useState, useEffect } from "react";
import {
  MagnifyingGlassIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  clockIcon,
} from "@heroicons/react/24/outline";

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

  // Summary Logic
  const stats = {
    totalVisitors: records.length,
    activeBags: records.reduce(
      (acc, rec) => (rec.status === "STORED" ? acc + rec.bags : acc),
      0,
    ),
    checkedOut: records.filter((rec) => rec.status === "RETURNED").length,
  };

  const filteredRecords = records.filter(
    (rec) =>
      rec.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.mobile.includes(searchTerm) ||
      rec.id.toString().includes(searchTerm),
  );

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

      {/* 2. Search and Refresh */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-grow">
          <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by Token, Name, or Mobile..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl font-bold text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          />
        </div>
        <button
          onClick={fetchRecords}
          className="p-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50"
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
                  className={`hover:bg-blue-50/30 transition-colors ${record.status === "RETURNED" ? "opacity-50 grayscale bg-gray-50/50" : ""}`}
                >
                  <td className="p-4 font-black text-xl text-blue-600">
                    #{record.id}
                  </td>
                  <td className="p-4">
                    <p className="font-bold text-gray-900 uppercase">
                      {record.name}
                    </p>
                    <p className="text-xs text-gray-500">{record.mobile}</p>
                  </td>
                  <td className="p-4 text-center">
                    <span className="inline-block px-3 py-1 bg-gray-100 rounded-lg font-black text-gray-700">
                      {record.bags}
                    </span>
                  </td>
                  <td className="p-4 text-sm font-bold text-gray-600">
                    {record.time}
                  </td>
                  <td className="p-4 text-right">
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                        record.status === "STORED"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {record.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredRecords.length === 0 && !loading && (
          <div className="p-20 text-center text-gray-400 font-bold italic">
            No matching records found.
          </div>
        )}

        {isAdmin && (
          <button className="text-red-600 text-xs font-bold">
            Delete Record
          </button>
        )}
      </div>
    </div>
  );
}
