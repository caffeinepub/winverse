import { useEffect, useState } from "react";
import { toast } from "sonner";
import { backendService } from "../lib/backend";

interface Props {
  userId: bigint;
}

export default function ReferralPage({ userId }: Props) {
  const [code, setCode] = useState("");
  const [count, setCount] = useState(0);
  const [earnings, setEarnings] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    backendService
      .getReferralInfo(userId)
      .then((res) => {
        if (cancelled) return;
        if (res.length > 0) {
          const info = res[0]!;
          // info is [string, bigint, number]
          setCode(String(info[0]));
          setCount(Number(info[1]));
          setEarnings(Number(info[2]));
        }
      })
      .catch(() => {
        /* ignore */
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const referralLink = code ? `${window.location.origin}?ref=${code}` : "";

  function copy(text: string, label: string) {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`);
  }

  const cardStyle = {
    background: "rgba(26,25,25,0.7)",
    backdropFilter: "blur(12px)" as const,
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "16px",
    padding: "20px",
  };

  return (
    <div
      style={{
        background: "#0e0e0e",
        minHeight: "100vh",
        paddingBottom: "80px",
      }}
    >
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <h1
          className="text-2xl font-black"
          style={{ fontFamily: "Plus Jakarta Sans", color: "#fff" }}
        >
          Referral
        </h1>
        <p className="text-sm mt-1" style={{ color: "#adaaaa" }}>
          Earn \u20B930 bonus for each referral (3 free bets \xd7 \u20B910 each)
        </p>
      </div>

      <div className="px-4 space-y-4">
        {/* Referral Code */}
        <div style={cardStyle}>
          <p
            className="text-xs font-semibold mb-3"
            style={{ color: "#adaaaa" }}
          >
            YOUR REFERRAL CODE
          </p>
          <div className="flex items-center gap-3">
            <div
              className="flex-1 text-center text-3xl font-black tracking-widest py-4 rounded-xl"
              style={{
                fontFamily: "Plus Jakarta Sans",
                color: loading ? "#555" : "#9cff93",
                background: "rgba(0,255,65,0.08)",
                border: "1px solid rgba(0,255,65,0.2)",
                textShadow: loading ? "none" : "0 0 15px rgba(0,255,65,0.4)",
                letterSpacing: "0.3em",
                minHeight: "72px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {loading ? "Loading..." : code || "------"}
            </div>
            <button
              type="button"
              onClick={() => copy(code, "Code")}
              disabled={loading || !code}
              className="p-3 rounded-xl flex-shrink-0"
              style={{
                background: "rgba(0,255,65,0.1)",
                color: "#9cff93",
                border: "1px solid rgba(0,255,65,0.2)",
                opacity: loading || !code ? 0.5 : 1,
              }}
            >
              \uD83D\uDCCB
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div style={{ ...cardStyle, textAlign: "center" }}>
            <p
              className="text-3xl font-black"
              style={{ fontFamily: "Plus Jakarta Sans", color: "#00cffc" }}
            >
              {count}
            </p>
            <p className="text-sm mt-1" style={{ color: "#adaaaa" }}>
              Total Referrals
            </p>
          </div>
          <div style={{ ...cardStyle, textAlign: "center" }}>
            <p
              className="text-3xl font-black"
              style={{ fontFamily: "Plus Jakarta Sans", color: "#9cff93" }}
            >
              \u20B9{earnings.toFixed(0)}
            </p>
            <p className="text-sm mt-1" style={{ color: "#adaaaa" }}>
              Total Earned
            </p>
          </div>
        </div>

        {/* How it works */}
        <div
          className="rounded-2xl p-5"
          style={{
            background:
              "linear-gradient(135deg, rgba(0,255,65,0.08) 0%, rgba(0,207,252,0.05) 100%)",
            border: "1px solid rgba(0,255,65,0.15)",
          }}
        >
          <p
            className="font-bold mb-3"
            style={{ color: "#9cff93", fontFamily: "Plus Jakarta Sans" }}
          >
            \uD83C\uDF1F How it works
          </p>
          <div className="space-y-2">
            {[
              { icon: "\uD83D\uDD17", text: "Share your unique referral link" },
              {
                icon: "\uD83D\uDC64",
                text: "Friend registers using your link",
              },
              {
                icon: "\uD83D\uDCB0",
                text: "You earn \u20B930 (3 free bets \xd7 \u20B910 max each)",
              },
              { icon: "\u267E\uFE0F", text: "Unlimited referrals, no cap!" },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-start gap-3">
                <span style={{ fontSize: "16px" }}>{icon}</span>
                <p
                  className="text-sm"
                  style={{ color: "#adaaaa", lineHeight: 1.5 }}
                >
                  {text}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Share Link */}
        {!loading && code && (
          <div style={cardStyle}>
            <p
              className="text-xs font-semibold mb-3"
              style={{ color: "#adaaaa" }}
            >
              SHARE LINK
            </p>
            <div
              className="text-sm py-3 px-4 rounded-xl mb-3 break-all"
              style={{
                background: "#262626",
                color: "#adaaaa",
                fontFamily: "monospace",
              }}
            >
              {referralLink}
            </div>
            <button
              type="button"
              onClick={() => copy(referralLink, "Link")}
              className="w-full py-3 rounded-xl font-bold"
              style={{
                background: "#9cff93",
                color: "#0e0e0e",
                fontFamily: "Plus Jakarta Sans",
                boxShadow: "0 0 20px rgba(0,255,65,0.3)",
              }}
            >
              \uD83D\uDCCB Copy Referral Link
            </button>
          </div>
        )}

        {/* Rules */}
        <div
          className="rounded-2xl p-4"
          style={{
            background: "rgba(0,207,252,0.04)",
            border: "1px solid rgba(0,207,252,0.1)",
          }}
        >
          <p className="text-xs font-bold mb-2" style={{ color: "#00cffc" }}>
            FREE BET RULES
          </p>
          <p className="text-xs" style={{ color: "#adaaaa", lineHeight: 1.6 }}>
            \u2022 Free bet amount: max \u20B910 per bet
            <br />
            \u2022 Free bets credited as \u20B930 wallet bonus
            <br />
            \u2022 No limit on number of referrals
          </p>
        </div>
      </div>
    </div>
  );
}
