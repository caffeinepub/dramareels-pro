import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Time "mo:core/Time";
import Float "mo:core/Float";
import Text "mo:core/Text";
import Array "mo:core/Array";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Map "mo:core/Map";
import Iter "mo:core/Iter";
import List "mo:core/List";

actor {
  type Status = {
    #active;
    #draft;
    #archived;
  };

  type TransactionType = {
    #adReward;
    #dailyBonus;
    #purchase;
    #episodeUnlock;
    #vipPurchase;
  };

  type SubscriptionPlan = {
    #monthly;
    #yearly;
  };

  type SubscriptionStatus = {
    #active;
    #expired;
    #cancelled;
  };

  type TargetAudience = {
    #all;
    #vip;
    #free;
  };

  type UserEntry = (Text, { phone : Text; displayName : Text });

  module SupportedDramaIdArray {
    public func compare(array1 : [Text], array2 : [Text]) : Order.Order {
      var i = 0;
      while (i < array1.size() and i < array2.size()) {
        switch (Text.compare(array1[i], array2[i])) {
          case (#equal) { i += 1 };
          case (order) { return order };
        };
      };
      Nat.compare(array1.size(), array2.size());
    };
  };

  type User = {
    id : Nat;
    phone : Text;
    displayName : Text;
    avatar : Text;
    coins : Nat;
    isVIP : Bool;
    vipExpiry : ?Int;
    isBlocked : Bool;
    following : [Text];
    watchHistory : [Text];
    favorites : [Text];
    dailyRewardClaimed : Bool;
    createdAt : Int;
  };

  module User {
    public func compareByCoins(user1 : User, user2 : User) : Order.Order {
      Nat.compare(user1.coins, user2.coins);
    };
  };

  type Creator = {
    id : Text;
    name : Text;
    avatar : Text;
    bio : Text;
    followers : Nat;
    totalVideos : Nat;
    verified : Bool;
  };

  type Category = {
    id : Text;
    name : Text;
    icon : Text;
    color : Text;
    order : Nat;
    active : Bool;
  };

  type Drama = {
    id : Text;
    title : Text;
    description : Text;
    thumbnail : Text;
    categoryId : Text;
    creatorId : Text;
    tags : [Text];
    totalParts : Nat;
    views : Nat;
    likes : Nat;
    shares : Nat;
    isPremium : Bool;
    coinsRequired : Nat;
    status : Status;
    createdAt : Int;
    updatedAt : Int;
  };

  type Episode = {
    id : Text;
    dramaId : Text;
    partNumber : Nat;
    title : Text;
    videoUrl : Text;
    thumbnail : Text;
    duration : Nat;
    isPremium : Bool;
    coinsRequired : Nat;
    views : Nat;
    order : Nat;
    createdAt : Int;
  };

  type CoinTransaction = {
    id : Text;
    userId : Nat;
    amount : Int;
    transactionType : TransactionType;
    description : Text;
    createdAt : Int;
  };

  type Subscription = {
    id : Text;
    userId : Nat;
    plan : SubscriptionPlan;
    price : Float;
    startDate : Int;
    endDate : Int;
    status : SubscriptionStatus;
  };

  type AppConfig = {
    coinRewardPerAd : Nat;
    dailyBonusCoins : Nat;
    vipMonthlyPrice : Float;
    vipYearlyPrice : Float;
    maintenanceMode : Bool;
  };

  type Notification = {
    id : Text;
    title : Text;
    body : Text;
    imageUrl : Text;
    targetAudience : TargetAudience;
    sentAt : Int;
    sentBy : Text;
  };

  type AnalyticsDay = {
    date : Text;
    totalUsers : Nat;
    newUsers : Nat;
    activeUsers : Nat;
    totalViews : Nat;
    coinsDistributed : Nat;
    revenue : Float;
  };

  let users = Map.empty<Nat, User>();
  let creators = Map.empty<Text, Creator>();
  let categories = Map.empty<Text, Category>();
  let dramas = Map.empty<Text, Drama>();
  let episodes = Map.empty<Text, Episode>();
  let coinTransactions = Map.empty<Text, CoinTransaction>();
  let subscriptions = Map.empty<Text, Subscription>();
  let notifications = Map.empty<Text, Notification>();
  let analytics = Map.empty<Text, AnalyticsDay>();
  var appConfig : ?AppConfig = null;

  public shared ({ caller }) func createDrama(
    id : Text,
    title : Text,
    desc : Text,
    thumbnail : Text,
    categoryId : Text,
    creatorId : Text,
    tags : [Text],
    isPremium : Bool,
    coinsRequired : Nat,
  ) : async Drama {
    let drama : Drama = {
      id;
      title;
      description = desc;
      thumbnail;
      categoryId;
      creatorId;
      tags;
      totalParts = 0;
      views = 0;
      likes = 0;
      shares = 0;
      isPremium;
      coinsRequired;
      status = #active;
      createdAt = Time.now();
      updatedAt = Time.now();
    };
    dramas.add(id, drama);
    drama;
  };

  public shared ({ caller }) func updateDrama(id : Text, fields : Drama) : async ?Drama {
    dramas.add(id, fields);
    ?fields;
  };

  public shared ({ caller }) func deleteDrama(id : Text) : async Bool {
    let existed = dramas.containsKey(id);
    dramas.remove(id);
    existed;
  };

  public shared ({ caller }) func getDramas() : async [Drama] {
    dramas.values().toArray();
  };

  public shared ({ caller }) func getDrama(id : Text) : async ?Drama {
    dramas.get(id);
  };

  public shared ({ caller }) func setDramaStatus(id : Text, status : Status) : async Bool {
    switch (dramas.get(id)) {
      case (?drama) {
        let updatedDrama = { drama with status };
        dramas.add(id, updatedDrama);
        true;
      };
      case (null) {
        false;
      };
    };
  };

  public shared ({ caller }) func createEpisode(dramaId : Text, id : Text, partNumber : Nat, title : Text, videoUrl : Text, thumbnail : Text, duration : Nat, isPremium : Bool, coinsRequired : Nat) : async Episode {
    let episode : Episode = {
      id;
      dramaId;
      partNumber;
      title;
      videoUrl;
      thumbnail;
      duration;
      isPremium;
      coinsRequired;
      views = 0;
      order = partNumber;
      createdAt = Time.now();
    };
    episodes.add(id, episode);
    episode;
  };

  public shared ({ caller }) func updateEpisode(id : Text, fields : Episode) : async ?Episode {
    episodes.add(id, fields);
    ?fields;
  };

  public shared ({ caller }) func deleteEpisode(id : Text) : async Bool {
    let existed = episodes.containsKey(id);
    episodes.remove(id);
    existed;
  };

  public shared ({ caller }) func getEpisodesByDrama(dramaId : Text) : async [Episode] {
    let filtered = episodes.values().toArray().filter(
      func(e) { e.dramaId == dramaId }
    );
    filtered.sort(
      func(a, b) {
        if (a.partNumber < b.partNumber) { #less } else if (a.partNumber > b.partNumber) {
          #greater;
        } else { #equal };
      }
    );
  };

  public shared ({ caller }) func reorderEpisode(id : Text, newOrder : Nat) : async Bool {
    switch (episodes.get(id)) {
      case (?episode) {
        let updatedEpisode = { episode with order = newOrder };
        episodes.add(id, updatedEpisode);
        true;
      };
      case (null) {
        false;
      };
    };
  };

  public shared ({ caller }) func createCategory(id : Text, name : Text, icon : Text, color : Text, order : Nat) : async Category {
    let category : Category = {
      id;
      name;
      icon;
      color;
      order;
      active = true;
    };
    categories.add(id, category);
    category;
  };

  public shared ({ caller }) func updateCategory(id : Text, fields : Category) : async ?Category {
    categories.add(id, fields);
    ?fields;
  };

  public shared ({ caller }) func deleteCategory(id : Text) : async Bool {
    let existed = categories.containsKey(id);
    categories.remove(id);
    existed;
  };

  public shared ({ caller }) func getCategories() : async [Category] {
    categories.values().toArray();
  };

  public shared ({ caller }) func toggleCategoryActive(id : Text) : async Bool {
    switch (categories.get(id)) {
      case (?category) {
        let updatedCategory = { category with active = not category.active };
        categories.add(id, updatedCategory);
        true;
      };
      case (null) {
        false;
      };
    };
  };

  public query ({ caller }) func getUser(uid : Nat) : async ?User {
    users.get(uid);
  };

  public query ({ caller }) func getUsers() : async [User] {
    users.values().toArray();
  };

  public shared ({ caller }) func blockUser(uid : Nat) : async Bool {
    switch (users.get(uid)) {
      case (?user) {
        let updatedUser = { user with isBlocked = true };
        users.add(uid, updatedUser);
        true;
      };
      case (null) {
        false;
      };
    };
  };

  public shared ({ caller }) func unblockUser(uid : Nat) : async Bool {
    switch (users.get(uid)) {
      case (?user) {
        let updatedUser = { user with isBlocked = false };
        users.add(uid, updatedUser);
        true;
      };
      case (null) {
        false;
      };
    };
  };

  public shared ({ caller }) func adjustUserCoins(uid : Nat, amount : Int, _reason : Text) : async Bool {
    switch (users.get(uid)) {
      case (?user) {
        let newCoinBalance = if (amount < 0) {
          Int.abs(amount);
        } else {
          amount.toNat();
        };
        let updatedUser = {
          user with coins = newCoinBalance;
        };
        users.add(uid, updatedUser);
        true;
      };
      case (null) { false };
    };
  };

  public query ({ caller }) func getUserTransactions(uid : Nat) : async [CoinTransaction] {
    coinTransactions.values().toArray().filter(func(t) { t.userId == uid });
  };

  public shared ({ caller }) func createCreator(id : Text, name : Text, avatar : Text, bio : Text) : async Creator {
    let creator : Creator = {
      id;
      name;
      avatar;
      bio;
      followers = 0;
      totalVideos = 0;
      verified = false;
    };
    creators.add(id, creator);
    creator;
  };

  public query ({ caller }) func getCreators() : async [Creator] {
    creators.values().toArray();
  };

  public shared ({ caller }) func updateCreator(id : Text, fields : Creator) : async ?Creator {
    creators.add(id, fields);
    ?fields;
  };

  public query ({ caller }) func getSubscriptions() : async [Subscription] {
    subscriptions.values().toArray();
  };

  public shared ({ caller }) func updateSubscriptionStatus(id : Text, status : SubscriptionStatus) : async Bool {
    switch (subscriptions.get(id)) {
      case (?subscription) {
        let updatedSubscription = { subscription with status };
        subscriptions.add(id, updatedSubscription);
        true;
      };
      case (null) {
        false;
      };
    };
  };

  public query ({ caller }) func getAppConfig() : async AppConfig {
    switch (appConfig) {
      case (?config) { config };
      case (null) { Runtime.trap("AppConfig not initialized") };
    };
  };

  public shared ({ caller }) func updateAppConfig(fields : AppConfig) : async AppConfig {
    appConfig := ?fields;
    fields;
  };

  public shared ({ caller }) func sendNotification(_title : Text, _body : Text, _imageUrl : Text, _targetAudience : TargetAudience, _sentBy : Text) : async Notification {
    let notification : Notification = {
      id = "1";
      title = _title;
      body = _body;
      imageUrl = _imageUrl;
      targetAudience = _targetAudience;
      sentAt = Time.now();
      sentBy = _sentBy;
    };
    notifications.add("1", notification);
    notification;
  };

  public query ({ caller }) func getNotifications() : async [Notification] {
    notifications.values().toArray();
  };

  public query ({ caller }) func getDailyAnalytics(_days : Nat) : async [AnalyticsDay] {
    analytics.values().toArray();
  };

  public query ({ caller }) func getSummaryStats() : async {
    totalUsers : Nat;
    activeToday : Nat;
    totalViews : Nat;
    revenue : Float;
  } {
    {
      totalUsers = users.size();
      activeToday = 0;
      totalViews = 0;
      revenue = 0.0;
    };
  };

  public query ({ caller }) func getCoinTransactions(_limit : Nat) : async [CoinTransaction] {
    coinTransactions.values().toArray();
  };

  public shared ({}) func preupgrade() {
    let persistentUsers = users.toArray();
    let persistentCreators = creators.toArray();
    let persistentCategories = categories.toArray();
    let persistentDramas = dramas.toArray();
    let persistentEpisodes = episodes.toArray();
    let persistentCoinTransactions = coinTransactions.toArray();
    let persistentSubscriptions = subscriptions.toArray();
    let persistentNotifications = notifications.toArray();
    let persistentAnalytics = analytics.toArray();

    users.clear();
    creators.clear();
    categories.clear();
    dramas.clear();
    episodes.clear();
    coinTransactions.clear();
    subscriptions.clear();
    notifications.clear();
    analytics.clear();

    persistentUsers.forEach(func(tuple) { users.add(tuple.0, tuple.1) });
    persistentCreators.forEach(func(tuple) { creators.add(tuple.0, tuple.1) });
    persistentCategories.forEach(func(tuple) { categories.add(tuple.0, tuple.1) });
    persistentDramas.forEach(func(tuple) { dramas.add(tuple.0, tuple.1) });
    persistentEpisodes.forEach(func(tuple) { episodes.add(tuple.0, tuple.1) });
    persistentCoinTransactions.forEach(func(tuple) { coinTransactions.add(tuple.0, tuple.1) });
    persistentSubscriptions.forEach(func(tuple) { subscriptions.add(tuple.0, tuple.1) });
    persistentNotifications.forEach(func(tuple) { notifications.add(tuple.0, tuple.1) });
    persistentAnalytics.forEach(func(tuple) { analytics.add(tuple.0, tuple.1) });
  };
};
