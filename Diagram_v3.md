//// =========================
//// Core: Users & Profiles
//// =========================

Table USERS {
  user_id        bigint [pk, increment]
  email          varchar(255) [not null, unique]
  phone_number   varchar(20) [unique]
  password_hash  varchar(255) [not null]
  created_at     timestamp [not null, default: `CURRENT_TIMESTAMP`]
  last_login     timestamp
  is_active      boolean [not null, default: true]
  first_name     varchar(100)
  middle_name    varchar(100)
  last_name      varchar(100)
}

// 1-1 with USERS, user_id is PK (no surrogate profile_id needed)
Table PROFILES {
  user_id        bigint [pk]              // PK + FK to USERS
  date_of_birth  date
  gender         enum('MALE','FEMALE','OTHER','UNSPECIFIED')
  bio            text
  avatar_url     varchar(255)
  cover_url      varchar(255)
  location       varchar(255)
  website        varchar(255)
  created_at     timestamp [not null, default: `CURRENT_TIMESTAMP`]
  updated_at     timestamp
}

//// =========================
//// User Subclasses
//// (partial participation, overlapping)
//// Not every user belongs to a subclass.
//// A user can belong to multiple subclasses.
//// =========================

Table ADMINS {
  user_id        bigint [pk]              // FK to USERS
  admin_level    enum('SUPER','STANDARD') [not null, default: 'STANDARD']
  granted_at     timestamp [not null, default: `CURRENT_TIMESTAMP`]
  permissions    text
}

Table MODERATORS {
  user_id        bigint [pk]              // FK to USERS
  assigned_area  varchar(255)
  granted_at     timestamp [not null, default: `CURRENT_TIMESTAMP`]
}

Table VERIFIED_USERS {
  user_id        bigint [pk]              // FK to USERS
  verified_at    timestamp [not null, default: `CURRENT_TIMESTAMP`]
  verified_by    bigint [not null]        // FK to ADMINS (only admins can verify)
}

//// =========================
//// Social graph (friendships)
//// Enforce user_one_id < user_two_id via CHECK constraint in SQL
//// =========================

Table FRIENDSHIPS {
  user_one_id    bigint [not null]
  user_two_id    bigint [not null]
  status         enum('PENDING','ACCEPTED','BLOCKED','DECLINED') [not null, default: 'PENDING']
  action_user_id bigint [not null]        // last actor who changed status
  created_at     timestamp [not null, default: `CURRENT_TIMESTAMP`]
  updated_at     timestamp

  indexes {
    (user_one_id, user_two_id) [pk]       // composite PK, no surrogate needed
  }
}

//// =========================
//// Union: AUTHORS (User + Page)
//// Total participation — every User and Page must have an AUTHOR record.
//// Used by: POSTS, PAGE_FOLLOWS
//// =========================

Table AUTHORS {
  author_id    bigint [pk, increment]
  author_type  enum('USER','PAGE') [not null]
  source_id    bigint [not null]          // maps to USERS.user_id or PAGES.page_id

  indexes {
    (author_type, source_id) [unique]     // prevent duplicate mappings
  }
}

//// =========================
//// Union: COMMENT_REACTION_TARGETS (Post + Comment + File)
//// Total participation — every Post, Comment, File must have a target record.
//// Used by: COMMENTS, REACTIONS
//// =========================

Table COMMENT_REACTION_TARGETS {
  target_id    bigint [pk, increment]
  target_type  enum('POST','COMMENT','FILE') [not null]
  source_id    bigint [not null]          // maps to POSTS.post_id, COMMENTS.comment_id, or FILES.file_id

  indexes {
    (target_type, source_id) [unique]
  }
}

//// =========================
//// Union: EVENT_ACTORS (User + Page + Group)
//// Total participation — every User, Page, Group must have an actor record.
//// Used by: EVENTS, EVENT_PUBLICATIONS
//// =========================

Table EVENT_ACTORS {
  actor_id    bigint [pk, increment]
  actor_type  enum('USER','PAGE','GROUP') [not null]
  source_id   bigint [not null]           // maps to USERS.user_id, PAGES.page_id, or GROUPS.group_id

  indexes {
    (actor_type, source_id) [unique]
  }
}

//// =========================
//// Union: REPORT_TARGETS (Group + User + Page + Post + Comment)
//// Total participation — every reportable entity must have a target record.
//// Used by: REPORTS
//// =========================

Table REPORT_TARGETS {
  target_id    bigint [pk, increment]
  target_type  enum('GROUP','USER','PAGE','POST','COMMENT') [not null]
  source_id    bigint [not null]          // maps to the corresponding entity's PK

  indexes {
    (target_type, source_id) [unique]
  }
}

//// =========================
//// Posts, Shares, Files, Comments, Reactions
//// =========================

Table POSTS {
  post_id        bigint [pk, increment]
  author_id      bigint [not null]        // FK to AUTHORS (union of User+Page)
  content        text
  visibility     enum('PUBLIC','FRIENDS','PRIVATE','CUSTOM') [not null, default: 'PUBLIC']
  post_type      enum('ORIGINAL','SHARE') [not null, default: 'ORIGINAL']
  parent_post_id bigint                   // FK to POSTS (for shares)
  created_at     timestamp [not null, default: `CURRENT_TIMESTAMP`]
  updated_at     timestamp
  is_deleted     boolean [not null, default: false]
}

Table POST_LOCATIONS {
  post_location_id bigint [pk, increment]
  post_id        bigint [not null]        // FK to POSTS
  place_name     varchar(100)
  latitude       decimal(10,7)
  longitude      decimal(10,7)
  address        varchar(255)
  created_at     timestamp [not null, default: `CURRENT_TIMESTAMP`]
}

Table FILES {
  file_id          bigint [pk, increment]
  uploader_user_id bigint [not null]      // FK to USERS
  file_name        varchar(255) [not null]
  file_type        varchar(100) [not null] // MIME type
  file_size        bigint [not null]       // supports >2GB
  file_url         varchar(255) [not null]
  thumbnail_url    varchar(255)
  created_at       timestamp [not null, default: `CURRENT_TIMESTAMP`]
}

Table POST_FILES {
  post_id        bigint [not null]
  file_id        bigint [not null]
  sort_order     int [not null, default: 0]

  indexes {
    (post_id, file_id) [pk]               // composite PK
  }
}

// Comments use union COMMENT_REACTION_TARGETS
Table COMMENTS {
  comment_id        bigint [pk, increment]
  commenter_user_id bigint [not null]     // FK to USERS
  target_id         bigint [not null]     // FK to COMMENT_REACTION_TARGETS
  parent_comment_id bigint                // self FK for replies
  content           text [not null]
  created_at        timestamp [not null, default: `CURRENT_TIMESTAMP`]
  updated_at        timestamp
  is_deleted        boolean [not null, default: false]
}

// Reactions use union COMMENT_REACTION_TARGETS
Table REACTIONS {
  reaction_id      bigint [pk, increment]
  target_id        bigint [not null]      // FK to COMMENT_REACTION_TARGETS
  reactor_user_id  bigint [not null]      // FK to USERS
  reaction_type    enum('LIKE','LOVE','HAHA','SAD','ANGRY') [not null]
  created_at       timestamp [not null, default: `CURRENT_TIMESTAMP`]

  indexes {
    (reactor_user_id, target_id) [unique]
  }
}

//// =========================
//// Pages (fanpages / org pages)
//// =========================

Table PAGES {
  page_id            bigint [pk, increment]
  name               varchar(255) [not null]
  username           varchar(100) [unique]      // @handle
  bio                text
  avatar_url         varchar(255)
  cover_url          varchar(255)
  created_at         timestamp [not null, default: `CURRENT_TIMESTAMP`]
  updated_at         timestamp
  created_by_user_id bigint [not null]          // FK to USERS
  is_verified        boolean [not null, default: false]
}

//// =========================
//// Page Roles — Weak Entity + Subclasses
//// Weak entity: depends on PAGES + USERS
//// Partial key: role
//// Subclass: full participation, overlapping
//// Note: Subclass FK (page_id, user_id) -> PAGE_ROLES is composite,
////       dbdiagram.io cannot express this — enforce at app layer.
//// =========================

Table PAGE_ROLES {
  page_id    bigint [not null]
  user_id    bigint [not null]
  role       enum('ADMIN','EDITOR','MODERATOR','ADVERTISER','ANALYST','MEMBER') [not null]
  granted_at timestamp [not null, default: `CURRENT_TIMESTAMP`]

  indexes {
    (page_id, user_id, role) [pk]   // composite PK (weak entity)
  }
}

// Subclass: PAGE_ROLE_ADMINS (full participation, overlapping)
Table PAGE_ROLE_ADMINS {
  page_id          bigint [not null]
  user_id          bigint [not null]
  can_manage_roles boolean [not null, default: true]

  indexes {
    (page_id, user_id) [pk]
  }
}

// Subclass: PAGE_ROLE_EDITORS
Table PAGE_ROLE_EDITORS {
  page_id           bigint [not null]
  user_id           bigint [not null]
  can_publish       boolean [not null, default: true]

  indexes {
    (page_id, user_id) [pk]
  }
}

// Subclass: PAGE_ROLE_MODERATORS
Table PAGE_ROLE_MODERATORS {
  page_id          bigint [not null]
  user_id          bigint [not null]
  can_ban_users    boolean [not null, default: true]

  indexes {
    (page_id, user_id) [pk]
  }
}

// Subclass: PAGE_ROLE_ADVERTISERS
Table PAGE_ROLE_ADVERTISERS {
  page_id           bigint [not null]
  user_id           bigint [not null]
  ad_budget_limit   decimal(12,2)

  indexes {
    (page_id, user_id) [pk]
  }
}

// Subclass: PAGE_ROLE_ANALYSTS
Table PAGE_ROLE_ANALYSTS {
  page_id          bigint [not null]
  user_id          bigint [not null]
  can_export_data  boolean [not null, default: false]

  indexes {
    (page_id, user_id) [pk]
  }
}

// Subclass: PAGE_ROLE_MEMBERS
Table PAGE_ROLE_MEMBERS {
  page_id          bigint [not null]
  user_id          bigint [not null]
  membership_level varchar(50)

  indexes {
    (page_id, user_id) [pk]
  }
}

// Page follows uses AUTHORS union
Table PAGE_FOLLOWS {
  follower_author_id  bigint [not null]   // FK to AUTHORS
  followed_author_id  bigint [not null]   // FK to AUTHORS
  followed_at         timestamp [not null, default: `CURRENT_TIMESTAMP`]
  notify              boolean [not null, default: true]

  indexes {
    (follower_author_id, followed_author_id) [pk]  // composite PK
  }
}

//// =========================
//// Groups & Memberships
//// =========================

Table GROUPS {
  group_id         bigint [pk, increment]
  name             varchar(255) [not null]
  description      text
  privacy          enum('PUBLIC','PRIVATE') [not null]
  cover_url        varchar(255)
  creator_user_id  bigint [not null]      // FK to USERS
  is_visible       boolean [not null, default: true]
  created_at       timestamp [not null, default: `CURRENT_TIMESTAMP`]
  updated_at       timestamp
}

Table GROUP_MEMBERSHIPS {
  group_id    bigint [not null]
  user_id     bigint [not null]
  role        enum('ADMIN','MODERATOR','MEMBER') [not null, default: 'MEMBER']
  status      enum('JOINED','PENDING','BANNED','INVITED') [not null]
  joined_at   timestamp [not null, default: `CURRENT_TIMESTAMP`]
  updated_at  timestamp

  indexes {
    (user_id, group_id) [pk]
  }
}

//// =========================
//// Weak Entities for Groups
//// =========================

// Weak entity: depends on GROUPS
// Partial key: rule_number
Table GROUP_RULES {
  group_id       bigint [not null]        // identifying relationship
  rule_number    int [not null]           // partial key
  title          varchar(255) [not null]
  description    text
  created_at     timestamp [not null, default: `CURRENT_TIMESTAMP`]

  indexes {
    (group_id, rule_number) [pk]          // composite PK
  }
}

// Weak entity: depends on GROUPS
// Partial key: question_number
Table MEMBERSHIP_QUESTIONS {
  group_id        bigint [not null]       // identifying relationship
  question_number int [not null]          // partial key
  question_text   text [not null]
  required        boolean [not null]
  created_at      timestamp [not null, default: `CURRENT_TIMESTAMP`]

  indexes {
    (group_id, question_number) [pk]      // composite PK
  }
}

// Weak entity: depends on GROUPS + USERS
// Partial key: question_number
Table MEMBERSHIP_ANSWERS {
  group_id         bigint [not null]      // identifying relationship (group)
  user_id          bigint [not null]      // identifying relationship (user)
  question_number  int [not null]         // partial key (matches MEMBERSHIP_QUESTIONS)
  answer_text      text
  created_at       timestamp [not null, default: `CURRENT_TIMESTAMP`]

  indexes {
    (group_id, user_id, question_number) [pk]  // composite PK
  }
}

//// =========================
//// Events & Participation
//// Events use union EVENT_ACTORS
//// =========================

Table EVENTS {
  event_id        bigint [pk, increment]
  title           varchar(255) [not null]
  description     text
  host_actor_id   bigint [not null]       // FK to EVENT_ACTORS (union of User+Page+Group)
  location_text   text
  start_time      timestamp [not null]
  end_time        timestamp
  visibility      enum('PUBLIC','PRIVATE','FRIENDS') [not null]
  created_at      timestamp [not null, default: `CURRENT_TIMESTAMP`]
  updated_at      timestamp
}

Table EVENT_PUBLICATIONS {
  publication_id     bigint [pk, increment]
  event_id           bigint [not null]    // FK to EVENTS
  publisher_actor_id bigint [not null]    // FK to EVENT_ACTORS
  published_at       timestamp [not null, default: `CURRENT_TIMESTAMP`]
}

Table EVENT_PARTICIPANTS {
  event_id     bigint [not null]
  user_id      bigint [not null]
  status       enum('GOING','INTERESTED','CANT_GO') [not null]
  responded_at timestamp
  updated_at   timestamp

  indexes {
    (event_id, user_id) [pk]
  }
}

//// =========================
//// Reporting
//// Reports use union REPORT_TARGETS
//// Subclass: full/partial participation, overlapping
//// REPORT_REASONS removed — replaced by subclass tables
//// =========================

Table REPORTS {
  report_id         bigint [pk, increment]
  reporter_user_id  bigint [not null]     // FK to USERS
  target_id         bigint [not null]     // FK to REPORT_TARGETS
  details           text
  status            enum('PENDING','REVIEWED','ACTION_TAKEN','DISMISSED') [not null, default: 'PENDING']
  created_at        timestamp [not null, default: `CURRENT_TIMESTAMP`]
  updated_at        timestamp
}

// Report Subclass: Spam
Table REPORT_SPAM {
  report_id     bigint [pk]              // FK to REPORTS
  spam_type     enum('COMMERCIAL','PHISHING','SCAM','BOT') [not null]
}

// Report Subclass: Harassment
Table REPORT_HARASSMENT {
  report_id      bigint [pk]             // FK to REPORTS
  severity_level enum('LOW','MEDIUM','HIGH','CRITICAL') [not null]
}

// Report Subclass: Inappropriate Content
Table REPORT_INAPPROPRIATE_CONTENT {
  report_id        bigint [pk]           // FK to REPORTS
  content_category enum('VIOLENCE','NUDITY','HATE_SPEECH','MISINFORMATION','OTHER') [not null]
}

// Report Subclass: Impersonation
Table REPORT_IMPERSONATION {
  report_id            bigint [pk]       // FK to REPORTS
  impersonated_user_id bigint            // FK to USERS (optional)
}

// Report Subclass: Other
Table REPORT_OTHER {
  report_id     bigint [pk]              // FK to REPORTS
  reason_text   text [not null]
}

Table REPORT_ACTIONS {
  action_id          bigint [pk, increment]
  report_id          bigint [not null]    // FK to REPORTS
  reviewer_admin_id  bigint [not null]    // FK to ADMINS (subclass of USERS)
  action_taken       enum('DELETE_CONTENT','BAN_USER','WARN_USER','DISMISS_REPORT') [not null]
  notes              text
  action_at          timestamp [not null, default: `CURRENT_TIMESTAMP`]
}


//// =========================
//// Foreign Keys
//// =========================

// ---- Profiles ----
Ref: PROFILES.user_id > USERS.user_id

// ---- User Subclasses ----
Ref: ADMINS.user_id > USERS.user_id
Ref: MODERATORS.user_id > USERS.user_id
Ref: VERIFIED_USERS.user_id > USERS.user_id
Ref: VERIFIED_USERS.verified_by > ADMINS.user_id

// ---- Friendships ----
Ref: FRIENDSHIPS.user_one_id > USERS.user_id
Ref: FRIENDSHIPS.user_two_id > USERS.user_id
Ref: FRIENDSHIPS.action_user_id > USERS.user_id

// ---- Posts & Files ----
Ref: POSTS.author_id > AUTHORS.author_id
Ref: POSTS.parent_post_id > POSTS.post_id
Ref: POST_LOCATIONS.post_id > POSTS.post_id
Ref: FILES.uploader_user_id > USERS.user_id
Ref: POST_FILES.post_id > POSTS.post_id
Ref: POST_FILES.file_id > FILES.file_id

// ---- Comments & Reactions (via union) ----
Ref: COMMENTS.commenter_user_id > USERS.user_id
Ref: COMMENTS.target_id > COMMENT_REACTION_TARGETS.target_id
Ref: COMMENTS.parent_comment_id > COMMENTS.comment_id
Ref: REACTIONS.target_id > COMMENT_REACTION_TARGETS.target_id
Ref: REACTIONS.reactor_user_id > USERS.user_id

// ---- Pages ----
Ref: PAGES.created_by_user_id > USERS.user_id

// ---- Page Roles (weak entity) ----
Ref: PAGE_ROLES.page_id > PAGES.page_id
Ref: PAGE_ROLES.user_id > USERS.user_id
// Note: Subclass tables' composite FK (page_id, user_id) -> PAGE_ROLES
//       cannot be expressed in dbdiagram.io — enforce at app layer
Ref: PAGE_ROLE_ADMINS.page_id > PAGES.page_id
Ref: PAGE_ROLE_ADMINS.user_id > USERS.user_id
Ref: PAGE_ROLE_EDITORS.page_id > PAGES.page_id
Ref: PAGE_ROLE_EDITORS.user_id > USERS.user_id
Ref: PAGE_ROLE_MODERATORS.page_id > PAGES.page_id
Ref: PAGE_ROLE_MODERATORS.user_id > USERS.user_id
Ref: PAGE_ROLE_ADVERTISERS.page_id > PAGES.page_id
Ref: PAGE_ROLE_ADVERTISERS.user_id > USERS.user_id
Ref: PAGE_ROLE_ANALYSTS.page_id > PAGES.page_id
Ref: PAGE_ROLE_ANALYSTS.user_id > USERS.user_id
Ref: PAGE_ROLE_MEMBERS.page_id > PAGES.page_id
Ref: PAGE_ROLE_MEMBERS.user_id > USERS.user_id

// ---- Page Follows (via AUTHORS union) ----
Ref: PAGE_FOLLOWS.follower_author_id > AUTHORS.author_id
Ref: PAGE_FOLLOWS.followed_author_id > AUTHORS.author_id

// ---- Groups ----
Ref: GROUPS.creator_user_id > USERS.user_id
Ref: GROUP_MEMBERSHIPS.group_id > GROUPS.group_id
Ref: GROUP_MEMBERSHIPS.user_id > USERS.user_id

// ---- Group Weak Entities ----
Ref: GROUP_RULES.group_id > GROUPS.group_id
Ref: MEMBERSHIP_QUESTIONS.group_id > GROUPS.group_id
Ref: MEMBERSHIP_ANSWERS.group_id > GROUPS.group_id
Ref: MEMBERSHIP_ANSWERS.user_id > USERS.user_id
// Composite FK: (group_id, question_number) -> MEMBERSHIP_QUESTIONS.(group_id, question_number)
// dbdiagram.io does not support composite FK — enforce at app layer

// ---- Events (via EVENT_ACTORS union) ----
Ref: EVENTS.host_actor_id > EVENT_ACTORS.actor_id
Ref: EVENT_PUBLICATIONS.event_id > EVENTS.event_id
Ref: EVENT_PUBLICATIONS.publisher_actor_id > EVENT_ACTORS.actor_id
Ref: EVENT_PARTICIPANTS.event_id > EVENTS.event_id
Ref: EVENT_PARTICIPANTS.user_id > USERS.user_id

// ---- Reports (via REPORT_TARGETS union) ----
Ref: REPORTS.reporter_user_id > USERS.user_id
Ref: REPORTS.target_id > REPORT_TARGETS.target_id
Ref: REPORT_ACTIONS.report_id > REPORTS.report_id
Ref: REPORT_ACTIONS.reviewer_admin_id > ADMINS.user_id

// ---- Report Subclasses ----
Ref: REPORT_SPAM.report_id > REPORTS.report_id
Ref: REPORT_HARASSMENT.report_id > REPORTS.report_id
Ref: REPORT_INAPPROPRIATE_CONTENT.report_id > REPORTS.report_id
Ref: REPORT_IMPERSONATION.report_id > REPORTS.report_id
Ref: REPORT_IMPERSONATION.impersonated_user_id > USERS.user_id
Ref: REPORT_OTHER.report_id > REPORTS.report_id
