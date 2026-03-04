import RecordsView from "@/components/RecordsView";

export default function RecordsPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-10">
      <h1 className="text-center text-4xl font-black text-gray-900 mb-2">
        CLOAKROOM RECORDS
      </h1>
      <p className="text-center text-gray-500 mb-10 font-bold uppercase tracking-widest">
        Pune Seva 2026
      </p>

      {/* This calls the component you already wrote */}
      <RecordsView />
    </main>
  );
}
