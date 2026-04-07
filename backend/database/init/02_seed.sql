-- ============================================================
-- SEED DATA (development / testing only)
-- ============================================================

-- ---- Users ----
INSERT INTO USERS (user_id, email, phone_number, password_hash, first_name, last_name, gender, date_of_birth) VALUES
(1, 'admin@example.com',   '0900000001', '$2b$12$hashAdmin',   'Super',   'Admin',   'UNSPECIFIED', '1990-01-01'),
(2, 'alice@example.com',   '0900000002', '$2b$12$hashAlice',   'Alice',   'Nguyen',  'FEMALE',      '1998-05-12'),
(3, 'bob@example.com',     '0900000003', '$2b$12$hashBob',     'Bob',     'Tran',    'MALE',        '1997-08-20'),
(4, 'charlie@example.com', '0900000004', '$2b$12$hashCharlie', 'Charlie', 'Le',      'MALE',        '1999-03-15'),
(5, 'diana@example.com',   '0900000005', '$2b$12$hashDiana',   'Diana',   'Pham',    'FEMALE',      '2000-11-30');

-- ---- User Profiles ----
INSERT INTO USER_PROFILES (user_id, bio, avatar_url) VALUES
(1, 'System administrator.',      NULL),
(2, 'Hello, I am Alice!',         'https://cdn.example.com/avatars/alice.jpg'),
(3, 'Just Bob.',                  'https://cdn.example.com/avatars/bob.jpg'),
(4, 'Charlie here.',              NULL),
(5, 'Diana from the south.',      'https://cdn.example.com/avatars/diana.jpg');

-- ---- Admins ----
INSERT INTO ADMINS (user_id, admin_level) VALUES
(1, 'SUPER');

-- ---- Verified Users ----
INSERT INTO VERIFIED_USERS (user_id) VALUES
(2),
(3);

-- ---- Verification Docs ----
INSERT INTO VERIFICATION_DOCS (user_id, document_url, status) VALUES
(2, 'https://cdn.example.com/docs/alice_id.pdf',   'APPROVED'),
(3, 'https://cdn.example.com/docs/bob_cccd.pdf',   'APPROVED'),
(4, 'https://cdn.example.com/docs/charlie_id.pdf', 'PENDING');

-- ---- Friendships ----
INSERT INTO FRIENDSHIPS (sender_id, receiver_id, status) VALUES
(2, 3, 'ACCEPTED'),
(2, 4, 'ACCEPTED'),
(3, 5, 'PENDING'),
(4, 5, 'ACCEPTED');

-- ---- Posts ----
INSERT INTO POSTS (post_id, user_id, content, visibility) VALUES
(1, 2, 'Hello world! This is my first post.',   'PUBLIC'),
(2, 3, 'Good morning everyone!',                'FRIENDS'),
(3, 4, 'Anyone up for a meetup this weekend?',  'PUBLIC'),
(4, 5, 'Beautiful sunset today 🌅',             'PUBLIC');

-- ---- Shared Posts ----
INSERT INTO SHARED_POSTS (post_id, parent_post_id) VALUES
(3, 1);

-- ---- Tags (tag users in posts) ----
INSERT INTO TAG (user_id, post_id) VALUES
(3, 1),
(4, 2);

-- ---- Reactions ----
INSERT INTO REACTIONS (user_id, post_id, react_type) VALUES
(3, 1, 'LIKE'),
(4, 1, 'LOVE'),
(2, 2, 'HAHA'),
(5, 3, 'LIKE'),
(2, 4, 'LOVE');

-- ---- Comments ----
INSERT INTO COMMENTS (user_id, post_id, content) VALUES
(3, 1, 'Welcome Alice!'),
(4, 1, 'Great first post!'),
(2, 2, 'Good morning Bob!'),
(5, 3, 'I am in! Where do we meet?');

-- ---- Reports ----
INSERT INTO REPORTS (report_id, user_id, post_id, reason, status) VALUES
(1, 2, 4, 'This post contains inappropriate content.', 'PENDING'),
(2, 3, 3, 'Suspected spam.',                           'REVIEWED');

-- ---- Review Reports (Admin action) ----
INSERT INTO REVIEW_REPORTS (report_id, admin_id) VALUES
(2, 1);

-- ---- Groups ----
INSERT INTO GROUPS (group_id, name, description, owner_id) VALUES
(1, 'Database Study Group', 'For HK252 database assignment', 2),
(2, 'HCMC Food Lovers',     'Share food spots in HCMC',      3);

-- ---- Memberships ----
INSERT INTO MEMBERSHIPS (group_id, user_id) VALUES
(1, 2),
(1, 3),
(1, 4),
(2, 3),
(2, 5);

-- ---- Group Rules ----
INSERT INTO GROUP_RULES (group_id, rule_id, title, description) VALUES
(1, 1, 'Be respectful',      'Treat all members with respect.'),
(1, 2, 'No spam',            'Do not post irrelevant content.'),
(2, 1, 'Food posts only',    'Only share food-related content.'),
(2, 2, 'Credit your source', 'Always credit the original creator.');
