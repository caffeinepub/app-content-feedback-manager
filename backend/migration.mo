import List "mo:core/List";
import Map "mo:core/Map";
import Nat "mo:core/Nat";

module {
  type CommentStatus = {
    #available;
    #used;
  };

  type Comment = {
    id : Nat;
    text : Text;
    status : CommentStatus;
  };

  type OldActor = {
    globalComments : List.List<Text>;
    globalCommentInventory : Nat;
  };

  type NewActor = {
    comments : Map.Map<Nat, Comment>;
    nextCommentId : Nat;
    globalCommentInventory : Nat;
  };

  public func run(old : OldActor) : NewActor {
    let comments = Map.empty<Nat, Comment>();
    var nextCommentId = 0;

    for (comment in old.globalComments.values()) {
      let newComment : Comment = {
        id = nextCommentId;
        text = comment;
        status = #available;
      };
      comments.add(nextCommentId, newComment);
      nextCommentId += 1;
    };

    {
      comments;
      nextCommentId;
      globalCommentInventory = old.globalCommentInventory;
    };
  };
};
