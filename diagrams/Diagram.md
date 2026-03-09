//// =========================
//// Core: Users & Profiles
//// =========================
// Need subclass admin
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

Table PROFILES {
  profile_id     bigint [pk, increment]
  user_id        bigint [not null, unique] // 1-1 with USERS
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
//// Roles & Access
//// =========================
// SUBCLASSES needed
Table ROLES {
  role_id        bigint [pk, increment]
  name           varchar(100) [not null, unique]
  description    text
  created_at     timestamp [not null, default: `CURRENT_TIMESTAMP`]
}

Table USER_ROLES {
  user_id        bigint [not null]
  role_id        bigint [not null]
  granted_at     timestamp [not null, default: `CURRENT_TIMESTAMP`]
  note_          text

  indexes {
    (user_id, role_id) [unique]
  }
}

//// =========================
//// Social graph (friendships)
//// =========================

Table FRIENDSHIPS {
  friendship_id  bigint [pk, increment]
  user_one_id    bigint [not null]
  user_two_id    bigint [not null]
  status         enum('PENDING','ACCEPTED','BLOCKED','DECLINED') [not null, default: 'PENDING']
  action_user_id bigint [not null] // last actor who changed status
  created_at     timestamp [not null, default: `CURRENT_TIMESTAMP`]
  updated_at     timestamp

  indexes {
    (user_one_id, user_two_id) [unique]
  }
}

//// =========================
//// Posts, Shares, Files, Comments, Reactions
//// =========================
// UNION for author (user, page)
Table POSTS {
  post_id        bigint [pk, increment]
  author_id bigint [not null] // FK to USERS
  author_type ENUM('USER', 'PAGE') [not null]
  content        text
  visibility     enum('PUBLIC','FRIENDS','PRIVATE','CUSTOM') [not null, default: 'PUBLIC']
  post_type      enum('ORIGINAL','SHARE') [not null, default: 'ORIGINAL']
  parent_post_id bigint
  created_at     timestamp [not null, default: `CURRENT_TIMESTAMP`]
  updated_at     timestamp
  is_deleted     boolean [not null]
}

Table POST_LOCATIONS {
  post_location_id bigint [pk, increment]
  post_id        bigint [not null]                 // FK -> POSTS.post_id
  place_name     varchar(100)
  latitude       bigint
  longitude      bigint
  address        varchar(255)
  created_at     timestamp [not null,default: `CURRENT_TIMESTAMP`]
}


Table FILES {
  file_id          bigint [pk, increment]                     // UID, PK, AUTO_INCREMENT
  uploader_user_id bigint [not null]    // FK to USERS
  file_name        varchar(255) [not null]                    // original file name
  file_type        varchar(100) [not null]                    // MIME type
  file_size        int [not null]                             // size in bytes
  file_url         varchar(255) [not null]                    // storage URL
  thumbnail_url    varchar(255)                               // preview thumbnail URL (nullable)
  created_at     timestamp [not null,default: `CURRENT_TIMESTAMP`]
}


Table POST_FILES {
  post_id        bigint [not null]
  file_id        bigint [not null]
  sort_order     int [not null, default: 0]

  indexes {
    (post_id, file_id) [unique]
  }
}
// UNION for comment_type (post, file, comment)
Table COMMENTS {
  comment_id        bigint [pk, increment]                     // PK
  commenter_user_id bigint [not null]   // FK -> USERS
  post_id    bigint [not null]                         // FK target (post_id OR file_id)
  post_type  enum('POST','FILE','COMMENT')
  parent_comment_id bigint [ref: > COMMENTS.comment_id]       // self FK for replies
  content      text [not null]                           // comment body
  created_at        timestamp [not null, default:  `CURRENT_TIMESTAMP`]
  updated_at        timestamp
  is_deleted        boolean
}

// UNION for reaction_target_type (post, comment, file)
Table REACTIONS {
  reaction_id      bigint [pk, increment]
  target_type   enum('POST', 'COMMENT', 'FILE') [not null]
  target_id     bigint [not null] 
  reactor_user_id  bigint [not null]
  reaction_type    enum('LIKE', 'LOVE', 'HAHA', 'SAD', 'ANGRY') [not null]
  created_at       timestamp [not null, default: `CURRENT_TIMESTAMP`]

  indexes {
    (reactor_user_id, target_id, target_type) [unique]
  }
}


//// =========================
//// Pages (fanpages / org pages)
//// =========================

Table PAGES {
  page_id        bigint [pk, increment]                        // AUTO_INCREMENT PK
  name      varchar(255) [not null]                      // public display name
  username       varchar(100) [unique]                        // @handle
  bio            text
  avatar_url     varchar(255)
  cover_url     varchar(255)
  // category       varchar(100)                                 // page category
  // description    text                                         // page description
  // contact_info   text                                         // JSON or text field
  created_at     timestamp [not null, default: `CURRENT_TIMESTAMP`] // creation time
  created_by_user_id bigint [not null]
  is_verified     boolean [not null]
}

// SUBCLASSES needed, weak entity
Table PAGE_ROLES {
  page_role_id   bigint [pk, increment]
  page_id        bigint [not null]
  user_id        bigint [not null]
  role           enum('ADMIN','EDITOR','MODERATOR','ADVERTISER','ANALYST','MEMBER')
  granted_at     timestamp [not null, default: 'CURRENT_TIMESTAMP']
  indexes {
    (page_id, user_id) [unique]
  }
}
// allow Page follow page
Table PAGE_FOLLOWS {
  page_id        bigint [not null]
  user_id        bigint [not null]
  followed_at    timestamp [not null, default: `CURRENT_TIMESTAMP`]
  notify         boolean [not null]
  indexes {
    (page_id, user_id) [unique]
  }
}

//// =========================
//// Groups & Memberships
//// =========================

Table GROUPS {
  group_id         bigint [pk, increment]                               // auto-increment PK
  name       varchar(255) [not null]
  description      text  
  privacy     enum('PUBLIC','PRIVATE') [not null]                // privacy
  cover_url  varchar(255)
  creator_user_id  bigint [not null]             // FK to USERS
  is_visible       boolean [not null, default: true]                  // searchable private group
  created_at       timestamp [not null, default: `CURRENT_TIMESTAMP`] // created time
}

Table GROUP_MEMBERSHIPS {
  group_id    bigint [not null]
  user_id     bigint [not null] 
  role        enum('ADMIN','MODERATOR','MEMBER') [not null, default: 'MEMBER']
  status      enum('JOINED','PENDING','BANNED','INVITED') [not null]
  joined_at   timestamp [not null, default: `CURRENT_TIMESTAMP`]
  updated_at timestamp
  indexes {
    (user_id, group_id) [pk]   // composite PK
  }
}

// Weak entities
Table GROUP_RULES {
  rule_id        bigint [pk, increment]                      // auto-increment PK
  group_id       bigint [not null]   // FK to GROUPS
  title          varchar(255) [not null]                     // rule title
  description        text                                        // full rule description
  created_at     timestamp [not null, default: `CURRENT_TIMESTAMP`]
  display_order  int [not null, default: 0]
}

// Weak entities
Table MEMBERSHIP_QUESTIONS {
  question_id    bigint [pk, increment]
  group_id       bigint [not null]
  question_text  text [not null]
  required       boolean [not null]
  sort_order     int [not null, default: 0]
  created_at     timestamp [not null, default: `CURRENT_TIMESTAMP`]
}
// Weak entities
Table MEMBERSHIP_ANSWERS {
  answer_id    bigint [pk, increment]
  group_id     bigint [not null]
  user_id      bigint [not null]                     // PK part + FK
  question_id  bigint [not null] // PK part + FK
  answer_text  text                                        // required answer
  created_at     timestamp [not null, default: `CURRENT_TIMESTAMP`]
  indexes {
    (user_id, group_id, question_id) [unique]
  }
}

//// =========================
//// Events & Participation
//// =========================
/// UNION for host_type (user, page, group)
Table EVENTS {
  event_id        bigint [pk, increment]
  title      varchar(255) [not null]                   // PK
  description     text
  host_id    bigint [not null]      
  host_type  enum('USER','PAGE', 'GROUP') [not null]             // polymorphic host
  location_text   text                                       // location in free text
  start_time      timestamp [not null]                       // start time
  end_time        timestamp                                  // end time (nullable)
  visibility enum('PUBLIC','PRIVATE','FRIENDS') [not null] // visibility
  created_at     timestamp [not null, default: `CURRENT_TIMESTAMP`]
}
/// UNION for publisher_type (user, page, group)

Table EVENT_PUBLICATIONS {
  publication_id  bigint [pk]                                 // unique publication id
  event_id        bigint [not null]   // FK to events
  published_at    varchar(255) [not null]
  publisher_id    bigint [not null]
  publisher_type  enum('GROUP', 'USER', 'PAGE')
  // location_id     bigint [not null]                           // page/user/group where published
  // location_type   enum('USER_TIMELINE','GROUP','PAGE_TIMELINE') [not null] // feed destination
}


Table EVENT_PARTICIPANTS {
  event_id     bigint [not null]    // PK part
  user_id      bigint [not null]      // PK part
  status  enum('GOING','INTERESTED','CANT_GO') [not null] // exact spec
  responded_at timestamp
  updated_at   timestamp

  indexes {
    (event_id, user_id) [pk]  // composite primary key
  }
}

//// =========================
//// Reporting (polymorphic)
//// =========================
// Use subclass
Table REPORT_REASONS {
  reason_id    int [pk, increment]      // auto-increment primary key
  title        varchar(255) [not null] // short title of the report reason
  description  text                    // detailed explanation (optional)
  code         int [not null, unique]
  created_at     timestamp [not null, default: `CURRENT_TIMESTAMP`]
}
// UNION for target_id (post, comment, user, page, group)
Table REPORTS {
  report_id         bigint [pk, increment]                          // auto-increment PK
  reporter_user_id  bigint [not null]        // FK to USERS
  target_id     bigint [not null]                              // polymorphic target ID
  target_type   enum('POST','COMMENT','USER','PAGE','GROUP') [not null] // polymorphic type
  reason_id         int [not null] // FK to reasons
  details        text
  status            enum('PENDING','REVIEWED','ACTION_TAKEN','DISMISSED') [not null]
  created_at        timestamp [not null, default: `CURRENT_TIMESTAMP`] 
}
Table REPORT_ACTIONS {
  action_id          bigint [pk, increment]                              // PK
  report_id          bigint [not null]        // FK to REPORTS
  reviewer_admin_id  bigint [not null]            // admin who handled the report
  action_taken       enum('DELETE_CONTENT','BAN_USER','WARN_USER','DISMISS_REPORT') [not null] 
  notes              text                                                // internal notes
  action_at          timestamp [not null, default: `CURRENT_TIMESTAMP`]  // time of action
}


//// =========================
//// Foreign Keys
//// =========================

// Profiles / roles
Ref: PROFILES.user_id > USERS.user_id
Ref: USER_ROLES.user_id > USERS.user_id
Ref: USER_ROLES.role_id > ROLES.role_id

// Friendships
Ref: FRIENDSHIPS.user_one_id > USERS.user_id
Ref: FRIENDSHIPS.user_two_id > USERS.user_id
Ref: FRIENDSHIPS.action_user_id > USERS.user_id

// Posts & files
Ref: POSTS.author_id > USERS.user_id
Ref: POSTS.parent_post_id > POSTS.post_id
Ref: POST_LOCATIONS.post_id > POSTS.post_id

Ref: FILES.uploader_user_id > USERS.user_id
Ref: POST_FILES.post_id > POSTS.post_id
Ref: POST_FILES.file_id > FILES.file_id
Ref: COMMENTS.commenter_user_id > USERS.user_id

// Reactions (polymorphic handled by app; no hard FK to two tables)
Ref: REACTIONS.reactor_user_id > USERS.user_id

// Pages
Ref: PAGES.created_by_user_id > USERS.user_id
Ref: PAGE_ROLES.page_id > PAGES.page_id
Ref: PAGE_ROLES.user_id > USERS.user_id
Ref: PAGE_FOLLOWS.page_id > PAGES.page_id
Ref: PAGE_FOLLOWS.user_id > USERS.user_id

// Groups
Ref: GROUPS.creator_user_id > USERS.user_id
Ref: GROUP_MEMBERSHIPS.group_id > GROUPS.group_id
Ref: GROUP_MEMBERSHIPS.user_id > USERS.user_id
Ref: GROUP_RULES.group_id > GROUPS.group_id
Ref: MEMBERSHIP_QUESTIONS.group_id > GROUPS.group_id
Ref: MEMBERSHIP_ANSWERS.group_id > GROUPS.group_id
Ref: MEMBERSHIP_ANSWERS.user_id > USERS.user_id
Ref: MEMBERSHIP_ANSWERS.question_id > MEMBERSHIP_QUESTIONS.question_id

// Events
Ref: EVENTS.host_id > USERS.user_id
Ref: EVENT_PUBLICATIONS.event_id > EVENTS.event_id
Ref: EVENT_PUBLICATIONS.publisher_id > USERS.user_id
Ref: EVENT_PARTICIPANTS.event_id > EVENTS.event_id
Ref: EVENT_PARTICIPANTS.user_id > USERS.user_id
// EVENTS.host_type+host_id and EVENT_PUBLICATIONS.location_* are polymorphic

// Reports
Ref: REPORTS.reporter_user_id > USERS.user_id
Ref: REPORTS.reason_id > REPORT_REASONS.reason_id
Ref: REPORT_ACTIONS.report_id > REPORTS.report_id
Ref: REPORT_ACTIONS.reviewer_admin_id > USERS.user_id



// Ref: "REPORTS"."report_id" < "REPORTS"."reportable_type"