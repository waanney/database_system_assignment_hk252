//// =========================
//// Core: Users & Profiles
//// =========================

Table USERS {
  user_id        bigint [pk, increment, not null]
  email          varchar(255) [not null, unique]
  phone_number   varchar(20) [not null, unique]
  password_hash  varchar(255) [not null]
  created_at     timestamp [not null, default: `CURRENT_TIMESTAMP`]
  is_active      boolean [not null, default: true]
  first_name     varchar(100)
  last_name      varchar(100)
  gender         enum('MALE','FEMALE','OTHER','UNSPECIFIED')
  date_of_birth  date
  age            int [derived: `TIMESTAMPDIFF(YEAR, date_of_birth, CURDATE())`]
}

Table USER_PROFILES {
  profile_id       bigint [pk, increment]
  user_id         bigint [not null, unique]
  bio             text
  avatar_url      varchar(255)
  cover_page_url  varchar(255)
}

//// =========================
//// User Subclasses
//// (partial participation, overlapping)
//// =========================

Table ADMINS {
  user_id     bigint [pk, not null]
  admin_level enum('SUPER','STANDARD') [not null, default: 'STANDARD']
  granted_at  timestamp [not null, default: `CURRENT_TIMESTAMP`]
}

Table VERIFIED_USERS {
  user_id      bigint [pk, not null]
  verified_at  timestamp [not null, default: `CURRENT_TIMESTAMP`]
}

Table VERIFICATION_DOCS {
  doc_id        bigint [pk, increment]
  user_id       bigint [not null]
  document_url  varchar(255) [not null]
  status        enum('PENDING','APPROVED','REJECTED') [not null, default: 'PENDING']
}

//// =========================
//// Social graph (friendships)
//// =========================

Table FRIENDSHIPS {
  sender_id   bigint [not null]
  receiver_id bigint [not null]
  status      enum('PENDING','ACCEPTED') [not null, default: 'PENDING']
  created_at  timestamp [not null, default: `CURRENT_TIMESTAMP`]

  indexes {
    (sender_id, receiver_id) [pk]
  }
}

//// =========================
//// Posts, Comments, Reactions, Tags, Shares
//// =========================

Table POSTS {
  post_id         bigint [pk, increment]
  content         text [not null]
  visibility      enum('PUBLIC','FRIENDS','PRIVATE','CUSTOM') [not null, default: 'PUBLIC']
  created_at      timestamp [not null, default: `CURRENT_TIMESTAMP`]
  user_id         bigint [not null]
  reaction_count  int [derived: COUNT(REACTIONS), default: 0]
}

Table COMMENTS {
  comment_id  bigint [pk, increment]
  content     text [not null]
  created_at  timestamp [not null, default: `CURRENT_TIMESTAMP`]
  post_id     bigint [not null]
  user_id     bigint [not null]
}

Table REACTIONS {
  user_id     bigint [not null]
  post_id     bigint [not null]
  react_type  enum('LIKE','LOVE','HAHA','WOW','CARE','SAD','ANGRY') [not null]

  indexes {
    (user_id, post_id) [pk]
  }
}

Table TAG {
  user_id  bigint [not null]
  post_id bigint [not null]

  indexes {
    (user_id, post_id) [pk]
  }
}

Table SHARED_POSTS {
  post_id         bigint [pk, not null]
  parent_post_id  bigint [not null]
}

//// =========================
//// Reporting
//// =========================

Table REPORTS {
  report_id   bigint [pk, increment]
  granted_at  timestamp [not null, default: `CURRENT_TIMESTAMP`]
  status      enum('PENDING','REVIEWED','ACTION_TAKEN','DISMISSED') [not null, default: 'PENDING']
  reason      text
  created_at  timestamp [not null, default: `CURRENT_TIMESTAMP`]
  user_id     bigint [not null]
  post_id     bigint [not null]
}

Table REVIEW_REPORTS {
  report_id bigint [pk, not null]
  admin_id  bigint [pk, not null]
}

//// =========================
//// Groups & Memberships
//// =========================

Table GROUPS {
  group_id     bigint [pk, increment]
  name         varchar(255) [not null]
  created_at   timestamp [not null, default: `CURRENT_TIMESTAMP`]
  description  text
  owner_id    bigint [not null]
  member_count int [derived: COUNT(MEMBERSHIPS), default: 0]
}

Table MEMBERSHIPS {
  group_id  bigint [not null]
  user_id   bigint [not null]
  joined_at timestamp [not null, default: `CURRENT_TIMESTAMP`]

  indexes {
    (group_id, user_id) [pk]
  }
}

Table GROUP_RULES {
  group_id    bigint [not null]
  rule_id     bigint [not null]
  title       varchar(255) [not null]
  description text

  indexes {
    (group_id, rule_id) [pk]
  }
}

//// =========================
//// Foreign Keys
//// =========================

Ref: USER_PROFILES.user_id > USERS.user_id
Ref: ADMINS.user_id > USERS.user_id
Ref: VERIFIED_USERS.user_id > USERS.user_id
Ref: VERIFICATION_DOCS.user_id > USERS.user_id
Ref: FRIENDSHIPS.sender_id > USERS.user_id
Ref: FRIENDSHIPS.receiver_id > USERS.user_id
Ref: POSTS.user_id > USERS.user_id
Ref: COMMENTS.post_id > POSTS.post_id
Ref: COMMENTS.user_id > USERS.user_id
Ref: REACTIONS.user_id > USERS.user_id
Ref: REACTIONS.post_id > POSTS.post_id
Ref: TAG.user_id > USERS.user_id
Ref: TAG.post_id > POSTS.post_id
Ref: SHARED_POSTS.post_id > POSTS.post_id
Ref: SHARED_POSTS.parent_post_id > POSTS.post_id
Ref: REPORTS.user_id > USERS.user_id
Ref: REPORTS.post_id > POSTS.post_id
Ref: REVIEW_REPORTS.report_id > REPORTS.report_id
Ref: REVIEW_REPORTS.admin_id > ADMINS.user_id
Ref: GROUPS.owner_id > USERS.user_id
Ref: MEMBERSHIPS.group_id > GROUPS.group_id
Ref: MEMBERSHIPS.user_id > USERS.user_id
Ref: GROUP_RULES.group_id > GROUPS.group_id

//// =========================
//// Business Constraints (Triggers)
//// =========================

// REPORTS: User cannot report their own post
Trigger: tg_check_report_self (BEFORE INSERT ON REPORTS)

// REPORTS: A user can only report a specific post once
Trigger: tg_check_report_self_update (BEFORE UPDATE ON REPORTS)

// FRIENDSHIPS: Prevent reciprocal duplicate entries (A->B and B->A)
Trigger: tg_check_friendship_reverse_insert (BEFORE INSERT ON FRIENDSHIPS)
Trigger: tg_check_friendship_reverse_update (BEFORE UPDATE ON FRIENDSHIPS)

// GROUPS: Owner automatically becomes a member
Trigger: tg_after_insert_group_owner_membership (AFTER INSERT ON GROUPS)
Trigger: tg_after_update_group_owner_membership (AFTER UPDATE ON GROUPS)

// MEMBERSHIPS: Owner membership cannot be deleted
Trigger: tg_check_owner_membership_delete (BEFORE DELETE ON MEMBERSHIPS)

// MEMBERSHIPS: joined_at cannot be earlier than group's created_at
Trigger: tg_check_membership_joined_at_insert (BEFORE INSERT ON MEMBERSHIPS)
Trigger: tg_check_membership_joined_at_update (BEFORE UPDATE ON MEMBERSHIPS)

// POSTS: reaction_count auto-incremented by triggers
Trigger: tg_after_insert_reaction (AFTER INSERT ON REACTIONS)
Trigger: tg_after_delete_reaction (AFTER DELETE ON REACTIONS)

// USERS: age derived attribute (materialized)
Trigger: tg_users_age_before_insert (BEFORE INSERT ON USERS)
Trigger: tg_users_age_before_update (BEFORE UPDATE ON USERS)

// GROUPS: member_count auto-incremented by triggers
Trigger: tg_after_insert_membership (AFTER INSERT ON MEMBERSHIPS)
Trigger: tg_after_delete_membership (AFTER DELETE ON MEMBERSHIPS)

//// =========================
//// Stored Procedures
//// =========================

Procedures:
  - sp_InsertUser   (INSERT USER, complex conditions: age >= 18, email format, phone format)
  - sp_UpdateUser   (UPDATE USER, complex conditions: age >= 18, email format, phone format)
  - sp_DeleteUser   (DELETE USER, complex conditions: prevent deletion of SUPER admin, prevent deletion of group owner)
  - friend_request   (Send friend request with duplicate/reciprocal check)
  - accept_friend   (Accept friend request with validation)
  - unfriend        (Remove friendship with validation)
  - decline_cancel_fr (Decline or cancel friend request)
  - search_friend   (Search friends by name)
  - search_pending_fr (Search pending received requests)
  - search_sent_fr   (Search sent friend requests)
  - get_friends_in_group (Get friends who are also group members)
  - get_group_members (Get all members of a group)
  - count_ver_group (Count verified groups with verified member count)
  - search_user     (Search users by name)
  - search_group    (Search groups by name/description)

//// =========================
//// Stored Functions
//// =========================

Functions:
  - get_mutual_friends_count(user_id1, user_id2) -> INT
  - get_post_reaction_weighted_score(post_id) -> INT
  - count_group_members_with_min_public_posts(group_id, min_posts) -> INT
