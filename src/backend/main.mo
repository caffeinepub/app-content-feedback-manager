import Map "mo:core/Map";
import Text "mo:core/Text";
import Set "mo:core/Set";
import Nat "mo:core/Nat";
import Iter "mo:core/Iter";
import List "mo:core/List";
import Float "mo:core/Float";
import Runtime "mo:core/Runtime";
import Array "mo:core/Array";
import Order "mo:core/Order";
import Principal "mo:core/Principal";
import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";
import Time "mo:core/Time";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";



actor {
  // Initialize access control (kept for Caffeine platform compatibility)
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // ── Admin PIN Authentication ──────────────────────────────────────────────
  // All admin functions validate against this stored code instead of
  // principal-based checks, so no Internet Identity is required.
  var storedAdminCode : Text = "7898";

  func requireAdmin(code : Text) {
    if (code != storedAdminCode) {
      Runtime.trap("Unauthorized: Invalid admin code");
    };
  };

  // User Profile Type (kept for stable variable compatibility)
  public type UserProfile = {
    name : Text;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();

  // Types
  type CommentList = {
    id : Text;
    displayName : Text;
    templates : [Text];
    locked : Bool;
    suffix : Text;
  };

  type AppEvent = {
    name : Text;
    usernames : [Text];
  };

  type AppEventWithImportDate = {
    appEvent : AppEvent;
    importDate : ?Text;
  };

  type ChatMessage = {
    id : Nat;
    text : Text;
    timestamp : Time.Time;
  };

  type ImageMeta = {
    id : Nat;
    name : Text;
    tags : [Text];
    dataUrl : Text;
    data : ?Storage.ExternalBlob;
  };

  type PublicSettings = {
    bgMusicEnabled : Bool;
    musicFile : ?Storage.ExternalBlob;
  };

  type PriceEntry = {
    appName : Text;
    pricePerEntry : Float;
    isActive : Bool;
  };

  type WithdrawalStatus = {
    #pending;
    #completed;
    #rejected;
  };

  type WithdrawalRequest = {
    username : Text;
    walletNumber : Text;
    amount : Float;
    status : WithdrawalStatus;
    timestamp : Time.Time;
  };

  type AppImport = {
    appName : Text;
    usernames : [Text];
    importDate : ?Text;
  };

  type ImportSummary = {
    totalAppsDetected : Nat;
    totalUsernamesAdded : Nat;
    totalDuplicatesSkipped : Nat;
  };

  type ListMetrics = {
    listId : Text;
    listName : Text;
    totalTemplates : Nat;
    usedTemplates : Nat;
    availableTemplates : Nat;
    percentUsed : Float;
  };

  type BulkCommentsResult = {
    commentListId : Text;
    comments : [Text];
    generatedCount : Nat;
    templateCount : Nat;
  };

  type CountdownState = {
    targetTime : ?Time.Time;
    isActive : Bool;
  };

  type GlobalCommentPoolStats = {
    totalTemplates : Nat;
    templatesRemaining : Nat;
    totalClaimed : Nat;
    batchSupport : Bool;
  };

  type CommentStatus = {
    #available;
    #used;
  };

  type Comment = {
    id : Nat;
    text : Text;
    status : CommentStatus;
  };

  type AppEarnings = {
    appName : Text;
    totalUsernamesFound : Nat;
    pricePerEntry : Float;
    totalAmount : Float;
    isActive : Bool;
  };

  type AllEarningsSummary = {
    appEarnings : [AppEarnings];
    totalAppsWithPrices : Nat;
    totalValidEntries : Nat;
    totalEarnings : Float;
  };

  // Data stores
  var nextCommentId = 0;

  let comments = Map.empty<Nat, Comment>();
  var globalCommentInventory = 0;
  let globalComments = List.empty<Text>();
  let commentLists = Map.empty<Text, CommentList>();
  let commentListsOrder = List.empty<Text>();
  let usedTemplateIndices = Map.empty<Text, Set.Set<Nat>>();
  let appsEvents = Map.empty<Text, AppEventWithImportDate>();
  let chatMessages = List.empty<ChatMessage>();
  let images = Map.empty<Nat, ImageMeta>();
  let priceList = Map.empty<Text, { pricePerEntry : Float; isActive : Bool }>();
  let inventoryCounter = Map.empty<Text, Nat>();
  let withdrawalRequests = Map.empty<Text, WithdrawalRequest>();

  var nextImageId = 1;
  var nextMessageId = 1;

  // Settings type kept identical to the previous version for stable variable
  // compatibility — musicUrl is stored separately in `var musicUrl` below.
  type Settings = {
    bgMusicEnabled : Bool;
    musicFile : ?Storage.ExternalBlob;
    accessKey : ?Text;
  };

  var settings : Settings = {
    bgMusicEnabled = false;
    musicFile = null;
    accessKey = null;
  };

  var priceListInitialized = false;
  var musicUrl : ?Text = null;

  var countdownState : CountdownState = {
    targetTime = null;
    isActive = false;
  };

  module GlobalCommentPoolStats {
    public func compare(a : GlobalCommentPoolStats, b : GlobalCommentPoolStats) : Order.Order {
      Nat.compare(a.totalTemplates, b.totalTemplates);
    };
  };

  module CommentList {
    public func compare(a : CommentList, b : CommentList) : Order.Order {
      Text.compare(a.displayName, b.displayName);
    };
  };

  module AppEvent {
    public func compare(a : AppEvent, b : AppEvent) : Order.Order {
      Text.compare(a.name, b.name);
    };
  };

  include MixinStorage();

  // Helper
  func safeNatSubtract(a : Nat, b : Nat) : Nat {
    if (a > b) { a - b } else { 0 };
  };

  // ── PUBLIC QUERY / UPDATE (no auth required) ──────────────────────────────

  public query func getAllCommentLists() : async [CommentList] {
    commentLists.values().toArray();
  };

  public query func getCommentList(id : Text) : async ?CommentList {
    commentLists.get(id);
  };

  public query func getAvailableCount(listId : Text) : async Nat {
    switch (commentLists.get(listId)) {
      case (null) { 0 };
      case (?list) {
        let usedSet = switch (usedTemplateIndices.get(listId)) {
          case (null) { Set.empty<Nat>() };
          case (?s) { s };
        };
        let usedCount = usedSet.size();
        let total = list.templates.size();
        if (total > usedCount) { safeNatSubtract(total, usedCount) } else { total };
      };
    };
  };

  public shared func consumeFromList(listId : Text, count : Nat) : async {
    #ok : [Text];
    #err : Text;
  } {
    switch (commentLists.get(listId)) {
      case (null) { return #err("Comment list not found") };
      case (?list) {
        if (list.locked) { return #err("This list is currently locked") };
        let usedSet = switch (usedTemplateIndices.get(listId)) {
          case (null) { Set.empty<Nat>() };
          case (?s) { s };
        };
        let usedCount = usedSet.size();
        let total = list.templates.size();
        let available = if (total > usedCount) { safeNatSubtract(total, usedCount) } else { total };
        if (available == 0) { return #err("No templates left. Please try later.") };
        if (count > available) {
          return #err("Only " # available.toText() # " templates left. Please reduce quantity.");
        };
        let pickedTexts = List.empty<Text>();
        var i = 0;
        var pickedCount = 0;
        while (i < total and pickedCount < count) {
          if (not usedSet.contains(i)) {
            let t = list.templates[i] # (if (list.suffix != "") { " " # list.suffix } else { "" });
            pickedTexts.add(t);
            usedSet.add(i);
            pickedCount += 1;
          };
          i += 1;
        };
        usedTemplateIndices.add(listId, usedSet);
        #ok(pickedTexts.toArray());
      };
    };
  };

  type ClaimCommentResult = { #noCommentsRemaining; #claimSuccess : Text };

  public shared func claimComment(listId : Text, username : Text) : async ClaimCommentResult {
    switch (commentLists.get(listId)) {
      case (null) { Runtime.trap("Comment list not found") };
      case (?list) {
        if (list.locked) { return #noCommentsRemaining };
        let totalTemplates = list.templates.size();
        if (totalTemplates == 0) { return #noCommentsRemaining };
        let usedSet = switch (usedTemplateIndices.get(listId)) {
          case (null) { Set.empty<Nat>() };
          case (?s) { s };
        };
        var foundIndex : ?Nat = null;
        var i = 0;
        while (i < totalTemplates and foundIndex == null) {
          if (not usedSet.contains(i)) { foundIndex := ?i };
          i += 1;
        };
        switch (foundIndex) {
          case (null) { #noCommentsRemaining };
          case (?idx) {
            let comment = list.templates[idx] # " " # username # list.suffix;
            usedSet.add(idx);
            usedTemplateIndices.add(listId, usedSet);
            switch (inventoryCounter.get(listId)) {
              case (?c) { if (c > 0) { inventoryCounter.add(listId, safeNatSubtract(c, 1)) } };
              case (null) {};
            };
            #claimSuccess(comment);
          };
        };
      };
    };
  };

  public shared func generateSingle() : async { #ok : Text; #err : Text } {
    let available = comments.values().filter(func(c) { c.status == #available }).toArray();
    if (available.isEmpty()) {
      #err("Pool is empty");
    } else {
      let first = available[0];
      comments.add(first.id, { id = first.id; text = first.text; status = #used });
      #ok(first.text);
    };
  };

  public shared func generateBulk(n : Nat) : async { #ok : [Text]; #err : Text } {
    let available = comments.values().filter(func(c) { c.status == #available }).toArray();
    if (available.size() < n) {
      return #err("Only " # available.size().toText() # " comments left. Reduce quantity.");
    };
    var texts = List.empty<Text>();
    var count = 0;
    for (c in available.vals()) {
      if (count < n) {
        texts.add(c.text);
        comments.add(c.id, { id = c.id; text = c.text; status = #used });
        count += 1;
      };
    };
    #ok(texts.toArray());
  };

  public query func getPoolStats() : async { totalPoolSize : Nat; availableCount : Nat } {
    let availableCount = comments.values().foldLeft(0, func(acc, c) {
      switch (c.status) { case (#available) { acc + 1 }; case (#used) { acc } };
    });
    { totalPoolSize = comments.size(); availableCount };
  };

  public query func getAllAppEvents() : async [AppEvent] {
    appsEvents.values().toArray().map(func(ev) { ev.appEvent });
  };

  public query func getAllAppEventsWithImportDate() : async [AppEventWithImportDate] {
    appsEvents.values().toArray();
  };

  public query func getAppEvent(name : Text) : async ?AppEvent {
    switch (appsEvents.get(name)) {
      case (?ev) { ?ev.appEvent };
      case (null) { null };
    };
  };

  public query func getAllChatMessages() : async [ChatMessage] {
    chatMessages.toArray();
  };

  public shared func addChatMessage(text : Text) : async ChatMessage {
    let msg : ChatMessage = { id = nextMessageId; text; timestamp = Time.now() };
    nextMessageId += 1;
    chatMessages.add(msg);
    msg;
  };

  public query func getAllImages() : async [ImageMeta] {
    images.values().toArray();
  };

  public query func getImage(id : Nat) : async ?ImageMeta {
    images.get(id);
  };

  public query func getPublicSettings() : async PublicSettings {
    { bgMusicEnabled = settings.bgMusicEnabled; musicFile = settings.musicFile };
  };

  public query func getMusicUrl() : async ?Text {
    musicUrl;
  };

  public query func validateAccessKey(key : Text) : async Bool {
    switch (settings.accessKey) {
      case (?storedKey) { key == storedKey };
      case (null) { false };
    };
  };

  public query func verifyAdminCode(code : Text) : async Bool {
    code == storedAdminCode;
  };

  public query func getPriceList() : async [PriceEntry] {
    priceList.toArray().map(func((appName, entry)) {
      { appName; pricePerEntry = entry.pricePerEntry; isActive = entry.isActive };
    });
  };

  public query func getPriceEntry(appName : Text) : async ?PriceEntry {
    switch (priceList.get(appName)) {
      case (?entry) { ?{ appName; pricePerEntry = entry.pricePerEntry; isActive = entry.isActive } };
      case (null) { null };
    };
  };

  public query func isPriceListInitialized() : async Bool { priceListInitialized };

  public query func getMyWithdrawalRequests(username : Text) : async [WithdrawalRequest] {
    withdrawalRequests.values().toArray().filter(func(req) { req.username == username });
  };

  public shared func submitWithdrawalRequest(username : Text, walletNumber : Text, amount : Float) : async WithdrawalRequest {
    let key = username # "-" # Time.now().toText();
    let req : WithdrawalRequest = { username; walletNumber; amount; status = #pending; timestamp = Time.now() };
    withdrawalRequests.add(key, req);
    req;
  };

  public query func checkWithdrawalEligibility(username : Text) : async Bool {
    let pending = withdrawalRequests.values().toArray().filter(
      func(req) { req.username == username and req.status == #pending }
    );
    pending.size() == 0;
  };

  public query func getListMetrics() : async [ListMetrics] {
    commentLists.values().toArray().map(func(list) {
      let usedIndices = switch (usedTemplateIndices.get(list.id)) {
        case (null) { Set.empty<Nat>() };
        case (?s) { s };
      };
      let usedCount = usedIndices.size();
      let totalTemplates = list.templates.size();
      {
        listId = list.id;
        listName = list.displayName;
        totalTemplates;
        usedTemplates = usedCount;
        availableTemplates = if (totalTemplates > 0 and usedCount > 0) {
          safeNatSubtract(totalTemplates, usedCount);
        } else { totalTemplates };
        percentUsed = if (totalTemplates == 0) { 0.0 } else {
          usedCount.toFloat() / totalTemplates.toFloat() * 100.0;
        };
      };
    });
  };

  public query func getAllInventory() : async [(Text, Nat)] {
    inventoryCounter.toArray();
  };

  public query func getInventoryCount(listId : Text) : async Nat {
    switch (inventoryCounter.get(listId)) { case (?c) { c }; case (null) { 0 } };
  };

  public query func getCountdownState() : async CountdownState { countdownState };

  public query func getGlobalCommentPoolStats() : async GlobalCommentPoolStats {
    {
      totalTemplates = globalComments.size();
      templatesRemaining = globalCommentInventory;
      totalClaimed = safeNatSubtract(globalComments.size(), globalCommentInventory);
      batchSupport = globalComments.size() > 1;
    };
  };

  // ── ADMIN FUNCTIONS — all validate code param against storedAdminCode ─────

  public shared func setAdminCode(currentCode : Text, newCode : Text) : async Bool {
    if (currentCode != storedAdminCode) { return false };
    storedAdminCode := newCode;
    true;
  };

  public shared func createCommentList(code : Text, id : Text, displayName : Text, suffix : Text) : async () {
    requireAdmin(code);
    commentLists.add(id, { id; displayName; templates = []; locked = false; suffix });
    commentListsOrder.add(id);
  };

  public shared func addTemplatesToCommentList(code : Text, id : Text, newTemplates : [Text]) : async () {
    requireAdmin(code);
    switch (commentLists.get(id)) {
      case (null) { Runtime.trap("Comment list not found") };
      case (?existing) {
        if (existing.locked) { Runtime.trap("Comment list is locked") };
        let updated : CommentList = {
          id = existing.id; displayName = existing.displayName;
          templates = existing.templates.concat(newTemplates);
          locked = existing.locked; suffix = existing.suffix;
        };
        commentLists.add(id, updated);
      };
    };
  };

  public shared func setCommentListTemplates(code : Text, id : Text, templates : [Text]) : async () {
    requireAdmin(code);
    switch (commentLists.get(id)) {
      case (null) { Runtime.trap("Comment list not found") };
      case (?existing) {
        commentLists.add(id, { id = existing.id; displayName = existing.displayName;
          templates; locked = existing.locked; suffix = existing.suffix });
      };
    };
  };

  public shared func renameCommentList(code : Text, id : Text, newDisplayName : Text) : async () {
    requireAdmin(code);
    switch (commentLists.get(id)) {
      case (null) { Runtime.trap("Comment list not found") };
      case (?existing) {
        commentLists.add(id, { id = existing.id; displayName = newDisplayName;
          templates = existing.templates; locked = existing.locked; suffix = existing.suffix });
      };
    };
  };

  public shared func deleteCommentList(code : Text, id : Text) : async () {
    requireAdmin(code);
    commentLists.remove(id);
    inventoryCounter.remove(id);
    usedTemplateIndices.remove(id);
  };

  public shared func lockCommentList(code : Text, id : Text) : async () {
    requireAdmin(code);
    switch (commentLists.get(id)) {
      case (null) { Runtime.trap("Comment list not found") };
      case (?existing) {
        commentLists.add(id, { id = existing.id; displayName = existing.displayName;
          templates = existing.templates; locked = true; suffix = existing.suffix });
      };
    };
  };

  public shared func unlockCommentList(code : Text, id : Text) : async () {
    requireAdmin(code);
    switch (commentLists.get(id)) {
      case (null) { Runtime.trap("Comment list not found") };
      case (?existing) {
        commentLists.add(id, { id = existing.id; displayName = existing.displayName;
          templates = existing.templates; locked = false; suffix = existing.suffix });
      };
    };
  };

  public shared func resetUsedTemplates(code : Text, listId : Text) : async () {
    requireAdmin(code);
    usedTemplateIndices.remove(listId);
  };

  public shared func setInventoryCount(code : Text, listId : Text, count : Nat) : async () {
    requireAdmin(code);
    inventoryCounter.add(listId, count);
  };

  public shared func getBulkComments(code : Text, listId : Text, count : Nat) : async BulkCommentsResult {
    requireAdmin(code);
    switch (commentLists.get(listId)) {
      case (null) { Runtime.trap("Comment list not found") };
      case (?list) {
        let totalTemplates = list.templates.size();
        let usedSet = switch (usedTemplateIndices.get(listId)) {
          case (null) { Set.empty<Nat>() };
          case (?s) { s };
        };
        var resultComments : List.List<Text> = List.empty();
        var generated = 0;
        var i = 0;
        while (i < totalTemplates and generated < count) {
          if (not usedSet.contains(i)) {
            resultComments.add(list.templates[i]);
            usedSet.add(i);
            generated += 1;
          };
          i += 1;
        };
        usedTemplateIndices.add(listId, usedSet);
        { commentListId = listId; comments = resultComments.toArray(); generatedCount = generated; templateCount = totalTemplates };
      };
    };
  };

  public shared func addGlobalComment(code : Text, comment : Text) : async () {
    requireAdmin(code);
    comments.add(nextCommentId, { id = nextCommentId; text = comment; status = #available });
    nextCommentId += 1;
  };

  public shared func addGlobalComments(code : Text, commentsToAdd : [Text]) : async () {
    requireAdmin(code);
    for (comment in commentsToAdd.vals()) {
      comments.add(nextCommentId, { id = nextCommentId; text = comment; status = #available });
      nextCommentId += 1;
    };
  };

  public shared func createAppEvent(code : Text, name : Text) : async () {
    requireAdmin(code);
    appsEvents.add(name, { appEvent = { name; usernames = [] }; importDate = null });
  };

  public shared func addUsernamesToAppEvent(code : Text, name : Text, newUsernames : [Text]) : async Nat {
    requireAdmin(code);
    switch (appsEvents.get(name)) {
      case (null) { Runtime.trap("App event not found") };
      case (?existing) {
        let existingSet = Set.fromArray(existing.appEvent.usernames, );
        var added = 0;
        let combined = List.empty<Text>();
        for (u in existing.appEvent.usernames.vals()) { combined.add(u) };
        for (u in newUsernames.vals()) {
          if (not existingSet.contains(u)) {
            combined.add(u); existingSet.add(u); added += 1;
          };
        };
        appsEvents.add(name, { appEvent = { name; usernames = combined.toArray() }; importDate = existing.importDate });
        added;
      };
    };
  };

  public shared func deleteAppEvent(code : Text, name : Text) : async () {
    requireAdmin(code);
    appsEvents.remove(name);
  };

  public shared func importLiveLists(code : Text, imports : [AppImport]) : async ImportSummary {
    requireAdmin(code);
    var totalAppsDetected = 0;
    var totalUsernamesAdded = 0;
    var totalDuplicatesSkipped = 0;
    for (appImport in imports.vals()) {
      totalAppsDetected += 1;
      let existing = switch (appsEvents.get(appImport.appName)) {
        case (?ev) { ev };
        case (null) {
          let newEv : AppEventWithImportDate = {
            appEvent = { name = appImport.appName; usernames = [] };
            importDate = appImport.importDate;
          };
          appsEvents.add(appImport.appName, newEv);
          newEv;
        };
      };
      let existingSet = Set.fromArray(existing.appEvent.usernames, );
      let combined = List.empty<Text>();
      for (u in existing.appEvent.usernames.vals()) { combined.add(u) };
      for (u in appImport.usernames.vals()) {
        if (not existingSet.contains(u)) {
          combined.add(u); existingSet.add(u); totalUsernamesAdded += 1;
        } else { totalDuplicatesSkipped += 1 };
      };
      appsEvents.add(appImport.appName, {
        appEvent = { name = appImport.appName; usernames = combined.toArray() };
        importDate = appImport.importDate;
      });
    };
    { totalAppsDetected; totalUsernamesAdded; totalDuplicatesSkipped };
  };

  public shared func deleteChatMessage(code : Text, id : Nat) : async () {
    requireAdmin(code);
    let remaining = chatMessages.toArray().filter(func(msg) { msg.id != id });
    chatMessages.clear();
    for (msg in remaining.vals()) { chatMessages.add(msg) };
  };

  public shared func uploadImage(code : Text, name : Text, tags : [Text], dataUrl : Text) : async ImageMeta {
    requireAdmin(code);
    let id = nextImageId;
    nextImageId += 1;
    let img : ImageMeta = { id; name; tags; dataUrl; data = null };
    images.add(id, img);
    img;
  };

  public shared func updateImageTags(code : Text, id : Nat, tags : [Text]) : async () {
    requireAdmin(code);
    switch (images.get(id)) {
      case (null) { Runtime.trap("Image not found") };
      case (?existing) {
        images.add(id, { id = existing.id; name = existing.name; tags; dataUrl = existing.dataUrl; data = existing.data });
      };
    };
  };

  public shared func deleteImage(code : Text, id : Nat) : async () {
    requireAdmin(code);
    images.remove(id);
  };

  public shared func setAccessKey(code : Text, key : Text) : async () {
    requireAdmin(code);
    settings := { bgMusicEnabled = settings.bgMusicEnabled; musicFile = settings.musicFile; accessKey = ?key };
  };

  public shared func regenerateAccessKey(code : Text) : async Text {
    requireAdmin(code);
    let key = "ak-" # Time.now().toText();
    settings := { bgMusicEnabled = settings.bgMusicEnabled; musicFile = settings.musicFile; accessKey = ?key };
    key;
  };

  public shared func clearAccessKey(code : Text) : async () {
    requireAdmin(code);
    settings := { bgMusicEnabled = settings.bgMusicEnabled; musicFile = settings.musicFile; accessKey = null };
  };

  public shared func setBgMusicEnabled(code : Text, enabled : Bool) : async () {
    requireAdmin(code);
    settings := { bgMusicEnabled = enabled; musicFile = settings.musicFile; accessKey = settings.accessKey };
  };

  // setMusicUrl stores the URL in the standalone musicUrl variable (not in Settings)
  public shared func setMusicUrl(code : Text, url : Text) : async () {
    requireAdmin(code);
    // Store non-empty URL; empty string means clear
    if (url == "") { musicUrl := null } else { musicUrl := ?url };
  };

  public shared func clearMusicUrl(code : Text) : async () {
    requireAdmin(code);
    musicUrl := null;
  };

  public shared func updateSettings(code : Text, bgMusicEnabled : Bool, newMusicUrl : ?Text) : async () {
    requireAdmin(code);
    settings := { bgMusicEnabled; musicFile = settings.musicFile; accessKey = settings.accessKey };
    musicUrl := newMusicUrl;
  };

  public shared func addPriceEntry(code : Text, appName : Text, pricePerEntry : Float, isActive : Bool) : async () {
    requireAdmin(code);
    priceList.add(appName, { pricePerEntry; isActive });
  };

  public shared func editPriceEntry(code : Text, appName : Text, pricePerEntry : Float, isActive : Bool) : async () {
    requireAdmin(code);
    switch (priceList.get(appName)) {
      case (null) { Runtime.trap("Price entry not found") };
      case (?_) { priceList.add(appName, { pricePerEntry; isActive }) };
    };
  };

  public shared func deletePriceEntry(code : Text, appName : Text) : async () {
    requireAdmin(code);
    priceList.remove(appName);
  };

  public shared func bulkUploadPrices(code : Text, entries : [PriceEntry]) : async Nat {
    requireAdmin(code);
    var count = 0;
    for (entry in entries.vals()) {
      priceList.add(entry.appName, { pricePerEntry = entry.pricePerEntry; isActive = entry.isActive });
      count += 1;
    };
    count;
  };

  public shared func setPriceListInitialized(code : Text, value : Bool) : async () {
    requireAdmin(code);
    priceListInitialized := value;
  };

  public shared func updateWithdrawalStatus(code : Text, key : Text, status : WithdrawalStatus) : async () {
    requireAdmin(code);
    switch (withdrawalRequests.get(key)) {
      case (null) { Runtime.trap("Withdrawal request not found") };
      case (?existing) {
        withdrawalRequests.add(key, {
          username = existing.username; walletNumber = existing.walletNumber;
          amount = existing.amount; status; timestamp = existing.timestamp;
        });
      };
    };
  };

  public query func getAllWithdrawalRequests(code : Text) : async [WithdrawalRequest] {
    if (code != storedAdminCode) { Runtime.trap("Unauthorized: Invalid admin code") };
    withdrawalRequests.values().toArray();
  };

  public query func getAllEarningsSummary(code : Text) : async AllEarningsSummary {
    if (code != storedAdminCode) { Runtime.trap("Unauthorized: Invalid admin code") };
    let appEarningsList = List.empty<AppEarnings>();
    var totalAppsWithPrices = 0;
    var totalValidEntries = 0;
    var totalEarnings : Float = 0.0;
    for ((appName, priceEntry) in priceList.toArray().vals()) {
      totalAppsWithPrices += 1;
      let usernameCount = switch (appsEvents.get(appName)) {
        case (null) { 0 };
        case (?ev) { ev.appEvent.usernames.size() };
      };
      let amount = if (usernameCount == 0) { 0.0 } else { usernameCount.toFloat() * priceEntry.pricePerEntry };
      if (priceEntry.isActive) { totalValidEntries += usernameCount; totalEarnings += amount };
      appEarningsList.add({
        appName; totalUsernamesFound = usernameCount;
        pricePerEntry = priceEntry.pricePerEntry; totalAmount = amount; isActive = priceEntry.isActive;
      });
    };
    { appEarnings = appEarningsList.toArray(); totalAppsWithPrices; totalValidEntries; totalEarnings };
  };

  public query func getSettings(code : Text) : async Settings {
    if (code != storedAdminCode) { Runtime.trap("Unauthorized: Invalid admin code") };
    settings;
  };

  public shared func wipeAllData(code : Text) : async () {
    requireAdmin(code);
    commentLists.clear(); appsEvents.clear(); chatMessages.clear(); images.clear();
    usedTemplateIndices.clear(); withdrawalRequests.clear(); priceList.clear();
    commentListsOrder.clear(); globalComments.clear(); inventoryCounter.clear();
    comments.clear();
    nextImageId := 1; nextMessageId := 1; nextCommentId := 0; globalCommentInventory := 0;
    musicUrl := null;
  };

  public shared func setCountdown(code : Text, targetTime : Time.Time) : async () {
    requireAdmin(code);
    countdownState := { targetTime = ?targetTime; isActive = true };
  };

  public shared func stopCountdown(code : Text) : async () {
    requireAdmin(code);
    countdownState := { targetTime = countdownState.targetTime; isActive = false };
  };

  public shared func clearCountdown(code : Text) : async () {
    requireAdmin(code);
    countdownState := { targetTime = null; isActive = false };
  };
};
