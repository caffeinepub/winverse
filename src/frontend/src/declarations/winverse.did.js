// Winverse Canister IDL Factory
// IMPORTANT: All types defined INSIDE factory using the passed IDL parameter
import { IDL as _IDL_MODULE } from '@icp-sdk/core/candid';

export const winverseIdlFactory = ({ IDL }) => {
  // Use passed IDL instance (required for Actor.createActor compatibility)
  // Fallback to module-level import if IDL not passed correctly
  const I = IDL || _IDL_MODULE;

  const ResultType = I.Record({ colour: I.Text, size: I.Text });

  const UserPublic = I.Record({
    id: I.Nat,
    phone: I.Text,
    name: I.Text,
    balance: I.Float64,
    totalBets: I.Nat,
    totalWinnings: I.Float64,
    referralCode: I.Text,
    referredBy: I.Opt(I.Text),
    referralCount: I.Nat,
    hasDeposited: I.Bool,
    firstDepositDone: I.Bool,
    firstDepositBonusGiven: I.Bool,
    signupBonusGiven: I.Bool,
    createdAt: I.Int,
    isActive: I.Bool,
    totalDeposited: I.Float64,
    isBanned: I.Bool,
  });

  const RoundPublic = I.Record({
    id: I.Nat,
    startTime: I.Int,
    endTime: I.Int,
    result: I.Opt(ResultType),
    status: I.Text,
    isManual: I.Bool,
    manualResult: I.Opt(ResultType),
    displayRoundNumber: I.Nat,
  });

  const BetPublic = I.Record({
    id: I.Nat,
    userId: I.Nat,
    roundId: I.Nat,
    betType: I.Text,
    betValue: I.Text,
    amount: I.Float64,
    status: I.Text,
    winAmount: I.Float64,
    placedAt: I.Int,
  });

  const DepositRequestPublic = I.Record({
    id: I.Nat,
    userId: I.Nat,
    amount: I.Float64,
    utrNumber: I.Text,
    screenshotUrl: I.Text,
    status: I.Text,
    createdAt: I.Int,
    processedAt: I.Opt(I.Int),
  });

  const WithdrawRequestPublic = I.Record({
    id: I.Nat,
    userId: I.Nat,
    amount: I.Float64,
    upiId: I.Text,
    status: I.Text,
    createdAt: I.Int,
    processedAt: I.Opt(I.Int),
  });

  // Candid tuple (Text, Nat, Float) is encoded as Record with numeric keys
  const BetTuple = I.Record({ '0': I.Text, '1': I.Nat, '2': I.Float64 });

  // ?(Nat, Nat, Float, Float, Nat, Float)
  const AdminStatsTuple = I.Record({
    '0': I.Nat, '1': I.Nat, '2': I.Float64,
    '3': I.Float64, '4': I.Nat, '5': I.Float64,
  });

  // ?(Text, Nat, Float)
  const ReferralInfoTuple = I.Record({
    '0': I.Text, '1': I.Nat, '2': I.Float64,
  });

  return I.Service({
    // User
    signup: I.Func([I.Text, I.Text], [I.Nat, I.Text], []),
    login: I.Func([I.Text, I.Text], [I.Opt(I.Nat)], []),
    getUserById: I.Func([I.Nat], [I.Opt(UserPublic)], ['query']),
    updateUserName: I.Func([I.Nat, I.Text], [I.Bool], []),
    placeBet: I.Func([I.Nat, I.Nat, I.Text, I.Text, I.Float64], [I.Opt(I.Nat)], []),
    getCurrentRound: I.Func([], [I.Opt(RoundPublic)], ['query']),
    checkAndAdvanceRound: I.Func([], [I.Bool], []),
    getRoundHistory: I.Func([I.Nat], [I.Vec(RoundPublic)], ['query']),
    getUserBetHistory: I.Func([I.Nat], [I.Vec(BetPublic)], ['query']),
    createDepositRequest: I.Func([I.Nat, I.Float64, I.Text, I.Text], [I.Opt(I.Nat)], []),
    createWithdrawRequest: I.Func([I.Nat, I.Float64, I.Text], [I.Opt(I.Nat)], []),
    getReferralInfo: I.Func([I.Nat], [I.Opt(ReferralInfoTuple)], ['query']),
    processReferral: I.Func([I.Nat, I.Text], [I.Bool], []),
    logout: I.Func([I.Nat], [I.Bool], []),
    getUserDepositRequests: I.Func([I.Nat], [I.Vec(DepositRequestPublic)], ['query']),
    getUserWithdrawRequests: I.Func([I.Nat], [I.Vec(WithdrawRequestPublic)], ['query']),
    // Admin
    adminLogin: I.Func([I.Text, I.Text], [I.Opt(I.Text)], []),
    getAllUsers: I.Func([I.Text], [I.Vec(UserPublic)], ['query']),
    getLiveUsers: I.Func([I.Text], [I.Nat], ['query']),
    getPendingDeposits: I.Func([I.Text], [I.Vec(DepositRequestPublic)], ['query']),
    getAllDeposits: I.Func([I.Text], [I.Vec(DepositRequestPublic)], ['query']),
    getPendingWithdrawals: I.Func([I.Text], [I.Vec(WithdrawRequestPublic)], ['query']),
    getAllWithdrawals: I.Func([I.Text], [I.Vec(WithdrawRequestPublic)], ['query']),
    approveDeposit: I.Func([I.Nat, I.Text], [I.Bool], []),
    rejectDeposit: I.Func([I.Nat, I.Text], [I.Bool], []),
    approveWithdrawal: I.Func([I.Nat, I.Text], [I.Bool], []),
    rejectWithdrawal: I.Func([I.Nat, I.Text], [I.Bool], []),
    banUser: I.Func([I.Nat, I.Text], [I.Bool], []),
    unbanUser: I.Func([I.Nat, I.Text], [I.Bool], []),
    setNextRoundResult: I.Func([I.Text, I.Text, I.Text], [I.Bool], []),
    setRandomMode: I.Func([I.Bool, I.Text], [I.Bool], []),
    getRandomModeStatus: I.Func([I.Text], [I.Bool], ['query']),
    setLowestBetWinsMode: I.Func([I.Bool, I.Text], [I.Bool], []),
    getLowestBetWinsMode: I.Func([I.Text], [I.Bool], ['query']),
    getCurrentRoundBets: I.Func([I.Text], [I.Vec(BetTuple)], ['query']),
    triggerRoundResult: I.Func([I.Text], [I.Bool], []),
    lockCurrentRound: I.Func([I.Text], [I.Bool], []),
    adjustUserBalance: I.Func([I.Nat, I.Float64, I.Text], [I.Bool], []),
    getAdminStats: I.Func([I.Text], [I.Opt(AdminStatsTuple)], ['query']),
  });
};
