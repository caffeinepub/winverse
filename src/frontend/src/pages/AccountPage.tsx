import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { clearStoredUserId } from "../lib/auth";
import { type UserPublic, backendService } from "../lib/backend";

interface Props {
  userId: bigint;
  onLogout: () => void;
}

export default function AccountPage({ userId, onLogout }: Props) {
  const [user, setUser] = useState<UserPublic | null>(null);
  const [loadingState, setLoadingState] = useState<
    "loading" | "done" | "error"
  >("loading");
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);

  const loadUser = useCallback(async () => {
    setLoadingState("loading");
    try {
      const r = await backendService.getUserById(userId);
      if (r.length > 0 && r[0]) {
        setUser(r[0]);
        setNewName(r[0].name);
        setLoadingState("done");
      } else {
        setLoadingState("error");
      }
    } catch {
      setLoadingState("error");
    }
  }, [userId]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  async function handleSaveName() {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      await backendService.updateUserName(userId, newName.trim());
      setUser((prev) => (prev ? { ...prev, name: newName.trim() } : prev));
      setEditingName(false);
      toast.success("Name updated!");
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    try {
      await backendService.logout(userId);
    } catch {
      // ignore errors during logout
    }
    clearStoredUserId();
    onLogout();
  }

  const cardStyle = {
    background: "rgba(26,25,25,0.7)",
    backdropFilter: "blur(12px)" as const,
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "16px",
    padding: "20px",
  };

  if (loadingState === "loading") {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-screen gap-4"
        style={{ color: "#adaaaa" }}
      >
        <div
          className="w-10 h-10 rounded-full border-2 animate-spin"
          style={{ borderColor: "#9cff93", borderTopColor: "transparent" }}
        />
        <p style={{ fontFamily: "Plus Jakarta Sans" }}>Loading account...</p>
      </div>
    );
  }

  if (loadingState === "error" || !user) {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-screen gap-5 px-8 text-center"
        style={{ background: "#0e0e0e" }}
      >
        <div style={{ fontSize: "56px" }}>⚠️</div>
        <h2
          className="text-xl font-black"
          style={{ fontFamily: "Plus Jakarta Sans", color: "#ff7162" }}
        >
          Account Load Failed
        </h2>
        <p className="text-sm" style={{ color: "#adaaaa", lineHeight: 1.6 }}>
          Could not load your account. Please try again.
        </p>
        <button
          type="button"
          onClick={loadUser}
          className="w-full py-3.5 rounded-xl font-bold text-sm"
          style={{
            background: "rgba(156,255,147,0.1)",
            color: "#9cff93",
            border: "1px solid rgba(156,255,147,0.3)",
            fontFamily: "Plus Jakarta Sans",
          }}
        >
          🔄 Retry
        </button>
        <button
          type="button"
          onClick={handleLogout}
          className="w-full py-3.5 rounded-xl font-bold text-sm"
          style={{
            background: "rgba(255,113,98,0.1)",
            color: "#ff7162",
            border: "1px solid rgba(255,113,98,0.3)",
            fontFamily: "Plus Jakarta Sans",
          }}
        >
          🚶 Logout
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        background: "#0e0e0e",
        minHeight: "100vh",
        paddingBottom: "80px",
      }}
    >
      <div className="px-4 pt-6 pb-2">
        <h1
          className="text-2xl font-black"
          style={{ fontFamily: "Plus Jakarta Sans" }}
        >
          Account
        </h1>
      </div>

      <div className="px-4 space-y-4">
        {/* Profile Card */}
        <div style={cardStyle}>
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-black flex-shrink-0"
              style={{
                background: "rgba(0,255,65,0.15)",
                border: "2px solid rgba(0,255,65,0.3)",
                color: "#9cff93",
                fontFamily: "Plus Jakarta Sans",
              }}
            >
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              {editingName ? (
                <div className="flex gap-2">
                  <input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="flex-1 rounded-lg px-3 py-2 text-sm min-w-0"
                    style={{
                      background: "#262626",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "#fff",
                      outline: "none",
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleSaveName}
                    disabled={saving}
                    className="px-3 py-2 rounded-lg text-sm font-bold flex-shrink-0"
                    style={{ background: "#9cff93", color: "#0e0e0e" }}
                  >
                    {saving ? "..." : "Save"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingName(false)}
                    className="px-3 py-2 rounded-lg text-sm flex-shrink-0"
                    style={{ background: "#262626", color: "#adaaaa" }}
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <p
                    className="font-bold text-lg truncate"
                    style={{ fontFamily: "Plus Jakarta Sans" }}
                  >
                    {user.name}
                  </p>
                  <button
                    type="button"
                    onClick={() => setEditingName(true)}
                    className="text-sm flex-shrink-0"
                    style={{ color: "#9cff93" }}
                  >
                    ✏️
                  </button>
                </div>
              )}
              <p className="text-sm" style={{ color: "#adaaaa" }}>
                ID: #{user.id.toString()}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          {[
            {
              label: "Balance",
              value: `₹${user.balance.toFixed(2)}`,
              color: "#9cff93",
            },
            {
              label: "Total Bets",
              value: user.totalBets.toString(),
              color: "#00cffc",
            },
            {
              label: "Total Winnings",
              value: `₹${user.totalWinnings.toFixed(2)}`,
              color: "#9cff93",
            },
            {
              label: "Referrals",
              value: user.referralCount.toString(),
              color: "#00cffc",
            },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ ...cardStyle, textAlign: "center" }}>
              <p
                className="text-xl font-black"
                style={{ color, fontFamily: "Plus Jakarta Sans" }}
              >
                {value}
              </p>
              <p className="text-xs mt-1" style={{ color: "#adaaaa" }}>
                {label}
              </p>
            </div>
          ))}
        </div>

        {/* Phone */}
        <div style={cardStyle}>
          <p
            className="text-xs font-semibold mb-2"
            style={{ color: "#adaaaa" }}
          >
            PHONE
          </p>
          <p className="font-semibold">{user.phone}</p>
        </div>

        {/* Referral Code */}
        <div style={cardStyle}>
          <p
            className="text-xs font-semibold mb-2"
            style={{ color: "#adaaaa" }}
          >
            REFERRAL CODE
          </p>
          <p
            className="text-xl font-black tracking-widest"
            style={{ color: "#9cff93", letterSpacing: "0.2em" }}
          >
            {user.referralCode}
          </p>
          <p className="text-xs mt-1" style={{ color: "#555" }}>
            Share to earn ₹30 per successful referral
          </p>
        </div>

        {/* Help Desk */}
        <div style={{ ...cardStyle, border: "1px solid rgba(0,207,252,0.15)" }}>
          <p
            className="font-bold mb-2"
            style={{ color: "#00cffc", fontFamily: "Plus Jakarta Sans" }}
          >
            🎟️ Help Desk
          </p>
          <p className="text-sm" style={{ color: "#adaaaa" }}>
            Need help? Contact us:
          </p>
          <a
            href="mailto:iamdevloper1309@gmail.com"
            className="text-sm font-semibold mt-1 block"
            style={{ color: "#9cff93" }}
          >
            iamdevloper1309@gmail.com
          </a>
          <p className="text-xs mt-2" style={{ color: "#555" }}>
            Send your query to the email above. We respond within 24 hours.
          </p>
        </div>

        {/* Logout */}
        <button
          type="button"
          onClick={handleLogout}
          className="w-full py-4 rounded-xl font-bold text-base"
          style={{
            background: "rgba(255,113,98,0.1)",
            color: "#ff7162",
            border: "1px solid rgba(255,113,98,0.3)",
            fontFamily: "Plus Jakarta Sans",
          }}
        >
          🚶 Logout
        </button>
      </div>
    </div>
  );
}
