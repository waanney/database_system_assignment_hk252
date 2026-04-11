-- ============================================================
-- DATABASE SCHEMA
-- Generated from: docs/diagrams/Diagram_v3.md
-- Execution order respects FK dependencies
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- Core: Users & Profiles
-- ============================================================

CREATE TABLE IF NOT EXISTS USERS (
    user_id       BIGINT        NOT NULL AUTO_INCREMENT,
    email         VARCHAR(255)  NOT NULL,
    phone_number  VARCHAR(20),
    password_hash VARCHAR(255)  NOT NULL,
    created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    /*last_login    TIMESTAMP     NULL,*/
    is_active     BOOLEAN       NOT NULL DEFAULT TRUE,
    first_name    VARCHAR(100),
    /*middle_name   VARCHAR(100),*/
    gender        ENUM('MALE','FEMALE','OTHER','UNSPECIFIED'),
    date_of_birth DATE,
    last_name     VARCHAR(100),
    PRIMARY KEY (user_id),
    UNIQUE KEY uq_users_email        (email),
    UNIQUE KEY uq_users_phone_number (phone_number),
    CONSTRAINT check_phone CHECK (LENGTH(PHONE_NUMBER) = 10)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS USER_PROFILES (
    profile_id    BIGINT       NOT NULL AUTO_INCREMENT,
    user_id       BIGINT       NOT NULL,
    bio           TEXT,
    avatar_url    VARCHAR(255),
    cover_page_url     VARCHAR(255),
    PRIMARY KEY (profile_id),
    UNIQUE KEY uq_user_profiles_user (user_id),
    CONSTRAINT fk_user_profiles_user FOREIGN KEY (user_id) REFERENCES USERS (user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- User Subclasses (partial participation, overlapping): ADMINS AND VERIFIED USERS
-- ============================================================

CREATE TABLE IF NOT EXISTS ADMINS (
    user_id     BIGINT                        NOT NULL,
    admin_level ENUM('SUPER','STANDARD')      NOT NULL DEFAULT 'STANDARD',
    granted_at  TIMESTAMP                     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id),
    CONSTRAINT fk_admins_user FOREIGN KEY (user_id) REFERENCES USERS (user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS VERIFIED_USERS (
    user_id     BIGINT    NOT NULL,
    verified_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id),
    CONSTRAINT fk_verified_users_user FOREIGN KEY (user_id) REFERENCES USERS (user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Đây là multivalued attribute vì một verified user có thể có nhiều document (mỗi document là 1 hàng với cùng user_id)
CREATE TABLE IF NOT EXISTS VERIFICATION_DOCS (
    user_id       BIGINT       NOT NULL,
    document_url  VARCHAR(255) NOT NULL,
    status        ENUM('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING',
    PRIMARY KEY (user_id, doc_id, status),
    CONSTRAINT fk_verification_docs_user FOREIGN KEY (user_id) REFERENCES USERS (user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Social Graph (Friendships)
-- Enforce sender_id <> receiver_id via CHECK constraint
-- ============================================================

CREATE TABLE IF NOT EXISTS FRIENDSHIPS (
    sender_id     BIGINT    NOT NULL,
    receiver_id   BIGINT    NOT NULL,
    status        ENUM('PENDING','ACCEPTED','BLOCKED','DECLINED') NOT NULL DEFAULT 'PENDING',
    created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (sender_id, receiver_id),
    CONSTRAINT chk_friendships_distinct CHECK (sender_id <> receiver_id),
    CONSTRAINT fk_friendships_sender FOREIGN KEY (sender_id) REFERENCES USERS (user_id) ON DELETE CASCADE,
    CONSTRAINT fk_friendships_receiver FOREIGN KEY (receiver_id) REFERENCES USERS (user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Posts, Files, Comments, Reactions
-- ============================================================

CREATE TABLE IF NOT EXISTS POSTS (
    post_id        BIGINT                                        NOT NULL AUTO_INCREMENT,
    content        TEXT                                          NOT NULL,
    visibility     ENUM('PUBLIC','FRIENDS','PRIVATE','CUSTOM')   NOT NULL DEFAULT 'PUBLIC',
    created_at     TIMESTAMP                                     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    user_id        BIGINT                                        NOT NULL,
    PRIMARY KEY (post_id),
    CONSTRAINT fk_posts_user FOREIGN KEY (user_id) REFERENCES USERS (user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS COMMENTS (
    comment_id        BIGINT    NOT NULL AUTO_INCREMENT,
    content           TEXT      NOT NULL,
    created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    post_id           BIGINT    NOT NULL,
    user_id           BIGINT    NOT NULL,
    PRIMARY KEY (comment_id),
    CONSTRAINT fk_comments_post FOREIGN KEY (post_id) REFERENCES POSTS (post_id) ON DELETE CASCADE,
    CONSTRAINT fk_comments_user FOREIGN KEY (user_id) REFERENCES USERS (user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS REACTIONS (
    user_id           BIGINT    NOT NULL,
    post_id           BIGINT    NOT NULL,
    react_type        ENUM('LIKE','LOVE','HAHA','WOW', 'CARE','SAD','ANGRY') NOT NULL,
    PRIMARY KEY (user_id, post_id),
    CONSTRAINT fk_reactions_user FOREIGN KEY (user_id) REFERENCES USERS (user_id) ON DELETE CASCADE,
    CONSTRAINT fk_reactions_post FOREIGN KEY (post_id) REFERENCES POSTS (post_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS TAG (
    user_id           BIGINT    NOT NULL,
    post_id           BIGINT    NOT NULL,
    PRIMARY KEY (user_id, post_id),
    CONSTRAINT fk_tag_user FOREIGN KEY (user_id) REFERENCES USERS (user_id) ON DELETE CASCADE,
    CONSTRAINT fk_tag_post FOREIGN KEY (post_id) REFERENCES POSTS (post_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS SHARED_POSTS (
    post_id           BIGINT    NOT NULL,
    parent_post_id    BIGINT    NOT NULL,
    PRIMARY KEY (post_id),
    CONSTRAINT chk_shared_posts_not_self CHECK (post_id <> parent_post_id),
    CONSTRAINT fk_shared_posts_post FOREIGN KEY (post_id) REFERENCES POSTS (post_id) ON DELETE CASCADE,
    CONSTRAINT fk_shared_posts_parent_post FOREIGN KEY (parent_post_id) REFERENCES POSTS (post_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Reporting
-- ============================================================

CREATE TABLE IF NOT EXISTS REPORTS (
    report_id         BIGINT    NOT NULL AUTO_INCREMENT,
    granted_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status            ENUM('PENDING','REVIEWED','ACTION_TAKEN','DISMISSED') NOT NULL DEFAULT 'PENDING',
    reason            TEXT,
    created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    user_id           BIGINT    NOT NULL,
    post_id           BIGINT    NOT NULL,
    PRIMARY KEY (report_id),
    CONSTRAINT fk_reports_user FOREIGN KEY (user_id) REFERENCES USERS (user_id) ON DELETE CASCADE,
    CONSTRAINT fk_reports_post FOREIGN KEY (post_id) REFERENCES POSTS (post_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS REVIEW_REPORTS (
    report_id         BIGINT    NOT NULL,
    admin_id          BIGINT    NOT NULL,
    PRIMARY KEY (report_id, admin_id),
    CONSTRAINT fk_review_reports_report FOREIGN KEY (report_id) REFERENCES REPORTS (report_id) ON DELETE CASCADE,
    CONSTRAINT fk_review_reports_admin FOREIGN KEY (admin_id) REFERENCES ADMINS (user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Groups & Memberships
-- ============================================================

CREATE TABLE IF NOT EXISTS GROUPS (
    group_id         BIGINT    NOT NULL AUTO_INCREMENT,
    name             VARCHAR(255) NOT NULL,
    created_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    description      TEXT,
    owner_id         BIGINT       NOT NULL,
    PRIMARY KEY (group_id),
    CONSTRAINT fk_groups_owner FOREIGN KEY (owner_id) REFERENCES USERS (user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS MEMBERSHIPS (
    group_id         BIGINT    NOT NULL,
    user_id          BIGINT    NOT NULL,
    joined_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (group_id, user_id),
    CONSTRAINT fk_memberships_group FOREIGN KEY (group_id) REFERENCES GROUPS (group_id) ON DELETE CASCADE,
    CONSTRAINT fk_memberships_user FOREIGN KEY (user_id) REFERENCES USERS (user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- If GROUP_RULES is a weak entity, its primary key should be a composite key consisting of (group_id, rule_id), 
-- where rule_id is NOT globally unique, but unique only within each group (not AUTO_INCREMENT globally).
CREATE TABLE IF NOT EXISTS GROUP_RULES (
    group_id    BIGINT       NOT NULL,
    rule_id     BIGINT       NOT NULL,
    title       VARCHAR(255) NOT NULL,
    description TEXT,
    PRIMARY KEY (group_id, rule_id),
    CONSTRAINT fk_group_rules_group FOREIGN KEY (group_id) REFERENCES GROUPS (group_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;