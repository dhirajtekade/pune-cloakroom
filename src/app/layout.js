import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { cookies } from "next/headers";
import LogoutButton from "@/components/LogoutButton"; // We'll create this next
import {
  PlusIcon,
  ClipboardDocumentListIcon,
  QrCodeIcon,
} from "@heroicons/react/24/outline";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "SamanGhar | Cloakroom Dept",
  description: "Cloakroom Management System",
};

export default async function RootLayout({ children }) {
  const cookieStore = await cookies();
  const session = cookieStore.get("samanghar_session");

  const isLoggedIn = !!session;
  const isAdmin = session?.value === "admin";

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 text-gray-900 pb-20`}
      >
        {isLoggedIn && (
          <>
            {/* --- TOP HEADER --- */}
            <header className="fixed top-0 left-0 right-0 bg-white h-14 border-b flex items-center justify-between px-6 z-50">
              <div className="flex items-center gap-2">
                <h1 className="font-black text-xl tracking-tighter text-blue-600">
                  SAMANGHAR
                </h1>
                {isAdmin && (
                  <span className="bg-blue-100 text-blue-700 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                    Admin
                  </span>
                )}
              </div>

              {/* Logout button must be a Client Component to handle the fetch */}
              <LogoutButton />
            </header>

            {/* --- BOTTOM NAVIGATION --- */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white border-t h-16 flex justify-around items-center z-50 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
              <Link
                href="/"
                className="flex flex-col items-center justify-center w-full h-full text-blue-600"
              >
                <PlusIcon className="w-7 h-7" />
                <span className="text-[10px] font-bold uppercase mt-1">
                  Check-in
                </span>
              </Link>

              <Link
                href="/records"
                className="flex flex-col items-center justify-center w-full h-full text-gray-400 hover:text-blue-500"
              >
                <ClipboardDocumentListIcon className="w-7 h-7" />
                <span className="text-[10px] font-bold uppercase mt-1">
                  Records
                </span>
              </Link>

              <Link
                href="/checkout"
                className="flex flex-col items-center justify-center w-full h-full text-gray-400 hover:text-blue-500"
              >
                <QrCodeIcon className="w-7 h-7" />
                <span className="text-[10px] font-bold uppercase mt-1">
                  Checkout
                </span>
              </Link>
            </nav>
          </>
        )}

        <main className={`${isLoggedIn ? "pt-14" : ""}`}>{children}</main>
      </body>
    </html>
  );
}
