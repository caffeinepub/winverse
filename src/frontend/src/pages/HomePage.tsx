import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import WinAnimation from "../components/WinAnimation";
import {
  type BetPublic,
  type RoundPublic,
  backendService,
} from "../lib/backend";

interface Props {
  userId: bigint;
  onBalanceUpdate: () => void;
}

type ColourOption = "green" | "violet" | "red";
type SizeOption = "big" | "small";

function getColourDot(colour: string): string {
  const map: Record<string, string> = {
    green: "#9cff93",
    violet: "#00cffc",
    red: "#ff7162",
  };
  return map[colour] ?? "#888";
}

export default function HomePage({ userId }: Props) {
  const [balance, setBalance] = useState(0);
  const [round, setRound] = useState<RoundPublic | null>(null);
  const [history, setHistory] = useState<RoundPublic[]>([]);
  const [timeLeft, setTimeLeft] = useState(30);
  const [selectedColour, setSelectedColour] = useState<ColourOption | null>(
    null,
  );
  const [selectedSize, setSelectedSize] = useState<SizeOption | null>(null);
  const [betAmount, setBetAmount] = useState(20);
  const [customAmount, setCustomAmount] = useState("");
  const [roundBets, setRoundBets] = useState<BetPublic[]>([]);
  const [animation, setAnimation] = useState<{
    type: "win" | "loss";
    amount?: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  // Stable refs to avoid stale closures
  const roundBetsRef = useRef<BetPublic[]>([]);
  const lastRoundIdRef = useRef<bigint | null>(null);
  const userIdRef = useRef(userId);
  userIdRef.current = userId;

  function updateRoundBets(bets: BetPublic[]) {
    roundBetsRef.current = bets;
    setRoundBets(bets);
  }

  // Stable function refs - always point to latest implementation
  const fetchUserRef = useRef(async () => {
    const res = await backendService.getUserById(userIdRef.current);
    if (res.length > 0) setBalance(res[0]!.balance);
  });

  const fetchHistoryRef = useRef(async () => {
    const res = await backendService.getRoundHistory(BigInt(10));
    setHistory(res);
  });

  const fetchRoundRef = useRef(async () => {
    const res = await backendService.getCurrentRound();
    if (res.length > 0) {
      const r = res[0]!;
      setRound(r);
      const endMs = Number(r.endTime) / 1_000_000;
      const diff = Math.max(0, Math.floor((endMs - Date.now()) / 1000));
      setTimeLeft(diff);

      if (lastRoundIdRef.current !== null && lastRoundIdRef.current !== r.id) {
        const prevBets = roundBetsRef.current;
        if (prevBets.length > 0) {
          try {
            const history2 = await backendService.getUserBetHistory(
              userIdRef.current,
            );
            const updatedBets = history2.filter(
              (b) => b.roundId === lastRoundIdRef.current,
            );
            const wonBets = updatedBets.filter((b) => b.status === "won");
            const lostBets = updatedBets.filter((b) => b.status === "lost");
            if (wonBets.length > 0) {
              const totalWin = wonBets.reduce((s, b) => s + b.winAmount, 0);
              setAnimation({ type: "win", amount: totalWin });
            } else if (lostBets.length > 0) {
              setAnimation({ type: "loss" });
            }
            const userRes = await backendService.getUserById(userIdRef.current);
            if (userRes.length > 0) setBalance(userRes[0]!.balance);
          } catch {
            // ignore
          }
        }
        updateRoundBets([]);
        setSelectedColour(null);
        setSelectedSize(null);
      }
      lastRoundIdRef.current = r.id;
    }
  });

  useEffect(() => {
    // Initial load
    fetchUserRef.current();
    fetchRoundRef.current();
    fetchHistoryRef.current();

    // Countdown - ticks every second, stable, never resets
    const ticker = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    // Poll backend every 3 seconds
    const poller = setInterval(() => {
      fetchRoundRef.current();
      fetchHistoryRef.current();
    }, 3000);

    return () => {
      clearInterval(ticker);
      clearInterval(poller);
    };
  }, []);

  const isLocked = timeLeft <= 10;
  const betCount = roundBets.length;
  const presets = [20, 50, 100, 500, 1000];
  const timerPercent = (timeLeft / 30) * 100;

  async function handlePlaceBet() {
    const amount = customAmount ? Number.parseFloat(customAmount) : betAmount;
    if (!amount || Number.isNaN(amount))
      return toast.error("Enter valid amount");
    if (!selectedColour && !selectedSize)
      return toast.error("Select colour or size");
    if (isLocked) return toast.error("Bets are locked!");
    if (betCount >= 3) return toast.error("Max 3 bets per round");
    if (amount > balance) return toast.error("Insufficient balance");
    if (!round) return toast.error("No active round");
    setLoading(true);
    try {
      if (selectedColour) {
        const res = await backendService.placeBet(
          userId,
          round.id,
          "colour",
          selectedColour,
          amount,
        );
        if (res.length === 0) {
          toast.error("Bet failed");
          return;
        }
        const newBet: BetPublic = {
          id: res[0]!,
          userId,
          roundId: round.id,
          betType: "colour",
          betValue: selectedColour,
          amount,
          status: "pending",
          winAmount: 0,
          placedAt: BigInt(Date.now()),
        };
        updateRoundBets([...roundBetsRef.current, newBet]);
        setBalance((prev) => prev - amount);
        toast.success(`Bet placed: ₹${amount} on ${selectedColour}`);
      }
      if (selectedSize) {
        const res2 = await backendService.placeBet(
          userId,
          round.id,
          "size",
          selectedSize,
          amount,
        );
        if (res2.length === 0) {
          toast.error("Size bet failed");
          return;
        }
        const newBet2: BetPublic = {
          id: res2[0]!,
          userId,
          roundId: round.id,
          betType: "size",
          betValue: selectedSize,
          amount,
          status: "pending",
          winAmount: 0,
          placedAt: BigInt(Date.now()),
        };
        updateRoundBets([...roundBetsRef.current, newBet2]);
        setBalance((prev) => prev - amount);
        toast.success(`Bet placed: ₹${amount} on ${selectedSize}`);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen"
      style={{ background: "#0e0e0e", paddingBottom: "80px" }}
    >
      {animation && (
        <WinAnimation
          type={animation.type}
          amount={animation.amount}
          onClose={() => setAnimation(null)}
        />
      )}

      {/* Navbar */}
      <div
        className="flex items-center justify-between px-4 py-3 sticky top-0 z-40"
        style={{
          background: "rgba(14,14,14,0.95)",
          backdropFilter: "blur(10px)",
          borderBottom: "1px solid rgba(255,255,255,0.04)",
        }}
      >
        <h1
          className="text-2xl font-black italic"
          style={{
            fontFamily: "Plus Jakarta Sans",
            color: "#9cff93",
            textShadow: "0 0 10px rgba(0,255,65,0.4)",
          }}
        >
          Winverse
        </h1>
        <div className="flex items-center gap-3">
          <div
            className="px-3 py-1.5 rounded-xl font-bold text-sm"
            style={{
              background: "rgba(0,255,65,0.1)",
              color: "#9cff93",
              border: "1px solid rgba(0,255,65,0.2)",
            }}
          >
            ₹{balance.toFixed(2)}
          </div>
          <span style={{ color: "#adaaaa", fontSize: "20px" }}>🔔</span>
        </div>
      </div>

      <div className="px-4 pt-3 space-y-4">
        {/* Promo Banner */}
        <div
          className="rounded-2xl p-4 flex items-center justify-between"
          style={{
            background:
              "linear-gradient(135deg, rgba(0,255,65,0.15) 0%, rgba(0,207,252,0.1) 100%)",
            border: "1px solid rgba(0,255,65,0.2)",
          }}
        >
          <div>
            <p
              className="font-bold text-sm"
              style={{ color: "#9cff93", fontFamily: "Plus Jakarta Sans" }}
            >
              🎁 1st Deposit Pe 100% Bonus!
            </p>
            <p className="text-xs mt-1" style={{ color: "#adaaaa" }}>
              Deposit karo, double pao
            </p>
          </div>
          <button
            type="button"
            className="px-4 py-2 rounded-xl text-sm font-bold"
            style={{
              background: "#9cff93",
              color: "#0e0e0e",
              fontFamily: "Plus Jakarta Sans",
            }}
          >
            Claim
          </button>
        </div>

        {/* Game Card */}
        <div
          className="rounded-2xl p-5"
          style={{
            background: "rgba(26,25,25,0.7)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          {/* Timer */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs" style={{ color: "#adaaaa" }}>
                Period
              </p>
              <p
                className="font-bold text-lg"
                style={{ fontFamily: "Plus Jakarta Sans" }}
              >
                #{round ? round.id.toString() : "..."}
              </p>
            </div>
            <div className="text-right">
              <div
                className="text-5xl font-black tabular-nums"
                style={{
                  fontFamily: "Plus Jakarta Sans",
                  color: isLocked ? "#ff7162" : "#9cff93",
                  textShadow: isLocked
                    ? "0 0 15px rgba(255,113,98,0.5)"
                    : "0 0 15px rgba(0,255,65,0.4)",
                }}
              >
                {String(timeLeft).padStart(2, "0")}
              </div>
              {isLocked && (
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-md"
                  style={{
                    background: "rgba(255,113,98,0.15)",
                    color: "#ff7162",
                    border: "1px solid rgba(255,113,98,0.3)",
                  }}
                >
                  🔒 BETS LOCKED
                </span>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div
            className="w-full h-1.5 rounded-full mb-5"
            style={{ background: "#262626" }}
          >
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{
                width: `${timerPercent}%`,
                background: isLocked ? "#ff7162" : "#9cff93",
                boxShadow: isLocked
                  ? "0 0 8px rgba(255,113,98,0.5)"
                  : "0 0 8px rgba(0,255,65,0.5)",
              }}
            />
          </div>

          {/* Colour Buttons */}
          <p
            className="text-xs font-semibold mb-3"
            style={{ color: "#adaaaa" }}
          >
            SELECT COLOUR
          </p>
          <div className="flex gap-3 justify-center mb-5">
            {[
              {
                value: "green" as ColourOption,
                label: "Green",
                bg: "#9cff93",
                shadow: "rgba(0,255,65,0.4)",
              },
              {
                value: "violet" as ColourOption,
                label: "Violet",
                bg: "#00cffc",
                shadow: "rgba(0,207,252,0.4)",
              },
              {
                value: "red" as ColourOption,
                label: "Red",
                bg: "#ff7162",
                shadow: "rgba(255,113,98,0.4)",
              },
            ].map(({ value, label, bg, shadow }) => (
              <button
                type="button"
                key={value}
                onClick={() =>
                  !isLocked &&
                  setSelectedColour(selectedColour === value ? null : value)
                }
                disabled={isLocked}
                className="flex flex-col items-center gap-2 transition-all"
                style={{ opacity: isLocked ? 0.5 : 1 }}
              >
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center transition-all"
                  style={{
                    background: selectedColour === value ? bg : `${bg}22`,
                    border: `3px solid ${bg}`,
                    boxShadow:
                      selectedColour === value
                        ? `0 0 20px ${shadow}, 0 0 40px ${shadow}`
                        : "none",
                    transform:
                      selectedColour === value ? "scale(1.1)" : "scale(1)",
                  }}
                >
                  {selectedColour === value && (
                    <span style={{ fontSize: "24px" }}>✓</span>
                  )}
                </div>
                <span
                  className="text-xs font-semibold"
                  style={{ color: selectedColour === value ? bg : "#adaaaa" }}
                >
                  {label}
                </span>
              </button>
            ))}
          </div>

          {/* Big/Small */}
          <p
            className="text-xs font-semibold mb-3"
            style={{ color: "#adaaaa" }}
          >
            SELECT SIZE
          </p>
          <div className="flex gap-3 mb-5">
            {(["big", "small"] as SizeOption[]).map((s) => (
              <button
                type="button"
                key={s}
                onClick={() =>
                  !isLocked && setSelectedSize(selectedSize === s ? null : s)
                }
                disabled={isLocked}
                className="flex-1 py-3 rounded-xl font-bold capitalize transition-all"
                style={{
                  background:
                    selectedSize === s ? "rgba(0,255,65,0.15)" : "#262626",
                  border: `2px solid ${selectedSize === s ? "#9cff93" : "rgba(255,255,255,0.08)"}`,
                  color: selectedSize === s ? "#9cff93" : "#adaaaa",
                  boxShadow:
                    selectedSize === s ? "0 0 12px rgba(0,255,65,0.3)" : "none",
                  opacity: isLocked ? 0.5 : 1,
                }}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>

          {/* Bet Amount */}
          <p
            className="text-xs font-semibold mb-3"
            style={{ color: "#adaaaa" }}
          >
            BET AMOUNT
          </p>
          <div className="flex gap-2 flex-wrap mb-3">
            {presets.map((amt) => (
              <button
                type="button"
                key={amt}
                onClick={() => {
                  setBetAmount(amt);
                  setCustomAmount("");
                }}
                className="px-3 py-2 rounded-lg text-sm font-semibold transition-all"
                style={{
                  background:
                    betAmount === amt && !customAmount
                      ? "rgba(0,255,65,0.15)"
                      : "#262626",
                  border: `1px solid ${betAmount === amt && !customAmount ? "#9cff93" : "rgba(255,255,255,0.08)"}`,
                  color:
                    betAmount === amt && !customAmount ? "#9cff93" : "#adaaaa",
                }}
              >
                ₹{amt}
              </button>
            ))}
          </div>
          <input
            type="number"
            placeholder="Custom amount"
            value={customAmount}
            onChange={(e) => {
              setCustomAmount(e.target.value);
              setBetAmount(0);
            }}
            className="w-full rounded-xl px-4 py-2.5 text-sm mb-4"
            style={{
              background: "#262626",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#fff",
              outline: "none",
            }}
          />

          <div className="flex items-center justify-between mb-3">
            <span className="text-xs" style={{ color: "#adaaaa" }}>
              {betCount}/3 bets this round
            </span>
            <span className="text-xs" style={{ color: "#adaaaa" }}>
              Balance: ₹{balance.toFixed(0)}
            </span>
          </div>

          <button
            type="button"
            onClick={handlePlaceBet}
            disabled={isLocked || loading || betCount >= 3}
            className="w-full py-4 rounded-xl font-bold text-base transition-all"
            style={{
              background: isLocked || betCount >= 3 ? "#2a2a2a" : "#9cff93",
              color: isLocked || betCount >= 3 ? "#555" : "#0e0e0e",
              fontFamily: "Plus Jakarta Sans",
              boxShadow:
                isLocked || betCount >= 3
                  ? "none"
                  : "0 0 20px rgba(0,255,65,0.3)",
              fontSize: "16px",
            }}
          >
            {loading
              ? "Placing..."
              : isLocked
                ? "🔒 Bets Locked"
                : betCount >= 3
                  ? "Max Bets Reached"
                  : "🎯 Place Bet"}
          </button>
        </div>

        {/* Current Bets */}
        {roundBets.length > 0 && (
          <div
            className="rounded-2xl p-4"
            style={{
              background: "rgba(26,25,25,0.7)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <p
              className="text-xs font-semibold mb-2"
              style={{ color: "#adaaaa" }}
            >
              YOUR BETS THIS ROUND
            </p>
            {roundBets.map((b) => (
              <div
                key={b.id.toString()}
                className="flex justify-between text-sm py-1"
              >
                <span style={{ color: "#fff" }}>
                  {b.betValue.toUpperCase()}
                </span>
                <span style={{ color: "#9cff93" }}>₹{b.amount.toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Game History */}
        <div
          className="rounded-2xl p-4"
          style={{
            background: "rgba(26,25,25,0.7)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <p
            className="font-semibold mb-3"
            style={{ fontFamily: "Plus Jakarta Sans", color: "#fff" }}
          >
            Game History
          </p>
          <table className="w-full text-sm">
            <thead>
              <tr
                style={{
                  color: "#adaaaa",
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <th className="text-left py-2">Period</th>
                <th className="text-center py-2">Colour</th>
                <th className="text-center py-2">Size</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 && (
                <tr>
                  <td
                    colSpan={3}
                    className="text-center py-4"
                    style={{ color: "#adaaaa" }}
                  >
                    No history yet
                  </td>
                </tr>
              )}
              {history.map((r) => {
                const result = r.result.length > 0 ? r.result[0] : null;
                return (
                  <tr
                    key={r.id.toString()}
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}
                  >
                    <td className="py-2" style={{ color: "#adaaaa" }}>
                      #{r.id.toString()}
                    </td>
                    <td className="py-2 text-center">
                      {result && (
                        <span className="flex items-center justify-center gap-1.5">
                          <span
                            className="inline-block w-3 h-3 rounded-full"
                            style={{ background: getColourDot(result.colour) }}
                          />
                          <span style={{ color: "#fff", fontSize: "12px" }}>
                            {result.colour}
                          </span>
                        </span>
                      )}
                    </td>
                    <td className="py-2 text-center">
                      {result && (
                        <span
                          className="px-2 py-0.5 rounded text-xs font-medium"
                          style={{
                            background:
                              result.size === "big"
                                ? "rgba(0,207,252,0.15)"
                                : "rgba(255,113,98,0.15)",
                            color:
                              result.size === "big" ? "#00cffc" : "#ff7162",
                          }}
                        >
                          {result.size}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
