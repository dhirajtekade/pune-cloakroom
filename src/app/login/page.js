"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    const res = await fetch("/api/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });

    if (res.ok) {
      // Instead of just router.push, we use window.location
      // This forces the browser to re-send all cookies to the Middleware
      window.location.href = "/";
    } else {
      setError("Invalid Username or Password");
    }
  };

  return (
    <div className="min-h-screen bg-blue-600 flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-10 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-blue-600 tracking-tighter">
            SAMANGHAR
          </h1>
          <p className="text-gray-400 font-bold uppercase text-xs tracking-widest mt-2">
            Cloakroom Management
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs font-black uppercase text-gray-400 ml-2">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold focus:border-blue-500 outline-none"
              placeholder="Enter username"
              required
            />
          </div>
          <div>
            <label className="text-xs font-black uppercase text-gray-400 ml-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold focus:border-blue-500 outline-none"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <p className="text-red-500 text-center font-bold text-sm">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-lg shadow-lg active:scale-95 transition-transform uppercase"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}
