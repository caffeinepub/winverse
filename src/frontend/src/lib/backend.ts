// Backend wrapper - persists mock data to localStorage

export interface UserPublic {
  id: bigint;
  phone: string;
  name: string;
  balance: number;
  totalBets: bigint;
  totalWinnings: number;
  referralCode: string;
  referredBy: [] | [string];
  referralCount: bigint;
  hasDeposited: boolean;
  firstDepositDone: boolean;
  firstDepositBonusGiven: boolean;
  signupBonusGiven: boolean;
  createdAt: bigint;
  isActive: boolean;
  totalDeposited: number;
  isBanned: boolean;
}

export interface RoundPublic {
  id: bigint;
  startTime: bigint;
  endTime: bigint;
  result: [] | [{ colour: string; size: string }];
  status: string;
  isManual: boolean;
  manualResult: [] | [{ colour: string; size: string }];
}

export interface BetPublic {
  id: bigint;
  userId: bigint;
  roundId: bigint;
  betType: string;
  betValue: string;
  amount: number;
  status: string;
  winAmount: number;
  placedAt: bigint;
}

export interface DepositRequestPublic {
  id: bigint;
  userId: bigint;
  amount: number;
  utrNumber: string;
  screenshotUrl: string;
  status: string;
  createdAt: bigint;
  processedAt: [] | [bigint];
}

export interface WithdrawRequestPublic {
  id: bigint;
  userId: bigint;
  amount: number;
  upiId: string;
  status: string;
  createdAt: bigint;
  processedAt: [] | [bigint];
}

// ===== LOCALSTORAGE PERSISTENCE =====

const STORAGE_KEY = 'winverse_db';

interface StoredUser {
  id: string;
  phone: string;
  name: string;
  balance: number;
  totalBets: string;
  totalWinnings: number;
  referralCode: string;
  referredBy: [] | [string];
  referralCount: string;
  hasDeposited: boolean;
  firstDepositDone: boolean;
  firstDepositBonusGiven: boolean;
  signupBonusGiven: boolean;
  createdAt: string;
  isActive: boolean;
  totalDeposited: number;
  passwordHash: string;
  isBanned: boolean;
}

interface StoredBet {
  id: string;
  userId: string;
  roundId: string;
  betType: string;
  betValue: string;
  amount: number;
  status: string;
  winAmount: number;
  placedAt: string;
}

interface StoredDeposit {
  id: string;
  userId: string;
  amount: number;
  utrNumber: string;
  screenshotUrl: string;
  status: string;
  createdAt: string;
  processedAt: [] | [string];
}

interface StoredWithdraw {
  id: string;
  userId: string;
  amount: number;
  upiId: string;
  status: string;
  createdAt: string;
  processedAt: [] | [string];
}

interface StoredRoundResult {
  id: string;
  colour: string;
  size: string;
  startTime: string;
  endTime: string;
}

interface DB {
  users: StoredUser[];
  nextId: string;
  roundId: string;
  roundStart: number;
  bets: StoredBet[];
  deposits: StoredDeposit[];
  withdraws: StoredWithdraw[];
  phoneToId: [string, string][];
  phoneToPass: [string, string][];
  referralToId: [string, string][];
  roundHistory: StoredRoundResult[];
  isRandomMode: boolean;
  pendingManualResult: [] | [{ colour: string; size: string }];
  isLowestBetWinsMode: boolean;
}

function freshDB(): DB {
  return {
    users: [], nextId: '1', roundId: '1', roundStart: Date.now(),
    bets: [], deposits: [], withdraws: [],
    phoneToId: [], phoneToPass: [], referralToId: [],
    roundHistory: [],
    isRandomMode: true,
    pendingManualResult: [],
    isLowestBetWinsMode: false,
  };
}

function loadDB(): DB {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DB;
      if (
        parsed &&
        typeof parsed === 'object' &&
        Array.isArray(parsed.users) &&
        Array.isArray(parsed.phoneToId) &&
        Array.isArray(parsed.phoneToPass) &&
        Array.isArray(parsed.referralToId) &&
        typeof parsed.nextId === 'string'
      ) {
        if (typeof parsed.isRandomMode !== 'boolean') parsed.isRandomMode = true;
        if (!Array.isArray(parsed.pendingManualResult)) parsed.pendingManualResult = [];
        if (typeof parsed.isLowestBetWinsMode !== 'boolean') parsed.isLowestBetWinsMode = false;
        // Migrate existing users to have isBanned
        parsed.users = parsed.users.map(u => ({ ...u, isBanned: (u as StoredUser).isBanned ?? false }));
        return parsed;
      }
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
  return freshDB();
}

function saveDB(db: DB) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

function toUserPublic(u: StoredUser): UserPublic {
  return {
    id: BigInt(u.id), phone: u.phone, name: u.name, balance: u.balance,
    totalBets: BigInt(u.totalBets), totalWinnings: u.totalWinnings,
    referralCode: u.referralCode, referredBy: u.referredBy,
    referralCount: BigInt(u.referralCount), hasDeposited: u.hasDeposited,
    firstDepositDone: u.firstDepositDone, firstDepositBonusGiven: u.firstDepositBonusGiven,
    signupBonusGiven: u.signupBonusGiven, createdAt: BigInt(u.createdAt),
    isActive: u.isActive, totalDeposited: u.totalDeposited,
    isBanned: u.isBanned ?? false,
  };
}

function toBetPublic(b: StoredBet): BetPublic {
  return {
    id: BigInt(b.id), userId: BigInt(b.userId), roundId: BigInt(b.roundId),
    betType: b.betType, betValue: b.betValue, amount: b.amount,
    status: b.status, winAmount: b.winAmount, placedAt: BigInt(b.placedAt),
  };
}

function toDepositPublic(d: StoredDeposit): DepositRequestPublic {
  return {
    id: BigInt(d.id), userId: BigInt(d.userId), amount: d.amount,
    utrNumber: d.utrNumber, screenshotUrl: d.screenshotUrl, status: d.status,
    createdAt: BigInt(d.createdAt),
    processedAt: d.processedAt.length > 0 ? [BigInt(d.processedAt[0]!)] : [],
  };
}

function toWithdrawPublic(w: StoredWithdraw): WithdrawRequestPublic {
  return {
    id: BigInt(w.id), userId: BigInt(w.userId), amount: w.amount,
    upiId: w.upiId, status: w.status, createdAt: BigInt(w.createdAt),
    processedAt: w.processedAt.length > 0 ? [BigInt(w.processedAt[0]!)] : [],
  };
}

function genCode(id: string): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let n = parseInt(id);
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars[(n * 7 + i * 13 + 17) % 36];
    n = Math.floor(n / 2) + 1;
  }
  return result;
}

function getMockRound(db: DB): RoundPublic {
  const now = Date.now();
  const elapsed = now - db.roundStart;
  const remaining = Math.max(0, 30000 - elapsed);
  const status = remaining > 10000 ? 'betting' : 'locked';
  const endTime = BigInt(db.roundStart + 30000) * BigInt(1000000);
  return {
    id: BigInt(db.roundId),
    startTime: BigInt(db.roundStart) * BigInt(1000000),
    endTime, result: [], status, isManual: false, manualResult: [],
  };
}

/** Pick the option with the lowest total bet amount. Ties broken randomly. */
function pickLowestBetOption(db: DB, roundId: string): { colour: string; size: string } {
  const colours = ['red', 'green', 'violet'];
  const sizes = ['big', 'small'];
  const allOptions = [...colours, ...sizes];
  const totals: Record<string, number> = {};
  for (const opt of allOptions) {
    totals[opt] = db.bets
      .filter(b => b.roundId === roundId && b.betValue === opt && b.status !== 'cancelled')
      .reduce((s, b) => s + b.amount, 0);
  }
  // Find lowest colour
  let minColour = colours[0]!;
  for (const c of colours) {
    if (totals[c]! < totals[minColour]!) minColour = c;
  }
  // Find lowest size
  let minSize = sizes[0]!;
  for (const sz of sizes) {
    if (totals[sz]! < totals[minSize]!) minSize = sz;
  }
  // Tie-break randomly among tied options
  const tiedColours = colours.filter(c => totals[c] === totals[minColour]);
  const tiedSizes = sizes.filter(s => totals[s] === totals[minSize]);
  const colour = tiedColours[Math.floor(Math.random() * tiedColours.length)]!;
  const size = tiedSizes[Math.floor(Math.random() * tiedSizes.length)]!;
  return { colour, size };
}

function maybeAdvanceRound(db: DB): boolean {
  const now = Date.now();
  let advanced = false;
  const colours = ['red', 'green', 'violet'];
  const sizes = ['big', 'small'];
  while (now >= db.roundStart + 30000) {
    let colour: string;
    let size: string;
    if (db.isLowestBetWinsMode) {
      // Auto: pick option with lowest bet amount
      const picked = pickLowestBetOption(db, db.roundId);
      colour = picked.colour;
      size = picked.size;
      db.pendingManualResult = [];
    } else if (db.pendingManualResult && db.pendingManualResult.length > 0) {
      colour = db.pendingManualResult[0]!.colour;
      size = db.pendingManualResult[0]!.size;
      db.pendingManualResult = [];
    } else {
      colour = colours[Math.floor(Math.random() * 3)]!;
      size = sizes[Math.floor(Math.random() * 2)]!;
    }
    if (!db.roundHistory) db.roundHistory = [];
    db.roundHistory.push({
      id: db.roundId, colour, size,
      startTime: String(db.roundStart),
      endTime: String(db.roundStart + 30000),
    });
    if (db.roundHistory.length > 50) db.roundHistory = db.roundHistory.slice(-50);
    for (const b of db.bets) {
      if (b.roundId === db.roundId && b.status === 'pending') {
        const won = (b.betType === 'colour' && b.betValue === colour) || (b.betType === 'size' && b.betValue === size);
        b.status = won ? 'won' : 'lost';
        if (won) {
          b.winAmount = b.amount * 1.9;
          const u = db.users.find(u => u.id === b.userId);
          if (u) { u.balance += b.winAmount; u.totalWinnings += b.winAmount; }
        }
      }
    }
    db.roundId = String(parseInt(db.roundId) + 1);
    db.roundStart = db.roundStart + 30000;
    advanced = true;
  }
  return advanced;
}

export const backendService = {
  async signup(phone: string, password: string): Promise<[bigint, string]> {
    const db = loadDB();
    const phoneMap = new Map(db.phoneToId);
    if (phoneMap.has(phone)) return [BigInt(0), 'Phone already registered'];
    const id = db.nextId;
    db.nextId = String(parseInt(id) + 1);
    const code = genCode(id);
    const user: StoredUser = {
      id, phone, name: `User${id}`, balance: 200, totalBets: '0',
      totalWinnings: 0, referralCode: code, referredBy: [], referralCount: '0',
      hasDeposited: false, firstDepositDone: false, firstDepositBonusGiven: false,
      signupBonusGiven: true, createdAt: String(Date.now()), isActive: true,
      totalDeposited: 0, passwordHash: password, isBanned: false,
    };
    db.users.push(user);
    db.phoneToId.push([phone, id]);
    db.phoneToPass.push([phone, password]);
    db.referralToId.push([code, id]);
    saveDB(db);
    return [BigInt(id), 'Account created! ₹200 signup bonus credited.'];
  },

  async login(phone: string, password: string): Promise<[] | [bigint]> {
    const db = loadDB();
    const passMap = new Map(db.phoneToPass);
    const phoneMap = new Map(db.phoneToId);
    const id = phoneMap.get(phone);
    if (!id) return [];
    if (passMap.get(phone) !== password) return [];
    const user = db.users.find(u => u.id === id);
    if (user?.isBanned) return [];
    db.users = db.users.map(u => u.id === id ? { ...u, isActive: true } : u);
    saveDB(db);
    return [BigInt(id)];
  },

  async getUserById(userId: bigint): Promise<[] | [UserPublic]> {
    try {
      const db = loadDB();
      const u = db.users.find(x => x.id === userId.toString());
      if (u) return [toUserPublic(u)];
      return [];
    } catch {
      return [];
    }
  },

  async updateUserName(userId: bigint, name: string): Promise<boolean> {
    const db = loadDB();
    const idx = db.users.findIndex(x => x.id === userId.toString());
    if (idx < 0) return false;
    db.users[idx] = { ...db.users[idx]!, name };
    saveDB(db);
    return true;
  },

  async placeBet(userId: bigint, roundId: bigint, betType: string, betValue: string, amount: number): Promise<[] | [bigint]> {
    const db = loadDB();
    const u = db.users.find(x => x.id === userId.toString());
    if (!u || u.isBanned || u.balance < amount) return [];
    const roundBets = db.bets.filter(b => b.userId === userId.toString() && b.roundId === roundId.toString());
    if (roundBets.length >= 3) return [];
    const bid = String(db.bets.length + 1);
    db.bets.push({ id: bid, userId: userId.toString(), roundId: roundId.toString(), betType, betValue, amount, status: 'pending', winAmount: 0, placedAt: String(Date.now()) });
    db.users = db.users.map(x => x.id === userId.toString()
      ? { ...x, balance: x.balance - amount, totalBets: String(parseInt(x.totalBets) + 1) }
      : x);
    saveDB(db);
    return [BigInt(bid)];
  },

  async getCurrentRound(): Promise<[] | [RoundPublic]> {
    const db = loadDB();
    const advanced = maybeAdvanceRound(db);
    if (advanced) saveDB(db);
    return [getMockRound(db)];
  },

  async getRoundHistory(limit: bigint): Promise<RoundPublic[]> {
    const db = loadDB();
    const history = db.roundHistory || [];
    const recent = [...history].reverse().slice(0, Number(limit));
    return recent.map(r => ({
      id: BigInt(r.id),
      startTime: BigInt(r.startTime) * BigInt(1000000),
      endTime: BigInt(r.endTime) * BigInt(1000000),
      result: [{ colour: r.colour, size: r.size }] as [{ colour: string; size: string }],
      status: 'completed', isManual: false, manualResult: [] as [],
    }));
  },

  async getUserBetHistory(userId: bigint): Promise<BetPublic[]> {
    const db = loadDB();
    return db.bets.filter(b => b.userId === userId.toString()).map(toBetPublic).reverse();
  },

  async createDepositRequest(userId: bigint, amount: number, utrNumber: string, screenshotUrl: string): Promise<[] | [bigint]> {
    const db = loadDB();
    const id = String(db.deposits.length + 1);
    db.deposits.push({ id, userId: userId.toString(), amount, utrNumber, screenshotUrl, status: 'pending', createdAt: String(Date.now()), processedAt: [] });
    saveDB(db);
    return [BigInt(id)];
  },

  async createWithdrawRequest(userId: bigint, amount: number, upiId: string): Promise<[] | [bigint]> {
    const db = loadDB();
    const u = db.users.find(x => x.id === userId.toString());
    if (!u || !u.hasDeposited || u.totalDeposited < 200 || u.balance < amount) return [];
    const id = String(db.withdraws.length + 1);
    db.withdraws.push({ id, userId: userId.toString(), amount, upiId, status: 'pending', createdAt: String(Date.now()), processedAt: [] });
    saveDB(db);
    return [BigInt(id)];
  },

  async getReferralInfo(userId: bigint): Promise<[] | [[string, bigint, number]]> {
    const db = loadDB();
    const u = db.users.find(x => x.id === userId.toString());
    if (!u) return [];
    return [[u.referralCode, BigInt(u.referralCount), parseInt(u.referralCount) * 30]];
  },

  async processReferral(newUserId: bigint, referralCode: string): Promise<boolean> {
    const db = loadDB();
    const refMap = new Map(db.referralToId);
    const refId = refMap.get(referralCode);
    if (!refId || refId === newUserId.toString()) return false;
    db.users = db.users.map(u => u.id === refId
      ? { ...u, balance: u.balance + 30, referralCount: String(parseInt(u.referralCount) + 1) }
      : u);
    saveDB(db);
    return true;
  },

  async logout(userId: bigint): Promise<boolean> {
    const db = loadDB();
    db.users = db.users.map(u => u.id === userId.toString() ? { ...u, isActive: false } : u);
    saveDB(db);
    return true;
  },

  async getUserDepositRequests(userId: bigint): Promise<DepositRequestPublic[]> {
    const db = loadDB();
    return db.deposits.filter(d => d.userId === userId.toString()).map(toDepositPublic).reverse();
  },

  async getUserWithdrawRequests(userId: bigint): Promise<WithdrawRequestPublic[]> {
    const db = loadDB();
    return db.withdraws.filter(w => w.userId === userId.toString()).map(toWithdrawPublic).reverse();
  },

  // Admin
  async adminLogin(credential: string, password: string): Promise<[] | [string]> {
    const valid = (credential === 'iamdevloper1309@gmail.com' || credential === '9294729968') && password === 'admin123123';
    return valid ? ['admin123123'] : [];
  },

  async getAllUsers(adminToken: string): Promise<UserPublic[]> {
    if (adminToken !== 'admin123123') return [];
    const db = loadDB();
    return db.users.map(toUserPublic);
  },

  async getLiveUsers(adminToken: string): Promise<bigint> {
    if (adminToken !== 'admin123123') return BigInt(0);
    const db = loadDB();
    return BigInt(db.users.filter(u => u.isActive).length);
  },

  async getPendingDeposits(adminToken: string): Promise<DepositRequestPublic[]> {
    if (adminToken !== 'admin123123') return [];
    const db = loadDB();
    return db.deposits.filter(d => d.status === 'pending').map(toDepositPublic);
  },

  async getAllDeposits(adminToken: string): Promise<DepositRequestPublic[]> {
    if (adminToken !== 'admin123123') return [];
    const db = loadDB();
    return [...db.deposits].reverse().map(toDepositPublic);
  },

  async getPendingWithdrawals(adminToken: string): Promise<WithdrawRequestPublic[]> {
    if (adminToken !== 'admin123123') return [];
    const db = loadDB();
    return db.withdraws.filter(w => w.status === 'pending').map(toWithdrawPublic);
  },

  async getAllWithdrawals(adminToken: string): Promise<WithdrawRequestPublic[]> {
    if (adminToken !== 'admin123123') return [];
    const db = loadDB();
    return [...db.withdraws].reverse().map(toWithdrawPublic);
  },

  async approveDeposit(requestId: bigint, adminToken: string): Promise<boolean> {
    if (adminToken !== 'admin123123') return false;
    const db = loadDB();
    const d = db.deposits.find(x => x.id === requestId.toString());
    if (!d || d.status !== 'pending') return false;
    d.status = 'approved';
    d.processedAt = [String(Date.now())];
    const u = db.users.find(x => x.id === d.userId);
    if (u) {
      const bonus = !u.firstDepositDone ? d.amount : 0;
      db.users = db.users.map(x => x.id === d.userId
        ? { ...x, balance: x.balance + d.amount + bonus, hasDeposited: true, firstDepositDone: true, firstDepositBonusGiven: bonus > 0, totalDeposited: x.totalDeposited + d.amount }
        : x);
    }
    saveDB(db);
    return true;
  },

  async rejectDeposit(requestId: bigint, adminToken: string): Promise<boolean> {
    if (adminToken !== 'admin123123') return false;
    const db = loadDB();
    const d = db.deposits.find(x => x.id === requestId.toString());
    if (!d) return false;
    d.status = 'rejected';
    saveDB(db);
    return true;
  },

  async approveWithdrawal(requestId: bigint, adminToken: string): Promise<boolean> {
    if (adminToken !== 'admin123123') return false;
    const db = loadDB();
    const w = db.withdraws.find(x => x.id === requestId.toString());
    if (!w || w.status !== 'pending') return false;
    w.status = 'approved';
    w.processedAt = [String(Date.now())];
    db.users = db.users.map(u => u.id === w.userId
      ? { ...u, balance: u.balance - w.amount }
      : u);
    saveDB(db);
    return true;
  },

  async rejectWithdrawal(requestId: bigint, adminToken: string): Promise<boolean> {
    if (adminToken !== 'admin123123') return false;
    const db = loadDB();
    const w = db.withdraws.find(x => x.id === requestId.toString());
    if (!w) return false;
    w.status = 'rejected';
    saveDB(db);
    return true;
  },

  async banUser(userId: bigint, adminToken: string): Promise<boolean> {
    if (adminToken !== 'admin123123') return false;
    const db = loadDB();
    const idx = db.users.findIndex(u => u.id === userId.toString());
    if (idx < 0) return false;
    // Refund pending bets
    let refund = 0;
    for (const b of db.bets) {
      if (b.userId === userId.toString() && b.status === 'pending') {
        b.status = 'cancelled';
        refund += b.amount;
      }
    }
    db.users[idx] = { ...db.users[idx]!, isBanned: true, isActive: false, balance: db.users[idx]!.balance + refund };
    saveDB(db);
    return true;
  },

  async unbanUser(userId: bigint, adminToken: string): Promise<boolean> {
    if (adminToken !== 'admin123123') return false;
    const db = loadDB();
    const idx = db.users.findIndex(u => u.id === userId.toString());
    if (idx < 0) return false;
    db.users[idx] = { ...db.users[idx]!, isBanned: false };
    saveDB(db);
    return true;
  },

  async setNextRoundResult(colour: string, size: string, adminToken: string): Promise<boolean> {
    if (adminToken !== 'admin123123') return false;
    const db = loadDB();
    db.pendingManualResult = [{ colour, size }];
    db.isRandomMode = false;
    saveDB(db);
    return true;
  },

  async setRandomMode(enabled: boolean, adminToken: string): Promise<boolean> {
    if (adminToken !== 'admin123123') return false;
    const db = loadDB();
    db.isRandomMode = enabled;
    if (enabled) db.pendingManualResult = [];
    saveDB(db);
    return true;
  },

  async getRandomModeStatus(adminToken: string): Promise<boolean> {
    if (adminToken !== 'admin123123') return true;
    const db = loadDB();
    return db.isRandomMode !== false;
  },

  async setLowestBetWinsMode(enabled: boolean, adminToken: string): Promise<boolean> {
    if (adminToken !== 'admin123123') return false;
    const db = loadDB();
    db.isLowestBetWinsMode = enabled;
    saveDB(db);
    return true;
  },

  async getLowestBetWinsMode(adminToken: string): Promise<boolean> {
    if (adminToken !== 'admin123123') return false;
    const db = loadDB();
    return db.isLowestBetWinsMode === true;
  },

  async getCurrentRoundBets(adminToken: string): Promise<Array<[string, bigint, number]>> {
    if (adminToken !== 'admin123123') return [];
    const db = loadDB();
    const options = ['red', 'green', 'violet', 'big', 'small'];
    return options.map(opt => {
      const matching = db.bets.filter(b => b.roundId === db.roundId && b.betValue === opt && b.status !== 'cancelled');
      return [opt, BigInt(matching.length), matching.reduce((s, b) => s + b.amount, 0)] as [string, bigint, number];
    });
  },

  async triggerRoundResult(adminToken: string): Promise<boolean> {
    if (adminToken !== 'admin123123') return false;
    const db = loadDB();
    const colours = ['red', 'green', 'violet'];
    const sizes = ['big', 'small'];
    let colour: string;
    let size: string;
    if (db.isLowestBetWinsMode) {
      const picked = pickLowestBetOption(db, db.roundId);
      colour = picked.colour;
      size = picked.size;
    } else if (db.pendingManualResult && db.pendingManualResult.length > 0) {
      colour = db.pendingManualResult[0]!.colour;
      size = db.pendingManualResult[0]!.size;
      db.pendingManualResult = [];
    } else {
      colour = colours[Math.floor(Math.random() * 3)]!;
      size = sizes[Math.floor(Math.random() * 2)]!;
    }
    for (const b of db.bets.filter(b => b.roundId === db.roundId && b.status === 'pending')) {
      const won = (b.betType === 'colour' && b.betValue === colour) || (b.betType === 'size' && b.betValue === size);
      b.status = won ? 'won' : 'lost';
      if (won) {
        b.winAmount = b.amount * 1.9;
        db.users = db.users.map(u => u.id === b.userId
          ? { ...u, balance: u.balance + b.winAmount, totalWinnings: u.totalWinnings + b.winAmount }
          : u);
      }
    }
    db.roundId = String(parseInt(db.roundId) + 1);
    db.roundStart = Date.now();
    saveDB(db);
    return true;
  },

  async lockCurrentRound(_adminToken: string): Promise<boolean> {
    return true;
  },

  async getAdminStats(adminToken: string): Promise<[] | [[bigint, bigint, number, number, bigint, number]]> {
    if (adminToken !== 'admin123123') return [];
    const db = loadDB();
    const totalUsers = BigInt(db.users.length);
    const liveUsers = BigInt(db.users.filter(u => u.isActive).length);
    const totalDeposits = db.deposits.filter(d => d.status === 'approved').reduce((s, d) => s + d.amount, 0);
    const totalWithdrawals = db.withdraws.filter(w => w.status === 'approved').reduce((s, w) => s + w.amount, 0);
    const totalBets = BigInt(db.bets.length);
    const winningsPaid = db.bets.filter(b => b.status === 'won').reduce((s, b) => s + b.winAmount, 0);
    return [[totalUsers, liveUsers, totalDeposits, totalWithdrawals, totalBets, winningsPaid]];
  },
};
