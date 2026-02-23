"use client";
import { ArrowRightOnRectangleIcon } from "@heroicons/react/24/outline";

export default function LogoutButton() {
  const handleLogout = async () => {
    if (confirm("Confirm Logout?")) {
      await fetch("/api/logout", { method: "POST" });
      window.location.href = "/login";
    }
  };

  return (
    <button
      onClick={handleLogout}
      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
    >
      <ArrowRightOnRectangleIcon className="w-6 h-6" />
    </button>
  );
}
