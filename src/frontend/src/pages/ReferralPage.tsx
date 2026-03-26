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

  useEffect(() => {
    backendService.getReferralInfo(userId).then((res) => {
      if (res.length > 0) {
        const [c, n, e] = res[0]!;
        setCode(c);
        setCount(Number(n));
        setEarnings(e);
      }
    });
  }, [userId]);

  const referralLink = `${window.location.origin}?ref=${code}`;

  function copy(text: string, label: string) {
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
          Earn ₹30 bonus for each referral (3 free bets × ₹10 each)
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
                color: "#9cff93",
                background: "rgba(0,255,65,0.08)",
                border: "1px solid rgba(0,255,65,0.2)",
                textShadow: "0 0 15px rgba(0,255,65,0.4)",
                letterSpacing: "0.3em",
              }}
            >
              {code || "------"}
            </div>
            <button
              type="button"
              onClick={() => copy(code, "Code")}
              className="p-3 rounded-xl flex-shrink-0"
              style={{
                background: "rgba(0,255,65,0.1)",
                color: "#9cff93",
                border: "1px solid rgba(0,255,65,0.2)",
              }}
              data-ocid="referral.secondary_button"
            >
              📋
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
              ₹{earnings.toFixed(0)}
            </p>
            <p className="text-sm mt-1" style={{ color: "#adaaaa" }}>
              Total Earned
            </p>
          </div>
        </div>

        {/* Info Card */}
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
            🌟 How it works
          </p>
          <div className="space-y-2">
            {[
              { icon: "🔗", text: "Share your unique referral link" },
              { icon: "👤", text: "Friend registers using your link" },
              { icon: "💰", text: "You earn ₹30 (3 free bets × ₹10 max each)" },
              { icon: "♾️", text: "Unlimited referrals, no cap!" },
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
            data-ocid="referral.primary_button"
          >
            📋 Copy Referral Link
          </button>
        </div>

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
            • Free bet amount: max ₹10 per bet
            <br />• Free bets credited as ₹30 wallet bonus
            <br />• No limit on number of referrals
          </p>
        </div>
      </div>
    </div>
  );
}
