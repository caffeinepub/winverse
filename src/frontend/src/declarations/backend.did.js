/* eslint-disable */
// @ts-nocheck
// Winverse custom IDL -- includes all Winverse canister methods

import { IDL } from '@icp-sdk/core/candid';

// Caffeine infra types (keep for platform compat)
export const _CaffeineStorageCreateCertificateResult = IDL.Record({
  'method': IDL.Text,
  'blob_hash': IDL.Text,
});
export const _CaffeineStorageRefillInformation = IDL.Record({
  'proposed_top_up_amount': IDL.Opt(IDL.Nat),
});
export const _CaffeineStorageRefillResult = IDL.Record({
  'success': IDL.Opt(IDL.Bool),
  'topped_up_amount': IDL.Opt(IDL.Nat),
});
export const UserRole = IDL.Variant({
  'admin': IDL.Null,
  'user': IDL.Null,
  'guest': IDL.Null,
});
export const UserProfile = IDL.Record({ 'name': IDL.Text });

// Winverse types
const ResultType = IDL.Record({ 'colour': IDL.Text, 'size': IDL.Text });

const UserPublic = IDL.Record({
  'id': IDL.Nat,
  'phone': IDL.Text,
  'name': IDL.Text,
  'balance': IDL.Float64,
  'totalBets': IDL.Nat,
  'totalWinnings': IDL.Float64,
  'referralCode': IDL.Text,
  'referredBy': IDL.Opt(IDL.Text),
  'referralCount': IDL.Nat,
  'hasDeposited': IDL.Bool,
  'firstDepositDone': IDL.Bool,
  'firstDepositBonusGiven': IDL.Bool,
  'signupBonusGiven': IDL.Bool,
  'createdAt': IDL.Int,
  'isActive': IDL.Bool,
  'totalDeposited': IDL.Float64,
  'isBanned': IDL.Bool,
});

const RoundPublic = IDL.Record({
  'id': IDL.Nat,
  'startTime': IDL.Int,
  'endTime': IDL.Int,
  'result': IDL.Opt(ResultType),
  'status': IDL.Text,
  'isManual': IDL.Bool,
  'manualResult': IDL.Opt(ResultType),
});

const BetPublic = IDL.Record({
  'id': IDL.Nat,
  'userId': IDL.Nat,
  'roundId': IDL.Nat,
  'betType': IDL.Text,
  'betValue': IDL.Text,
  'amount': IDL.Float64,
  'status': IDL.Text,
  'winAmount': IDL.Float64,
  'placedAt': IDL.Int,
});

const DepositRequestPublic = IDL.Record({
  'id': IDL.Nat,
  'userId': IDL.Nat,
  'amount': IDL.Float64,
  'utrNumber': IDL.Text,
  'screenshotUrl': IDL.Text,
  'status': IDL.Text,
  'createdAt': IDL.Int,
  'processedAt': IDL.Opt(IDL.Int),
});

const WithdrawRequestPublic = IDL.Record({
  'id': IDL.Nat,
  'userId': IDL.Nat,
  'amount': IDL.Float64,
  'upiId': IDL.Text,
  'status': IDL.Text,
  'createdAt': IDL.Int,
  'processedAt': IDL.Opt(IDL.Int),
});

// Tuple type for getCurrentRoundBets: (Text, Nat, Float)
const RoundBetTuple = IDL.Record({
  '0': IDL.Text,
  '1': IDL.Nat,
  '2': IDL.Float64,
});

// Tuple for getReferralInfo: (Text, Nat, Float)
const ReferralTuple = IDL.Record({
  '0': IDL.Text,
  '1': IDL.Nat,
  '2': IDL.Float64,
});

// Tuple for getAdminStats: (Nat, Nat, Float, Float, Nat, Float)
const AdminStatsTuple = IDL.Record({
  '0': IDL.Nat,
  '1': IDL.Nat,
  '2': IDL.Float64,
  '3': IDL.Float64,
  '4': IDL.Nat,
  '5': IDL.Float64,
});

export const idlService = IDL.Service({
  // Caffeine infra
  '_caffeineStorageBlobIsLive': IDL.Func([IDL.Vec(IDL.Nat8)], [IDL.Bool], ['query']),
  '_caffeineStorageBlobsToDelete': IDL.Func([], [IDL.Vec(IDL.Vec(IDL.Nat8))], ['query']),
  '_caffeineStorageConfirmBlobDeletion': IDL.Func([IDL.Vec(IDL.Vec(IDL.Nat8))], [], []),
  '_caffeineStorageCreateCertificate': IDL.Func([IDL.Text], [_CaffeineStorageCreateCertificateResult], []),
  '_caffeineStorageRefillCashier': IDL.Func([IDL.Opt(_CaffeineStorageRefillInformation)], [_CaffeineStorageRefillResult], []),
  '_caffeineStorageUpdateGatewayPrincipals': IDL.Func([], [], []),
  '_initializeAccessControlWithSecret': IDL.Func([IDL.Text], [], []),
  // Winverse user
  'signup': IDL.Func([IDL.Text, IDL.Text], [IDL.Nat, IDL.Text], []),
  'login': IDL.Func([IDL.Text, IDL.Text], [IDL.Opt(IDL.Nat)], []),
  'getUserById': IDL.Func([IDL.Nat], [IDL.Opt(UserPublic)], ['query']),
  'updateUserName': IDL.Func([IDL.Nat, IDL.Text], [IDL.Bool], []),
  'logout': IDL.Func([IDL.Nat], [IDL.Bool], []),
  'processReferral': IDL.Func([IDL.Nat, IDL.Text], [IDL.Bool], []),
  'getReferralInfo': IDL.Func([IDL.Nat], [IDL.Opt(ReferralTuple)], ['query']),
  'placeBet': IDL.Func([IDL.Nat, IDL.Nat, IDL.Text, IDL.Text, IDL.Float64], [IDL.Opt(IDL.Nat)], []),
  'getCurrentRound': IDL.Func([], [IDL.Opt(RoundPublic)], []),
  'getRoundHistory': IDL.Func([IDL.Nat], [IDL.Vec(RoundPublic)], ['query']),
  'getUserBetHistory': IDL.Func([IDL.Nat], [IDL.Vec(BetPublic)], ['query']),
  'createDepositRequest': IDL.Func([IDL.Nat, IDL.Float64, IDL.Text, IDL.Text], [IDL.Opt(IDL.Nat)], []),
  'createWithdrawRequest': IDL.Func([IDL.Nat, IDL.Float64, IDL.Text], [IDL.Opt(IDL.Nat)], []),
  'getUserDepositRequests': IDL.Func([IDL.Nat], [IDL.Vec(DepositRequestPublic)], ['query']),
  'getUserWithdrawRequests': IDL.Func([IDL.Nat], [IDL.Vec(WithdrawRequestPublic)], ['query']),
  // Winverse admin
  'adminLogin': IDL.Func([IDL.Text, IDL.Text], [IDL.Opt(IDL.Text)], []),
  'getAllUsers': IDL.Func([IDL.Text], [IDL.Vec(UserPublic)], ['query']),
  'getLiveUsers': IDL.Func([IDL.Text], [IDL.Nat], ['query']),
  'getPendingDeposits': IDL.Func([IDL.Text], [IDL.Vec(DepositRequestPublic)], ['query']),
  'getAllDeposits': IDL.Func([IDL.Text], [IDL.Vec(DepositRequestPublic)], ['query']),
  'getPendingWithdrawals': IDL.Func([IDL.Text], [IDL.Vec(WithdrawRequestPublic)], ['query']),
  'getAllWithdrawals': IDL.Func([IDL.Text], [IDL.Vec(WithdrawRequestPublic)], ['query']),
  'approveDeposit': IDL.Func([IDL.Nat, IDL.Text], [IDL.Bool], []),
  'rejectDeposit': IDL.Func([IDL.Nat, IDL.Text], [IDL.Bool], []),
  'approveWithdrawal': IDL.Func([IDL.Nat, IDL.Text], [IDL.Bool], []),
  'rejectWithdrawal': IDL.Func([IDL.Nat, IDL.Text], [IDL.Bool], []),
  'banUser': IDL.Func([IDL.Nat, IDL.Text], [IDL.Bool], []),
  'unbanUser': IDL.Func([IDL.Nat, IDL.Text], [IDL.Bool], []),
  'setNextRoundResult': IDL.Func([IDL.Text, IDL.Text, IDL.Text], [IDL.Bool], []),
  'setRandomMode': IDL.Func([IDL.Bool, IDL.Text], [IDL.Bool], []),
  'getRandomModeStatus': IDL.Func([IDL.Text], [IDL.Bool], ['query']),
  'setLowestBetWinsMode': IDL.Func([IDL.Bool, IDL.Text], [IDL.Bool], []),
  'getLowestBetWinsMode': IDL.Func([IDL.Text], [IDL.Bool], ['query']),
  'getCurrentRoundBets': IDL.Func([IDL.Text], [IDL.Vec(RoundBetTuple)], ['query']),
  'triggerRoundResult': IDL.Func([IDL.Text], [IDL.Bool], []),
  'lockCurrentRound': IDL.Func([IDL.Text], [IDL.Bool], []),
  'getAdminStats': IDL.Func([IDL.Text], [IDL.Opt(AdminStatsTuple)], ['query']),
});

export const idlInitArgs = [];

export const idlFactory = ({ IDL }) => {
  const _CaffeineStorageCreateCertificateResult = IDL.Record({
    'method': IDL.Text,
    'blob_hash': IDL.Text,
  });
  const _CaffeineStorageRefillInformation = IDL.Record({
    'proposed_top_up_amount': IDL.Opt(IDL.Nat),
  });
  const _CaffeineStorageRefillResult = IDL.Record({
    'success': IDL.Opt(IDL.Bool),
    'topped_up_amount': IDL.Opt(IDL.Nat),
  });
  const ResultType = IDL.Record({ 'colour': IDL.Text, 'size': IDL.Text });
  const UserPublic = IDL.Record({
    'id': IDL.Nat,
    'phone': IDL.Text,
    'name': IDL.Text,
    'balance': IDL.Float64,
    'totalBets': IDL.Nat,
    'totalWinnings': IDL.Float64,
    'referralCode': IDL.Text,
    'referredBy': IDL.Opt(IDL.Text),
    'referralCount': IDL.Nat,
    'hasDeposited': IDL.Bool,
    'firstDepositDone': IDL.Bool,
    'firstDepositBonusGiven': IDL.Bool,
    'signupBonusGiven': IDL.Bool,
    'createdAt': IDL.Int,
    'isActive': IDL.Bool,
    'totalDeposited': IDL.Float64,
    'isBanned': IDL.Bool,
  });
  const RoundPublic = IDL.Record({
    'id': IDL.Nat,
    'startTime': IDL.Int,
    'endTime': IDL.Int,
    'result': IDL.Opt(ResultType),
    'status': IDL.Text,
    'isManual': IDL.Bool,
    'manualResult': IDL.Opt(ResultType),
  });
  const BetPublic = IDL.Record({
    'id': IDL.Nat,
    'userId': IDL.Nat,
    'roundId': IDL.Nat,
    'betType': IDL.Text,
    'betValue': IDL.Text,
    'amount': IDL.Float64,
    'status': IDL.Text,
    'winAmount': IDL.Float64,
    'placedAt': IDL.Int,
  });
  const DepositRequestPublic = IDL.Record({
    'id': IDL.Nat,
    'userId': IDL.Nat,
    'amount': IDL.Float64,
    'utrNumber': IDL.Text,
    'screenshotUrl': IDL.Text,
    'status': IDL.Text,
    'createdAt': IDL.Int,
    'processedAt': IDL.Opt(IDL.Int),
  });
  const WithdrawRequestPublic = IDL.Record({
    'id': IDL.Nat,
    'userId': IDL.Nat,
    'amount': IDL.Float64,
    'upiId': IDL.Text,
    'status': IDL.Text,
    'createdAt': IDL.Int,
    'processedAt': IDL.Opt(IDL.Int),
  });
  const RoundBetTuple = IDL.Record({
    '0': IDL.Text,
    '1': IDL.Nat,
    '2': IDL.Float64,
  });
  const ReferralTuple = IDL.Record({
    '0': IDL.Text,
    '1': IDL.Nat,
    '2': IDL.Float64,
  });
  const AdminStatsTuple = IDL.Record({
    '0': IDL.Nat,
    '1': IDL.Nat,
    '2': IDL.Float64,
    '3': IDL.Float64,
    '4': IDL.Nat,
    '5': IDL.Float64,
  });

  return IDL.Service({
    '_caffeineStorageBlobIsLive': IDL.Func([IDL.Vec(IDL.Nat8)], [IDL.Bool], ['query']),
    '_caffeineStorageBlobsToDelete': IDL.Func([], [IDL.Vec(IDL.Vec(IDL.Nat8))], ['query']),
    '_caffeineStorageConfirmBlobDeletion': IDL.Func([IDL.Vec(IDL.Vec(IDL.Nat8))], [], []),
    '_caffeineStorageCreateCertificate': IDL.Func([IDL.Text], [_CaffeineStorageCreateCertificateResult], []),
    '_caffeineStorageRefillCashier': IDL.Func([IDL.Opt(_CaffeineStorageRefillInformation)], [_CaffeineStorageRefillResult], []),
    '_caffeineStorageUpdateGatewayPrincipals': IDL.Func([], [], []),
    '_initializeAccessControlWithSecret': IDL.Func([IDL.Text], [], []),
    'signup': IDL.Func([IDL.Text, IDL.Text], [IDL.Nat, IDL.Text], []),
    'login': IDL.Func([IDL.Text, IDL.Text], [IDL.Opt(IDL.Nat)], []),
    'getUserById': IDL.Func([IDL.Nat], [IDL.Opt(UserPublic)], ['query']),
    'updateUserName': IDL.Func([IDL.Nat, IDL.Text], [IDL.Bool], []),
    'logout': IDL.Func([IDL.Nat], [IDL.Bool], []),
    'processReferral': IDL.Func([IDL.Nat, IDL.Text], [IDL.Bool], []),
    'getReferralInfo': IDL.Func([IDL.Nat], [IDL.Opt(ReferralTuple)], ['query']),
    'placeBet': IDL.Func([IDL.Nat, IDL.Nat, IDL.Text, IDL.Text, IDL.Float64], [IDL.Opt(IDL.Nat)], []),
    'getCurrentRound': IDL.Func([], [IDL.Opt(RoundPublic)], []),
    'getRoundHistory': IDL.Func([IDL.Nat], [IDL.Vec(RoundPublic)], ['query']),
    'getUserBetHistory': IDL.Func([IDL.Nat], [IDL.Vec(BetPublic)], ['query']),
    'createDepositRequest': IDL.Func([IDL.Nat, IDL.Float64, IDL.Text, IDL.Text], [IDL.Opt(IDL.Nat)], []),
    'createWithdrawRequest': IDL.Func([IDL.Nat, IDL.Float64, IDL.Text], [IDL.Opt(IDL.Nat)], []),
    'getUserDepositRequests': IDL.Func([IDL.Nat], [IDL.Vec(DepositRequestPublic)], ['query']),
    'getUserWithdrawRequests': IDL.Func([IDL.Nat], [IDL.Vec(WithdrawRequestPublic)], ['query']),
    'adminLogin': IDL.Func([IDL.Text, IDL.Text], [IDL.Opt(IDL.Text)], []),
    'getAllUsers': IDL.Func([IDL.Text], [IDL.Vec(UserPublic)], ['query']),
    'getLiveUsers': IDL.Func([IDL.Text], [IDL.Nat], ['query']),
    'getPendingDeposits': IDL.Func([IDL.Text], [IDL.Vec(DepositRequestPublic)], ['query']),
    'getAllDeposits': IDL.Func([IDL.Text], [IDL.Vec(DepositRequestPublic)], ['query']),
    'getPendingWithdrawals': IDL.Func([IDL.Text], [IDL.Vec(WithdrawRequestPublic)], ['query']),
    'getAllWithdrawals': IDL.Func([IDL.Text], [IDL.Vec(WithdrawRequestPublic)], ['query']),
    'approveDeposit': IDL.Func([IDL.Nat, IDL.Text], [IDL.Bool], []),
    'rejectDeposit': IDL.Func([IDL.Nat, IDL.Text], [IDL.Bool], []),
    'approveWithdrawal': IDL.Func([IDL.Nat, IDL.Text], [IDL.Bool], []),
    'rejectWithdrawal': IDL.Func([IDL.Nat, IDL.Text], [IDL.Bool], []),
    'banUser': IDL.Func([IDL.Nat, IDL.Text], [IDL.Bool], []),
    'unbanUser': IDL.Func([IDL.Nat, IDL.Text], [IDL.Bool], []),
    'setNextRoundResult': IDL.Func([IDL.Text, IDL.Text, IDL.Text], [IDL.Bool], []),
    'setRandomMode': IDL.Func([IDL.Bool, IDL.Text], [IDL.Bool], []),
    'getRandomModeStatus': IDL.Func([IDL.Text], [IDL.Bool], ['query']),
    'setLowestBetWinsMode': IDL.Func([IDL.Bool, IDL.Text], [IDL.Bool], []),
    'getLowestBetWinsMode': IDL.Func([IDL.Text], [IDL.Bool], ['query']),
    'getCurrentRoundBets': IDL.Func([IDL.Text], [IDL.Vec(RoundBetTuple)], ['query']),
    'triggerRoundResult': IDL.Func([IDL.Text], [IDL.Bool], []),
    'lockCurrentRound': IDL.Func([IDL.Text], [IDL.Bool], []),
    'getAdminStats': IDL.Func([IDL.Text], [IDL.Opt(AdminStatsTuple)], ['query']),
  });
};

export const init = ({ IDL }) => { return []; };
