import { Toaster } from "@/components/ui/sonner";
import { useEffect, useState } from "react";
import "./backend-patch";
import BottomNav from "./components/BottomNav";
import { getStoredUserId } from "./lib/auth";
import AccountPage from "./pages/AccountPage";
import AdminPage from "./pages/AdminPage";
import AuthPage from "./pages/AuthPage";
import HomePage from "./pages/HomePage";
import ReferralPage from "./pages/ReferralPage";
import WalletPage from "./pages/WalletPage";

export type Tab = "home" | "referral" | "wallet" | "account";

export default function App() {
  const [userId, setUserId] = useState<bigint | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const isAdmin = window.location.pathname === "/admin";

  // Extract referral code from URL (stable, read once)
  const refCode = new URLSearchParams(window.location.search).get("ref");

  useEffect(() => {
    // If referral link is present, force signup page -- don't auto-login
    if (refCode) return;
    const id = getStoredUserId();
    if (id) setUserId(id);
  }, [refCode]);

  function handleLogin(id: bigint) {
    // After login/signup via referral link, clean URL and proceed
    if (refCode) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    setUserId(id);
  }

  if (isAdmin) {
    return (
      <div className="min-h-screen" style={{ background: "#0e0e0e" }}>
        <AdminPage />
        <Toaster />
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="min-h-screen" style={{ background: "#0e0e0e" }}>
        <AuthPage onLogin={handleLogin} prefilledReferralCode={refCode || ""} />
        <Toaster />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20" style={{ background: "#0e0e0e" }}>
      <div className="max-w-[430px] mx-auto">
        {activeTab === "home" && (
          <HomePage userId={userId} onBalanceUpdate={() => {}} />
        )}
        {activeTab === "referral" && <ReferralPage userId={userId} />}
        {activeTab === "wallet" && <WalletPage userId={userId} />}
        {activeTab === "account" && (
          <AccountPage userId={userId} onLogout={() => setUserId(null)} />
        )}
      </div>
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      <Toaster />
    </div>
  );
}
