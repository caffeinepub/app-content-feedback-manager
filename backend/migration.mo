import Map "mo:core/Map";
import List "mo:core/List";
import Nat "mo:core/Nat";

module {
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
    timestamp : Int;
  };

  type ImageMeta = {
    id : Nat;
    name : Text;
    tags : [Text];
    dataUrl : Text;
    data : ?Blob;
  };

  type SettingsOld = {
    bgMusicEnabled : Bool;
    musicFile : ?Blob;
  };

  type SettingsNew = {
    bgMusicEnabled : Bool;
    musicFile : ?Blob;
    accessKey : ?Text;
  };

  type OldActor = {
    commentLists : Map.Map<Text, CommentList>;
    appsEvents : Map.Map<Text, AppEvent>;
    chatMessages : List.List<ChatMessage>;
    images : Map.Map<Nat, ImageMeta>;
    settings : SettingsOld;
    nextImageId : Nat;
    nextMessageId : Nat;
  };

  type NewActor = {
    commentLists : Map.Map<Text, CommentList>;
    appsEvents : Map.Map<Text, AppEvent>;
    chatMessages : List.List<ChatMessage>;
    images : Map.Map<Nat, ImageMeta>;
    settings : SettingsNew;
    nextImageId : Nat;
    nextMessageId : Nat;
  };

  public func run(old : OldActor) : NewActor {
    let newSettings : SettingsNew = {
      old.settings with
      accessKey = null
    };
    { old with settings = newSettings };
  };
};
