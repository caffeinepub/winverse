import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { clearAdminToken, getAdminToken, setAdminToken } from "../lib/auth";
import {
  type DepositRequestPublic,
  type RoundPublic,
  type UserPublic,
  type WithdrawRequestPublic,
  backendService,
} from "../lib/backend";

export default function AdminPage() {
  const [token, setToken] = useState<string | null>(getAdminToken());
  const [credential, setCredential] = useState("");
  const [password, setPassword] = useState("");
  const [activeTab, setActiveTab] = useState<
    "live" | "users" | "deposits" | "withdrawals" | "stats"
  >("live");

  // Live game state
  const [round, setRound] = useState<RoundPublic | null>(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const roundEndTimeRef = useRef<number>(Date.now() + 30000);
  const [roundBets, setRoundBets] = useState<Array<[string, bigint, number]>>(
    [],
  );
  const [manualColour, setManualColour] = useState("red");
  const [manualSize, setManualSize] = useState("big");
  const [randomMode, setRandomMode] = useState(true);
  const [lowestBetWinsMode, setLowestBetWinsMode] = useState(false);

  // Data
  const [users, setUsers] = useState<UserPublic[]>([]);
  const [search, setSearch] = useState("");
  const [deposits, setDeposits] = useState<DepositRequestPublic[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawRequestPublic[]>([]);
  const [stats, setStats] = useState<
    [bigint, bigint, number, number, bigint, number] | null
  >(null);

  const fetchLiveData = useCallback(async () => {
    if (!token) return;
    const r = await backendService.getCurrentRound();
    if (r.length > 0) {
      const rr = r[0]!;
      setRound(rr);
      const endMs = Number(rr.endTime) / 1_000_000;
      roundEndTimeRef.current = endMs;
    }
    const bets = await backendService.getCurrentRoundBets(token);
    setRoundBets(bets);
    const rm = await backendService.getRandomModeStatus(token);
    setRandomMode(rm);
    try {
      const lbw = await backendService.getLowestBetWinsMode(token);
      setLowestBetWinsMode(lbw);
    } catch (_) {
      // ignore if not supported yet
    }
  }, [token]);

  // Smooth per-second local countdown — never cleared by backend fetch
  useEffect(() => {
    if (!token) return;
    const ticker = setInterval(() => {
      const diff = Math.max(
        0,
        Math.floor((roundEndTimeRef.current - Date.now()) / 1000),
      );
      setTimeLeft(diff);
    }, 1000);
    return () => clearInterval(ticker);
  }, [token]);

  // Backend polling every 3s
  useEffect(() => {
    if (!token) return;
    fetchLiveData();
    const interval = setInterval(fetchLiveData, 3000);
    return () => clearInterval(interval);
  }, [token, fetchLiveData]);

  const fetchTabData = useCallback(async () => {
    if (!token || activeTab === "live") return;
    if (activeTab === "users") backendService.getAllUsers(token).then(setUsers);
    if (activeTab === "deposits")
      backendService.getAllDeposits(token).then(setDeposits);
    if (activeTab === "withdrawals")
      backendService.getAllWithdrawals(token).then(setWithdrawals);
    if (activeTab === "stats")
      backendService.getAdminStats(token).then((r) => {
        if (r.length > 0) setStats(r[0]!);
      });
  }, [token, activeTab]);

  useEffect(() => {
    if (!token || activeTab === "live") return;
    fetchTabData();
    const interval = setInterval(fetchTabData, 5000);
    return () => clearInterval(interval);
  }, [token, activeTab, fetchTabData]);

  async function handleLogin() {
    const res = await backendService.adminLogin(credential, password);
    if (res.length > 0) {
      setAdminToken(res[0]!);
      setToken(res[0]!);
    } else {
      toast.error("Invalid credentials");
    }
  }

  async function handleSetResult() {
    if (!token) return;
    await backendService.setNextRoundResult(manualColour, manualSize, token);
    toast.success("Manual result set!");
  }

  async function handleForceEnd() {
    if (!token) return;
    await backendService.triggerRoundResult(token);
    toast.success("Round ended!");
    fetchLiveData();
  }

  async function handleToggleRandom() {
    if (!token) return;
    await backendService.setRandomMode(!randomMode, token);
    setRandomMode(!randomMode);
    toast.success(`Random mode ${!randomMode ? "enabled" : "disabled"}`);
  }

  async function handleToggleLowestBetWins() {
    if (!token) return;
    const newVal = !lowestBetWinsMode;
    try {
      await backendService.setLowestBetWinsMode(newVal, token);
      setLowestBetWinsMode(newVal);
      toast.success(`Lowest Bet Wins ${newVal ? "enabled" : "disabled"}`);
    } catch (_) {
      toast.error("Failed to update Lowest Bet Wins mode");
    }
  }

  async function handleBan(userId: bigint) {
    if (!token) return;
    await backendService.banUser(userId, token);
    toast.success(`User #${userId} banned`);
    backendService.getAllUsers(token).then(setUsers);
  }

  async function handleUnban(userId: bigint) {
    if (!token) return;
    await backendService.unbanUser(userId, token);
    toast.success(`User #${userId} unbanned`);
    backendService.getAllUsers(token).then(setUsers);
  }

  const inputStyle = {
    background: "#1a1919",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "8px",
    color: "#fff",
    padding: "10px 14px",
    outline: "none",
    fontSize: "14px",
  };

  if (!token) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "#0e0e0e" }}
      >
        <div
          className="w-full max-w-[380px] mx-4 rounded-2xl p-8"
          style={{
            background: "#1a1919",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <h1
            className="text-2xl font-black mb-1"
            style={{ fontFamily: "Plus Jakarta Sans", color: "#9cff93" }}
          >
            Winverse
          </h1>
          <p className="text-sm mb-6" style={{ color: "#adaaaa" }}>
            Admin Dashboard
          </p>
          <div className="space-y-3">
            <input
              style={{ ...inputStyle, width: "100%" }}
              placeholder="Email or Phone"
              value={credential}
              onChange={(e) => setCredential(e.target.value)}
            />
            <input
              style={{ ...inputStyle, width: "100%" }}
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            />
            <button
              type="button"
              onClick={handleLogin}
              className="w-full py-3 rounded-xl font-bold"
              style={{
                background: "#9cff93",
                color: "#0e0e0e",
                fontFamily: "Plus Jakarta Sans",
              }}
            >
              Admin Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "live", label: "Live Game" },
    { id: "users", label: "Users" },
    { id: "deposits", label: "Deposits" },
    { id: "withdrawals", label: "Withdrawals" },
    { id: "stats", label: "Stats" },
  ] as const;

  // Betting distribution calculations
  const totalAmount = roundBets.reduce((s, [, , amt]) => s + amt, 0);
  const totalCount = roundBets.reduce((s, [, cnt]) => s + Number(cnt), 0);

  const betColours: Record<string, string> = {
    red: "#ff7162",
    green: "#9cff93",
    violet: "#b47fff",
    big: "#FFD700",
    small: "#adaaaa",
  };

  const filteredUsers = users.filter(
    (u) =>
      u.phone.includes(search) ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.id.toString().includes(search),
  );

  function StatusBadge({ status }: { status: string }) {
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

  return (
    <div style={{ background: "#0e0e0e", minHeight: "100vh" }}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-6 py-4"
        style={{
          background: "#1a1919",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <h1
          className="text-xl font-black italic"
          style={{ fontFamily: "Plus Jakarta Sans", color: "#9cff93" }}
        >
          Winverse Admin
        </h1>
        <button
          type="button"
          onClick={() => {
            clearAdminToken();
            setToken(null);
          }}
          className="text-sm px-3 py-1.5 rounded-lg"
          style={{
            background: "rgba(255,113,98,0.1)",
            color: "#ff7162",
            border: "1px solid rgba(255,113,98,0.2)",
          }}
        >
          Logout
        </button>
      </div>

      {/* Tab Bar */}
      <div
        className="flex border-b overflow-x-auto"
        style={{ borderColor: "rgba(255,255,255,0.06)", background: "#1a1919" }}
      >
        {tabs.map((t) => (
          <button
            type="button"
            key={t.id}
            onClick={() => setActiveTab(t.id as typeof activeTab)}
            className="px-4 py-3 text-sm font-semibold transition-all whitespace-nowrap"
            style={{
              color: activeTab === t.id ? "#9cff93" : "#adaaaa",
              borderBottom:
                activeTab === t.id
                  ? "2px solid #9cff93"
                  : "2px solid transparent",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="p-4 md:p-6">
        {/* Live Game Tab */}
        {activeTab === "live" && (
          <div className="space-y-6 max-w-4xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Timer */}
              <div
                className="rounded-xl p-5"
                style={{
                  background: "#1a1919",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <p
                  className="text-sm font-semibold mb-2"
                  style={{ color: "#adaaaa" }}
                >
                  CURRENT ROUND
                </p>
                <p
                  className="text-5xl font-black"
                  style={{ fontFamily: "Plus Jakarta Sans", color: "#9cff93" }}
                >
                  {String(timeLeft).padStart(2, "0")}s
                </p>
                <p className="text-sm mt-1" style={{ color: "#adaaaa" }}>
                  Round #{round ? round.id.toString() : "—"} •{" "}
                  {round?.status || "—"}
                </p>
              </div>

              {/* Controls */}
              <div
                className="rounded-xl p-5 space-y-3"
                style={{
                  background: "#1a1919",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <p
                  className="text-sm font-semibold"
                  style={{ color: "#adaaaa" }}
                >
                  GAME CONTROLS
                </p>

                {/* Random Mode toggle */}
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: "#fff" }}>
                    Random Mode
                  </span>
                  <button
                    type="button"
                    onClick={handleToggleRandom}
                    disabled={lowestBetWinsMode}
                    className="px-4 py-1.5 rounded-full text-sm font-bold"
                    style={{
                      background: randomMode
                        ? "rgba(0,255,65,0.15)"
                        : "rgba(255,255,255,0.08)",
                      color: randomMode ? "#9cff93" : "#adaaaa",
                      border: `1px solid ${randomMode ? "rgba(0,255,65,0.3)" : "rgba(255,255,255,0.1)"}`,
                      opacity: lowestBetWinsMode ? 0.4 : 1,
                      pointerEvents: lowestBetWinsMode ? "none" : "auto",
                    }}
                  >
                    {randomMode ? "ON" : "OFF"}
                  </button>
                </div>

                {/* Lowest Bet Wins toggle */}
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: "#fff" }}>
                    Lowest Bet Wins
                  </span>
                  <button
                    type="button"
                    onClick={handleToggleLowestBetWins}
                    data-ocid="lowest_bet_wins.toggle"
                    className="px-4 py-1.5 rounded-full text-sm font-bold"
                    style={{
                      background: lowestBetWinsMode
                        ? "rgba(255,200,0,0.15)"
                        : "rgba(255,255,255,0.08)",
                      color: lowestBetWinsMode ? "#ffc800" : "#adaaaa",
                      border: `1px solid ${
                        lowestBetWinsMode
                          ? "rgba(255,200,0,0.3)"
                          : "rgba(255,255,255,0.1)"
                      }`,
                    }}
                  >
                    {lowestBetWinsMode ? "ON" : "OFF"}
                  </button>
                </div>
                {lowestBetWinsMode && (
                  <p
                    className="text-xs"
                    style={{ color: "rgba(255,200,0,0.6)" }}
                  >
                    Auto: lowest bet option wins next round
                  </p>
                )}

                {/* Manual result selects */}
                <div className="flex gap-2">
                  <select
                    value={manualColour}
                    onChange={(e) => setManualColour(e.target.value)}
                    disabled={lowestBetWinsMode}
                    style={{
                      ...inputStyle,
                      flex: 1,
                      opacity: lowestBetWinsMode ? 0.4 : 1,
                    }}
                  >
                    <option value="red">Red</option>
                    <option value="green">Green</option>
                    <option value="violet">Violet</option>
                  </select>
                  <select
                    value={manualSize}
                    onChange={(e) => setManualSize(e.target.value)}
                    disabled={lowestBetWinsMode}
                    style={{
                      ...inputStyle,
                      flex: 1,
                      opacity: lowestBetWinsMode ? 0.4 : 1,
                    }}
                  >
                    <option value="big">Big</option>
                    <option value="small">Small</option>
                  </select>
                </div>
                <button
                  type="button"
                  onClick={handleSetResult}
                  disabled={lowestBetWinsMode}
                  className="w-full py-2 rounded-lg text-sm font-bold"
                  style={{
                    background: "rgba(0,207,252,0.15)",
                    color: "#00cffc",
                    border: "1px solid rgba(0,207,252,0.3)",
                    opacity: lowestBetWinsMode ? 0.4 : 1,
                    pointerEvents: lowestBetWinsMode ? "none" : "auto",
                  }}
                >
                  Set Manual Result
                </button>
                <button
                  type="button"
                  onClick={handleForceEnd}
                  className="w-full py-2 rounded-lg text-sm font-bold"
                  style={{
                    background: "rgba(255,113,98,0.15)",
                    color: "#ff7162",
                    border: "1px solid rgba(255,113,98,0.3)",
                  }}
                >
                  ⚡ Force End Round
                </button>
              </div>
            </div>

            {/* Betting Distribution */}
            <div
              className="rounded-xl p-5"
              style={{
                background: "#1a1919",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <p
                  className="text-sm font-semibold"
                  style={{ color: "#adaaaa" }}
                >
                  BETTING DISTRIBUTION — CURRENT ROUND
                </p>
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-semibold"
                  style={{
                    background: "rgba(156,255,147,0.1)",
                    color: "#9cff93",
                  }}
                >
                  {totalCount} bets · ₹{totalAmount.toFixed(0)}
                </span>
              </div>
              <div className="space-y-3">
                {roundBets.map(([option, count, amt]) => {
                  const amtPct =
                    totalAmount > 0 ? (amt / totalAmount) * 100 : 0;
                  const cntPct =
                    totalCount > 0 ? (Number(count) / totalCount) * 100 : 0;
                  const colour = betColours[option] || "#888";
                  const lowestAmongBets =
                    roundBets.filter(([, , a]) => a > 0).length > 0
                      ? Math.min(
                          ...roundBets
                            .filter(([, , a]) => a > 0)
                            .map(([, , a]) => a),
                        )
                      : -1;
                  const isLowest =
                    lowestBetWinsMode && amt > 0 && amt === lowestAmongBets;
                  return (
                    <div key={option}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ background: colour }}
                          />
                          <span
                            className="text-sm font-semibold capitalize"
                            style={{ color: colour }}
                          >
                            {option}
                          </span>
                          <span
                            className="text-xs"
                            style={{ color: "#adaaaa" }}
                          >
                            ({count.toString()} bets)
                          </span>
                          {isLowest && (
                            <span
                              className="text-xs px-1.5 py-0.5 rounded font-bold"
                              style={{
                                background: "rgba(255,200,0,0.15)",
                                color: "#ffc800",
                                border: "1px solid rgba(255,200,0,0.3)",
                              }}
                            >
                              🎯 WINS
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          <span
                            className="text-sm font-bold"
                            style={{ color: colour }}
                          >
                            {amtPct.toFixed(1)}%
                          </span>
                          <span
                            className="text-xs ml-2"
                            style={{ color: "#adaaaa" }}
                          >
                            ₹{amt.toFixed(0)}
                          </span>
                        </div>
                      </div>
                      <div
                        className="rounded-full overflow-hidden"
                        style={{
                          background: "rgba(255,255,255,0.05)",
                          height: "8px",
                        }}
                      >
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${amtPct}%`,
                            background: colour,
                            opacity: 0.8,
                          }}
                        />
                      </div>
                      <div
                        className="rounded-full overflow-hidden mt-0.5"
                        style={{
                          background: "rgba(255,255,255,0.03)",
                          height: "4px",
                        }}
                      >
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${cntPct}%`,
                            background: colour,
                            opacity: 0.4,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
                {totalCount === 0 && (
                  <p
                    className="text-center py-4 text-sm"
                    style={{ color: "#adaaaa" }}
                  >
                    No bets placed yet this round
                  </p>
                )}
              </div>
            </div>

            {/* Live Bets Table */}
            <div
              className="rounded-xl p-5"
              style={{
                background: "#1a1919",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <p
                className="text-sm font-semibold mb-3"
                style={{ color: "#adaaaa" }}
              >
                LIVE BETTING STATS
              </p>
              <table className="w-full">
                <thead>
                  <tr
                    style={{
                      color: "#adaaaa",
                      borderBottom: "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    <th className="text-left py-2 text-sm">Option</th>
                    <th className="text-center py-2 text-sm">Bets</th>
                    <th className="text-center py-2 text-sm">% of Total</th>
                    <th className="text-right py-2 text-sm">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {roundBets.map(([option, count, amt]) => {
                    const pct = totalAmount > 0 ? (amt / totalAmount) * 100 : 0;
                    const colour = betColours[option] || "#888";
                    const isMax =
                      amt > 0 &&
                      amt === Math.max(...roundBets.map(([, , a]) => a));
                    return (
                      <tr
                        key={option}
                        style={{
                          borderBottom: "1px solid rgba(255,255,255,0.03)",
                          background: isMax
                            ? "rgba(255,215,0,0.04)"
                            : "transparent",
                        }}
                      >
                        <td className="py-2 text-sm">
                          <span className="flex items-center gap-2">
                            <span
                              className="w-3 h-3 rounded-full inline-block"
                              style={{ background: colour }}
                            />
                            <span
                              style={{
                                color: colour,
                                textTransform: "capitalize",
                                fontWeight: isMax ? 700 : 400,
                              }}
                            >
                              {option} {isMax ? "🔥" : ""}
                            </span>
                          </span>
                        </td>
                        <td className="py-2 text-sm text-center">
                          {count.toString()}
                        </td>
                        <td
                          className="py-2 text-sm text-center"
                          style={{ color: colour, fontWeight: 600 }}
                        >
                          {pct.toFixed(1)}%
                        </td>
                        <td
                          className="py-2 text-sm text-right"
                          style={{ color: isMax ? "#FFD700" : "#fff" }}
                        >
                          ₹{amt.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <div className="space-y-4 max-w-full">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <input
                style={{ ...inputStyle, width: "300px" }}
                placeholder="Search by phone, name or ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <span
                className="text-sm font-semibold px-3 py-1.5 rounded-lg"
                style={{
                  background: "rgba(156,255,147,0.1)",
                  color: "#9cff93",
                  border: "1px solid rgba(156,255,147,0.2)",
                }}
              >
                Total Users: {users.length}
              </span>
            </div>
            <div
              className="rounded-xl overflow-hidden"
              style={{
                background: "#1a1919",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <div style={{ overflowX: "auto" }}>
                <table className="w-full" style={{ minWidth: "1100px" }}>
                  <thead style={{ background: "#262626" }}>
                    <tr style={{ color: "#adaaaa" }}>
                      {[
                        "ID",
                        "Phone",
                        "Name",
                        "Balance",
                        "Bets",
                        "Deposited",
                        "Ref Code",
                        "Referred By",
                        "Referrals",
                        "Status",
                        "Action",
                      ].map((h) => (
                        <th
                          key={h}
                          className="text-left px-4 py-3 text-xs font-semibold"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u) => (
                      <tr
                        key={u.id.toString()}
                        style={{
                          borderBottom: "1px solid rgba(255,255,255,0.03)",
                          background: u.isBanned
                            ? "rgba(255,113,98,0.04)"
                            : "transparent",
                        }}
                      >
                        <td
                          className="px-4 py-3 text-sm"
                          style={{ color: "#adaaaa" }}
                        >
                          #{u.id.toString()}
                        </td>
                        <td className="px-4 py-3 text-sm">{u.phone}</td>
                        <td className="px-4 py-3 text-sm">{u.name}</td>
                        <td
                          className="px-4 py-3 text-sm"
                          style={{ color: "#9cff93" }}
                        >
                          ₹{u.balance.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {u.totalBets.toString()}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          ₹{u.totalDeposited.toFixed(2)}
                        </td>
                        <td
                          className="px-4 py-3 text-sm"
                          style={{
                            color: "#00cffc",
                            fontFamily: "monospace",
                            letterSpacing: "0.05em",
                          }}
                        >
                          {u.referralCode}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {u.referredBy.length > 0 ? (
                            <span style={{ color: "#9cff93" }}>
                              {u.referredBy[0]}
                            </span>
                          ) : (
                            <span style={{ color: "#555" }}>—</span>
                          )}
                        </td>
                        <td
                          className="px-4 py-3 text-sm"
                          style={{ color: "#FFD700" }}
                        >
                          {u.referralCount.toString()}
                        </td>
                        <td className="px-4 py-3">
                          {u.isBanned ? (
                            <span
                              className="text-xs px-2 py-0.5 rounded-full font-semibold"
                              style={{
                                background: "rgba(255,113,98,0.15)",
                                color: "#ff7162",
                              }}
                            >
                              Banned
                            </span>
                          ) : (
                            <span
                              className="text-xs px-2 py-0.5 rounded-full"
                              style={{
                                background: u.isActive
                                  ? "rgba(0,255,65,0.15)"
                                  : "rgba(255,255,255,0.06)",
                                color: u.isActive ? "#9cff93" : "#adaaaa",
                              }}
                            >
                              {u.isActive ? "Online" : "Offline"}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {u.isBanned ? (
                            <button
                              type="button"
                              onClick={() => handleUnban(u.id)}
                              className="text-xs px-3 py-1.5 rounded-lg font-bold"
                              style={{
                                background: "rgba(0,255,65,0.12)",
                                color: "#9cff93",
                                border: "1px solid rgba(0,255,65,0.25)",
                              }}
                            >
                              Unban
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleBan(u.id)}
                              className="text-xs px-3 py-1.5 rounded-lg font-bold"
                              style={{
                                background: "rgba(255,113,98,0.12)",
                                color: "#ff7162",
                                border: "1px solid rgba(255,113,98,0.25)",
                              }}
                            >
                              Ban
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {filteredUsers.length === 0 && (
                      <tr>
                        <td
                          colSpan={11}
                          className="text-center py-8"
                          style={{ color: "#adaaaa" }}
                        >
                          No users found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Deposits Tab — Card Layout */}
        {activeTab === "deposits" && (
          <div className="max-w-5xl">
            <p
              className="text-sm font-semibold mb-4"
              style={{ color: "#adaaaa" }}
            >
              DEPOSIT REQUESTS ({deposits.length})
            </p>
            {deposits.length === 0 ? (
              <div
                className="rounded-xl p-10 text-center"
                style={{
                  background: "#1a1919",
                  border: "1px solid rgba(255,255,255,0.06)",
                  color: "#adaaaa",
                }}
              >
                No deposit requests yet
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {deposits.map((d) => (
                  <div
                    key={d.id.toString()}
                    className="rounded-xl p-5 flex flex-col gap-3"
                    style={{
                      background: "#1a1919",
                      border: "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p
                          className="text-3xl font-black"
                          style={{
                            fontFamily: "Plus Jakarta Sans",
                            color: "#9cff93",
                          }}
                        >
                          ₹{d.amount.toFixed(2)}
                        </p>
                        <p
                          className="text-xs mt-0.5"
                          style={{ color: "#adaaaa" }}
                        >
                          Deposit Request
                        </p>
                      </div>
                      <StatusBadge status={d.status} />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs" style={{ color: "#adaaaa" }}>
                          UTR Number
                        </span>
                        <span
                          className="text-sm font-semibold"
                          style={{ color: "#fff", wordBreak: "break-all" }}
                        >
                          {d.utrNumber || "—"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs" style={{ color: "#adaaaa" }}>
                          User ID
                        </span>
                        <span className="text-sm" style={{ color: "#fff" }}>
                          #{d.userId.toString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs" style={{ color: "#adaaaa" }}>
                          Date
                        </span>
                        <span className="text-sm" style={{ color: "#adaaaa" }}>
                          {new Date(
                            Number(d.createdAt) / 1_000_000,
                          ).toLocaleString()}
                        </span>
                      </div>
                      {d.screenshotUrl && d.screenshotUrl !== "N/A" && (
                        <div className="flex items-center justify-between">
                          <span
                            className="text-xs"
                            style={{ color: "#adaaaa" }}
                          >
                            Screenshot
                          </span>
                          <a
                            href={d.screenshotUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-semibold"
                            style={{ color: "#00cffc" }}
                          >
                            View →
                          </a>
                        </div>
                      )}
                    </div>
                    {d.status === "pending" && (
                      <div className="flex gap-3 mt-1">
                        <button
                          type="button"
                          onClick={async () => {
                            if (!token) return;
                            await backendService.approveDeposit(d.id, token);
                            toast.success("Deposit approved!");
                            backendService
                              .getAllDeposits(token)
                              .then(setDeposits);
                          }}
                          className="flex-1 font-bold rounded-lg"
                          style={{
                            background: "rgba(0,255,65,0.15)",
                            color: "#9cff93",
                            border: "1px solid rgba(0,255,65,0.3)",
                            minHeight: "40px",
                            fontSize: "14px",
                          }}
                        >
                          ✓ Approve
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            if (!token) return;
                            await backendService.rejectDeposit(d.id, token);
                            toast.success("Deposit rejected");
                            backendService
                              .getAllDeposits(token)
                              .then(setDeposits);
                          }}
                          className="flex-1 font-bold rounded-lg"
                          style={{
                            background: "rgba(255,113,98,0.15)",
                            color: "#ff7162",
                            border: "1px solid rgba(255,113,98,0.3)",
                            minHeight: "40px",
                            fontSize: "14px",
                          }}
                        >
                          ✕ Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Withdrawals Tab — Card Layout */}
        {activeTab === "withdrawals" && (
          <div className="max-w-5xl">
            <p
              className="text-sm font-semibold mb-4"
              style={{ color: "#adaaaa" }}
            >
              WITHDRAWAL REQUESTS ({withdrawals.length})
            </p>
            {withdrawals.length === 0 ? (
              <div
                className="rounded-xl p-10 text-center"
                style={{
                  background: "#1a1919",
                  border: "1px solid rgba(255,255,255,0.06)",
                  color: "#adaaaa",
                }}
              >
                No withdrawal requests yet
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {withdrawals.map((w) => (
                  <div
                    key={w.id.toString()}
                    className="rounded-xl p-5 flex flex-col gap-3"
                    style={{
                      background: "#1a1919",
                      border: "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p
                          className="text-3xl font-black"
                          style={{
                            fontFamily: "Plus Jakarta Sans",
                            color: "#9cff93",
                          }}
                        >
                          ₹{w.amount.toFixed(2)}
                        </p>
                        <p
                          className="text-xs mt-0.5"
                          style={{ color: "#adaaaa" }}
                        >
                          Withdrawal Request
                        </p>
                      </div>
                      <StatusBadge status={w.status} />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs" style={{ color: "#adaaaa" }}>
                          UPI ID
                        </span>
                        <span
                          className="text-sm font-semibold"
                          style={{ color: "#fff", wordBreak: "break-all" }}
                        >
                          {w.upiId}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs" style={{ color: "#adaaaa" }}>
                          User ID
                        </span>
                        <span className="text-sm" style={{ color: "#fff" }}>
                          #{w.userId.toString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs" style={{ color: "#adaaaa" }}>
                          Date
                        </span>
                        <span className="text-sm" style={{ color: "#adaaaa" }}>
                          {new Date(
                            Number(w.createdAt) / 1_000_000,
                          ).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    {w.status === "pending" && (
                      <div className="flex gap-3 mt-1">
                        <button
                          type="button"
                          onClick={async () => {
                            if (!token) return;
                            await backendService.approveWithdrawal(w.id, token);
                            toast.success("Withdrawal approved!");
                            backendService
                              .getAllWithdrawals(token)
                              .then(setWithdrawals);
                          }}
                          className="flex-1 font-bold rounded-lg"
                          style={{
                            background: "rgba(0,255,65,0.15)",
                            color: "#9cff93",
                            border: "1px solid rgba(0,255,65,0.3)",
                            minHeight: "40px",
                            fontSize: "14px",
                          }}
                        >
                          ✓ Approve
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            if (!token) return;
                            await backendService.rejectWithdrawal(w.id, token);
                            toast.success("Withdrawal rejected");
                            backendService
                              .getAllWithdrawals(token)
                              .then(setWithdrawals);
                          }}
                          className="flex-1 font-bold rounded-lg"
                          style={{
                            background: "rgba(255,113,98,0.15)",
                            color: "#ff7162",
                            border: "1px solid rgba(255,113,98,0.3)",
                            minHeight: "40px",
                            fontSize: "14px",
                          }}
                        >
                          ✕ Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Stats Tab */}
        {activeTab === "stats" && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-3xl">
            {[
              {
                label: "Total Users",
                value: stats ? stats[0].toString() : "0",
                color: "#9cff93",
              },
              {
                label: "Live Users",
                value: stats ? stats[1].toString() : "0",
                color: "#00cffc",
              },
              {
                label: "Total Deposits",
                value: stats ? `₹${stats[2].toFixed(2)}` : "₹0",
                color: "#9cff93",
              },
              {
                label: "Total Withdrawals",
                value: stats ? `₹${stats[3].toFixed(2)}` : "₹0",
                color: "#ff7162",
              },
              {
                label: "Total Bets",
                value: stats ? stats[4].toString() : "0",
                color: "#FFD700",
              },
              {
                label: "Winnings Paid",
                value: stats ? `₹${stats[5].toFixed(2)}` : "₹0",
                color: "#ff7162",
              },
            ].map(({ label, value, color }) => (
              <div
                key={label}
                className="rounded-xl p-5"
                style={{
                  background: "#1a1919",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <p
                  className="text-2xl font-black"
                  style={{ fontFamily: "Plus Jakarta Sans", color }}
                >
                  {value}
                </p>
                <p className="text-sm mt-1" style={{ color: "#adaaaa" }}>
                  {label}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
