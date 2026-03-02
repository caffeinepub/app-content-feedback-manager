import Map "mo:core/Map";
import List "mo:core/List";
import Set "mo:core/Set";
import Time "mo:core/Time";
import Storage "blob-storage/Storage";

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

  type CountdownState = {
    targetTime : ?Time.Time;
    isActive : Bool;
    startedBy : ?Principal;
  };

  type OldActor = {
    commentLists : Map.Map<Text, CommentList>;
    commentListsOrder : List.List<Text>;
    appsEvents : Map.Map<Text, { appEvent : AppEvent; importDate : ?Text }>;
    chatMessages : List.List<ChatMessage>;
    images : Map.Map<Nat, ImageMeta>;
    usedTemplateIndices : Map.Map<Text, Set.Set<Nat>>;
    priceList : Map.Map<Text, { pricePerEntry : Float; isActive : Bool }>;
    inventoryCounter : Map.Map<Text, Nat>;
    withdrawalRequests : Map.Map<Text, WithdrawalRequest>;
    nextImageId : Nat;
    nextMessageId : Nat;
    settings : Settings;
    priceListInitialized : Bool;
  };

  type NewActor = {
    commentLists : Map.Map<Text, CommentList>;
    commentListsOrder : List.List<Text>;
    appsEvents : Map.Map<Text, { appEvent : AppEvent; importDate : ?Text }>;
    chatMessages : List.List<ChatMessage>;
    images : Map.Map<Nat, ImageMeta>;
    usedTemplateIndices : Map.Map<Text, Set.Set<Nat>>;
    priceList : Map.Map<Text, { pricePerEntry : Float; isActive : Bool }>;
    inventoryCounter : Map.Map<Text, Nat>;
    withdrawalRequests : Map.Map<Text, WithdrawalRequest>;
    nextImageId : Nat;
    nextMessageId : Nat;
    settings : Settings;
    priceListInitialized : Bool;
    countdownState : CountdownState;
  };

  public func run(old : OldActor) : NewActor {
    {
      old with
      countdownState = {
        targetTime = null;
        isActive = false;
        startedBy = null;
      };
    };
  };
};
