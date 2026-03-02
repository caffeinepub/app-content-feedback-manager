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

import Migration "migration";
(with migration = Migration.run)
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

  // ── User profile functions (required by instructions) ──────────────────────

  // Users only: get caller's own profile
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can get their profile");
    };
    userProfiles.get(caller);
  };

  // Users only: save caller's own profile
  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can save their profile");
    };
    userProfiles.add(caller, profile);
  };

  // Users can view their own profile; admins can view any profile
  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  // ── Countdown timer functions ──────────────────────────────────────────────

  // Open to all: read countdown state
  public query ({ caller }) func getCountdownState() : async CountdownState {
    countdownState;
  };

  // Admin-only: set countdown target time
  public shared ({ caller }) func setCountdown(targetTime : Time.Time) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can set the countdown timer");
    };
    countdownState := {
      countdownState with targetTime = ?targetTime;
      isActive = true;
      startedBy = ?caller;
    };
  };

  // Admin-only: pause countdown
  public shared ({ caller }) func pauseCountdown() : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can pause the countdown timer");
    };
    countdownState := {
      countdownState with isActive = false;
      startedBy = ?caller;
    };
  };

  // Admin-only: resume countdown
  public shared ({ caller }) func resumeCountdown() : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can resume the countdown timer");
    };
    countdownState := {
      countdownState with isActive = true;
      startedBy = ?caller;
    };
  };

  // Admin-only: reset countdown
  public shared ({ caller }) func resetCountdown() : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can reset the countdown timer");
    };
    countdownState := {
      targetTime = null;
      isActive = false;
      startedBy = ?caller;
    };
  };

  // ── Settings ─────────────────────────────────────────────────────────────

  // Open to all: get public settings (music file, bgMusicEnabled) — no accessKey exposed
  public query ({ caller }) func getPublicSettings() : async PublicSettings {
    {
      bgMusicEnabled = settings.bgMusicEnabled;
      musicFile = settings.musicFile;
    };
  };

  // Admin-only: get full settings including accessKey
  public query ({ caller }) func getSettings() : async Settings {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can view full settings");
    };
    settings;
  };

  // Admin-only: update settings
  public shared ({ caller }) func updateSettings(bgMusicEnabled : Bool, musicFile : ?Storage.ExternalBlob) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can update settings");
    };
    settings := {
      bgMusicEnabled;
      musicFile;
      accessKey = settings.accessKey;
    };
  };

  // Admin-only: set access key
  public shared ({ caller }) func setAccessKey(key : Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can set the access key");
    };
    settings := {
      settings with accessKey = ?key;
    };
  };

  // Admin-only: get access key
  public query ({ caller }) func getAccessKey() : async ?Text {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can view the access key");
    };
    settings.accessKey;
  };

  // ── Comment lists ──────────────────────────────────────────────────────

  // Admin-only: import live list data
  public shared ({ caller }) func importLiveList(imports : [AppImport]) : async ImportSummary {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can import live lists");
    };
    var totalUsernamesAdded = 0;
    var totalDuplicatesSkipped = 0;

    for (imp in imports.values()) {
      let currentUsers = switch (appsEvents.get(imp.appName)) {
        case (?existing) { existing.appEvent.usernames };
        case (null) {
          let app = { name = imp.appName; usernames = [] };
          appsEvents.add(
            imp.appName,
            {
              appEvent = app;
              importDate = imp.importDate;
            },
          );
          [];
        };
      };

      let filteredNewUsernames = imp.usernames.filter(
        func(u) {
          not currentUsers.values().any(func(v) { v == u });
        }
      );

      let combinedUsernames = currentUsers.concat(filteredNewUsernames);
      let newSize = combinedUsernames.size();

      if (newSize > 0) {
        totalUsernamesAdded += filteredNewUsernames.size();
        totalDuplicatesSkipped += (imp.usernames.size() - filteredNewUsernames.size());

        appsEvents.add(
          imp.appName,
          {
            appEvent = {
              name = imp.appName;
              usernames = combinedUsernames;
            };
            importDate = imp.importDate;
          },
        );
      } else {
        totalDuplicatesSkipped += imp.usernames.size();
      };
    };

    {
      totalAppsDetected = imports.size();
      totalUsernamesAdded;
      totalDuplicatesSkipped;
    };
  };

  // Admin-only: delete a comment list
  public shared ({ caller }) func deleteCommentList(listId : Text) : async Bool {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can delete comment lists");
    };
    switch (commentLists.get(listId)) {
      case (null) { false };
      case (_) {
        commentLists.remove(listId);
        usedTemplateIndices.remove(listId);

        let filteredList = commentListsOrder.filter(func(id) { id != listId });
        commentListsOrder.clear();
        for (id in filteredList.values()) {
          commentListsOrder.add(id);
        };
        true;
      };
    };
  };

  // Admin-only: add a comment list
  public shared ({ caller }) func addCommentList(id : Text, displayName : Text, suffix : Text) : async Bool {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can add comment lists");
    };
    let list : CommentList = {
      id;
      displayName;
      templates = [];
      locked = false;
      suffix;
    };
    commentLists.add(id, list);
    commentListsOrder.add(id);
    true;
  };

  // Admin-only: rename a comment list
  public shared ({ caller }) func renameCommentList(oldId : Text, newId : Text, newDisplayName : Text) : async Bool {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can rename comment lists");
    };
    switch (commentLists.get(oldId)) {
      case (null) { false };
      case (?oldList) {
        let newList : CommentList = {
          id = newId;
          displayName = newDisplayName;
          templates = oldList.templates;
          locked = oldList.locked;
          suffix = oldList.suffix;
        };
        commentLists.remove(oldId);
        commentLists.add(newId, newList);

        let orderArray = commentListsOrder.toArray();
        commentListsOrder.clear();
        for (id in orderArray.values()) {
          if (id != oldId) {
            commentListsOrder.add(id);
          } else {
            commentListsOrder.add(newId);
          };
        };
        true;
      };
    };
  };

  // Admin-only: add templates to a list
  public shared ({ caller }) func addTemplatesToList(listId : Text, templates : [Text]) : async Bool {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can add templates to lists");
    };
    switch (commentLists.get(listId)) {
      case (null) { false };
      case (?list) {
        if (list.locked) { return false };
        let newList : CommentList = {
          id = list.id;
          displayName = list.displayName;
          templates = list.templates.concat(templates);
          locked = list.locked;
          suffix = list.suffix;
        };
        commentLists.add(listId, newList);
        true;
      };
    };
  };

  // Admin-only: toggle list lock
  public shared ({ caller }) func toggleListLock(listId : Text) : async Bool {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can toggle list lock");
    };
    switch (commentLists.get(listId)) {
      case (null) { false };
      case (?list) {
        let newList : CommentList = {
          id = list.id;
          displayName = list.displayName;
          templates = list.templates;
          locked = not list.locked;
          suffix = list.suffix;
        };
        commentLists.add(listId, newList);
        true;
      };
    };
  };

  // ── App events ─────────────────────────────────────────────────────---

  // Admin-only: delete an app event
  public shared ({ caller }) func deleteAppEvent(name : Text) : async Bool {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can delete app events");
    };
    switch (appsEvents.get(name)) {
      case (null) { false };
      case (_) {
        appsEvents.remove(name);
        true;
      };
    };
  };

  // Admin-only: rename an app event
  public shared ({ caller }) func renameAppEvent(oldName : Text, newName : Text) : async Bool {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can rename app events");
    };
    switch (appsEvents.get(oldName)) {
      case (null) { false };
      case (?oldApp) {
        let newApp : AppEvent = {
          name = newName;
          usernames = oldApp.appEvent.usernames;
        };
        appsEvents.remove(oldName);
        appsEvents.add(
          newName,
          {
            appEvent = newApp;
            importDate = oldApp.importDate;
          },
        );
        true;
      };
    };
  };

  // Admin-only: add an app event
  public shared ({ caller }) func addAppEvent(name : Text) : async Bool {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can add app events");
    };
    let app : AppEvent = {
      name;
      usernames = [];
    };
    appsEvents.add(
      name,
      {
        appEvent = app;
        importDate = null;
      },
    );
    true;
  };

  // Admin-only: add usernames to an app event
  public shared ({ caller }) func addUsernamesToAppEvent(name : Text, usernames : [Text]) : async Bool {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can add usernames to app events");
    };
    switch (appsEvents.get(name)) {
      case (null) { false };
      case (?app) {
        let newApp : AppEvent = {
          name = app.appEvent.name;
          usernames = app.appEvent.usernames.concat(usernames);
        };
        appsEvents.add(
          name,
          {
            appEvent = newApp;
            importDate = app.importDate;
          },
        );
        true;
      };
    };
  };

  // ── Chat ─────────────────────────────────────────────────────────-----

  // Users only: add a chat message
  public shared ({ caller }) func addChatMessage(text : Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can add chat messages");
    };
    let message : ChatMessage = {
      id = nextMessageId;
      text;
      timestamp = Time.now();
    };
    chatMessages.add(message);
    nextMessageId += 1;
  };

  // ── Images ─────────────────────────────────────────────────────────---

  // Users only: add an image
  public shared ({ caller }) func addImage(name : Text, tags : [Text], dataUrl : Text, data : ?Storage.ExternalBlob) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can add images");
    };
    let image : ImageMeta = {
      id = nextImageId;
      name;
      tags;
      dataUrl;
      data;
    };
    images.add(nextImageId, image);
    nextImageId += 1;
  };

  // ── Comments ─────────────────────────────────────────────────────────

  // Users only: claim a comment
  public shared ({ caller }) func claimComment(listId : Text) : async ClaimCommentResult {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can claim comments");
    };
    switch (commentLists.get(listId)) {
      case (null) {
        #noCommentsRemaining;
      };
      case (?list) {
        if (list.templates.size() == 0) {
          return #noCommentsRemaining;
        };

        let usedIndices = switch (usedTemplateIndices.get(listId)) {
          case (null) { Set.empty<Nat>() };
          case (?set) { set };
        };

        let usedCount = usedIndices.size();

        if (usedCount >= list.templates.size()) {
          return #noCommentsRemaining;
        };

        var availableIndex : ?Nat = null;

        var attempts = 0;
        let maxAttempts = 100;

        while (attempts < maxAttempts) {
          let randomIndex = Int.abs(Time.now()) % list.templates.size();
          if (not usedIndices.contains(randomIndex)) {
            availableIndex := ?randomIndex;
            attempts := maxAttempts;
          };
          attempts += 1;
        };

        let finalIndex = switch (availableIndex) {
          case (?index) { index };
          case (null) {
            var firstAvailable = 0;
            while (firstAvailable < list.templates.size() and usedIndices.contains(firstAvailable)) {
              firstAvailable += 1;
            };
            firstAvailable;
          };
        };

        let updatedUsedIndices = Set.empty<Nat>();
        updatedUsedIndices.addAll(usedIndices.values());
        updatedUsedIndices.add(finalIndex);

        usedTemplateIndices.add(listId, updatedUsedIndices);

        #claimSuccess(list.templates[finalIndex]);
      };
    };
  };

  // Open to all: get available comments for a list
  public query ({ caller }) func getAvailableComments(listId : Text) : async {
    comments : [Text];
    count : Nat;
  } {
    switch (commentLists.get(listId)) {
      case (null) {
        { comments = []; count = 0 };
      };
      case (?list) {
        let usedIndices = switch (usedTemplateIndices.get(listId)) {
          case (null) { Set.empty<Nat>() };
          case (?set) { set };
        };

        let availableComments = Array.tabulate(
          list.templates.size(),
          func(i) {
            if (not usedIndices.contains(i)) {
              list.templates[i];
            } else {
              "";
            };
          },
        ).filter(func(comment) { comment != "" });

        {
          comments = availableComments;
          count = availableComments.size();
        };
      };
    };
  };

  // Open to all: get available count for a list
  public query ({ caller }) func getAvailableCount(listId : Text) : async Nat {
    switch (commentLists.get(listId)) {
      case (null) { 0 };
      case (?list) {
        let usedIndices = switch (usedTemplateIndices.get(listId)) {
          case (null) { Set.empty<Nat>() };
          case (?set) { set };
        };
        let usedCount = usedIndices.size();
        if (list.templates.size() > 0 and usedCount > 0) {
          safeNatSubtract(list.templates.size(), usedCount);
        } else {
          list.templates.size();
        };
      };
    };
  };

  // Admin-only: get list metrics
  public query ({ caller }) func getListMetrics() : async [ListMetrics] {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can view list metrics");
    };
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

  // Users only: generate bulk comments
  public shared ({ caller }) func generateBulkComments(_ : Text, _ : Nat) : async BulkCommentsResult {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can generate bulk comments");
    };
    Runtime.trap("Function not implemented yet. This will take place in the next generated iteration.");
  };

  // Admin-only: export all data
  public shared ({ caller }) func exportAllData() : async ?ExportData {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can export all data");
    };
    ?{
      commentLists = commentLists.values().toArray();
      appsEvents = appsEvents.values().toArray().map(func(appWithDate) { appWithDate.appEvent });
      chatMessages = chatMessages.toArray();
      images = images.values().toArray();
      settings;
    };
  };

  // Open to all: get comment lists order
  public query ({ caller }) func getCommentListsOrder() : async [Text] {
    commentListsOrder.toArray();
  };

  // ── Price list ─────────────────────────────────────────────────────---

  // Admin-only: set a price entry
  public shared ({ caller }) func setPriceEntry(appName : Text, pricePerEntry : Float, isActive : Bool) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can set price entries");
    };
    priceList.add(appName, { pricePerEntry; isActive });
  };

  // Open to all: get price list
  public query ({ caller }) func getPriceList() : async [PriceEntry] {
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

  // Admin-only: delete a price entry
  public shared ({ caller }) func deletePriceEntry(appName : Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can delete price entries");
    };
    priceList.remove(appName);
  };

  // Admin-only: bulk set prices
  public shared ({ caller }) func bulkSetPrices(entries : [(Text, Float, Bool)]) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can bulk set prices");
    };
    for ((appName, pricePerEntry, isActive) in entries.values()) {
      priceList.add(appName, { pricePerEntry; isActive });
    };
  };

  // ── Earnings ─────────────────────────────────────────────────────---

  // Open to all: calculate earnings for a specific app
  public query ({ caller }) func calculateEarnings(appName : Text) : async ?AppEarnings {
    let appsEventsWithoutImportDate = appsEvents.toArray().filter(
      func((_, appWithDate)) {
        appWithDate.appEvent.name == appName;
      }
    );

    switch (priceList.get(appName)) {
      case (?priceEntry) {
        let accounts = appsEventsWithoutImportDate.filter(
          func((name, _)) {
            name == appName;
          }
        );

        var totalEarnings = 0.0;
        var totalUsernames = 0;

        for ((_name, appWithDate) in accounts.values()) {
          let count = appWithDate.appEvent.usernames.size();
          totalEarnings += count.toFloat() * priceEntry.pricePerEntry;
          totalUsernames += count;
        };

        ?{
          appName;
          totalUsernamesFound = totalUsernames;
          pricePerEntry = priceEntry.pricePerEntry;
          totalAmount = totalEarnings;
          isActive = priceEntry.isActive;
        };
      };
      case (null) { null };
    };
  };

  // Open to all: calculate all earnings
  public query ({ caller }) func calculateAllEarnings() : async AllEarningsSummary {
    var totalUsernames = 0;
    var totalEarnings = 0.0;
    var appsWithPricesCount = 0;

    let priceListToArray = priceList.toArray();
    let appsEventsWithoutImportDate = appsEvents.toArray();

    let appEarningsArr = priceListToArray.foldRight<(Text, { pricePerEntry : Float; isActive : Bool }), [AppEarnings]>(
      [],
      func((appName, entry), acc) {
        if (entry.isActive) {
          let accounts = appsEventsWithoutImportDate.filter(
            func((name, _)) {
              name == appName;
            }
          );

          switch (priceList.get(appName)) {
            case (?priceEntry_) {
              var appTotal = 0.0;
              var usernames = 0;
              for ((_name, appWithDate) in accounts.values()) {
                let count = appWithDate.appEvent.usernames.size();
                appTotal += count.toFloat() * entry.pricePerEntry;
                usernames += count;
              };

              if (usernames > 0) {
                let newEarning : AppEarnings = {
                  appName;
                  totalUsernamesFound = usernames;
                  pricePerEntry = entry.pricePerEntry;
                  totalAmount = appTotal;
                  isActive = entry.isActive;
                };
                appsWithPricesCount += 1;
                totalEarnings += appTotal;
                totalUsernames += usernames;
                [newEarning].concat(acc);
              } else {
                acc;
              };
            };
            case (null) { acc };
          };
        } else {
          acc;
        };
      },
    );

    {
      appEarnings = appEarningsArr;
      totalAppsWithPrices = appsWithPricesCount;
      totalValidEntries = totalUsernames;
      totalEarnings;
    };
  };

  // ── Inventory ─────────────────────────────────────────────────────---

  // Open to all: get inventory count for a list
  public query ({ caller }) func getInventoryCount(listId : Text) : async Nat {
    switch (inventoryCounter.get(listId)) {
      case (?count) { count };
      case (null) { 0 };
    };
  };

  // Admin-only: get all inventory
  public query ({ caller }) func getAllInventory() : async [(Text, Nat)] {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can view all inventory");
    };
    inventoryCounter.toArray();
  };

  // Users only: decrement inventory when performing bulk comment generation
  public shared ({ caller }) func updateInventory(commentListId : Text, quantity : Nat) : async Bool {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can update inventory");
    };
    let currentCount = switch (inventoryCounter.get(commentListId)) {
      case (?count) { count };
      case (null) { 0 };
    };
    let safeQuantity = if (quantity > currentCount) { currentCount } else {
      quantity;
    };
    let newCount = safeNatSubtract(currentCount, safeQuantity);
    inventoryCounter.add(commentListId, newCount);
    true;
  };

  // Admin-only: set inventory count for a list
  public shared ({ caller }) func setInventoryCount(commentListId : Text, count : Nat) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can set inventory counts");
    };
    inventoryCounter.add(commentListId, count);
  };

  // ── Withdrawals ─────────────────────────────────────────────────────

  // Users only: check earnings for a username and create a withdrawal request
  public shared ({ caller }) func checkAndRequestWithdrawal(username : Text, walletNumber : Text) : async ?Float {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can request withdrawals");
    };
    let allEarnings = await calculateAllEarnings();
    let userTotal = allEarnings.appEarnings.foldLeft(
      0.0,
      func(acc, earning) {
        if (earning.totalAmount > 0) { acc + earning.totalAmount } else { acc };
      },
    );

    if (userTotal > 0.0) {
      let request : WithdrawalRequest = {
        username;
        walletNumber;
        amount = userTotal;
        status = #pending;
        timestamp = Time.now();
      };
      withdrawalRequests.add(username.concat(walletNumber), request);
      ?userTotal;
    } else {
      null;
    };
  };

  // Admin-only: get all withdrawal requests
  public query ({ caller }) func getAllWithdrawalRequests() : async [WithdrawalRequest] {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can view withdrawal requests");
    };
    withdrawalRequests.values().toArray();
  };
};
