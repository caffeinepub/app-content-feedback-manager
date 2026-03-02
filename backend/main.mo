import Map "mo:core/Map";
import List "mo:core/List";
import Array "mo:core/Array";
import Set "mo:core/Set";
import Float "mo:core/Float";
import Int "mo:core/Int";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Order "mo:core/Order";
import Iter "mo:core/Iter";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import Nat "mo:core/Nat";
import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  include MixinStorage();

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  func hasUserOrAdminPermission(caller : Principal) : Bool {
    AccessControl.hasPermission(accessControlState, caller, #user) or AccessControl.isAdmin(accessControlState, caller);
  };

  type UserProfile = {
    name : Text;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not hasUserOrAdminPermission(caller)) {
      Runtime.trap("Unauthorized: Only users or admins can get their profile");
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
    if (not hasUserOrAdminPermission(caller)) {
      Runtime.trap("Unauthorized: Only users or admins can save profiles");
    };
    userProfiles.add(caller, profile);
  };

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

  let commentLists = Map.empty<Text, CommentList>();
  let commentListsOrder = List.empty<Text>();
  let appsEvents = Map.empty<Text, AppEventWithImportDate>();
  let chatMessages = List.empty<ChatMessage>();
  let images = Map.empty<Nat, ImageMeta>();
  let usedTemplateIndices = Map.empty<Text, Set.Set<Nat>>();
  let priceList = Map.empty<Text, { pricePerEntry : Float; isActive : Bool }>();

  var nextImageId = 1;
  var nextMessageId = 1;
  var settings : Settings = {
    bgMusicEnabled = false;
    musicFile = null;
    accessKey = null;
  };

  var priceListInitialized = false;

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

  public shared ({ caller }) func importLiveList(imports : [AppImport]) : async ImportSummary {
    if (not hasUserOrAdminPermission(caller)) {
      Runtime.trap("Unauthorized: Only users or admins can import live lists");
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

  public shared ({ caller }) func deleteCommentList(listId : Text) : async Bool {
    if (not hasUserOrAdminPermission(caller)) {
      Runtime.trap("Unauthorized: Only users or admins can delete comment lists");
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

  public shared ({ caller }) func addCommentList(id : Text, displayName : Text, suffix : Text) : async Bool {
    if (not hasUserOrAdminPermission(caller)) {
      Runtime.trap("Unauthorized: Only users or admins can add comment lists");
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

  public shared ({ caller }) func renameCommentList(oldId : Text, newId : Text, newDisplayName : Text) : async Bool {
    if (not hasUserOrAdminPermission(caller)) {
      Runtime.trap("Unauthorized: Only users or admins can rename comment lists");
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

  public shared ({ caller }) func addTemplatesToList(listId : Text, templates : [Text]) : async Bool {
    if (not hasUserOrAdminPermission(caller)) {
      Runtime.trap("Unauthorized: Only users or admins can add templates");
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

  public shared ({ caller }) func toggleListLock(listId : Text) : async Bool {
    if (not hasUserOrAdminPermission(caller)) {
      Runtime.trap("Unauthorized: Only users or admins can toggle list lock");
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

  public shared ({ caller }) func deleteAppEvent(name : Text) : async Bool {
    if (not hasUserOrAdminPermission(caller)) {
      Runtime.trap("Unauthorized: Only users or admins can delete app events");
    };
    switch (appsEvents.get(name)) {
      case (null) { false };
      case (_) {
        appsEvents.remove(name);
        true;
      };
    };
  };

  public shared ({ caller }) func renameAppEvent(oldName : Text, newName : Text) : async Bool {
    if (not hasUserOrAdminPermission(caller)) {
      Runtime.trap("Unauthorized: Only users or admins can rename app events");
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

  public shared ({ caller }) func addAppEvent(name : Text) : async Bool {
    if (not hasUserOrAdminPermission(caller)) {
      Runtime.trap("Unauthorized: Only users or admins can add app events");
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

  public shared ({ caller }) func addUsernamesToAppEvent(name : Text, usernames : [Text]) : async Bool {
    if (not hasUserOrAdminPermission(caller)) {
      Runtime.trap("Unauthorized: Only users or admins can add usernames to app events");
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

  public shared ({ caller }) func addChatMessage(text : Text) : async () {
    if (not hasUserOrAdminPermission(caller)) {
      Runtime.trap("Unauthorized: Only users or admins can add chat messages");
    };
    let message : ChatMessage = {
      id = nextMessageId;
      text;
      timestamp = Time.now();
    };
    chatMessages.add(message);
    nextMessageId += 1;
  };

  public shared ({ caller }) func addImage(name : Text, tags : [Text], dataUrl : Text, data : ?Storage.ExternalBlob) : async () {
    if (not hasUserOrAdminPermission(caller)) {
      Runtime.trap("Unauthorized: Only users or admins can add images");
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

  public shared ({ caller }) func setAccessKey(key : Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can set the access key");
    };
    settings := {
      settings with accessKey = ?key;
    };
  };

  public query ({ caller }) func getAccessKey() : async ?Text {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can retrieve the access key");
    };
    settings.accessKey;
  };

  public shared ({ caller }) func claimComment(listId : Text) : async ClaimCommentResult {
    // Open to any caller (no auth check required)
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
          let size = Int.abs(list.templates.size() - usedCount);
          assert (size >= 0);
          size;
        } else {
          list.templates.size();
        };
      };
    };
  };

  public query ({ caller }) func getListMetrics() : async [ListMetrics] {
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
            Int.abs(totalTemplates - usedCount);
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

  public shared ({ caller }) func generateBulkComments(_ : Text, _ : Nat) : async BulkCommentsResult {
    if (not hasUserOrAdminPermission(caller)) {
      Runtime.trap("Unauthorized: Only users or admins can generate bulk comments");
    };
    Runtime.trap("Function not implemented yet. This will take place in the next generated iteration.");
  };

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

  public query ({ caller }) func getCommentListsOrder() : async [Text] {
    commentListsOrder.toArray();
  };

  type PriceEntry = {
    appName : Text;
    pricePerEntry : Float;
    isActive : Bool;
  };

  public shared ({ caller }) func setPriceEntry(appName : Text, pricePerEntry : Float, isActive : Bool) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can set price entries");
    };
    priceList.add(appName, { pricePerEntry; isActive });
  };

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

  public shared ({ caller }) func deletePriceEntry(appName : Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can delete price entries");
    };
    priceList.remove(appName);
  };

  public shared ({ caller }) func bulkSetPrices(entries : [(Text, Float, Bool)]) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can bulk set prices");
    };
    for ((appName, pricePerEntry, isActive) in entries.values()) {
      priceList.add(appName, { pricePerEntry; isActive });
    };
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

  //
  // Earnings and Payout Backend
  //
  public type Earning = {
    username : Text;
    totalAmount : Nat;
    walletPhone : ?Text;
  };

  public type PayoutRequest = {
    username : Text;
    totalAmount : Nat;
    walletPhone : Text;
    status : {
      #pending;
      #approved;
    };
    timestamp : Int;
  };

  var earningsStore : Map.Map<Text, Earning> = Map.empty<Text, Earning>();
  var payoutStore : Map.Map<Text, List.List<PayoutRequest>> = Map.empty<Text, List.List<PayoutRequest>>();

  public shared ({ caller }) func addOrUpdateEarning(username : Text, totalAmount : Nat) : async () {
    if (not hasUserOrAdminPermission(caller)) {
      Runtime.trap("Unauthorized: Only users or admins can add or update earnings");
    };
    let existing : Earning = {
      username;
      totalAmount;
      walletPhone = switch (earningsStore.get(username)) {
        case (?e) { e.walletPhone };
        case (null) { null };
      };
    };
    earningsStore.add(username, existing);
  };

  public shared ({ caller }) func setWalletPhone(username : Text, phone : Text) : async () {
    if (not hasUserOrAdminPermission(caller)) {
      Runtime.trap("Unauthorized: Only users or admins can set wallet phone");
    };
    switch (earningsStore.get(username)) {
      case (null) {};
      case (?earning) {
        let updated : Earning = {
          earning with walletPhone = ?phone;
        };
        earningsStore.add(username, updated);
      };
    };
  };

  public query ({ caller }) func getEarning(username : Text) : async ?Earning {
    earningsStore.get(username);
  };

  public shared ({ caller }) func submitPayoutRequest(username : Text, totalAmount : Nat, walletPhone : Text) : async () {
    if (not hasUserOrAdminPermission(caller)) {
      Runtime.trap("Unauthorized: Only users or admins can submit payout requests");
    };
    let request : PayoutRequest = {
      username;
      totalAmount;
      walletPhone;
      status = #pending;
      timestamp = Time.now();
    };

    switch (payoutStore.get(username)) {
      case (null) {
        let newList = List.empty<PayoutRequest>();
        newList.add(request);
        payoutStore.add(username, newList);
      };
      case (?existingList) {
        existingList.add(request);
      };
    };
  };

  public shared ({ caller }) func approvePayoutRequest(username : Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can approve payout requests");
    };
    switch (payoutStore.get(username)) {
      case (null) {};
      case (?requests) {
        let updated = requests.map<PayoutRequest, PayoutRequest>(
          func(req) {
            if (req.status == #pending) {
              {
                req with status = #approved;
              };
            } else {
              req;
            };
          }
        );
        payoutStore.add(username, updated);
      };
    };
  };

  public query ({ caller }) func getAllPayoutRequests() : async [PayoutRequest] {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can view all payout requests");
    };
    let allRequests = List.empty<PayoutRequest>();
    for ((_, requests) in payoutStore.entries()) {
      for (req in requests.values()) {
        if (req.status == #pending) {
          allRequests.add({
            req with status = #pending;
          });
        } else {
          allRequests.add({
            req with status = #approved;
          });
        };
      };
    };
    allRequests.toArray();
  };

  public shared ({ caller }) func bulkDeleteCommentLists() : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can bulk delete comment lists");
    };
    commentLists.clear();
    commentListsOrder.clear();
  };

  public shared ({ caller }) func bulkDeleteLiveLists() : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can bulk delete live lists");
    };
    appsEvents.clear();
  };

  public query ({ caller }) func getAllEarnings() : async [Earning] {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can view all earnings");
    };
    earningsStore.values().toArray();
  };

  public shared ({ caller }) func deleteEarningsRecords() : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can delete earnings records");
    };
    earningsStore := Map.empty<Text, Earning>();
  };

  public shared ({ caller }) func deleteAllPayoutRequests() : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can delete all payout requests");
    };
    payoutStore := Map.empty<Text, List.List<PayoutRequest>>();
  };
};
