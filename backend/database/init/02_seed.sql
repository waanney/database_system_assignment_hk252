-- ============================================================
-- SEED DATA (development / testing only)
-- ============================================================

-- ---- Users ----
INSERT INTO USERS (user_id, email, phone_number, password_hash, first_name, last_name) VALUES
(1, 'admin@example.com',   '0900000001', '$2b$12$hashAdmin',   'Super',  'Admin'),
(2, 'mod@example.com',     '0900000002', '$2b$12$hashMod',     'John',   'Doe'),
(3, 'alice@example.com',   '0900000003', '$2b$12$hashAlice',   'Alice',  'Nguyen'),
(4, 'bob@example.com',     '0900000004', '$2b$12$hashBob',     'Bob',    'Tran'),
(5, 'charlie@example.com', '0900000005', '$2b$12$hashCharlie', 'Charlie','Le');

-- ---- Profiles ----
INSERT INTO PROFILES (user_id, gender, bio, location) VALUES
(1, 'UNSPECIFIED', 'System administrator', 'Ho Chi Minh City'),
(2, 'MALE',        'Platform moderator',   'Ha Noi'),
(3, 'FEMALE',      'Hello, I am Alice!',   'Da Nang'),
(4, 'MALE',        'Just Bob.',            'Ho Chi Minh City'),
(5, 'MALE',        'Charlie here.',        'Can Tho');

-- ---- Admins & Moderators ----
INSERT INTO ADMINS (user_id, admin_level) VALUES
(1, 'SUPER');

INSERT INTO MODERATORS (user_id, assigned_area) VALUES
(2, 'General');

-- ---- Verified users ----
INSERT INTO VERIFIED_USERS (user_id, verified_by) VALUES
(3, 1);

-- ---- Friendships ----
-- user_one_id < user_two_id enforced by CHECK constraint
INSERT INTO FRIENDSHIPS (user_one_id, user_two_id, status, action_user_id) VALUES
(3, 4, 'ACCEPTED', 3),
(3, 5, 'PENDING',  3),
(4, 5, 'ACCEPTED', 4);

-- ---- AUTHORS union ----
INSERT INTO AUTHORS (author_id, author_type, source_id) VALUES
(1, 'USER', 1),
(2, 'USER', 2),
(3, 'USER', 3),
(4, 'USER', 4),
(5, 'USER', 5);

-- ---- Posts ----
INSERT INTO POSTS (post_id, author_id, content, visibility, post_type) VALUES
(1, 3, 'Hello world! This is my first post.',            'PUBLIC',  'ORIGINAL'),
(2, 4, 'Good morning everyone!',                         'FRIENDS', 'ORIGINAL'),
(3, 3, 'Sharing Bob''s post because it''s great.',       'PUBLIC',  'SHARE'),
(4, 5, 'Anyone up for a meetup this weekend?',           'PUBLIC',  'ORIGINAL');

UPDATE POSTS SET parent_post_id = 2 WHERE post_id = 3;

-- ---- COMMENT_REACTION_TARGETS for posts ----
INSERT INTO COMMENT_REACTION_TARGETS (target_id, target_type, source_id) VALUES
(1, 'POST', 1),
(2, 'POST', 2),
(3, 'POST', 3),
(4, 'POST', 4);

-- ---- Reactions ----
INSERT INTO REACTIONS (target_id, reactor_user_id, reaction_type) VALUES
(1, 4, 'LIKE'),
(1, 5, 'LOVE'),
(2, 3, 'LIKE'),
(4, 3, 'LIKE'),
(4, 4, 'HAHA');

-- ---- Comments ----
INSERT INTO COMMENTS (comment_id, commenter_user_id, target_id, content) VALUES
(1, 4, 1, 'Welcome Alice!'),
(2, 5, 1, 'Great first post!'),
(3, 3, 2, 'Good morning Bob!');

-- ---- COMMENT_REACTION_TARGETS for comments ----
INSERT INTO COMMENT_REACTION_TARGETS (target_id, target_type, source_id) VALUES
(5, 'COMMENT', 1),
(6, 'COMMENT', 2),
(7, 'COMMENT', 3);

-- ---- Pages ----
INSERT INTO PAGES (page_id, name, username, bio, created_by_user_id) VALUES
(1, 'Tech Vietnam', 'techvn', 'Vietnam tech community', 1),
(2, 'Food Lovers',  'foodlv', 'Share your food photos',  3);

INSERT INTO AUTHORS (author_id, author_type, source_id) VALUES
(6, 'PAGE', 1),
(7, 'PAGE', 2);

INSERT INTO PAGE_ROLES (page_id, user_id, role) VALUES
(1, 1, 'ADMIN'),
(1, 2, 'MODERATOR'),
(2, 3, 'ADMIN');

INSERT INTO PAGE_ROLE_ADMINS (page_id, user_id) VALUES (1, 1), (2, 3);

-- ---- Groups ----
INSERT INTO `GROUPS` (group_id, name, description, privacy, creator_user_id) VALUES
(1, 'Database Study Group', 'For HK252 database assignment', 'PRIVATE', 3),
(2, 'Foodies HCMC',         'Food lovers in Ho Chi Minh City', 'PUBLIC', 4);

INSERT INTO EVENT_ACTORS (actor_id, actor_type, source_id) VALUES
(1, 'USER',  1), (2, 'USER',  2), (3, 'USER',  3),
(4, 'USER',  4), (5, 'USER',  5),
(6, 'PAGE',  1), (7, 'PAGE',  2),
(8, 'GROUP', 1), (9, 'GROUP', 2);

INSERT INTO GROUP_MEMBERSHIPS (group_id, user_id, role, status) VALUES
(1, 3, 'ADMIN',  'JOINED'),
(1, 4, 'MEMBER', 'JOINED'),
(1, 5, 'MEMBER', 'PENDING'),
(2, 4, 'ADMIN',  'JOINED'),
(2, 3, 'MEMBER', 'JOINED');

-- ---- Events ----
INSERT INTO EVENTS (event_id, title, host_actor_id, start_time, end_time, visibility) VALUES
(1, 'DB Study Session #1', 8, '2026-04-15 18:00:00', '2026-04-15 20:00:00', 'PRIVATE'),
(2, 'HCMC Food Festival',  9, '2026-04-20 10:00:00', '2026-04-20 22:00:00', 'PUBLIC');

INSERT INTO EVENT_PARTICIPANTS (event_id, user_id, status) VALUES
(1, 3, 'GOING'),
(1, 4, 'GOING'),
(1, 5, 'INTERESTED'),
(2, 3, 'INTERESTED'),
(2, 4, 'GOING');
