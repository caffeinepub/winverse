import HashMap "mo:base/HashMap";
import Nat "mo:base/Nat";
import Text "mo:base/Text";
import Float "mo:base/Float";
import Int "mo:base/Int";
import Time "mo:base/Time";
import Array "mo:base/Array";
import Iter "mo:base/Iter";
import Option "mo:base/Option";
import Char "mo:base/Char";
import Nat32 "mo:base/Nat32";
import Buffer "mo:base/Buffer";

actor Winverse {

  // ===== TYPES =====

  type ResultType = { colour : Text; size : Text };

  type User = {
    id : Nat;
    phone : Text;
    passwordHash : Text;
    name : Text;
    var balance : Float;
    var totalBets : Nat;
    var totalWinnings : Float;
    referralCode : Text;
    referredBy : ?Text;
    var referralCount : Nat;
    var hasDeposited : Bool;
    var firstDepositDone : Bool;
    var firstDepositBonusGiven : Bool;
    signupBonusGiven : Bool;
    createdAt : Int;
    var isActive : Bool;
    var totalDeposited : Float;
    var isBanned : Bool;
  };

  type UserPublic = {
    id : Nat;
    phone : Text;
    name : Text;
    balance : Float;
    totalBets : Nat;
    totalWinnings : Float;
    referralCode : Text;
    referredBy : ?Text;
    referralCount : Nat;
    hasDeposited : Bool;
    firstDepositDone : Bool;
    firstDepositBonusGiven : Bool;
    signupBonusGiven : Bool;
    createdAt : Int;
    isActive : Bool;
    totalDeposited : Float;
    isBanned : Bool;
  };

  type Round = {
    id : Nat;
    startTime : Int;
    endTime : Int;
    var result : ?ResultType;
    var status : Text;
    var isManual : Bool;
    var manualResult : ?ResultType;
  };

  // displayRoundNumber = ((id-1) % 1000) + 1  cycles 1..1000
  type RoundPublic = {
    id : Nat;
    startTime : Int;
    endTime : Int;
    result : ?ResultType;
    status : Text;
    isManual : Bool;
    manualResult : ?ResultType;
    displayRoundNumber : Nat;
  };

  type Bet = {
    id : Nat;
    userId : Nat;
    roundId : Nat;
    betType : Text;
    betValue : Text;
    amount : Float;
    var status : Text;
    var winAmount : Float;
    placedAt : Int;
  };

  type BetPublic = {
    id : Nat;
    userId : Nat;
    roundId : Nat;
    betType : Text;
    betValue : Text;
    amount : Float;
    status : Text;
    winAmount : Float;
    placedAt : Int;
  };

  type DepositRequest = {
    id : Nat;
    userId : Nat;
    amount : Float;
    utrNumber : Text;
    screenshotUrl : Text;
    var status : Text;
    createdAt : Int;
    var processedAt : ?Int;
  };

  type DepositRequestPublic = {
    id : Nat;
    userId : Nat;
    amount : Float;
    utrNumber : Text;
    screenshotUrl : Text;
    status : Text;
    createdAt : Int;
    processedAt : ?Int;
  };

  type WithdrawRequest = {
    id : Nat;
    userId : Nat;
    amount : Float;
    upiId : Text;
    var status : Text;
    createdAt : Int;
    var processedAt : ?Int;
  };

  type WithdrawRequestPublic = {
    id : Nat;
    userId : Nat;
    amount : Float;
    upiId : Text;
    status : Text;
    createdAt : Int;
    processedAt : ?Int;
  };

  type StableUserV2 = (Nat, Text, Text, Text, Float, Nat, Float, Text, ?Text, Nat, Bool, Bool, Bool, Bool, Int, Bool, Float, Bool);
  type StableUserLegacy = (Nat, Text, Text, Text, Float, Nat, Float, Text, ?Text, Nat, Bool, Bool, Bool, Bool, Int, Bool, Float);
  type StableRound = (Nat, Int, Int, ?ResultType, Text, Bool, ?ResultType);
  type StableBet = (Nat, Nat, Nat, Text, Text, Float, Text, Float, Int);
  type StableDeposit = (Nat, Nat, Float, Text, Text, Text, Int, ?Int);
  type StableWithdraw = (Nat, Nat, Float, Text, Text, Int, ?Int);

  // ===== STABLE STATE =====

  stable var nextUserId : Nat = 1;
  stable var nextRoundId : Nat = 1;
  stable var nextBetId : Nat = 1;
  stable var nextDepositId : Nat = 1;
  stable var nextWithdrawId : Nat = 1;
  stable var randomMode : Bool = true;
  stable var lowestBetWinsMode : Bool = false;
  stable var pseudoRandom : Nat = 42;
  stable var currentRoundId : Nat = 0;
  stable var initialized : Bool = false;

  stable var stableUsers : [StableUserLegacy] = [];
  stable var stableUsersV2 : [StableUserV2] = [];
  stable var stablePhoneToId : [(Text, Nat)] = [];
  stable var stableRefToId : [(Text, Nat)] = [];
  stable var stableRounds : [StableRound] = [];
  stable var stableBets : [StableBet] = [];
  stable var stableDeposits : [StableDeposit] = [];
  stable var stableWithdraws : [StableWithdraw] = [];

  // ===== MUTABLE STATE =====

  flexible var users = HashMap.HashMap<Nat, User>(16, Nat.equal, func(n : Nat) : Nat32 { Nat32.fromNat(n % 1000) });
  flexible var phoneToUserId = HashMap.HashMap<Text, Nat>(16, Text.equal, Text.hash);
  flexible var referralToUserId = HashMap.HashMap<Text, Nat>(16, Text.equal, Text.hash);
  flexible var rounds = HashMap.HashMap<Nat, Round>(16, Nat.equal, func(n : Nat) : Nat32 { Nat32.fromNat(n % 1000) });
  flexible var bets = HashMap.HashMap<Nat, Bet>(64, Nat.equal, func(n : Nat) : Nat32 { Nat32.fromNat(n % 1000) });
  flexible var deposits = HashMap.HashMap<Nat, DepositRequest>(16, Nat.equal, func(n : Nat) : Nat32 { Nat32.fromNat(n % 1000) });
  flexible var withdraws = HashMap.HashMap<Nat, WithdrawRequest>(16, Nat.equal, func(n : Nat) : Nat32 { Nat32.fromNat(n % 1000) });

  // ===== UPGRADE HOOKS =====

  system func preupgrade() {
    let ubuf = Buffer.Buffer<StableUserV2>(users.size());
    for ((_, u) in users.entries()) {
      ubuf.add((u.id, u.phone, u.passwordHash, u.name, u.balance, u.totalBets, u.totalWinnings,
        u.referralCode, u.referredBy, u.referralCount, u.hasDeposited, u.firstDepositDone,
        u.firstDepositBonusGiven, u.signupBonusGiven, u.createdAt, u.isActive, u.totalDeposited, u.isBanned));
    };
    stableUsersV2 := Buffer.toArray(ubuf);
    stableUsers := [];
    stablePhoneToId := Iter.toArray(phoneToUserId.entries());
    stableRefToId := Iter.toArray(referralToUserId.entries());
    let rbuf = Buffer.Buffer<StableRound>(rounds.size());
    for ((_, r) in rounds.entries()) {
      rbuf.add((r.id, r.startTime, r.endTime, r.result, r.status, r.isManual, r.manualResult));
    };
    stableRounds := Buffer.toArray(rbuf);
    let bbuf = Buffer.Buffer<StableBet>(bets.size());
    for ((_, b) in bets.entries()) {
      bbuf.add((b.id, b.userId, b.roundId, b.betType, b.betValue, b.amount, b.status, b.winAmount, b.placedAt));
    };
    stableBets := Buffer.toArray(bbuf);
    let dbuf = Buffer.Buffer<StableDeposit>(deposits.size());
    for ((_, d) in deposits.entries()) {
      dbuf.add((d.id, d.userId, d.amount, d.utrNumber, d.screenshotUrl, d.status, d.createdAt, d.processedAt));
    };
    stableDeposits := Buffer.toArray(dbuf);
    let wbuf = Buffer.Buffer<StableWithdraw>(withdraws.size());
    for ((_, w) in withdraws.entries()) {
      wbuf.add((w.id, w.userId, w.amount, w.upiId, w.status, w.createdAt, w.processedAt));
    };
    stableWithdraws := Buffer.toArray(wbuf);
  };

  system func postupgrade() {
    if (stableUsersV2.size() > 0) {
      for ((id, phone, pwHash, name, bal, tb, tw, rc, rb, rcount, hd, fdd, fdbg, sbg, ca, ia, td, ib) in stableUsersV2.vals()) {
        let u : User = {
          id; phone; passwordHash = pwHash; name;
          var balance = bal; var totalBets = tb; var totalWinnings = tw;
          referralCode = rc; referredBy = rb; var referralCount = rcount;
          var hasDeposited = hd; var firstDepositDone = fdd; var firstDepositBonusGiven = fdbg;
          signupBonusGiven = sbg; createdAt = ca; var isActive = ia; var totalDeposited = td;
          var isBanned = ib;
        };
        users.put(id, u);
      };
    } else {
      for ((id, phone, pwHash, name, bal, tb, tw, rc, rb, rcount, hd, fdd, fdbg, sbg, ca, ia, td) in stableUsers.vals()) {
        let u : User = {
          id; phone; passwordHash = pwHash; name;
          var balance = bal; var totalBets = tb; var totalWinnings = tw;
          referralCode = rc; referredBy = rb; var referralCount = rcount;
          var hasDeposited = hd; var firstDepositDone = fdd; var firstDepositBonusGiven = fdbg;
          signupBonusGiven = sbg; createdAt = ca; var isActive = ia; var totalDeposited = td;
          var isBanned = false;
        };
        users.put(id, u);
      };
    };
    for ((k, v) in stablePhoneToId.vals()) { phoneToUserId.put(k, v) };
    for ((k, v) in stableRefToId.vals()) { referralToUserId.put(k, v) };
    for ((id, st, et, res, rstatus, isM, mr) in stableRounds.vals()) {
      let r : Round = { id; startTime = st; endTime = et; var result = res; var status = rstatus; var isManual = isM; var manualResult = mr };
      rounds.put(id, r);
    };
    for ((id, uid, rid, bt, bv, amt, bstatus, wa, pa) in stableBets.vals()) {
      let b : Bet = { id; userId = uid; roundId = rid; betType = bt; betValue = bv; amount = amt; var status = bstatus; var winAmount = wa; placedAt = pa };
      bets.put(id, b);
    };
    for ((id, uid, amt, utr, ss, dstatus, ca, pa) in stableDeposits.vals()) {
      let d : DepositRequest = { id; userId = uid; amount = amt; utrNumber = utr; screenshotUrl = ss; var status = dstatus; createdAt = ca; var processedAt = pa };
      deposits.put(id, d);
    };
    for ((id, uid, amt, upi, wstatus, ca, pa) in stableWithdraws.vals()) {
      let w : WithdrawRequest = { id; userId = uid; amount = amt; upiId = upi; var status = wstatus; createdAt = ca; var processedAt = pa };
      withdraws.put(id, w);
    };
  };

  // ===== HELPER FUNCTIONS =====

  func nextRandom() : Nat {
    pseudoRandom := (pseudoRandom * 6364136223846793005 + 1442695040888963407) % 18446744073709551616;
    pseudoRandom
  };

  func hashPassword(pw : Text) : Text {
    var h : Nat = 0;
    var i = 0;
    for (c in pw.chars()) {
      h := (h * 31 + Nat32.toNat(Char.toNat32(c)) + i) % 1000000007;
      i += 1;
    };
    Nat.toText(h)
  };

  func genReferralCode(id : Nat) : Text {
    let chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let arr = Text.toArray(chars);
    var n = id + 1000;
    var result = "";
    for (_ in Iter.range(0, 5)) {
      let idx = n % 36;
      result := Text.fromChar(arr[idx]) # result;
      n := n / 36;
    };
    result
  };

  func getRandomResult() : ResultType {
    let colours = ["red", "green", "violet"];
    let sizes = ["big", "small"];
    let ci = nextRandom() % 3;
    let si = nextRandom() % 2;
    { colour = colours[ci]; size = sizes[si] }
  };

  // Fixed: finds global minimum across ALL 5 options, picks randomly from global min pool
  func getLowestBetWinsResult() : ResultType {
    var redA : Float = 0.0;
    var greenA : Float = 0.0;
    var violetA : Float = 0.0;
    var bigA : Float = 0.0;
    var smallA : Float = 0.0;

    for ((_, b) in bets.entries()) {
      if (b.roundId == currentRoundId and b.status != "cancelled") {
        switch (b.betValue) {
          case "red"    { redA    += b.amount };
          case "green"  { greenA  += b.amount };
          case "violet" { violetA += b.amount };
          case "big"    { bigA    += b.amount };
          case "small"  { smallA  += b.amount };
          case _ {};
        };
      };
    };

    // Find global minimum across ALL 5 options
    let globalMin = Float.min(redA, Float.min(greenA, Float.min(violetA, Float.min(bigA, smallA))));

    // Build global minimum pool
    let pool = Buffer.Buffer<Text>(5);
    if (redA == globalMin)    { pool.add("red") };
    if (greenA == globalMin)  { pool.add("green") };
    if (violetA == globalMin) { pool.add("violet") };
    if (bigA == globalMin)    { pool.add("big") };
    if (smallA == globalMin)  { pool.add("small") };

    let poolArr = Buffer.toArray(pool);
    let winner = poolArr[nextRandom() % poolArr.size()];

    // Determine colour result
    let winColour : Text = switch (winner) {
      case "red"    { "red" };
      case "green"  { "green" };
      case "violet" { "violet" };
      case _ {
        // winner is a size; pick lowest-bet colour independently
        let minC = Float.min(redA, Float.min(greenA, violetA));
        let cPool = Buffer.Buffer<Text>(3);
        if (redA == minC)    { cPool.add("red") };
        if (greenA == minC)  { cPool.add("green") };
        if (violetA == minC) { cPool.add("violet") };
        let cArr = Buffer.toArray(cPool);
        cArr[nextRandom() % cArr.size()]
      };
    };

    // Determine size result
    let winSize : Text = switch (winner) {
      case "big"   { "big" };
      case "small" { "small" };
      case _ {
        // winner is a colour; pick lowest-bet size independently
        let minS = Float.min(bigA, smallA);
        let sPool = Buffer.Buffer<Text>(2);
        if (bigA == minS)   { sPool.add("big") };
        if (smallA == minS) { sPool.add("small") };
        let sArr = Buffer.toArray(sPool);
        sArr[nextRandom() % sArr.size()]
      };
    };

    { colour = winColour; size = winSize }
  };

  func userToPublic(u : User) : UserPublic {
    { id = u.id; phone = u.phone; name = u.name; balance = u.balance; totalBets = u.totalBets;
      totalWinnings = u.totalWinnings; referralCode = u.referralCode; referredBy = u.referredBy;
      referralCount = u.referralCount; hasDeposited = u.hasDeposited;
      firstDepositDone = u.firstDepositDone; firstDepositBonusGiven = u.firstDepositBonusGiven;
      signupBonusGiven = u.signupBonusGiven; createdAt = u.createdAt;
      isActive = u.isActive; totalDeposited = u.totalDeposited; isBanned = u.isBanned }
  };

  func displayNum(id : Nat) : Nat {
    if (id == 0) { 1 } else { ((id - 1) % 1000) + 1 }
  };

  func roundToPublic(r : Round) : RoundPublic {
    { id = r.id; startTime = r.startTime; endTime = r.endTime; result = r.result;
      status = r.status; isManual = r.isManual; manualResult = r.manualResult;
      displayRoundNumber = displayNum(r.id) }
  };

  func betToPublic(b : Bet) : BetPublic {
    { id = b.id; userId = b.userId; roundId = b.roundId; betType = b.betType;
      betValue = b.betValue; amount = b.amount; status = b.status;
      winAmount = b.winAmount; placedAt = b.placedAt }
  };

  func depositToPublic(d : DepositRequest) : DepositRequestPublic {
    { id = d.id; userId = d.userId; amount = d.amount; utrNumber = d.utrNumber;
      screenshotUrl = d.screenshotUrl; status = d.status;
      createdAt = d.createdAt; processedAt = d.processedAt }
  };

  func withdrawToPublic(w : WithdrawRequest) : WithdrawRequestPublic {
    { id = w.id; userId = w.userId; amount = w.amount; upiId = w.upiId;
      status = w.status; createdAt = w.createdAt; processedAt = w.processedAt }
  };

  func isAdmin(token : Text) : Bool { token == "admin123123" };

  func settleRound(r : Round) {
    let result : ResultType = if (lowestBetWinsMode) {
      getLowestBetWinsResult()
    } else if (r.isManual) {
      switch (r.manualResult) {
        case (?mr) { mr };
        case null { getRandomResult() };
      }
    } else { getRandomResult() };
    r.result := ?result;
    r.status := "completed";
    for ((_, b) in bets.entries()) {
      if (b.roundId == r.id and b.status == "pending") {
        let won = (b.betType == "colour" and b.betValue == result.colour) or
                  (b.betType == "size" and b.betValue == result.size);
        if (won) {
          let winAmt = b.amount * 1.9;
          b.status := "won";
          b.winAmount := winAmt;
          switch (users.get(b.userId)) {
            case null {};
            case (?u) { u.balance += winAmt; u.totalWinnings += winAmt };
          };
        } else { b.status := "lost" };
      };
    };
  };

  func createNewRound() : Nat {
    let now = Time.now();
    let rid = nextRoundId;
    nextRoundId += 1;
    let r : Round = {
      id = rid; startTime = now; endTime = now + 30_000_000_000;
      var result = null; var status = "betting"; var isManual = false; var manualResult = null;
    };
    rounds.put(rid, r);
    currentRoundId := rid;
    rid
  };

  if (not initialized) {
    ignore createNewRound();
    initialized := true;
  };

  // ===== USER FUNCTIONS =====

  public func signup(phone : Text, password : Text) : async (Nat, Text) {
    switch (phoneToUserId.get(phone)) {
      case (?_) { return (0, "Phone already registered") };
      case null {};
    };
    let uid = nextUserId;
    nextUserId += 1;
    let code = genReferralCode(uid);
    let u : User = {
      id = uid; phone; passwordHash = hashPassword(password);
      name = "User" # Nat.toText(uid);
      var balance = 200.0; var totalBets = 0; var totalWinnings = 0.0;
      referralCode = code; referredBy = null; var referralCount = 0;
      var hasDeposited = false; var firstDepositDone = false;
      var firstDepositBonusGiven = false; signupBonusGiven = true;
      createdAt = Time.now(); var isActive = false; var totalDeposited = 0.0;
      var isBanned = false;
    };
    users.put(uid, u);
    phoneToUserId.put(phone, uid);
    referralToUserId.put(code, uid);
    (uid, "Account created! \u{20B9}200 signup bonus credited.")
  };

  public func login(phone : Text, password : Text) : async ?Nat {
    switch (phoneToUserId.get(phone)) {
      case null { null };
      case (?uid) {
        switch (users.get(uid)) {
          case null { null };
          case (?u) {
            if (u.isBanned) { return null };
            if (u.passwordHash == hashPassword(password)) { u.isActive := true; ?uid }
            else { null }
          };
        }
      };
    }
  };

  public query func getUserById(userId : Nat) : async ?UserPublic {
    Option.map(users.get(userId), userToPublic)
  };

  public func updateUserName(userId : Nat, name : Text) : async Bool {
    switch (users.get(userId)) {
      case null { false };
      case (?u) {
        let updated : User = {
          id = u.id; phone = u.phone; passwordHash = u.passwordHash; name;
          var balance = u.balance; var totalBets = u.totalBets;
          var totalWinnings = u.totalWinnings;
          referralCode = u.referralCode; referredBy = u.referredBy;
          var referralCount = u.referralCount; var hasDeposited = u.hasDeposited;
          var firstDepositDone = u.firstDepositDone;
          var firstDepositBonusGiven = u.firstDepositBonusGiven;
          signupBonusGiven = u.signupBonusGiven; createdAt = u.createdAt;
          var isActive = u.isActive; var totalDeposited = u.totalDeposited;
          var isBanned = u.isBanned;
        };
        users.put(userId, updated);
        true
      };
    }
  };

  public func placeBet(userId : Nat, roundId : Nat, betType : Text, betValue : Text, amount : Float) : async ?Nat {
    if (amount < 20.0 or amount > 50000.0) { return null };
    switch (users.get(userId)) {
      case null { null };
      case (?u) {
        if (u.isBanned or u.balance < amount) { return null };
        switch (rounds.get(roundId)) {
          case null { null };
          case (?r) {
            if (r.status != "betting") { return null };
            var betCount = 0;
            for ((_, b) in bets.entries()) {
              if (b.userId == userId and b.roundId == roundId) { betCount += 1 };
            };
            if (betCount >= 2) { return null };
            let bid = nextBetId;
            nextBetId += 1;
            let b : Bet = {
              id = bid; userId; roundId; betType; betValue; amount;
              var status = "pending"; var winAmount = 0.0; placedAt = Time.now();
            };
            bets.put(bid, b);
            u.balance -= amount;
            u.totalBets += 1;
            ?bid
          };
        }
      };
    }
  };

  public query func getCurrentRound() : async ?RoundPublic {
    Option.map(rounds.get(currentRoundId), roundToPublic)
  };

  // Called by frontend polling to auto-advance expired rounds
  public func checkAndAdvanceRound() : async Bool {
    switch (rounds.get(currentRoundId)) {
      case null {
        ignore createNewRound();
        true
      };
      case (?r) {
        let now = Time.now();
        if (r.status != "completed" and now > r.endTime) {
          settleRound(r);
          ignore createNewRound();
          true
        } else { false };
      };
    }
  };

  public query func getRoundHistory(limit : Nat) : async [RoundPublic] {
    let buf = Buffer.Buffer<RoundPublic>(10);
    for ((_, r) in rounds.entries()) {
      if (r.status == "completed") { buf.add(roundToPublic(r)) };
    };
    let arr = Buffer.toArray(buf);
    let sorted = Array.sort(arr, func(a : RoundPublic, b : RoundPublic) : { #less; #equal; #greater } {
      if (a.id > b.id) { #less } else if (a.id < b.id) { #greater } else { #equal }
    });
    if (sorted.size() <= limit) { sorted }
    else { Array.tabulate(limit, func(i : Nat) : RoundPublic { sorted[i] }) }
  };

  public query func getUserBetHistory(userId : Nat) : async [BetPublic] {
    let buf = Buffer.Buffer<BetPublic>(10);
    for ((_, b) in bets.entries()) {
      if (b.userId == userId) { buf.add(betToPublic(b)) };
    };
    Buffer.toArray(buf)
  };

  public func createDepositRequest(userId : Nat, amount : Float, utrNumber : Text, screenshotUrl : Text) : async ?Nat {
    if (amount < 100.0) { return null };
    let did = nextDepositId;
    nextDepositId += 1;
    let d : DepositRequest = {
      id = did; userId; amount; utrNumber; screenshotUrl;
      var status = "pending"; createdAt = Time.now(); var processedAt = null;
    };
    deposits.put(did, d);
    ?did
  };

  public func createWithdrawRequest(userId : Nat, amount : Float, upiId : Text) : async ?Nat {
    if (amount < 100.0) { return null };
    switch (users.get(userId)) {
      case null { null };
      case (?u) {
        if (not u.firstDepositDone) { return null };
        let wid = nextWithdrawId;
        nextWithdrawId += 1;
        let w : WithdrawRequest = {
          id = wid; userId; amount; upiId;
          var status = "pending"; createdAt = Time.now(); var processedAt = null;
        };
        withdraws.put(wid, w);
        ?wid
      };
    }
  };

  public query func getReferralInfo(userId : Nat) : async ?(Text, Nat, Float) {
    switch (users.get(userId)) {
      case null { null };
      case (?u) { ?(u.referralCode, u.referralCount, Float.fromInt(u.referralCount) * 30.0) };
    }
  };

  public func processReferral(newUserId : Nat, referralCode : Text) : async Bool {
    switch (referralToUserId.get(referralCode)) {
      case null { false };
      case (?refUserId) {
        if (refUserId == newUserId) { return false };
        switch (users.get(refUserId)) {
          case null { false };
          case (?u) {
            u.balance += 30.0;
            u.referralCount += 1;
            switch (users.get(newUserId)) {
              case null {};
              case (?nu) {
                let updated : User = {
                  id = nu.id; phone = nu.phone; passwordHash = nu.passwordHash; name = nu.name;
                  var balance = nu.balance; var totalBets = nu.totalBets;
                  var totalWinnings = nu.totalWinnings;
                  referralCode = nu.referralCode; referredBy = ?referralCode;
                  var referralCount = nu.referralCount; var hasDeposited = nu.hasDeposited;
                  var firstDepositDone = nu.firstDepositDone;
                  var firstDepositBonusGiven = nu.firstDepositBonusGiven;
                  signupBonusGiven = nu.signupBonusGiven; createdAt = nu.createdAt;
                  var isActive = nu.isActive; var totalDeposited = nu.totalDeposited;
                  var isBanned = nu.isBanned;
                };
                users.put(newUserId, updated);
              };
            };
            true
          };
        }
      };
    }
  };

  public func logout(userId : Nat) : async Bool {
    switch (users.get(userId)) {
      case null { false };
      case (?u) { u.isActive := false; true };
    }
  };

  public query func getUserDepositRequests(userId : Nat) : async [DepositRequestPublic] {
    let buf = Buffer.Buffer<DepositRequestPublic>(4);
    for ((_, d) in deposits.entries()) {
      if (d.userId == userId) { buf.add(depositToPublic(d)) };
    };
    Buffer.toArray(buf)
  };

  public query func getUserWithdrawRequests(userId : Nat) : async [WithdrawRequestPublic] {
    let buf = Buffer.Buffer<WithdrawRequestPublic>(4);
    for ((_, w) in withdraws.entries()) {
      if (w.userId == userId) { buf.add(withdrawToPublic(w)) };
    };
    Buffer.toArray(buf)
  };

  // ===== ADMIN FUNCTIONS =====

  public func adminLogin(credential : Text, password : Text) : async ?Text {
    let valid = (credential == "iamdevloper1309@gmail.com" or credential == "9294729968")
                and password == "admin123123";
    if (valid) { ?"admin123123" } else { null }
  };

  public query func getAllUsers(adminToken : Text) : async [UserPublic] {
    if (not isAdmin(adminToken)) { return [] };
    let buf = Buffer.Buffer<UserPublic>(users.size());
    for ((_, u) in users.entries()) { buf.add(userToPublic(u)) };
    Buffer.toArray(buf)
  };

  public query func getLiveUsers(adminToken : Text) : async Nat {
    if (not isAdmin(adminToken)) { return 0 };
    var count = 0;
    for ((_, u) in users.entries()) { if (u.isActive) { count += 1 } };
    count
  };

  public query func getPendingDeposits(adminToken : Text) : async [DepositRequestPublic] {
    if (not isAdmin(adminToken)) { return [] };
    let buf = Buffer.Buffer<DepositRequestPublic>(4);
    for ((_, d) in deposits.entries()) {
      if (d.status == "pending") { buf.add(depositToPublic(d)) };
    };
    Buffer.toArray(buf)
  };

  public query func getAllDeposits(adminToken : Text) : async [DepositRequestPublic] {
    if (not isAdmin(adminToken)) { return [] };
    let buf = Buffer.Buffer<DepositRequestPublic>(deposits.size());
    for ((_, d) in deposits.entries()) { buf.add(depositToPublic(d)) };
    Buffer.toArray(buf)
  };

  public query func getPendingWithdrawals(adminToken : Text) : async [WithdrawRequestPublic] {
    if (not isAdmin(adminToken)) { return [] };
    let buf = Buffer.Buffer<WithdrawRequestPublic>(4);
    for ((_, w) in withdraws.entries()) {
      if (w.status == "pending") { buf.add(withdrawToPublic(w)) };
    };
    Buffer.toArray(buf)
  };

  public query func getAllWithdrawals(adminToken : Text) : async [WithdrawRequestPublic] {
    if (not isAdmin(adminToken)) { return [] };
    let buf = Buffer.Buffer<WithdrawRequestPublic>(withdraws.size());
    for ((_, w) in withdraws.entries()) { buf.add(withdrawToPublic(w)) };
    Buffer.toArray(buf)
  };

  public func approveDeposit(requestId : Nat, adminToken : Text) : async Bool {
    if (not isAdmin(adminToken)) { return false };
    switch (deposits.get(requestId)) {
      case null { false };
      case (?d) {
        if (d.status != "pending") { return false };
        switch (users.get(d.userId)) {
          case null { false };
          case (?u) {
            var creditAmount = d.amount;
            if (not u.firstDepositDone) {
              creditAmount := d.amount * 2.0;
              u.firstDepositDone := true;
              u.firstDepositBonusGiven := true;
            };
            u.balance += creditAmount;
            u.hasDeposited := true;
            u.totalDeposited += d.amount;
            d.status := "approved";
            d.processedAt := ?Time.now();
            true
          };
        }
      };
    }
  };

  public func rejectDeposit(requestId : Nat, adminToken : Text) : async Bool {
    if (not isAdmin(adminToken)) { return false };
    switch (deposits.get(requestId)) {
      case null { false };
      case (?d) {
        if (d.status != "pending") { return false };
        d.status := "rejected";
        d.processedAt := ?Time.now();
        true
      };
    }
  };

  public func approveWithdrawal(requestId : Nat, adminToken : Text) : async Bool {
    if (not isAdmin(adminToken)) { return false };
    switch (withdraws.get(requestId)) {
      case null { false };
      case (?w) {
        if (w.status != "pending") { return false };
        switch (users.get(w.userId)) {
          case null { false };
          case (?u) {
            if (u.balance < w.amount) { return false };
            u.balance -= w.amount;
            w.status := "approved";
            w.processedAt := ?Time.now();
            true
          };
        }
      };
    }
  };

  public func rejectWithdrawal(requestId : Nat, adminToken : Text) : async Bool {
    if (not isAdmin(adminToken)) { return false };
    switch (withdraws.get(requestId)) {
      case null { false };
      case (?w) {
        if (w.status != "pending") { return false };
        w.status := "rejected";
        w.processedAt := ?Time.now();
        true
      };
    }
  };

  public func banUser(userId : Nat, adminToken : Text) : async Bool {
    if (not isAdmin(adminToken)) { return false };
    switch (users.get(userId)) {
      case null { false };
      case (?u) {
        u.isBanned := true;
        u.isActive := false;
        for ((_, b) in bets.entries()) {
          if (b.userId == userId and b.status == "pending") {
            b.status := "cancelled";
            u.balance += b.amount;
          };
        };
        true
      };
    }
  };

  public func unbanUser(userId : Nat, adminToken : Text) : async Bool {
    if (not isAdmin(adminToken)) { return false };
    switch (users.get(userId)) {
      case null { false };
      case (?u) { u.isBanned := false; true };
    }
  };

  // Blocked when lowestBetWinsMode is ON
  public func setNextRoundResult(colour : Text, size : Text, adminToken : Text) : async Bool {
    if (not isAdmin(adminToken)) { return false };
    if (lowestBetWinsMode) { return false };
    switch (rounds.get(currentRoundId)) {
      case null { false };
      case (?r) { r.isManual := true; r.manualResult := ?{ colour; size }; true };
    }
  };

  // Blocked when lowestBetWinsMode is ON
  public func setRandomMode(enabled : Bool, adminToken : Text) : async Bool {
    if (not isAdmin(adminToken)) { return false };
    if (lowestBetWinsMode) { return false };
    randomMode := enabled;
    true
  };

  public query func getRandomModeStatus(adminToken : Text) : async Bool {
    if (not isAdmin(adminToken)) { return true };
    randomMode
  };

  public func setLowestBetWinsMode(enabled : Bool, adminToken : Text) : async Bool {
    if (not isAdmin(adminToken)) { return false };
    lowestBetWinsMode := enabled;
    if (enabled) {
      // Clear any pending manual result
      switch (rounds.get(currentRoundId)) {
        case null {};
        case (?r) { r.isManual := false; r.manualResult := null };
      };
    };
    true
  };

  public query func getLowestBetWinsMode(adminToken : Text) : async Bool {
    if (not isAdmin(adminToken)) { return false };
    lowestBetWinsMode
  };

  public query func getCurrentRoundBets(adminToken : Text) : async [(Text, Nat, Float)] {
    if (not isAdmin(adminToken)) { return [] };
    let options = ["red", "green", "violet", "big", "small"];
    var redC = 0; var redA : Float = 0.0;
    var greenC = 0; var greenA : Float = 0.0;
    var violetC = 0; var violetA : Float = 0.0;
    var bigC = 0; var bigA : Float = 0.0;
    var smallC = 0; var smallA : Float = 0.0;
    for ((_, b) in bets.entries()) {
      if (b.roundId == currentRoundId and b.status != "cancelled") {
        switch (b.betValue) {
          case "red"    { redC += 1; redA += b.amount };
          case "green"  { greenC += 1; greenA += b.amount };
          case "violet" { violetC += 1; violetA += b.amount };
          case "big"    { bigC += 1; bigA += b.amount };
          case "small"  { smallC += 1; smallA += b.amount };
          case _ {};
        };
      };
    };
    ignore options;
    [("red", redC, redA), ("green", greenC, greenA), ("violet", violetC, violetA),
     ("big", bigC, bigA), ("small", smallC, smallA)]
  };

  public func triggerRoundResult(adminToken : Text) : async Bool {
    if (not isAdmin(adminToken)) { return false };
    switch (rounds.get(currentRoundId)) {
      case null { false };
      case (?r) {
        if (r.status == "completed") { return false };
        settleRound(r);
        ignore createNewRound();
        true
      };
    }
  };

  public func lockCurrentRound(adminToken : Text) : async Bool {
    if (not isAdmin(adminToken)) { return false };
    switch (rounds.get(currentRoundId)) {
      case null { false };
      case (?r) { r.status := "locked"; true };
    }
  };

  public func adjustUserBalance(userId : Nat, amount : Float, adminToken : Text) : async Bool {
    if (not isAdmin(adminToken)) { return false };
    switch (users.get(userId)) {
      case null { false };
      case (?u) { u.balance += amount; true };
    }
  };

  public query func getAdminStats(adminToken : Text) : async ?(Nat, Nat, Float, Float, Nat, Float) {
    if (not isAdmin(adminToken)) { return null };
    let totalUsers = users.size();
    var liveUsers = 0;
    for ((_, u) in users.entries()) { if (u.isActive) { liveUsers += 1 } };
    var totalDep : Float = 0.0;
    for ((_, d) in deposits.entries()) { if (d.status == "approved") { totalDep += d.amount } };
    var totalWit : Float = 0.0;
    for ((_, w) in withdraws.entries()) { if (w.status == "approved") { totalWit += w.amount } };
    var totalBetsCount = 0;
    var winningsPaid : Float = 0.0;
    for ((_, b) in bets.entries()) {
      totalBetsCount += 1;
      if (b.status == "won") { winningsPaid += b.winAmount };
    };
    ?(totalUsers, liveUsers, totalDep, totalWit, totalBetsCount, winningsPaid)
  };
}
