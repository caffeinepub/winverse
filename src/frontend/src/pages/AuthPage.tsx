import { useEffect, useState } from "react";
import { toast } from "sonner";
import { setStoredUserId } from "../lib/auth";
import { backendService } from "../lib/backend";

interface Props {
  onLogin: (id: bigint) => void;
  prefilledReferralCode?: string;
}

export default function AuthPage({
  onLogin,
  prefilledReferralCode = "",
}: Props) {
  const [tab, setTab] = useState<"login" | "signup">(
    prefilledReferralCode ? "signup" : "login",
  );
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [referralCode, setReferralCode] = useState(prefilledReferralCode);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (prefilledReferralCode) {
      setReferralCode(prefilledReferralCode);
      setTab("signup");
    }
  }, [prefilledReferralCode]);

  async function handleSignup() {
    if (!phone.trim()) return toast.error("Phone number required");
    if (!password.trim()) return toast.error("Password required");
    if (password !== confirmPass) return toast.error("Passwords do not match");
    if (phone.trim().length < 10)
      return toast.error("Enter valid 10-digit phone number");
    if (password.length < 6)
      return toast.error("Password must be at least 6 characters");

    setLoading(true);
    try {
      const [userId, msg] = await backendService.signup(phone.trim(), password);
      if (userId === BigInt(0)) {
        toast.error(msg || "Signup failed. Please try again.");
        return;
      }
      // Process referral if provided
      if (referralCode.trim()) {
        await backendService.processReferral(
          userId,
          referralCode.trim().toUpperCase(),
        );
      }
      setStoredUserId(userId);
      toast.success(msg || "Account created! ₹200 bonus credited.");
      onLogin(userId);
    } catch (err) {
      console.error("signup exception", err);
      toast.error("Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin() {
    if (!phone.trim()) return toast.error("Phone number required");
    if (!password.trim()) return toast.error("Password required");

    setLoading(true);
    try {
      const result = await backendService.login(phone.trim(), password);
      if (result.length === 0) {
        toast.error("Incorrect phone number or password");
        return;
      }
      const userId = result[0]!;
      setStoredUserId(userId);
      toast.success("Welcome back!");
      onLogin(userId);
    } catch (err) {
      console.error("login exception", err);
      toast.error("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    background: "rgba(38,38,38,0.8)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "10px",
    color: "#fff",
    padding: "12px 16px",
    width: "100%",
    fontSize: "15px",
    outline: "none",
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{
        background:
          "radial-gradient(ellipse at 50% 20%, rgba(0,255,65,0.06) 0%, #0e0e0e 60%)",
      }}
    >
      <div
        className="w-full max-w-[400px] rounded-2xl p-8"
        style={{
          background: "rgba(26,25,25,0.85)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.06)",
          boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
        }}
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <h1
            className="text-4xl font-black italic"
            style={{
              fontFamily: "Plus Jakarta Sans",
              color: "#9cff93",
              textShadow: "0 0 20px rgba(0,255,65,0.5)",
            }}
          >
            Winverse
          </h1>
          <p style={{ color: "#adaaaa", fontSize: "13px", marginTop: "4px" }}>
            Colour Prediction Game
          </p>
          {prefilledReferralCode && (
            <div
              className="mt-3 text-sm rounded-xl px-4 py-2"
              style={{
                background: "rgba(0,255,65,0.1)",
                color: "#9cff93",
                border: "1px solid rgba(0,255,65,0.25)",
              }}
            >
              🎁 You were invited! Sign up to claim your bonus.
            </div>
          )}
        </div>

        {/* Tab Toggle */}
        <div
          className="flex rounded-xl p-1 mb-6"
          style={{ background: "#262626" }}
        >
          {(["login", "signup"] as const).map((t) => (
            <button
              type="button"
              key={t}
              onClick={() => setTab(t)}
              className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all"
              style={{
                background: tab === t ? "#9cff93" : "transparent",
                color: tab === t ? "#0e0e0e" : "#adaaaa",
                fontFamily: "Plus Jakarta Sans",
              }}
            >
              {t === "login" ? "Login" : "Sign Up"}
            </button>
          ))}
        </div>

        {/* Form */}
        <div className="space-y-4">
          <input
            style={inputStyle}
            type="tel"
            placeholder="Phone Number (10 digits)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" && (tab === "login" ? handleLogin() : undefined)
            }
          />
          <input
            style={inputStyle}
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" && (tab === "login" ? handleLogin() : undefined)
            }
          />
          {tab === "signup" && (
            <>
              <input
                style={inputStyle}
                type="password"
                placeholder="Confirm Password"
                value={confirmPass}
                onChange={(e) => setConfirmPass(e.target.value)}
              />
              <input
                style={{
                  ...inputStyle,
                  border: referralCode
                    ? "1px solid rgba(0,255,65,0.4)"
                    : inputStyle.border,
                  color: referralCode ? "#9cff93" : "#fff",
                }}
                type="text"
                placeholder="Referral Code (Optional)"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                readOnly={!!prefilledReferralCode}
              />
            </>
          )}

          <button
            type="button"
            onClick={tab === "login" ? handleLogin : handleSignup}
            disabled={loading}
            className="w-full py-3 rounded-xl font-bold text-base transition-all"
            style={{
              background: loading ? "#4a7a47" : "#9cff93",
              color: "#0e0e0e",
              fontFamily: "Plus Jakarta Sans",
              boxShadow: loading ? "none" : "0 0 20px rgba(0,255,65,0.3)",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading
              ? "Please wait..."
              : tab === "login"
                ? "Login"
                : "Create Account"}
          </button>

          {tab === "signup" && (
            <div
              className="text-center text-sm rounded-xl p-3"
              style={{
                background: "rgba(0,255,65,0.08)",
                color: "#9cff93",
                border: "1px solid rgba(0,255,65,0.2)",
              }}
            >
              🎁 New users get ₹200 signup bonus!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
