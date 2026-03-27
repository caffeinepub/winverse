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

// Create a raw canister actor with our full IDL (includes all Winverse methods)
let _actorPromise: Promise<any> | null = null;

function getActor(): Promise<any> {
  if (_actorPromise) return _actorPromise;
  _actorPromise = (async () => {
    const config = await loadConfig();
    const agent = new HttpAgent({ host: config.backend_host });
    if (config.backend_host?.includes('localhost')) {
      await agent.fetchRootKey().catch(console.error);
    }
    return Actor.createActor(idlFactory, {
      agent,
      canisterId: config.backend_canister_id,
    });
  })();
  return _actorPromise;
}

// Normalize raw canister return values
function normalizeUser(u: any): UserPublic {
  return {
    id: BigInt(u.id),
    phone: u.phone,
    name: u.name,
    balance: Number(u.balance),
    totalBets: BigInt(u.totalBets),
    totalWinnings: Number(u.totalWinnings),
    referralCode: u.referralCode,
    referredBy: u.referredBy,
    referralCount: BigInt(u.referralCount),
    hasDeposited: u.hasDeposited,
    firstDepositDone: u.firstDepositDone,
    firstDepositBonusGiven: u.firstDepositBonusGiven,
    signupBonusGiven: u.signupBonusGiven,
    createdAt: BigInt(u.createdAt),
    isActive: u.isActive,
    totalDeposited: Number(u.totalDeposited),
    isBanned: u.isBanned ?? false,
  };
}

function normalizeRound(r: any): RoundPublic {
  return {
    id: BigInt(r.id),
    startTime: BigInt(r.startTime),
    endTime: BigInt(r.endTime),
    result: r.result,
    status: r.status,
    isManual: r.isManual,
    manualResult: r.manualResult,
  };
}

function normalizeBet(b: any): BetPublic {
  return {
    id: BigInt(b.id),
    userId: BigInt(b.userId),
    roundId: BigInt(b.roundId),
    betType: b.betType,
    betValue: b.betValue,
    amount: Number(b.amount),
    status: b.status,
    winAmount: Number(b.winAmount),
    placedAt: BigInt(b.placedAt),
  };
}

function normalizeDeposit(d: any): DepositRequestPublic {
  return {
    id: BigInt(d.id),
    userId: BigInt(d.userId),
    amount: Number(d.amount),
    utrNumber: d.utrNumber,
    screenshotUrl: d.screenshotUrl,
    status: d.status,
    createdAt: BigInt(d.createdAt),
    processedAt: d.processedAt,
  };
}

function normalizeWithdraw(w: any): WithdrawRequestPublic {
  return {
    id: BigInt(w.id),
    userId: BigInt(w.userId),
    amount: Number(w.amount),
    upiId: w.upiId,
    status: w.status,
    createdAt: BigInt(w.createdAt),
    processedAt: w.processedAt,
  };
}

export const backendService = {
  async signup(phone: string, password: string): Promise<[bigint, string]> {
    try {
      const actor = await getActor();
      const result = await actor.signup(phone, password);
      return [BigInt(result[0]), result[1]];
    } catch (e) {
      console.error('signup error', e);
      return [BigInt(0), 'Network error. Please try again.'];
    }
  },

  async login(phone: string, password: string): Promise<[] | [bigint]> {
    try {
      const actor = await getActor();
      const result = await actor.login(phone, password);
      if (!result || (Array.isArray(result) && result.length === 0)) return [];
      const id = Array.isArray(result) ? result[0] : result;
      return [BigInt(id)];
    } catch (e) {
      console.error('login error', e);
      return [];
    }
  },

  async getUserById(userId: bigint): Promise<[] | [UserPublic]> {
    try {
      const actor = await getActor();
      const result = await actor.getUserById(userId);
      if (!result || (Array.isArray(result) && result.length === 0)) return [];
      const u = Array.isArray(result) ? result[0] : result;
      return [normalizeUser(u)];
    } catch (e) {
      console.error('getUserById error', e);
      return [];
    }
  },

  async updateUserName(userId: bigint, name: string): Promise<boolean> {
    try {
      const actor = await getActor();
      return !!(await actor.updateUserName(userId, name));
    } catch (e) {
      return false;
    }
  },

  async placeBet(userId: bigint, roundId: bigint, betType: string, betValue: string, amount: number): Promise<[] | [bigint]> {
    try {
      const actor = await getActor();
      const result = await actor.placeBet(userId, roundId, betType, betValue, amount);
      if (!result || (Array.isArray(result) && result.length === 0)) return [];
      const id = Array.isArray(result) ? result[0] : result;
      return [BigInt(id)];
    } catch (e) {
      console.error('placeBet error', e);
      return [];
    }
  },

  async getCurrentRound(): Promise<[] | [RoundPublic]> {
    try {
      const actor = await getActor();
      const result = await actor.getCurrentRound();
      if (!result || (Array.isArray(result) && result.length === 0)) return [];
      const r = Array.isArray(result) ? result[0] : result;
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
      return Array.isArray(result) ? result.map(normalizeRound) : [];
    } catch (e) {
      return [];
    }
  },

  async getUserBetHistory(userId: bigint): Promise<BetPublic[]> {
    try {
      const actor = await getActor();
      const result = await actor.getUserBetHistory(userId);
      return Array.isArray(result) ? result.map(normalizeBet) : [];
    } catch (e) {
      return [];
    }
  },

  async createDepositRequest(userId: bigint, amount: number, utrNumber: string, screenshotUrl: string): Promise<[] | [bigint]> {
    try {
      const actor = await getActor();
      const result = await actor.createDepositRequest(userId, amount, utrNumber, screenshotUrl);
      if (!result || (Array.isArray(result) && result.length === 0)) return [];
      return [BigInt(Array.isArray(result) ? result[0] : result)];
    } catch (e) {
      return [];
    }
  },

  async createWithdrawRequest(userId: bigint, amount: number, upiId: string): Promise<[] | [bigint]> {
    try {
      const actor = await getActor();
      const result = await actor.createWithdrawRequest(userId, amount, upiId);
      if (!result || (Array.isArray(result) && result.length === 0)) return [];
      return [BigInt(Array.isArray(result) ? result[0] : result)];
    } catch (e) {
      return [];
    }
  },

  async getReferralInfo(userId: bigint): Promise<[] | [[string, bigint, number]]> {
    try {
      const actor = await getActor();
      const result = await actor.getReferralInfo(userId);
      if (!result || (Array.isArray(result) && result.length === 0)) return [];
      const info = Array.isArray(result) ? result[0] : result;
      // Motoko tuple (Text, Nat, Float) -> record { '0': text, '1': nat, '2': float64 }
      return [[String(info['0']), BigInt(info['1']), Number(info['2'])]];
    } catch (e) {
      console.error('getReferralInfo error', e);
      return [];
    }
  },

  async processReferral(newUserId: bigint, referralCode: string): Promise<boolean> {
    try {
      const actor = await getActor();
      return !!(await actor.processReferral(newUserId, referralCode));
    } catch (e) {
      return false;
    }
  },

  async logout(userId: bigint): Promise<boolean> {
    try {
      const actor = await getActor();
      return !!(await actor.logout(userId));
    } catch (e) {
      return true;
    }
  },

  async getUserDepositRequests(userId: bigint): Promise<DepositRequestPublic[]> {
    try {
      const actor = await getActor();
      const result = await actor.getUserDepositRequests(userId);
      return Array.isArray(result) ? result.map(normalizeDeposit) : [];
    } catch (e) {
      return [];
    }
  },

  async getUserWithdrawRequests(userId: bigint): Promise<WithdrawRequestPublic[]> {
    try {
      const actor = await getActor();
      const result = await actor.getUserWithdrawRequests(userId);
      return Array.isArray(result) ? result.map(normalizeWithdraw) : [];
    } catch (e) {
      return [];
    }
  },

  // ===== ADMIN =====

  async adminLogin(credential: string, password: string): Promise<[] | [string]> {
    try {
      const actor = await getActor();
      const result = await actor.adminLogin(credential, password);
      if (!result || (Array.isArray(result) && result.length === 0)) return [];
      const token = Array.isArray(result) ? result[0] : result;
      return [String(token)];
    } catch (e) {
      return [];
    }
  },

  async getAllUsers(adminToken: string): Promise<UserPublic[]> {
    try {
      const actor = await getActor();
      const result = await actor.getAllUsers(adminToken);
      return Array.isArray(result) ? result.map(normalizeUser) : [];
    } catch (e) {
      console.error('getAllUsers error', e);
      return [];
    }
  },

  async getLiveUsers(adminToken: string): Promise<bigint> {
    try {
      const actor = await getActor();
      return BigInt(await actor.getLiveUsers(adminToken));
    } catch (e) {
      return BigInt(0);
    }
  },

  async getPendingDeposits(adminToken: string): Promise<DepositRequestPublic[]> {
    try {
      const actor = await getActor();
      const result = await actor.getPendingDeposits(adminToken);
      return Array.isArray(result) ? result.map(normalizeDeposit) : [];
    } catch (e) {
      return [];
    }
  },

  async getAllDeposits(adminToken: string): Promise<DepositRequestPublic[]> {
    try {
      const actor = await getActor();
      const result = await actor.getAllDeposits(adminToken);
      return Array.isArray(result) ? result.map(normalizeDeposit) : [];
    } catch (e) {
      return [];
    }
  },

  async getPendingWithdrawals(adminToken: string): Promise<WithdrawRequestPublic[]> {
    try {
      const actor = await getActor();
      const result = await actor.getPendingWithdrawals(adminToken);
      return Array.isArray(result) ? result.map(normalizeWithdraw) : [];
    } catch (e) {
      return [];
    }
  },

  async getAllWithdrawals(adminToken: string): Promise<WithdrawRequestPublic[]> {
    try {
      const actor = await getActor();
      const result = await actor.getAllWithdrawals(adminToken);
      return Array.isArray(result) ? result.map(normalizeWithdraw) : [];
    } catch (e) {
      return [];
    }
  },

  async approveDeposit(requestId: bigint, adminToken: string): Promise<boolean> {
    try {
      const actor = await getActor();
      return !!(await actor.approveDeposit(requestId, adminToken));
    } catch (e) {
      return false;
    }
  },

  async rejectDeposit(requestId: bigint, adminToken: string): Promise<boolean> {
    try {
      const actor = await getActor();
      return !!(await actor.rejectDeposit(requestId, adminToken));
    } catch (e) {
      return false;
    }
  },

  async approveWithdrawal(requestId: bigint, adminToken: string): Promise<boolean> {
    try {
      const actor = await getActor();
      return !!(await actor.approveWithdrawal(requestId, adminToken));
    } catch (e) {
      return false;
    }
  },

  async rejectWithdrawal(requestId: bigint, adminToken: string): Promise<boolean> {
    try {
      const actor = await getActor();
      return !!(await actor.rejectWithdrawal(requestId, adminToken));
    } catch (e) {
      return false;
    }
  },

  async banUser(userId: bigint, adminToken: string): Promise<boolean> {
    try {
      const actor = await getActor();
      return !!(await actor.banUser(userId, adminToken));
    } catch (e) {
      return false;
    }
  },

  async unbanUser(userId: bigint, adminToken: string): Promise<boolean> {
    try {
      const actor = await getActor();
      return !!(await actor.unbanUser(userId, adminToken));
    } catch (e) {
      return false;
    }
  },

  async setNextRoundResult(colour: string, size: string, adminToken: string): Promise<boolean> {
    try {
      const actor = await getActor();
      return !!(await actor.setNextRoundResult(colour, size, adminToken));
    } catch (e) {
      return false;
    }
  },

  async setRandomMode(enabled: boolean, adminToken: string): Promise<boolean> {
    try {
      const actor = await getActor();
      return !!(await actor.setRandomMode(enabled, adminToken));
    } catch (e) {
      return false;
    }
  },

  async getRandomModeStatus(adminToken: string): Promise<boolean> {
    try {
      const actor = await getActor();
      return !!(await actor.getRandomModeStatus(adminToken));
    } catch (e) {
      return true;
    }
  },

  async setLowestBetWinsMode(enabled: boolean, adminToken: string): Promise<boolean> {
    try {
      const actor = await getActor();
      return !!(await actor.setLowestBetWinsMode(enabled, adminToken));
    } catch (e) {
      return false;
    }
  },

  async getLowestBetWinsMode(adminToken: string): Promise<boolean> {
    try {
      const actor = await getActor();
      return !!(await actor.getLowestBetWinsMode(adminToken));
    } catch (e) {
      return false;
    }
  },

  async getCurrentRoundBets(adminToken: string): Promise<Array<[string, bigint, number]>> {
    try {
      const actor = await getActor();
      const result = await actor.getCurrentRoundBets(adminToken);
      if (!Array.isArray(result)) return [];
      return result.map((item: any) => [
        String(item['0']),
        BigInt(item['1']),
        Number(item['2']),
      ] as [string, bigint, number]);
    } catch (e) {
      console.error('getCurrentRoundBets error', e);
      return [];
    }
  },

  async triggerRoundResult(adminToken: string): Promise<boolean> {
    try {
      const actor = await getActor();
      return !!(await actor.triggerRoundResult(adminToken));
    } catch (e) {
      return false;
    }
  },

  async lockCurrentRound(adminToken: string): Promise<boolean> {
    try {
      const actor = await getActor();
      return !!(await actor.lockCurrentRound(adminToken));
    } catch (e) {
      return false;
    }
  },

  async getAdminStats(adminToken: string): Promise<[] | [[bigint, bigint, number, number, bigint, number]]> {
    try {
      const actor = await getActor();
      const result = await actor.getAdminStats(adminToken);
      if (!result || (Array.isArray(result) && result.length === 0)) return [];
      const stats = Array.isArray(result) ? result[0] : result;
      return [[
        BigInt(stats['0']),
        BigInt(stats['1']),
        Number(stats['2']),
        Number(stats['3']),
        BigInt(stats['4']),
        Number(stats['5']),
      ]];
    } catch (e) {
      console.error('getAdminStats error', e);
      return [];
    }
  },
};
