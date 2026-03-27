// Real ICP Canister Backend Service
// Creates a raw ICP actor directly using our custom idlFactory
// Data is shared across ALL users/devices via the shared canister

import { Actor, HttpAgent } from '@icp-sdk/core/agent';
import { idlFactory } from '../declarations/backend.did';
import { loadConfig } from '../config';

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

// Actor singleton -- reset on failure so retry is possible
let _actorPromise: Promise<any> | null = null;

function getActor(): Promise<any> {
  if (_actorPromise) return _actorPromise;
  const p = (async () => {
    const config = await loadConfig();
    const agentOpts: Record<string, unknown> = {};
    if (config.backend_host && config.backend_host !== 'undefined') {
      agentOpts.host = config.backend_host;
    }
    const agent = new HttpAgent(agentOpts);
    if (config.backend_host?.includes('localhost')) {
      await agent.fetchRootKey().catch(console.error);
    }
    return Actor.createActor(idlFactory, {
      agent,
      canisterId: config.backend_canister_id,
    });
  })();
  // Reset cache on failure so next call retries
  p.catch(() => { _actorPromise = null; });
  _actorPromise = p;
  return p;
}

// Unwrap a Candid optional: [] | [T] -> T | null
function unwrapOpt<T>(opt: [] | [T]): T | null {
  return (Array.isArray(opt) && opt.length > 0 ? opt[0] : null) as T | null;
}

// The JS agent wraps all function return values in an outer array.
// e.g. a function returning Opt(Nat) gives [ [] | [bigint] ]
// So result[0] is the Opt(Nat) = [] or [bigint]
function getReturnValue<T>(result: any): T | null {
  if (!Array.isArray(result) || result.length === 0) return null;
  return result[0] as T;
}

function normalizeUser(u: any): UserPublic {
  return {
    id: BigInt(u.id ?? 0),
    phone: String(u.phone ?? ''),
    name: String(u.name ?? ''),
    balance: Number(u.balance ?? 0),
    totalBets: BigInt(u.totalBets ?? 0),
    totalWinnings: Number(u.totalWinnings ?? 0),
    referralCode: String(u.referralCode ?? ''),
    referredBy: u.referredBy ?? [],
    referralCount: BigInt(u.referralCount ?? 0),
    hasDeposited: Boolean(u.hasDeposited),
    firstDepositDone: Boolean(u.firstDepositDone),
    firstDepositBonusGiven: Boolean(u.firstDepositBonusGiven),
    signupBonusGiven: Boolean(u.signupBonusGiven),
    createdAt: BigInt(u.createdAt ?? 0),
    isActive: Boolean(u.isActive),
    totalDeposited: Number(u.totalDeposited ?? 0),
    isBanned: Boolean(u.isBanned),
  };
}

function normalizeRound(r: any): RoundPublic {
  return {
    id: BigInt(r.id ?? 0),
    startTime: BigInt(r.startTime ?? 0),
    endTime: BigInt(r.endTime ?? 0),
    result: r.result ?? [],
    status: String(r.status ?? ''),
    isManual: Boolean(r.isManual),
    manualResult: r.manualResult ?? [],
  };
}

function normalizeBet(b: any): BetPublic {
  return {
    id: BigInt(b.id ?? 0),
    userId: BigInt(b.userId ?? 0),
    roundId: BigInt(b.roundId ?? 0),
    betType: String(b.betType ?? ''),
    betValue: String(b.betValue ?? ''),
    amount: Number(b.amount ?? 0),
    status: String(b.status ?? ''),
    winAmount: Number(b.winAmount ?? 0),
    placedAt: BigInt(b.placedAt ?? 0),
  };
}

function normalizeDeposit(d: any): DepositRequestPublic {
  return {
    id: BigInt(d.id ?? 0),
    userId: BigInt(d.userId ?? 0),
    amount: Number(d.amount ?? 0),
    utrNumber: String(d.utrNumber ?? ''),
    screenshotUrl: String(d.screenshotUrl ?? ''),
    status: String(d.status ?? ''),
    createdAt: BigInt(d.createdAt ?? 0),
    processedAt: d.processedAt ?? [],
  };
}

function normalizeWithdraw(w: any): WithdrawRequestPublic {
  return {
    id: BigInt(w.id ?? 0),
    userId: BigInt(w.userId ?? 0),
    amount: Number(w.amount ?? 0),
    upiId: String(w.upiId ?? ''),
    status: String(w.status ?? ''),
    createdAt: BigInt(w.createdAt ?? 0),
    processedAt: w.processedAt ?? [],
  };
}

export const backendService = {
  async signup(phone: string, password: string): Promise<[bigint, string]> {
    try {
      const actor = await getActor();
      // Motoko (Nat, Text) -> JS agent returns [bigint, string]
      const result = await actor.signup(phone, password);
      const userId = BigInt(result[0]);
      const msg = String(result[1]);
      return [userId, msg];
    } catch (e) {
      console.error('signup error', e);
      return [BigInt(0), 'Network error. Please check your connection and try again.'];
    }
  },

  async login(phone: string, password: string): Promise<[] | [bigint]> {
    try {
      const actor = await getActor();
      // Motoko ?Nat -> Candid Opt(Nat) -> JS agent returns [ [] | [bigint] ]
      const result = await actor.login(phone, password);
      // result[0] is the optional value: [] (null) or [bigint] (some)
      const optId = Array.isArray(result) && result.length > 0 ? result[0] : [];
      if (!Array.isArray(optId) || optId.length === 0) return [];
      return [BigInt(optId[0])];
    } catch (e) {
      console.error('login error', e);
      return [];
    }
  },

  async getUserById(userId: bigint): Promise<[] | [UserPublic]> {
    try {
      const actor = await getActor();
      const result = await actor.getUserById(userId);
      const optUser = Array.isArray(result) && result.length > 0 ? result[0] : null;
      if (!optUser || (Array.isArray(optUser) && optUser.length === 0)) return [];
      const u = Array.isArray(optUser) ? optUser[0] : optUser;
      if (!u) return [];
      return [normalizeUser(u)];
    } catch (e) {
      console.error('getUserById error', e);
      return [];
    }
  },

  async updateUserName(userId: bigint, name: string): Promise<boolean> {
    try {
      const actor = await getActor();
      const result = await actor.updateUserName(userId, name);
      return Array.isArray(result) ? Boolean(result[0]) : Boolean(result);
    } catch (e) {
      return false;
    }
  },

  async placeBet(userId: bigint, roundId: bigint, betType: string, betValue: string, amount: number): Promise<[] | [bigint]> {
    try {
      const actor = await getActor();
      const result = await actor.placeBet(userId, roundId, betType, betValue, amount);
      const optId = Array.isArray(result) && result.length > 0 ? result[0] : [];
      if (!Array.isArray(optId) || optId.length === 0) return [];
      return [BigInt(optId[0])];
    } catch (e) {
      console.error('placeBet error', e);
      return [];
    }
  },

  async getCurrentRound(): Promise<[] | [RoundPublic]> {
    try {
      const actor = await getActor();
      const result = await actor.getCurrentRound();
      const optRound = Array.isArray(result) && result.length > 0 ? result[0] : null;
      if (!optRound || (Array.isArray(optRound) && optRound.length === 0)) return [];
      const r = Array.isArray(optRound) ? optRound[0] : optRound;
      if (!r) return [];
      return [normalizeRound(r)];
    } catch (e) {
      console.error('getCurrentRound error', e);
      return [];
    }
  },

  async getRoundHistory(limit: bigint): Promise<RoundPublic[]> {
    try {
      const actor = await getActor();
      const result = await actor.getRoundHistory(limit);
      const arr = Array.isArray(result) && result.length > 0 && Array.isArray(result[0]) ? result[0] : result;
      return Array.isArray(arr) ? arr.map(normalizeRound) : [];
    } catch (e) {
      return [];
    }
  },

  async getUserBetHistory(userId: bigint): Promise<BetPublic[]> {
    try {
      const actor = await getActor();
      const result = await actor.getUserBetHistory(userId);
      const arr = Array.isArray(result) && result.length > 0 && Array.isArray(result[0]) ? result[0] : result;
      return Array.isArray(arr) ? arr.map(normalizeBet) : [];
    } catch (e) {
      return [];
    }
  },

  async createDepositRequest(userId: bigint, amount: number, utrNumber: string, screenshotUrl: string): Promise<[] | [bigint]> {
    try {
      const actor = await getActor();
      const result = await actor.createDepositRequest(userId, amount, utrNumber, screenshotUrl);
      const optId = Array.isArray(result) && result.length > 0 ? result[0] : [];
      if (!Array.isArray(optId) || optId.length === 0) return [];
      return [BigInt(optId[0])];
    } catch (e) {
      return [];
    }
  },

  async createWithdrawRequest(userId: bigint, amount: number, upiId: string): Promise<[] | [bigint]> {
    try {
      const actor = await getActor();
      const result = await actor.createWithdrawRequest(userId, amount, upiId);
      const optId = Array.isArray(result) && result.length > 0 ? result[0] : [];
      if (!Array.isArray(optId) || optId.length === 0) return [];
      return [BigInt(optId[0])];
    } catch (e) {
      return [];
    }
  },

  async getReferralInfo(userId: bigint): Promise<[] | [[string, bigint, number]]> {
    try {
      const actor = await getActor();
      const result = await actor.getReferralInfo(userId);
      // result[0] is Opt(record{'0':Text,'1':Nat,'2':Float})
      const optInfo = Array.isArray(result) && result.length > 0 ? result[0] : null;
      if (!optInfo || (Array.isArray(optInfo) && optInfo.length === 0)) return [];
      const info = Array.isArray(optInfo) ? optInfo[0] : optInfo;
      if (!info) return [];
      return [[String(info['0']), BigInt(info['1']), Number(info['2'])]];
    } catch (e) {
      console.error('getReferralInfo error', e);
      return [];
    }
  },

  async processReferral(newUserId: bigint, referralCode: string): Promise<boolean> {
    try {
      const actor = await getActor();
      const result = await actor.processReferral(newUserId, referralCode);
      return Array.isArray(result) ? Boolean(result[0]) : Boolean(result);
    } catch (e) {
      return false;
    }
  },

  async logout(userId: bigint): Promise<boolean> {
    try {
      const actor = await getActor();
      const result = await actor.logout(userId);
      return Array.isArray(result) ? Boolean(result[0]) : Boolean(result);
    } catch (e) {
      return true;
    }
  },

  async getUserDepositRequests(userId: bigint): Promise<DepositRequestPublic[]> {
    try {
      const actor = await getActor();
      const result = await actor.getUserDepositRequests(userId);
      const arr = Array.isArray(result) && result.length > 0 && Array.isArray(result[0]) ? result[0] : result;
      return Array.isArray(arr) ? arr.map(normalizeDeposit) : [];
    } catch (e) {
      return [];
    }
  },

  async getUserWithdrawRequests(userId: bigint): Promise<WithdrawRequestPublic[]> {
    try {
      const actor = await getActor();
      const result = await actor.getUserWithdrawRequests(userId);
      const arr = Array.isArray(result) && result.length > 0 && Array.isArray(result[0]) ? result[0] : result;
      return Array.isArray(arr) ? arr.map(normalizeWithdraw) : [];
    } catch (e) {
      return [];
    }
  },

  // ===== ADMIN =====

  async adminLogin(credential: string, password: string): Promise<[] | [string]> {
    try {
      const actor = await getActor();
      // Motoko ?Text -> result[0] is [] | [string]
      const result = await actor.adminLogin(credential, password);
      const optToken = Array.isArray(result) && result.length > 0 ? result[0] : [];
      if (!Array.isArray(optToken) || optToken.length === 0) return [];
      return [String(optToken[0])];
    } catch (e) {
      console.error('adminLogin error', e);
      return [];
    }
  },

  async getAllUsers(adminToken: string): Promise<UserPublic[]> {
    try {
      const actor = await getActor();
      const result = await actor.getAllUsers(adminToken);
      const arr = Array.isArray(result) && result.length > 0 && Array.isArray(result[0]) ? result[0] : result;
      return Array.isArray(arr) ? arr.map(normalizeUser) : [];
    } catch (e) {
      console.error('getAllUsers error', e);
      return [];
    }
  },

  async getLiveUsers(adminToken: string): Promise<bigint> {
    try {
      const actor = await getActor();
      const result = await actor.getLiveUsers(adminToken);
      const val = Array.isArray(result) && result.length > 0 ? result[0] : result;
      return BigInt(val ?? 0);
    } catch (e) {
      return BigInt(0);
    }
  },

  async getPendingDeposits(adminToken: string): Promise<DepositRequestPublic[]> {
    try {
      const actor = await getActor();
      const result = await actor.getPendingDeposits(adminToken);
      const arr = Array.isArray(result) && result.length > 0 && Array.isArray(result[0]) ? result[0] : result;
      return Array.isArray(arr) ? arr.map(normalizeDeposit) : [];
    } catch (e) {
      return [];
    }
  },

  async getAllDeposits(adminToken: string): Promise<DepositRequestPublic[]> {
    try {
      const actor = await getActor();
      const result = await actor.getAllDeposits(adminToken);
      const arr = Array.isArray(result) && result.length > 0 && Array.isArray(result[0]) ? result[0] : result;
      return Array.isArray(arr) ? arr.map(normalizeDeposit) : [];
    } catch (e) {
      return [];
    }
  },

  async getPendingWithdrawals(adminToken: string): Promise<WithdrawRequestPublic[]> {
    try {
      const actor = await getActor();
      const result = await actor.getPendingWithdrawals(adminToken);
      const arr = Array.isArray(result) && result.length > 0 && Array.isArray(result[0]) ? result[0] : result;
      return Array.isArray(arr) ? arr.map(normalizeWithdraw) : [];
    } catch (e) {
      return [];
    }
  },

  async getAllWithdrawals(adminToken: string): Promise<WithdrawRequestPublic[]> {
    try {
      const actor = await getActor();
      const result = await actor.getAllWithdrawals(adminToken);
      const arr = Array.isArray(result) && result.length > 0 && Array.isArray(result[0]) ? result[0] : result;
      return Array.isArray(arr) ? arr.map(normalizeWithdraw) : [];
    } catch (e) {
      return [];
    }
  },

  async approveDeposit(requestId: bigint, adminToken: string): Promise<boolean> {
    try {
      const actor = await getActor();
      const result = await actor.approveDeposit(requestId, adminToken);
      return Array.isArray(result) ? Boolean(result[0]) : Boolean(result);
    } catch (e) {
      return false;
    }
  },

  async rejectDeposit(requestId: bigint, adminToken: string): Promise<boolean> {
    try {
      const actor = await getActor();
      const result = await actor.rejectDeposit(requestId, adminToken);
      return Array.isArray(result) ? Boolean(result[0]) : Boolean(result);
    } catch (e) {
      return false;
    }
  },

  async approveWithdrawal(requestId: bigint, adminToken: string): Promise<boolean> {
    try {
      const actor = await getActor();
      const result = await actor.approveWithdrawal(requestId, adminToken);
      return Array.isArray(result) ? Boolean(result[0]) : Boolean(result);
    } catch (e) {
      return false;
    }
  },

  async rejectWithdrawal(requestId: bigint, adminToken: string): Promise<boolean> {
    try {
      const actor = await getActor();
      const result = await actor.rejectWithdrawal(requestId, adminToken);
      return Array.isArray(result) ? Boolean(result[0]) : Boolean(result);
    } catch (e) {
      return false;
    }
  },

  async banUser(userId: bigint, adminToken: string): Promise<boolean> {
    try {
      const actor = await getActor();
      const result = await actor.banUser(userId, adminToken);
      return Array.isArray(result) ? Boolean(result[0]) : Boolean(result);
    } catch (e) {
      return false;
    }
  },

  async unbanUser(userId: bigint, adminToken: string): Promise<boolean> {
    try {
      const actor = await getActor();
      const result = await actor.unbanUser(userId, adminToken);
      return Array.isArray(result) ? Boolean(result[0]) : Boolean(result);
    } catch (e) {
      return false;
    }
  },

  async setNextRoundResult(colour: string, size: string, adminToken: string): Promise<boolean> {
    try {
      const actor = await getActor();
      const result = await actor.setNextRoundResult(colour, size, adminToken);
      return Array.isArray(result) ? Boolean(result[0]) : Boolean(result);
    } catch (e) {
      return false;
    }
  },

  async setRandomMode(enabled: boolean, adminToken: string): Promise<boolean> {
    try {
      const actor = await getActor();
      const result = await actor.setRandomMode(enabled, adminToken);
      return Array.isArray(result) ? Boolean(result[0]) : Boolean(result);
    } catch (e) {
      return false;
    }
  },

  async getRandomModeStatus(adminToken: string): Promise<boolean> {
    try {
      const actor = await getActor();
      const result = await actor.getRandomModeStatus(adminToken);
      return Array.isArray(result) ? Boolean(result[0]) : Boolean(result);
    } catch (e) {
      return true;
    }
  },

  async setLowestBetWinsMode(enabled: boolean, adminToken: string): Promise<boolean> {
    try {
      const actor = await getActor();
      const result = await actor.setLowestBetWinsMode(enabled, adminToken);
      return Array.isArray(result) ? Boolean(result[0]) : Boolean(result);
    } catch (e) {
      return false;
    }
  },

  async getLowestBetWinsMode(adminToken: string): Promise<boolean> {
    try {
      const actor = await getActor();
      const result = await actor.getLowestBetWinsMode(adminToken);
      return Array.isArray(result) ? Boolean(result[0]) : Boolean(result);
    } catch (e) {
      return false;
    }
  },

  async getCurrentRoundBets(adminToken: string): Promise<Array<[string, bigint, number]>> {
    try {
      const actor = await getActor();
      const result = await actor.getCurrentRoundBets(adminToken);
      const arr = Array.isArray(result) && result.length > 0 && Array.isArray(result[0]) ? result[0] : result;
      if (!Array.isArray(arr)) return [];
      return arr.map((item: any) => [
        String(item['0'] ?? item[0] ?? ''),
        BigInt(item['1'] ?? item[1] ?? 0),
        Number(item['2'] ?? item[2] ?? 0),
      ] as [string, bigint, number]);
    } catch (e) {
      console.error('getCurrentRoundBets error', e);
      return [];
    }
  },

  async triggerRoundResult(adminToken: string): Promise<boolean> {
    try {
      const actor = await getActor();
      const result = await actor.triggerRoundResult(adminToken);
      return Array.isArray(result) ? Boolean(result[0]) : Boolean(result);
    } catch (e) {
      return false;
    }
  },

  async lockCurrentRound(adminToken: string): Promise<boolean> {
    try {
      const actor = await getActor();
      const result = await actor.lockCurrentRound(adminToken);
      return Array.isArray(result) ? Boolean(result[0]) : Boolean(result);
    } catch (e) {
      return false;
    }
  },

  async getAdminStats(adminToken: string): Promise<[] | [[bigint, bigint, number, number, bigint, number]]> {
    try {
      const actor = await getActor();
      const result = await actor.getAdminStats(adminToken);
      // result[0] is Opt(record)
      const optStats = Array.isArray(result) && result.length > 0 ? result[0] : null;
      if (!optStats || (Array.isArray(optStats) && optStats.length === 0)) return [];
      const stats = Array.isArray(optStats) ? optStats[0] : optStats;
      if (!stats) return [];
      return [[
        BigInt(stats['0'] ?? 0),
        BigInt(stats['1'] ?? 0),
        Number(stats['2'] ?? 0),
        Number(stats['3'] ?? 0),
        BigInt(stats['4'] ?? 0),
        Number(stats['5'] ?? 0),
      ]];
    } catch (e) {
      console.error('getAdminStats error', e);
      return [];
    }
  },
};

// Re-export unused helpers to keep TypeScript happy
export { unwrapOpt, getReturnValue };
