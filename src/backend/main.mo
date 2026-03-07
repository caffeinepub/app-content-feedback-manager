import Set "mo:core/Set";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import Time "mo:core/Time";
import List "mo:core/List";
import Map "mo:core/Map";
import Float "mo:core/Float";
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

  var nextCommentId = 0;
  let comments = Map.empty<Nat, Comment>();
  var globalCommentInventory = 0;
  let globalComments = List.empty<Text>();

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

  type BulkGlobalCommentsResult = {
    comments : [Text];
    fulfilled : Nat;
    requested : Nat;
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

  type GlobalCommentPoolStats = {
    totalTemplates : Nat;
    templatesRemaining : Nat;
    totalClaimed : Nat;
    batchSupport : Bool;
  };

  type GlobalClaimCommentResult = {
    #noCommentsRemaining;
    #claimSuccess : Text;
  };

  type CommentsDispensed = {
    batchRequested : Nat;
    batchFulfilled : Nat;
    comments : [Text];
  };

  type Comment = {
    id : Nat;
    text : Text;
    status : CommentStatus;
  };

  type CommentStatus = {
    #available;
    #used;
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

  // ── Comment list read functions ───────────────────────────────────────────

  public query func getAllCommentLists() : async [CommentList] {
    commentLists.values().toArray();
  };

  public query func getCommentList(id : Text) : async ?CommentList {
    commentLists.get(id);
  };

  public query func getAvailableCount(listId : Text) : async Nat {
    switch (commentLists.get(listId)) {
      case (null) { 0 };
      case (?_) {
        let usedSet = switch (usedTemplateIndices.get(listId)) {
          case (null) { Set.empty<Nat>() };
          case (?s) { s };
        };
        let usedCount = usedSet.size();
        let total = switch (commentLists.get(listId)) {
          case (?list) { list.templates.size() };
          case (null) { 0 };
        };
        if (total > usedCount) {
          safeNatSubtract(total, usedCount);
        } else {
          total;
        };
      };
    };
  };

  public shared ({ caller }) func consumeFromList(listId : Text, count : Nat) : async {
    #ok : [Text];
    #err : Text;
  } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      return #err("Unauthorized: Only users can consume from lists");
    };

    switch (commentLists.get(listId)) {
      case (null) {
        return #err("Comment list not found");
      };
      case (?list) {
        if (list.locked) {
          return #err("This list is currently locked");
        };

        let usedSet = switch (usedTemplateIndices.get(listId)) {
          case (null) { Set.empty<Nat>() };
          case (?s) { s };
        };

        let usedCount = usedSet.size();
        let total = list.templates.size();
        let available = if (total > usedCount) {
          safeNatSubtract(total, usedCount);
        } else {
          total;
        };

        if (available == 0) {
          return #err("No templates left. Please try later.");
        };

        if (count > available) {
          return #err(
            "Only " #
            available.toText() #
            " templates left. Please reduce quantity."
          );
        };

        let pickedTexts = List.empty<Text>();
        var i = 0;
        var pickedCount = 0;
        while (i < total and pickedCount < count) {
          if (not usedSet.contains(i)) {
            let templateWithSuffix = list.templates[i] # (if (list.suffix != "") { " " # list.suffix } else { "" });
            pickedTexts.add(templateWithSuffix);
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

  // ── Comment list write functions (admin-only) ─────────────────────────────

  public shared ({ caller }) func createCommentList(id : Text, displayName : Text, suffix : Text) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can create comment lists");
    };
    let newList : CommentList = {
      id;
      displayName;
      templates = [];
      locked = false;
      suffix;
    };
    commentLists.add(id, newList);
    commentListsOrder.add(id);
  };

  public shared ({ caller }) func addTemplatesToCommentList(id : Text, newTemplates : [Text]) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can add templates to comment lists");
    };
    switch (commentLists.get(id)) {
      case (null) { Runtime.trap("Comment list not found") };
      case (?existing) {
        if (existing.locked) {
          Runtime.trap("Comment list is locked");
        };
        let combined = existing.templates.concat(newTemplates);
        let updated : CommentList = {
          id = existing.id;
          displayName = existing.displayName;
          templates = combined;
          locked = existing.locked;
          suffix = existing.suffix;
        };
        commentLists.add(id, updated);
      };
    };
  };

  public shared ({ caller }) func setCommentListTemplates(id : Text, templates : [Text]) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can set templates on comment lists");
    };
    switch (commentLists.get(id)) {
      case (null) { Runtime.trap("Comment list not found") };
      case (?existing) {
        let updated : CommentList = {
          id = existing.id;
          displayName = existing.displayName;
          templates;
          locked = existing.locked;
          suffix = existing.suffix;
        };
        commentLists.add(id, updated);
      };
    };
  };

  public shared ({ caller }) func setInventoryCount(listId : Text, count : Nat) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can set inventory counts");
    };
    inventoryCounter.add(listId, count);
  };

  public shared ({ caller }) func renameCommentList(id : Text, newDisplayName : Text) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can rename comment lists");
    };
    switch (commentLists.get(id)) {
      case (null) { Runtime.trap("Comment list not found") };
      case (?existing) {
        let updated : CommentList = {
          id = existing.id;
          displayName = newDisplayName;
          templates = existing.templates;
          locked = existing.locked;
          suffix = existing.suffix;
        };
        commentLists.add(id, updated);
      };
    };
  };

  public shared ({ caller }) func deleteCommentList(id : Text) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can delete comment lists");
    };
    commentLists.remove(id);
    inventoryCounter.remove(id);
    usedTemplateIndices.remove(id);
  };

  public shared ({ caller }) func lockCommentList(id : Text) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can lock comment lists");
    };
    switch (commentLists.get(id)) {
      case (null) { Runtime.trap("Comment list not found") };
      case (?existing) {
        let updated : CommentList = {
          id = existing.id;
          displayName = existing.displayName;
          templates = existing.templates;
          locked = true;
          suffix = existing.suffix;
        };
        commentLists.add(id, updated);
      };
    };
  };

  public shared ({ caller }) func unlockCommentList(id : Text) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can unlock comment lists");
    };
    switch (commentLists.get(id)) {
      case (null) { Runtime.trap("Comment list not found") };
      case (?existing) {
        let updated : CommentList = {
          id = existing.id;
          displayName = existing.displayName;
          templates = existing.templates;
          locked = false;
          suffix = existing.suffix;
        };
        commentLists.add(id, updated);
      };
    };
  };

  public shared ({ caller }) func resetUsedTemplates(listId : Text) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can reset used templates");
    };
    usedTemplateIndices.remove(listId);
  };

  // ── Comment claiming (user-level) ─────────────────────────────────────────

  public shared ({ caller }) func claimComment(listId : Text, username : Text) : async ClaimCommentResult {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can claim comments");
    };
    switch (commentLists.get(listId)) {
      case (null) { Runtime.trap("Comment list not found") };
      case (?list) {
        if (list.locked) {
          return #noCommentsRemaining;
        };
        let totalTemplates = list.templates.size();
        if (totalTemplates == 0) {
          return #noCommentsRemaining;
        };
        let usedSet = switch (usedTemplateIndices.get(listId)) {
          case (null) { Set.empty<Nat>() };
          case (?s) { s };
        };
        // Find first unused template index
        var foundIndex : ?Nat = null;
        var i = 0;
        while (i < totalTemplates and foundIndex == null) {
          if (not usedSet.contains(i)) {
            foundIndex := ?i;
          };
          i += 1;
        };
        switch (foundIndex) {
          case (null) { #noCommentsRemaining };
          case (?idx) {
            let template = list.templates[idx];
            let comment = template # " " # username # list.suffix;
            usedSet.add(idx);
            usedTemplateIndices.add(listId, usedSet);
            // Decrement inventory if tracked
            switch (inventoryCounter.get(listId)) {
              case (?count) {
                if (count > 0) {
                  inventoryCounter.add(listId, safeNatSubtract(count, 1));
                };
              };
              case (null) {};
            };
            #claimSuccess(comment);
          };
        };
      };
    };
  };

  public shared ({ caller }) func getBulkComments(listId : Text, count : Nat) : async BulkCommentsResult {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can get bulk comments");
    };
    switch (commentLists.get(listId)) {
      case (null) { Runtime.trap("Comment list not found") };
      case (?list) {
        let totalTemplates = list.templates.size();
        let usedSet = switch (usedTemplateIndices.get(listId)) {
          case (null) { Set.empty<Nat>() };
          case (?s) { s };
        };
        var comments : List.List<Text> = List.empty();
        var generated = 0;
        var i = 0;
        while (i < totalTemplates and generated < count) {
          if (not usedSet.contains(i)) {
            comments.add(list.templates[i]);
            usedSet.add(i);
            generated += 1;
          };
          i += 1;
        };
        usedTemplateIndices.add(listId, usedSet);
        {
          commentListId = listId;
          comments = comments.toArray();
          generatedCount = generated;
          templateCount = totalTemplates;
        };
      };
    };
  };

  // ── Global comments ───────────────────────────────────────────────────────
  public type SingleGlobalCommentResult = {
    #ok : Text;
    #err : Text;
  };

  public shared ({ caller }) func generateSingle() : async SingleGlobalCommentResult {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      return #err("Not authorized");
    };

    let availableComments = comments.values().filter(
      func(comment) { comment.status == #available }
    ).toArray();

    if (availableComments.isEmpty()) {
      #err("Pool is empty");
    } else {
      let firstAvailable = availableComments[0];
      let updatedComment = {
        id = firstAvailable.id;
        text = firstAvailable.text;
        status = #used;
      };
      comments.add(firstAvailable.id, updatedComment);
      #ok(firstAvailable.text);
    };
  };

  public shared ({ caller }) func generateBulk(n : Nat) : async {
    #ok : [Text];
    #err : Text;
  } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      return #err("Not authorized");
    };

    let availableComments = comments.values().filter(
      func(comment) { comment.status == #available }
    ).toArray();

    if (availableComments.size() < n) {
      return #err("Only " # availableComments.size().toText() # " comments left. Reduce quantity.");
    };

    var texts = List.empty<Text>();
    var count = 0;

    for (comment in availableComments.vals()) {
      if (count < n) {
        texts.add(comment.text);
        let updatedComment = {
          id = comment.id;
          text = comment.text;
          status = #used;
        };
        comments.add(comment.id, updatedComment);
        count += 1;
      };
    };

    #ok(texts.toArray());
  };

  public query func getPoolStats() : async {
    totalPoolSize : Nat;
    availableCount : Nat;
  } {
    let availableCount = comments.values().foldLeft(
      0,
      func(acc, comment) {
        switch (comment.status) {
          case (#available) { acc + 1 };
          case (#used) { acc };
        };
      },
    );
    {
      totalPoolSize = comments.size();
      availableCount;
    };
  };

  public shared ({ caller }) func addGlobalComment(comment : Text) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can add global comments");
    };

    let newComment = {
      id = nextCommentId;
      text = comment;
      status = #available;
    };
    comments.add(nextCommentId, newComment);
    nextCommentId += 1;
  };

  public shared ({ caller }) func addGlobalComments(newComments : [Text]) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can add global comments");
    };

    for (comment in newComments.vals()) {
      let newComment = {
        id = nextCommentId;
        text = comment;
        status = #available;
      };
      comments.add(nextCommentId, newComment);
      nextCommentId += 1;
    };
  };

  // ── Legacy Functions (for backward compatibility) ─────────────────────────

  public shared ({ caller }) func getBulkGlobalComments(count : Nat) : async {
    batchRequested : Nat;
    batchFulfilled : Nat;
    comments : [Text];
  } {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can get bulk global comments");
    };

    let result = List.empty<Text>();
    var countFulfilled = 0;
    var limit = count;
    while (limit > 0 and globalComments.size() > 0) {
      if (limit > 0) {
        switch (globalComments.removeLast()) {
          case (null) { limit := 0 };
          case (?comment) {
            result.add(comment);
            countFulfilled += 1;
            limit := safeNatSubtract(limit, 1);
          };
        };
      };
    };
    globalCommentInventory := safeNatSubtract(
      globalCommentInventory,
      countFulfilled,
    );

    {
      batchRequested = count;
      batchFulfilled = countFulfilled;
      comments = result.toArray();
    };
  };

  public query func getGlobalCommentPoolStats() : async GlobalCommentPoolStats {
    {
      totalTemplates = globalComments.size();
      templatesRemaining = globalCommentInventory;
      totalClaimed = safeNatSubtract(globalComments.size(), globalCommentInventory);
      batchSupport = globalComments.size() > 1;
    };
  };

  // ── App event read functions ──────────────────────────────────────────────

  public query func getAllAppEvents() : async [AppEvent] {
    appsEvents.values().toArray().map(func(ev) { ev.appEvent });
  };

  public query func getAppEvent(name : Text) : async ?AppEvent {
    switch (appsEvents.get(name)) {
      case (?ev) { ?ev.appEvent };
      case (null) { null };
    };
  };

  public query func getAllAppEventsWithImportDate() : async [AppEventWithImportDate] {
    appsEvents.values().toArray();
  };

  // ── App event write functions (admin-only) ────────────────────────────────

  public shared ({ caller }) func createAppEvent(name : Text) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can create app events");
    };
    let newEvent : AppEventWithImportDate = {
      appEvent = { name; usernames = [] };
      importDate = null;
    };
    appsEvents.add(name, newEvent);
  };

  public shared ({ caller }) func addUsernamesToAppEvent(name : Text, newUsernames : [Text]) : async Nat {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can add usernames to app events");
    };
    switch (appsEvents.get(name)) {
      case (null) { Runtime.trap("App event not found") };
      case (?existing) {
        let existingSet = Set.fromArray(existing.appEvent.usernames, );
        var added = 0;
        let combined = List.empty<Text>();
        for (u in existing.appEvent.usernames.vals()) {
          combined.add(u);
        };
        for (u in newUsernames.vals()) {
          if (not existingSet.contains(u)) {
            combined.add(u);
            existingSet.add(u);
            added += 1;
          };
        };
        let updated : AppEventWithImportDate = {
          appEvent = { name; usernames = combined.toArray() };
          importDate = existing.importDate;
        };
        appsEvents.add(name, updated);
        added;
      };
    };
  };

  public shared ({ caller }) func deleteAppEvent(name : Text) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can delete app events");
    };
    appsEvents.remove(name);
  };

  public shared ({ caller }) func importLiveLists(imports : [AppImport]) : async ImportSummary {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can import live lists");
    };
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
      for (u in existing.appEvent.usernames.vals()) {
        combined.add(u);
      };
      for (u in appImport.usernames.vals()) {
        if (not existingSet.contains(u)) {
          combined.add(u);
          existingSet.add(u);
          totalUsernamesAdded += 1;
        } else {
          totalDuplicatesSkipped += 1;
        };
      };
      let updated : AppEventWithImportDate = {
        appEvent = { name = appImport.appName; usernames = combined.toArray() };
        importDate = appImport.importDate;
      };
      appsEvents.add(appImport.appName, updated);
    };

    {
      totalAppsDetected;
      totalUsernamesAdded;
      totalDuplicatesSkipped;
    };
  };

  // ── Chat message read functions ───────────────────────────────────────────

  public query func getAllChatMessages() : async [ChatMessage] {
    chatMessages.toArray();
  };

  public query func getChatMessage(id : Nat) : async ?ChatMessage {
    chatMessages.toArray().find(func(msg) { msg.id == id });
  };

  // ── Chat message write functions (user-level) ─────────────────────────────

  public shared ({ caller }) func addChatMessage(text : Text) : async ChatMessage {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add chat messages");
    };
    let msg : ChatMessage = {
      id = nextMessageId;
      text;
      timestamp = Time.now();
    };
    nextMessageId += 1;
    chatMessages.add(msg);
    msg;
  };

  public shared ({ caller }) func deleteChatMessage(id : Nat) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can delete chat messages");
    };
    // Filter out the message with the given id
    let remaining = chatMessages.toArray().filter(func(msg) { msg.id != id });
    // Clear and re-add
    chatMessages.clear();
    for (msg in remaining.vals()) {
      chatMessages.add(msg);
    };
  };

  // ── Image read functions ─────────────────────────────────────────────────-

  public query func getAllImages() : async [ImageMeta] {
    images.values().toArray();
  };

  public query func getImage(id : Nat) : async ?ImageMeta {
    images.get(id);
  };

  // ── Image write functions (admin-only) ─────────────────────────────────---

  public shared ({ caller }) func uploadImage(name : Text, tags : [Text], dataUrl : Text) : async ImageMeta {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can upload images");
    };
    let id = nextImageId;
    nextImageId += 1;
    let img : ImageMeta = {
      id;
      name;
      tags;
      dataUrl;
      data = null;
    };
    images.add(id, img);
    img;
  };

  public shared ({ caller }) func updateImageTags(id : Nat, tags : [Text]) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can update image tags");
    };
    switch (images.get(id)) {
      case (null) { Runtime.trap("Image not found") };
      case (?existing) {
        let updated : ImageMeta = {
          id = existing.id;
          name = existing.name;
          tags;
          dataUrl = existing.dataUrl;
          data = existing.data;
        };
        images.add(id, updated);
      };
    };
  };

  public shared ({ caller }) func deleteImage(id : Nat) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can delete images");
    };
    images.remove(id);
  };

  // ── Settings read functions ───────────────────────────────────────────────

  public query func getPublicSettings() : async PublicSettings {
    {
      bgMusicEnabled = settings.bgMusicEnabled;
      musicFile = settings.musicFile;
    };
  };

  public query ({ caller }) func getSettings() : async Settings {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can access full settings");
    };
    settings;
  };

  // ── Settings write functions (admin-only) ─────────────────────────────────

  public shared ({ caller }) func setAccessKey(key : Text) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can set the access key");
    };
    settings := {
      bgMusicEnabled = settings.bgMusicEnabled;
      musicFile = settings.musicFile;
      accessKey = ?key;
    };
  };

  public shared ({ caller }) func regenerateAccessKey() : async Text {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can regenerate the access key");
    };
    // Generate a pseudo-random key based on current time
    let now = Time.now();
    let key = "ak-" # now.toText();
    settings := {
      bgMusicEnabled = settings.bgMusicEnabled;
      musicFile = settings.musicFile;
      accessKey = ?key;
    };
    key;
  };

  public shared ({ caller }) func clearAccessKey() : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can clear the access key");
    };
    settings := {
      bgMusicEnabled = settings.bgMusicEnabled;
      musicFile = settings.musicFile;
      accessKey = null;
    };
  };

  public shared ({ caller }) func setBgMusicEnabled(enabled : Bool) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can change music settings");
    };
    settings := {
      bgMusicEnabled = enabled;
      musicFile = settings.musicFile;
      accessKey = settings.accessKey;
    };
  };

  public shared ({ caller }) func setMusicUrl(url : Text) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can set the music URL");
    };
    settings := {
      bgMusicEnabled = settings.bgMusicEnabled;
      musicFile = settings.musicFile;
      accessKey = settings.accessKey;
    };
    musicUrl := ?url;
  };

  var musicUrl : ?Text = null;

  public query func getMusicUrl() : async ?Text {
    musicUrl;
  };

  public shared ({ caller }) func updateSettings(bgMusicEnabled : Bool, newMusicUrl : ?Text) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can update settings");
    };
    settings := {
      bgMusicEnabled;
      musicFile = settings.musicFile;
      accessKey = settings.accessKey;
    };
    musicUrl := newMusicUrl;
  };

  // ── Access key validation (public) ───────────────────────────────────────

  public query func validateAccessKey(key : Text) : async Bool {
    switch (settings.accessKey) {
      case (null) { false };
      case (?storedKey) { storedKey == key };
    };
  };

  // ── Price list read functions ─────────────────────────────────────────────

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

  // ── Price list write functions (admin-only) ───────────────────────────────

  public shared ({ caller }) func addPriceEntry(appName : Text, pricePerEntry : Float, isActive : Bool) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can add price entries");
    };
    priceList.add(appName, { pricePerEntry; isActive });
  };

  public shared ({ caller }) func editPriceEntry(appName : Text, pricePerEntry : Float, isActive : Bool) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can edit price entries");
    };
    switch (priceList.get(appName)) {
      case (null) { Runtime.trap("Price entry not found") };
      case (?_) {
        priceList.add(appName, { pricePerEntry; isActive });
      };
    };
  };

  public shared ({ caller }) func deletePriceEntry(appName : Text) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can delete price entries");
    };
    priceList.remove(appName);
  };

  public shared ({ caller }) func bulkUploadPrices(entries : [PriceEntry]) : async Nat {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can bulk upload prices");
    };
    var count = 0;
    for (entry in entries.vals()) {
      priceList.add(entry.appName, { pricePerEntry = entry.pricePerEntry; isActive = entry.isActive });
      count += 1;
    };
    count;
  };

  public shared ({ caller }) func setPriceListInitialized(value : Bool) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can set price list initialization state");
    };
    priceListInitialized := value;
  };

  public query func isPriceListInitialized() : async Bool {
    priceListInitialized;
  };

  // ── Earnings calculation (admin-only) ─────────────────────────────────────

  public query ({ caller }) func getAllEarningsSummary() : async AllEarningsSummary {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view earnings summary");
    };
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
      let amount = switch (usernameCount) {
        case (0) { 0.0 };
        case (_) { usernameCount.toFloat() * priceEntry.pricePerEntry };
      };
      if (priceEntry.isActive) {
        totalValidEntries += usernameCount;
        totalEarnings += amount;
      };
      appEarningsList.add({
        appName;
        totalUsernamesFound = usernameCount;
        pricePerEntry = priceEntry.pricePerEntry;
        totalAmount = amount;
        isActive = priceEntry.isActive;
      });
    };

    {
      appEarnings = appEarningsList.toArray();
      totalAppsWithPrices;
      totalValidEntries;
      totalEarnings;
    };
  };

  // ── Inventory read functions ──────────────────────────────────────────────

  public query func getAllInventory() : async [(Text, Nat)] {
    inventoryCounter.toArray();
  };

  public query func getInventoryCount(listId : Text) : async Nat {
    switch (inventoryCounter.get(listId)) {
      case (?count) { count };
      case (null) { 0 };
    };
  };

  // ── Withdrawal request functions ──────────────────────────────────────────

  public query ({ caller }) func getAllWithdrawalRequests() : async [WithdrawalRequest] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view withdrawal requests");
    };
    withdrawalRequests.values().toArray();
  };

  public query ({ caller }) func getMyWithdrawalRequests(username : Text) : async [WithdrawalRequest] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view their withdrawal requests");
    };
    withdrawalRequests.values().toArray().filter(func(req) { req.username == username });
  };

  public shared ({ caller }) func submitWithdrawalRequest(username : Text, walletNumber : Text, amount : Float) : async WithdrawalRequest {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can submit withdrawal requests");
    };
    let key = username # "-" # Time.now().toText();
    let req : WithdrawalRequest = {
      username;
      walletNumber;
      amount;
      status = #pending;
      timestamp = Time.now();
    };
    withdrawalRequests.add(key, req);
    req;
  };

  public shared ({ caller }) func updateWithdrawalStatus(key : Text, status : WithdrawalStatus) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can update withdrawal request status");
    };
    switch (withdrawalRequests.get(key)) {
      case (null) { Runtime.trap("Withdrawal request not found") };
      case (?existing) {
        let updated : WithdrawalRequest = {
          username = existing.username;
          walletNumber = existing.walletNumber;
          amount = existing.amount;
          status;
          timestamp = existing.timestamp;
        };
        withdrawalRequests.add(key, updated);
      };
    };
  };

  public shared ({ caller }) func checkWithdrawalEligibility(username : Text) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can check withdrawal eligibility");
    };
    // Check if user has any pending requests
    let pending = withdrawalRequests.values().toArray().filter(
      func(req) { req.username == username and req.status == #pending }
    );
    pending.size() == 0;
  };

  // ── Metrics and utilities ─────────────────────────────────────────────────

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

  // ── Countdown timer functions ─────────────────────────────────────────────

  public query func getCountdownState() : async CountdownState {
    countdownState;
  };

  public shared ({ caller }) func setCountdown(targetTime : Time.Time) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can set the countdown");
    };
    countdownState := {
      targetTime = ?targetTime;
      isActive = true;
      startedBy = ?caller;
    };
  };

  public shared ({ caller }) func stopCountdown() : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can stop the countdown");
    };
    countdownState := {
      targetTime = countdownState.targetTime;
      isActive = false;
      startedBy = countdownState.startedBy;
    };
  };

  public shared ({ caller }) func clearCountdown() : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can clear the countdown");
    };
    countdownState := {
      targetTime = null;
      isActive = false;
      startedBy = null;
    };
  };
};
