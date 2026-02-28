import Storage "blob-storage/Storage";
import List "mo:core/List";
import Map "mo:core/Map";
import Set "mo:core/Set";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Array "mo:core/Array";
import Order "mo:core/Order";
import Iter "mo:core/Iter";
import Float "mo:core/Float";
import Int "mo:core/Int";
import MixinStorage "blob-storage/Mixin";
import Migration "migration";

(with migration = Migration.run)
actor {
  include MixinStorage();

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

  let commentLists = Map.empty<Text, CommentList>();
  let appsEvents = Map.empty<Text, AppEvent>();
  let chatMessages = List.empty<ChatMessage>();
  let images = Map.empty<Nat, ImageMeta>();
  let usedTemplateIndices = Map.empty<Text, Set.Set<Nat>>();

  var nextImageId = 1;
  var nextMessageId = 1;
  var settings : Settings = {
    bgMusicEnabled = false;
    musicFile = null;
    accessKey = null;
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

  public shared ({ caller }) func addCommentList(id : Text, displayName : Text, suffix : Text) : async Bool {
    let list : CommentList = {
      id;
      displayName;
      templates = [];
      locked = false;
      suffix;
    };
    commentLists.add(id, list);
    true;
  };

  public shared ({ caller }) func addTemplatesToList(listId : Text, templates : [Text]) : async Bool {
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

  public shared ({ caller }) func addAppEvent(name : Text) : async Bool {
    let app : AppEvent = {
      name;
      usernames = [];
    };
    appsEvents.add(name, app);
    true;
  };

  public shared ({ caller }) func addUsernamesToAppEvent(name : Text, usernames : [Text]) : async Bool {
    switch (appsEvents.get(name)) {
      case (null) { false };
      case (?app) {
        let newApp : AppEvent = {
          name = app.name;
          usernames = app.usernames.concat(usernames);
        };
        appsEvents.add(name, newApp);
        true;
      };
    };
  };

  public shared ({ caller }) func addChatMessage(text : Text) : async () {
    let message : ChatMessage = {
      id = nextMessageId;
      text;
      timestamp = Time.now();
    };
    chatMessages.add(message);
    nextMessageId += 1;
  };

  public shared ({ caller }) func addImage(name : Text, tags : [Text], dataUrl : Text, data : ?Storage.ExternalBlob) : async () {
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
    settings := {
      bgMusicEnabled;
      musicFile;
      accessKey = settings.accessKey;
    };
  };

  public shared ({ caller }) func setAccessKey(key : Text) : async () {
    settings := {
      settings with accessKey = ?key;
    };
  };

  public query ({ caller }) func getAccessKey() : async ?Text {
    settings.accessKey;
  };

  public shared ({ caller }) func renameAppEvent(id : Text, newName : Text) : async Bool {
    switch (appsEvents.get(id)) {
      case (null) { false };
      case (?app) {
        let newApp : AppEvent = {
          name = newName;
          usernames = app.usernames;
        };
        appsEvents.remove(id);
        appsEvents.add(newName, newApp);
        true;
      };
    };
  };

  public shared ({ caller }) func deleteAppEvent(id : Text) : async Bool {
    switch (appsEvents.get(id)) {
      case (null) { false };
      case (_) {
        appsEvents.remove(id);
        true;
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
          list.templates.size() - usedCount;
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
            totalTemplates - usedCount;
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

  public shared ({ caller }) func generateBulkComments(listId : Text, count : Nat) : async BulkCommentsResult {
    Runtime.trap("Function not implemented yet. This will take place in the next generated iteration.");
  };

  public shared ({ caller }) func exportAllData() : async ExportData {
    {
      commentLists = commentLists.values().toArray();
      appsEvents = appsEvents.values().toArray();
      chatMessages = chatMessages.toArray();
      images = images.values().toArray();
      settings;
    };
  };
};
