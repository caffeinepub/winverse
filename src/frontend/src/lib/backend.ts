// Winverse backend service
// Uses the Caffeine-standard actor creation via loadConfig + HttpAgent + Actor
import { Actor, HttpAgent } from '@icp-sdk/core/agent';
import { winverseIdlFactory } from '../declarations/winverse.did.js';
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
  displayRoundNumber: bigint;
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

// ===== ACTOR SINGLETON =====

type WinverseActor = Record<string, (...args: unknown[]) => Promise<unknown>>;

let _actor: WinverseActor | null = null;
let _initPromise: Promise<WinverseActor> | null = null;

async function initActor(): Promise<WinverseActor> {
  const config = await loadConfig();
  const { backend_canister_id: canisterId, backend_host: host } = config;
  const agent = new HttpAgent({ host });
  // Only fetch root key on local dev
  if (host?.includes('localhost') || host?.includes('127.0.0.1')) {
    await agent.fetchRootKey().catch(() => {});
  }
  const actor = Actor.createActor(winverseIdlFactory, {
    agent,
    canisterId,
  }) as WinverseActor;
  return actor;
}

async function getActor(): Promise<WinverseActor> {
  if (_actor) return _actor;
  if (_initPromise) {
    try {
      return await _initPromise;
    } catch {
      _initPromise = null; // allow retry
    }
  }
  _initPromise = initActor().then((a) => {
    _actor = a;
    _initPromise = null;
    return a;
  }).catch((e) => {
    _initPromise = null;
    throw e;
  });
  return _initPromise;
}

async function call<T>(method: string, ...args: unknown[]): Promise<T> {
  const actor = await getActor();
  const fn = actor[method];
  if (!fn) throw new Error(`Unknown method: ${method}`);
  return fn(...args) as Promise<T>;
}

// Helpers to convert raw canister records to typed interfaces
function toUser(u: Record<string, unknown>): UserPublic {
  return {
    id: u.id as bigint,
    phone: u.phone as string,
    name: u.name as string,
    balance: u.balance as number,
    totalBets: u.totalBets as bigint,
    totalWinnings: u.totalWinnings as number,
    referralCode: u.referralCode as string,
    referredBy: u.referredBy as [] | [string],
    referralCount: u.referralCount as bigint,
    hasDeposited: u.hasDeposited as boolean,
    firstDepositDone: u.firstDepositDone as boolean,
    firstDepositBonusGiven: u.firstDepositBonusGiven as boolean,
    signupBonusGiven: u.signupBonusGiven as boolean,
    createdAt: u.createdAt as bigint,
    isActive: u.isActive as boolean,
    totalDeposited: u.totalDeposited as number,
    isBanned: u.isBanned as boolean,
  };
}

function toRound(r: Record<string, unknown>): RoundPublic {
  return {
    id: r.id as bigint,
    startTime: r.startTime as bigint,
    endTime: r.endTime as bigint,
    result: r.result as [] | [{ colour: string; size: string }],
    status: r.status as string,
    isManual: r.isManual as boolean,
    manualResult: r.manualResult as [] | [{ colour: string; size: string }],
    displayRoundNumber: r.displayRoundNumber as bigint,
  };
}

function toBet(b: Record<string, unknown>): BetPublic {
  return {
    id: b.id as bigint,
    userId: b.userId as bigint,
    roundId: b.roundId as bigint,
    betType: b.betType as string,
    betValue: b.betValue as string,
    amount: b.amount as number,
    status: b.status as string,
    winAmount: b.winAmount as number,
    placedAt: b.placedAt as bigint,
  };
}

function toDeposit(d: Record<string, unknown>): DepositRequestPublic {
  return {
    id: d.id as bigint,
    userId: d.userId as bigint,
    amount: d.amount as number,
    utrNumber: d.utrNumber as string,
    screenshotUrl: d.screenshotUrl as string,
    status: d.status as string,
    createdAt: d.createdAt as bigint,
    processedAt: d.processedAt as [] | [bigint],
  };
}

function toWithdraw(w: Record<string, unknown>): WithdrawRequestPublic {
  return {
    id: w.id as bigint,
    userId: w.userId as bigint,
    amount: w.amount as number,
    upiId: w.upiId as string,
    status: w.status as string,
    createdAt: w.createdAt as bigint,
    processedAt: w.processedAt as [] | [bigint],
  };
}

// ===== BACKEND SERVICE =====
export const backendService = {

  // ---- Auth ----
  async signup(phone: string, password: string): Promise<[bigint, string]> {
    // Returns (Nat, Text) -> decoded as [bigint, string]
    const res = await call<[bigint, string]>('signup', phone, password);
    return res;
  },

  async login(phone: string, password: string): Promise<[] | [bigint]> {
    // Returns ?Nat -> decoded as [] | [bigint]
    const res = await call<[] | [bigint]>('login', phone, password);
    return res;
  },

  async logout(userId: bigint): Promise<boolean> {
    return call<boolean>('logout', userId);
  },

  // ---- User ----
  async getUserById(userId: bigint): Promise<[] | [UserPublic]> {
    const res = await call<[] | [Record<string, unknown>]>('getUserById', userId);
    if (!res || (res as unknown[]).length === 0) return [];
    return [toUser((res as [Record<string, unknown>])[0]!)];
  },

  async updateUserName(userId: bigint, name: string): Promise<boolean> {
    return call<boolean>('updateUserName', userId, name);
  },

  // ---- Game ----
  async getCurrentRound(): Promise<[] | [RoundPublic]> {
    const res = await call<[] | [Record<string, unknown>]>('getCurrentRound');
    if (!res || (res as unknown[]).length === 0) return [];
    return [toRound((res as [Record<string, unknown>])[0]!)];
  },

  async checkAndAdvanceRound(): Promise<boolean> {
    return call<boolean>('checkAndAdvanceRound');
  },

  async getRoundHistory(limit: bigint): Promise<RoundPublic[]> {
    const res = await call<Record<string, unknown>[]>('getRoundHistory', limit);
    return (res || []).map(toRound);
  },

  async placeBet(
    userId: bigint,
    roundId: bigint,
    betType: string,
    betValue: string,
    amount: number,
  ): Promise<[] | [bigint]> {
    const res = await call<[] | [bigint]>('placeBet', userId, roundId, betType, betValue, amount);
    return res;
  },

  async getUserBetHistory(userId: bigint): Promise<BetPublic[]> {
    const res = await call<Record<string, unknown>[]>('getUserBetHistory', userId);
    return (res || []).map(toBet);
  },

  // ---- Wallet ----
  async createDepositRequest(
    userId: bigint,
    amount: number,
    utrNumber: string,
    screenshotUrl: string,
  ): Promise<[] | [bigint]> {
    return call<[] | [bigint]>('createDepositRequest', userId, amount, utrNumber, screenshotUrl);
  },

  async createWithdrawRequest(
    userId: bigint,
    amount: number,
    upiId: string,
  ): Promise<[] | [bigint]> {
    return call<[] | [bigint]>('createWithdrawRequest', userId, amount, upiId);
  },

  async getUserDepositRequests(userId: bigint): Promise<DepositRequestPublic[]> {
    const res = await call<Record<string, unknown>[]>('getUserDepositRequests', userId);
    return (res || []).map(toDeposit);
  },

  async getUserWithdrawRequests(userId: bigint): Promise<WithdrawRequestPublic[]> {
    const res = await call<Record<string, unknown>[]>('getUserWithdrawRequests', userId);
    return (res || []).map(toWithdraw);
  },

  // ---- Referral ----
  async getReferralInfo(userId: bigint): Promise<[] | [[string, bigint, number]]> {
    const res = await call<[] | [Record<string, unknown>]>('getReferralInfo', userId);
    if (!res || (res as unknown[]).length === 0) return [];
    const t = (res as [Record<string, unknown>])[0]!;
    return [[t['0'] as string, t['1'] as bigint, t['2'] as number]];
  },

  async processReferral(newUserId: bigint, referralCode: string): Promise<boolean> {
    return call<boolean>('processReferral', newUserId, referralCode);
  },

  // ---- Admin ----
  async adminLogin(credential: string, password: string): Promise<[] | [string]> {
    return call<[] | [string]>('adminLogin', credential, password);
  },

  async getAllUsers(adminToken: string): Promise<UserPublic[]> {
    const res = await call<Record<string, unknown>[]>('getAllUsers', adminToken);
    return (res || []).map(toUser);
  },

  async getAllDeposits(adminToken: string): Promise<DepositRequestPublic[]> {
    const res = await call<Record<string, unknown>[]>('getAllDeposits', adminToken);
    return (res || []).map(toDeposit);
  },

  async getAllWithdrawals(adminToken: string): Promise<WithdrawRequestPublic[]> {
    const res = await call<Record<string, unknown>[]>('getAllWithdrawals', adminToken);
    return (res || []).map(toWithdraw);
  },

  async approveDeposit(requestId: bigint, adminToken: string): Promise<boolean> {
    return call<boolean>('approveDeposit', requestId, adminToken);
  },

  async rejectDeposit(requestId: bigint, adminToken: string): Promise<boolean> {
    return call<boolean>('rejectDeposit', requestId, adminToken);
  },

  async approveWithdrawal(requestId: bigint, adminToken: string): Promise<boolean> {
    return call<boolean>('approveWithdrawal', requestId, adminToken);
  },

  async rejectWithdrawal(requestId: bigint, adminToken: string): Promise<boolean> {
    return call<boolean>('rejectWithdrawal', requestId, adminToken);
  },

  async banUser(userId: bigint, adminToken: string): Promise<boolean> {
    return call<boolean>('banUser', userId, adminToken);
  },

  async unbanUser(userId: bigint, adminToken: string): Promise<boolean> {
    return call<boolean>('unbanUser', userId, adminToken);
  },

  async setNextRoundResult(colour: string, size: string, adminToken: string): Promise<boolean> {
    return call<boolean>('setNextRoundResult', colour, size, adminToken);
  },

  async setRandomMode(enabled: boolean, adminToken: string): Promise<boolean> {
    return call<boolean>('setRandomMode', enabled, adminToken);
  },

  async getRandomModeStatus(adminToken: string): Promise<boolean> {
    return call<boolean>('getRandomModeStatus', adminToken);
  },

  async setLowestBetWinsMode(enabled: boolean, adminToken: string): Promise<boolean> {
    return call<boolean>('setLowestBetWinsMode', enabled, adminToken);
  },

  async getLowestBetWinsMode(adminToken: string): Promise<boolean> {
    return call<boolean>('getLowestBetWinsMode', adminToken);
  },

  async getCurrentRoundBets(adminToken: string): Promise<Array<[string, bigint, number]>> {
    const res = await call<Array<Record<string, unknown>>>('getCurrentRoundBets', adminToken);
    return (res || []).map((t) => [t['0'] as string, t['1'] as bigint, t['2'] as number]);
  },

  async triggerRoundResult(adminToken: string): Promise<boolean> {
    return call<boolean>('triggerRoundResult', adminToken);
  },

  async lockCurrentRound(adminToken: string): Promise<boolean> {
    return call<boolean>('lockCurrentRound', adminToken);
  },

  async adjustUserBalance(userId: bigint, amount: number, adminToken: string): Promise<boolean> {
    return call<boolean>('adjustUserBalance', userId, amount, adminToken);
  },

  async getAdminStats(adminToken: string): Promise<[] | [[bigint, bigint, number, number, bigint, number]]> {
    const res = await call<[] | [Record<string, unknown>]>('getAdminStats', adminToken);
    if (!res || (res as unknown[]).length === 0) return [];
    const t = (res as [Record<string, unknown>])[0]!;
    return [[t['0'] as bigint, t['1'] as bigint, t['2'] as number, t['3'] as number, t['4'] as bigint, t['5'] as number]];
  },
};
