/* eslint-disable */
// @ts-nocheck
// Winverse custom IDL declarations

import type { ActorMethod } from '@icp-sdk/core/agent';
import type { IDL } from '@icp-sdk/core/candid';
import type { Principal } from '@icp-sdk/core/principal';

export interface UserProfile { 'name': string }
export type UserRole = { 'admin': null } | { 'user': null } | { 'guest': null };
export interface _CaffeineStorageCreateCertificateResult {
  'method': string;
  'blob_hash': string;
}
export interface _CaffeineStorageRefillInformation {
  'proposed_top_up_amount': [] | [bigint];
}
export interface _CaffeineStorageRefillResult {
  'success': [] | [boolean];
  'topped_up_amount': [] | [bigint];
}

// Winverse types
export interface ResultType { colour: string; size: string }
export interface WinverseUserPublic {
  id: bigint; phone: string; name: string; balance: number;
  totalBets: bigint; totalWinnings: number; referralCode: string;
  referredBy: [] | [string]; referralCount: bigint;
  hasDeposited: boolean; firstDepositDone: boolean;
  firstDepositBonusGiven: boolean; signupBonusGiven: boolean;
  createdAt: bigint; isActive: boolean; totalDeposited: number; isBanned: boolean;
}
export interface WinverseRoundPublic {
  id: bigint; startTime: bigint; endTime: bigint;
  result: [] | [ResultType]; status: string;
  isManual: boolean; manualResult: [] | [ResultType];
}
export interface WinverseBetPublic {
  id: bigint; userId: bigint; roundId: bigint;
  betType: string; betValue: string; amount: number;
  status: string; winAmount: number; placedAt: bigint;
}
export interface WinverseDepositRequestPublic {
  id: bigint; userId: bigint; amount: number;
  utrNumber: string; screenshotUrl: string; status: string;
  createdAt: bigint; processedAt: [] | [bigint];
}
export interface WinverseWithdrawRequestPublic {
  id: bigint; userId: bigint; amount: number;
  upiId: string; status: string;
  createdAt: bigint; processedAt: [] | [bigint];
}

export interface _SERVICE {
  // Caffeine infra
  '_caffeineStorageBlobIsLive': ActorMethod<[Uint8Array], boolean>;
  '_caffeineStorageBlobsToDelete': ActorMethod<[], Array<Uint8Array>>;
  '_caffeineStorageConfirmBlobDeletion': ActorMethod<[Array<Uint8Array>], undefined>;
  '_caffeineStorageCreateCertificate': ActorMethod<[string], _CaffeineStorageCreateCertificateResult>;
  '_caffeineStorageRefillCashier': ActorMethod<[[] | [_CaffeineStorageRefillInformation]], _CaffeineStorageRefillResult>;
  '_caffeineStorageUpdateGatewayPrincipals': ActorMethod<[], undefined>;
  '_initializeAccessControlWithSecret': ActorMethod<[string], undefined>;
  // Winverse user
  'signup': ActorMethod<[string, string], [bigint, string]>;
  'login': ActorMethod<[string, string], [] | [bigint]>;
  'getUserById': ActorMethod<[bigint], [] | [WinverseUserPublic]>;
  'updateUserName': ActorMethod<[bigint, string], boolean>;
  'logout': ActorMethod<[bigint], boolean>;
  'processReferral': ActorMethod<[bigint, string], boolean>;
  'getReferralInfo': ActorMethod<[bigint], [] | [{ '0': string; '1': bigint; '2': number }]>;
  'placeBet': ActorMethod<[bigint, bigint, string, string, number], [] | [bigint]>;
  'getCurrentRound': ActorMethod<[], [] | [WinverseRoundPublic]>;
  'getRoundHistory': ActorMethod<[bigint], WinverseRoundPublic[]>;
  'getUserBetHistory': ActorMethod<[bigint], WinverseBetPublic[]>;
  'createDepositRequest': ActorMethod<[bigint, number, string, string], [] | [bigint]>;
  'createWithdrawRequest': ActorMethod<[bigint, number, string], [] | [bigint]>;
  'getUserDepositRequests': ActorMethod<[bigint], WinverseDepositRequestPublic[]>;
  'getUserWithdrawRequests': ActorMethod<[bigint], WinverseWithdrawRequestPublic[]>;
  // Winverse admin
  'adminLogin': ActorMethod<[string, string], [] | [string]>;
  'getAllUsers': ActorMethod<[string], WinverseUserPublic[]>;
  'getLiveUsers': ActorMethod<[string], bigint>;
  'getPendingDeposits': ActorMethod<[string], WinverseDepositRequestPublic[]>;
  'getAllDeposits': ActorMethod<[string], WinverseDepositRequestPublic[]>;
  'getPendingWithdrawals': ActorMethod<[string], WinverseWithdrawRequestPublic[]>;
  'getAllWithdrawals': ActorMethod<[string], WinverseWithdrawRequestPublic[]>;
  'approveDeposit': ActorMethod<[bigint, string], boolean>;
  'rejectDeposit': ActorMethod<[bigint, string], boolean>;
  'approveWithdrawal': ActorMethod<[bigint, string], boolean>;
  'rejectWithdrawal': ActorMethod<[bigint, string], boolean>;
  'banUser': ActorMethod<[bigint, string], boolean>;
  'unbanUser': ActorMethod<[bigint, string], boolean>;
  'setNextRoundResult': ActorMethod<[string, string, string], boolean>;
  'setRandomMode': ActorMethod<[boolean, string], boolean>;
  'getRandomModeStatus': ActorMethod<[string], boolean>;
  'setLowestBetWinsMode': ActorMethod<[boolean, string], boolean>;
  'getLowestBetWinsMode': ActorMethod<[string], boolean>;
  'getCurrentRoundBets': ActorMethod<[string], Array<{ '0': string; '1': bigint; '2': number }>>;
  'triggerRoundResult': ActorMethod<[string], boolean>;
  'lockCurrentRound': ActorMethod<[string], boolean>;
  'getAdminStats': ActorMethod<[string], [] | [{ '0': bigint; '1': bigint; '2': number; '3': number; '4': bigint; '5': number }]>;
}
export declare const idlService: IDL.ServiceClass;
export declare const idlInitArgs: IDL.Type[];
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
