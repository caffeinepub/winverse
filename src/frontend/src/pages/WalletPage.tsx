import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  type DepositRequestPublic,
  type UserPublic,
  type WithdrawRequestPublic,
  backendService,
} from "../lib/backend";

interface Props {
  userId: bigint;
}

export default function WalletPage({ userId }: Props) {
  const [tab, setTab] = useState<"deposit" | "withdraw">("deposit");
  const [user, setUser] = useState<UserPublic | null>(null);
  const [depositAmount, setDepositAmount] = useState("");
  const [utrNumber, setUtrNumber] = useState("");
  const [screenshotUrl, setScreenshotUrl] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [upiId, setUpiId] = useState("");
  const [deposits, setDeposits] = useState<DepositRequestPublic[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawRequestPublic[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    backendService.getUserById(userId).then((r) => {
      if (r.length > 0) setUser(r[0]!);
    });
    backendService.getUserDepositRequests(userId).then(setDeposits);
    backendService.getUserWithdrawRequests(userId).then(setWithdrawals);
  }, [userId]);

  function copy(text: string) {
    navigator.clipboard.writeText(text);
    toast.success("Copied!");
  }

  async function handleDeposit() {
    const amount = Number.parseFloat(depositAmount);
    if (!amount || amount < 100) return toast.error("Minimum deposit ₹100");
    if (!utrNumber) return toast.error("Enter UTR number");
    setLoading(true);
    try {
      const res = await backendService.createDepositRequest(
        userId,
        amount,
        utrNumber,
        screenshotUrl || "N/A",
      );
      if (res.length === 0) return toast.error("Request failed");
      toast.success("Deposit request submitted! Awaiting admin approval.");
      setDepositAmount("");
      setUtrNumber("");
      setScreenshotUrl("");
      const updated = await backendService.getUserDepositRequests(userId);
      setDeposits(updated);
    } finally {
      setLoading(false);
    }
  }

  async function handleWithdraw() {
    const amount = Number.parseFloat(withdrawAmount);
    if (!amount || amount < 100) return toast.error("Minimum withdrawal ₹100");
    if (!upiId) return toast.error("Enter UPI ID");
    setLoading(true);
    try {
      const res = await backendService.createWithdrawRequest(
        userId,
        amount,
        upiId,
      );
      if (res.length === 0)
        return toast.error("Cannot withdraw. Ensure you have deposited ₹200+");
      toast.success("Withdrawal request submitted!");
      setWithdrawAmount("");
      setUpiId("");
      const updated = await backendService.getUserWithdrawRequests(userId);
      setWithdrawals(updated);
    } finally {
      setLoading(false);
    }
  }

  function statusBadge(status: string) {
    const styles: Record<string, { bg: string; color: string }> = {
      pending: { bg: "rgba(255,200,0,0.15)", color: "#FFD700" },
      approved: { bg: "rgba(0,255,65,0.15)", color: "#9cff93" },
      rejected: { bg: "rgba(255,113,98,0.15)", color: "#ff7162" },
    };
    const s = styles[status] || styles.pending;
    return (
      <span
        className="text-xs px-2 py-0.5 rounded-full font-semibold"
        style={{ background: s.bg, color: s.color }}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  }

  const inputStyle = {
    background: "#262626",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "10px",
    color: "#fff",
    padding: "12px 16px",
    width: "100%",
    fontSize: "14px",
    outline: "none",
  };

  const canWithdraw = user?.hasDeposited && user.totalDeposited >= 200;

  return (
    <div
      style={{
        background: "#0e0e0e",
        minHeight: "100vh",
        paddingBottom: "80px",
      }}
    >
      {/* Header with Balance */}
      <div
        className="px-4 pt-6 pb-5"
        style={{
          background:
            "linear-gradient(180deg, rgba(0,255,65,0.06) 0%, transparent 100%)",
        }}
      >
        <p className="text-sm" style={{ color: "#adaaaa" }}>
          Your Balance
        </p>
        <p
          className="text-4xl font-black mt-1"
          style={{
            fontFamily: "Plus Jakarta Sans",
            color: "#9cff93",
            textShadow: "0 0 20px rgba(0,255,65,0.4)",
          }}
        >
          ₹{user ? user.balance.toFixed(2) : "0.00"}
        </p>
      </div>

      {/* Tab Toggle */}
      <div className="px-4 mb-4">
        <div className="flex rounded-xl p-1" style={{ background: "#1a1919" }}>
          {(["deposit", "withdraw"] as const).map((t) => (
            <button
              type="button"
              key={t}
              onClick={() => setTab(t)}
              className="flex-1 py-2.5 rounded-lg text-sm font-bold capitalize transition-all"
              style={{
                background: tab === t ? "#9cff93" : "transparent",
                color: tab === t ? "#0e0e0e" : "#adaaaa",
                fontFamily: "Plus Jakarta Sans",
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 space-y-4">
        {tab === "deposit" && (
          <>
            {/* Deposit Form */}
            <div
              className="rounded-2xl p-5 space-y-4"
              style={{
                background: "rgba(26,25,25,0.7)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <div
                className="rounded-xl p-3 flex items-center justify-between"
                style={{
                  background: "rgba(0,255,65,0.08)",
                  border: "1px solid rgba(0,255,65,0.2)",
                }}
              >
                <span
                  className="text-sm font-semibold"
                  style={{ color: "#9cff93" }}
                >
                  🎁 First deposit gets 100% bonus!
                </span>
              </div>

              <input
                style={inputStyle}
                type="number"
                placeholder="Amount (₹100 minimum)"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
              />

              {/* UPI ID */}
              <div>
                <p
                  className="text-xs font-semibold mb-2"
                  style={{ color: "#adaaaa" }}
                >
                  SEND PAYMENT TO
                </p>
                <div
                  className="flex items-center justify-between rounded-xl px-4 py-3"
                  style={{
                    background: "#262626",
                    border: "1px solid rgba(255,255,255,0.08)",
                    fontFamily: "monospace",
                  }}
                >
                  <span style={{ color: "#9cff93", fontSize: "15px" }}>
                    winverse@naviaxis
                  </span>
                  <button
                    type="button"
                    onClick={() => copy("winverse@naviaxis")}
                    style={{ color: "#adaaaa", fontSize: "18px" }}
                  >
                    📋
                  </button>
                </div>
              </div>

              {/* QR Placeholder */}
              <div
                className="rounded-xl flex items-center justify-center"
                style={{
                  background: "#262626",
                  border: "1px dashed rgba(255,255,255,0.1)",
                  height: "150px",
                }}
              >
                <div className="text-center">
                  <div style={{ fontSize: "48px" }}>📱</div>
                  <p className="text-sm" style={{ color: "#adaaaa" }}>
                    QR Code
                  </p>
                  <p className="text-xs" style={{ color: "#555" }}>
                    winverse@naviaxis
                  </p>
                </div>
              </div>

              <input
                style={inputStyle}
                type="text"
                placeholder="UTR Number (12-digit transaction ID)"
                value={utrNumber}
                onChange={(e) => setUtrNumber(e.target.value)}
              />
              <input
                style={inputStyle}
                type="text"
                placeholder="Screenshot URL (optional)"
                value={screenshotUrl}
                onChange={(e) => setScreenshotUrl(e.target.value)}
              />

              <button
                type="button"
                onClick={handleDeposit}
                disabled={loading}
                className="w-full py-3.5 rounded-xl font-bold"
                style={{
                  background: loading ? "#4a7a47" : "#9cff93",
                  color: "#0e0e0e",
                  fontFamily: "Plus Jakarta Sans",
                  boxShadow: "0 0 20px rgba(0,255,65,0.3)",
                }}
              >
                {loading ? "Submitting..." : "Submit Deposit Request"}
              </button>
            </div>

            {/* Deposit History */}
            {deposits.length > 0 && (
              <div
                className="rounded-2xl p-4"
                style={{
                  background: "rgba(26,25,25,0.7)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <p
                  className="font-semibold mb-3"
                  style={{ fontFamily: "Plus Jakarta Sans" }}
                >
                  Deposit History
                </p>
                {deposits.map((d) => (
                  <div
                    key={d.id.toString()}
                    className="flex justify-between items-center py-2"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                  >
                    <div>
                      <p className="text-sm font-semibold">
                        ₹{d.amount.toFixed(2)}
                      </p>
                      <p className="text-xs" style={{ color: "#adaaaa" }}>
                        UTR: {d.utrNumber}
                      </p>
                    </div>
                    {statusBadge(d.status)}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {tab === "withdraw" && (
          <>
            {!canWithdraw ? (
              <div
                className="rounded-2xl p-6 text-center"
                style={{
                  background: "rgba(26,25,25,0.7)",
                  border: "1px solid rgba(255,113,98,0.2)",
                }}
              >
                <div style={{ fontSize: "48px", marginBottom: "12px" }}>🔒</div>
                <p
                  className="font-bold text-lg mb-2"
                  style={{ fontFamily: "Plus Jakarta Sans", color: "#ff7162" }}
                >
                  Withdrawal Locked
                </p>
                <p className="text-sm" style={{ color: "#adaaaa" }}>
                  Deposit a total of ₹200 or more to unlock withdrawals.
                </p>
                <p className="text-sm mt-2" style={{ color: "#adaaaa" }}>
                  Current deposits:{" "}
                  <span style={{ color: "#9cff93" }}>
                    ₹{user?.totalDeposited.toFixed(2) || "0.00"}
                  </span>
                </p>
              </div>
            ) : (
              <div
                className="rounded-2xl p-5 space-y-4"
                style={{
                  background: "rgba(26,25,25,0.7)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <input
                  style={inputStyle}
                  type="number"
                  placeholder="Amount (₹100 minimum)"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                />
                <input
                  style={inputStyle}
                  type="text"
                  placeholder="Your UPI ID"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                />
                <button
                  type="button"
                  onClick={handleWithdraw}
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl font-bold"
                  style={{
                    background: loading ? "#4a4a4a" : "#00cffc",
                    color: "#0e0e0e",
                    fontFamily: "Plus Jakarta Sans",
                    boxShadow: "0 0 20px rgba(0,207,252,0.3)",
                  }}
                >
                  {loading ? "Submitting..." : "Submit Withdrawal Request"}
                </button>
              </div>
            )}

            {/* Withdrawal History */}
            {withdrawals.length > 0 && (
              <div
                className="rounded-2xl p-4"
                style={{
                  background: "rgba(26,25,25,0.7)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <p
                  className="font-semibold mb-3"
                  style={{ fontFamily: "Plus Jakarta Sans" }}
                >
                  Withdrawal History
                </p>
                {withdrawals.map((w) => (
                  <div
                    key={w.id.toString()}
                    className="flex justify-between items-center py-2"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                  >
                    <div>
                      <p className="text-sm font-semibold">
                        ₹{w.amount.toFixed(2)}
                      </p>
                      <p className="text-xs" style={{ color: "#adaaaa" }}>
                        UPI: {w.upiId}
                      </p>
                    </div>
                    {statusBadge(w.status)}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
