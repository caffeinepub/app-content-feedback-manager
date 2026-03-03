import Set "mo:core/Set";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import Time "mo:core/Time";
import List "mo:core/List";
import Map "mo:core/Map";
import Float "mo:core/Float";
import Int "mo:core/Int";
import Order "mo:core/Order";
import Array "mo:core/Array";
import Iter "mo:core/Iter";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  func safeNatSubtract(a : Nat, b : Nat) : Nat {
    if (a > b) { a - b } else { 0 };
  };

  include MixinStorage();

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  type UserProfile = {
    name : Text;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();

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

  type Settings = {
    bgMusicEnabled : Bool;
    musicFile : ?Storage.ExternalBlob;
    accessKey : ?Text;
  };

  // Public-safe settings (no accessKey exposed)
  type PublicSettings = {
    bgMusicEnabled : Bool;
    musicFile : ?Storage.ExternalBlob;
  };

  type ImportSummary = {
    totalAppsDetected : Nat;
    totalUsernamesAdded : Nat;
    totalDuplicatesSkipped : Nat;
  };

  type ExportData = {
    commentLists : [CommentList];
    appsEvents : [AppEvent];
    chatMessages : [ChatMessage];
    images : [ImageMeta];
    settings : Settings;
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

  type ClaimCommentResult = {
    #noCommentsRemaining;
    #claimSuccess : Text;
  };

  type AppImport = {
    appName : Text;
    usernames : [Text];
    importDate : ?Text;
  };

  type AppEventWithImportDate = {
    appEvent : AppEvent;
    importDate : ?Text;
  };

  type WithdrawalRequest = {
    username : Text;
    walletNumber : Text;
    amount : Float;
    status : WithdrawalStatus;
    timestamp : Time.Time;
  };

  type WithdrawalStatus = {
    #pending;
    #completed;
    #rejected;
  };

  type PriceEntry = {
    appName : Text;
    pricePerEntry : Float;
    isActive : Bool;
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

  type CountdownState = {
    targetTime : ?Time.Time;
    isActive : Bool;
    startedBy : ?Principal;
  };

  let commentLists = Map.empty<Text, CommentList>();
  let commentListsOrder = List.empty<Text>();
  let appsEvents = Map.empty<Text, AppEventWithImportDate>();
  let chatMessages = List.empty<ChatMessage>();
  let images = Map.empty<Nat, ImageMeta>();
  let usedTemplateIndices = Map.empty<Text, Set.Set<Nat>>();
  let priceList = Map.empty<Text, { pricePerEntry : Float; isActive : Bool }>();
  let inventoryCounter = Map.empty<Text, Nat>();
  let withdrawalRequests = Map.empty<Text, WithdrawalRequest>();

  var nextImageId = 1;
  var nextMessageId = 1;
  var settings : Settings = {
    bgMusicEnabled = false;
    musicFile = null;
    accessKey = null;
  };

  var priceListInitialized = false;

  var countdownState : CountdownState = {
    targetTime = null;
    isActive = false;
    startedBy = null;
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

  // ── User profile functions ────────────────────────────────────────────────

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get their profile");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // ── Comment list functions ────────────────────────────────────────────────

  // Publicly accessible read query (no auth required per implementation plan)
  public query func getAllCommentLists() : async [CommentList] {
    commentLists.values().toArray();
  };

  // Publicly accessible read query (no auth required per implementation plan)
  public query func getCommentList(id : Text) : async ?CommentList {
    commentLists.get(id);
  };

  // Admin-only: create new comment list (previously missing backend support)
  public shared ({ caller }) func createCommentList(list : CommentList) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can create comment lists");
    };
    if (commentLists.containsKey(list.id)) {
      Runtime.trap("Comment list with id " # list.id # " already exists. ");
    };
    commentLists.add(list.id, list);
    commentListsOrder.add(list.id);
  };

  // ── App event functions ──────────────────────────────────────────────────

  // Publicly accessible read query (no auth required per implementation plan)
  public query func getAllAppEvents() : async [AppEvent] {
    appsEvents.values().toArray().map(func(ev) { ev.appEvent });
  };

  // Publicly accessible read query (no auth required per implementation plan)
  public query func getAppEvent(name : Text) : async ?AppEvent {
    switch (appsEvents.get(name)) {
      case (?ev) { ?ev.appEvent };
      case (null) { null };
    };
  };

  // Admin-only: create app event (previously missing backend support)
  public shared ({ caller }) func createAppEvent(appName : Text, event : AppEvent) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can create app events");
    };
    appsEvents.add(
      appName,
      {
        appEvent = event;
        importDate = null;
      },
    );
  };

  // ── Chat message functions ───────────────────────────────────────────────

  // Publicly accessible read query (no auth required per implementation plan)
  public query func getAllChatMessages() : async [ChatMessage] {
    chatMessages.toArray();
  };

  // Publicly accessible read query (no auth required per implementation plan)
  public query func getChatMessage(id : Nat) : async ?ChatMessage {
    chatMessages.toArray().find(func(msg) { msg.id == id });
  };

  // ── Image functions ─────────────────────────────────────────────────────

  // Publicly accessible read query (no auth required per implementation plan)
  public query func getAllImages() : async [ImageMeta] {
    images.values().toArray();
  };

  // Publicly accessible read query (no auth required per implementation plan)
  public query func getImage(id : Nat) : async ?ImageMeta {
    images.get(id);
  };

  // ── Settings functions ─────────────────────────────────────────────────

  // Publicly accessible read query - returns only non-sensitive settings
  public query func getPublicSettings() : async PublicSettings {
    {
      bgMusicEnabled = settings.bgMusicEnabled;
      musicFile = settings.musicFile;
    };
  };

  // Admin-only: exposes sensitive accessKey field
  public query ({ caller }) func getSettings() : async Settings {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can access full settings");
    };
    settings;
  };

  // Admin-only: set new access key (previously missing backend support)
  public shared ({ caller }) func setAccessKey(key : Text) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can set access key");
    };
    settings := { settings with accessKey = ?key };
  };

  // Admin-only: upload music file (previously missing backend support)
  public shared ({ caller }) func uploadMusicFile(blob : Storage.ExternalBlob) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can upload music file");
    };
    settings := { settings with musicFile = ?blob };
  };

  // ── Price list functions ────────────────────────────────────────────────

  // Publicly accessible read query (no auth required per implementation plan)
  public query func getPriceList() : async [PriceEntry] {
    priceList.toArray().map(
      func((appName, entry)) {
        {
          appName;
          pricePerEntry = entry.pricePerEntry;
          isActive = entry.isActive;
        };
      }
    );
  };

  // Publicly accessible read query (no auth required per implementation plan)
  public query func getPriceEntry(appName : Text) : async ?PriceEntry {
    switch (priceList.get(appName)) {
      case (?entry) {
        ?{
          appName;
          pricePerEntry = entry.pricePerEntry;
          isActive = entry.isActive;
        };
      };
      case (null) { null };
    };
  };

  // ── Inventory functions ────────────────────────────────────────────────

  // Publicly accessible read query (no auth required per implementation plan)
  public query func getAllInventory() : async [(Text, Nat)] {
    inventoryCounter.toArray();
  };

  // Publicly accessible read query (no auth required per implementation plan)
  public query func getInventoryCount(listId : Text) : async Nat {
    switch (inventoryCounter.get(listId)) {
      case (?count) { count };
      case (null) { 0 };
    };
  };

  // ── Withdrawal request functions ───────────────────────────────────────

  // Admin-only: exposes sensitive financial data (wallet numbers, amounts, usernames)
  public query ({ caller }) func getAllWithdrawalRequests() : async [WithdrawalRequest] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view withdrawal requests");
    };
    withdrawalRequests.values().toArray();
  };

  // ── Metrics and utilities ──────────────────────────────────────────────

  // Publicly accessible read query (no auth required per implementation plan)
  public query func getListMetrics() : async [ListMetrics] {
    commentLists.values().toArray().map(
      func(list) {
        let usedIndices = switch (usedTemplateIndices.get(list.id)) {
          case (null) { Set.empty<Nat>() };
          case (?set) { set };
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
          } else {
            totalTemplates;
          };
          percentUsed = if (totalTemplates == 0) {
            0.0;
          } else {
            let ratio = usedCount.toFloat() / totalTemplates.toFloat();
            ratio * 100.0;
          };
        };
      }
    );
  };

  // ── Countdown timer functions ──────────────────────────────────────────

  // Publicly accessible read query (no auth required per implementation plan)
  public query func getCountdownState() : async CountdownState {
    countdownState;
  };
};

