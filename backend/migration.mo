import Map "mo:core/Map";
import List "mo:core/List";
import Set "mo:core/Set";
import Nat "mo:core/Nat";
import Array "mo:core/Array";
import Time "mo:core/Time";
import Text "mo:core/Text";
import Storage "blob-storage/Storage";

module {
  type OldCommentList = {
    id : Text;
    displayName : Text;
    templates : [Text];
    locked : Bool;
    suffix : Text;
  };

  type OldAppEvent = {
    name : Text;
    usernames : [Text];
  };

  type OldChatMessage = {
    id : Nat;
    text : Text;
    timestamp : Time.Time;
  };

  type OldImageMeta = {
    id : Nat;
    name : Text;
    tags : [Text];
    dataUrl : Text;
    data : ?Storage.ExternalBlob;
  };

  type OldSettings = {
    bgMusicEnabled : Bool;
    musicFile : ?Storage.ExternalBlob;
    accessKey : ?Text;
  };

  type OldActor = {
    commentLists : Map.Map<Text, OldCommentList>;
    appsEvents : Map.Map<Text, OldAppEvent>;
    chatMessages : List.List<OldChatMessage>;
    images : Map.Map<Nat, OldImageMeta>;
    settings : OldSettings;
    nextImageId : Nat;
    nextMessageId : Nat;
  };

  public func run(old : OldActor) : { // New actor type after migration
    commentLists : Map.Map<Text, OldCommentList>;
    appsEvents : Map.Map<Text, OldAppEvent>;
    chatMessages : List.List<OldChatMessage>;
    images : Map.Map<Nat, OldImageMeta>;
    usedTemplateIndices : Map.Map<Text, Set.Set<Nat>>; // Add new structure
    settings : OldSettings;
    nextImageId : Nat;
    nextMessageId : Nat;
  } {
    {
      old with
      usedTemplateIndices = Map.empty<Text, Set.Set<Nat>>();
    };
  };
};
