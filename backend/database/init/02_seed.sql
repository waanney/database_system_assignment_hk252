-- ============================================================
-- SEED DATA (development / testing only)
-- Expanded from docs/version-1/add_data.sql → current schema
-- ============================================================
USE PHOBODTB;

-- ---- Users (15) — phone 10 số, email hợp lệ CHECK, DOB ≥ 18 tuổi ----
INSERT INTO USERS (user_id, email, phone_number, password_hash, first_name, last_name, gender, date_of_birth) VALUES
(1,  'admin@example.com',      '0900000001', '$2b$12$hashAdmin',   'Super',   'Admin',   'UNSPECIFIED', '1990-01-01'),
(2,  'alice@example.com',      '0900000002', '$2b$12$hashAlice',   'Alice',   'Nguyen',  'FEMALE',      '1998-05-12'),
(3,  'bob@example.com',        '0900000003', '$2b$12$hashBob',     'Bob',     'Tran',    'MALE',        '1997-08-20'),
(4,  'charlie@example.com',    '0900000004', '$2b$12$hashCharlie', 'Charlie', 'Le',      'MALE',        '1999-03-15'),
(5,  'diana@example.com',      '0900000005', '$2b$12$hashDiana',   'Diana',   'Pham',    'FEMALE',      '2000-11-30'),
(6,  'eve@example.com',        '0900000006', '$2b$12$hashEve',     'Eve',     'Adams',   'FEMALE',      '1999-12-15'),
(7,  'frank@example.com',      '0900000007', '$2b$12$hashFrank',   'Frank',   'Castle',  'OTHER',       '1985-03-22'),
(8,  'grace@example.com',      '0900000008', '$2b$12$hashGrace',   'Grace',   'Hopper',  'OTHER',       '1991-09-09'),
(9,  'hank@example.com',       '0900000009', '$2b$12$hashHank',    'Hank',    'Pym',     'MALE',        '1980-01-30'),
(10, 'ivy@example.com',        '0900000010', '$2b$12$hashIvy',     'Ivy',     'Poison',  'FEMALE',      '1996-06-06'),
(11, 'jack@example.com',       '0900000011', '$2b$12$hashJack',     'Jack',    'Sparrow', 'OTHER',       '1989-10-31'),
(12, 'kelly@example.com',      '0900000012', '$2b$12$hashKelly',    'Kelly',   'Tran',    'FEMALE',      '1994-04-04'),
(13, 'leo@example.com',        '0900000013', '$2b$12$hashLeo',      'Leo',     'Pham',    'MALE',        '1993-07-19'),
(14, 'mia@example.com',        '0900000014', '$2b$12$hashMia',      'Mia',     'Vo',      'FEMALE',      '1995-01-25'),
(15, 'noah@example.com',       '0900000015', '$2b$12$hashNoah',     'Noah',    'Dang',    'MALE',        '1992-11-08');

-- ---- User Profiles ----
INSERT INTO USER_PROFILES (user_id, bio, avatar_url, cover_page_url) VALUES
(1,  'System administrator.',                    NULL,                                              NULL),
(2,  'Hello, I am Alice!',                       'https://cdn.example.com/avatars/alice.jpg',       'https://cdn.example.com/covers/alice.jpg'),
(3,  'Just Bob.',                                'https://cdn.example.com/avatars/bob.jpg',         'https://cdn.example.com/covers/bob.jpg'),
(4,  'Charlie here.',                            NULL,                                              NULL),
(5,  'Diana from the south.',                    'https://cdn.example.com/avatars/diana.jpg',     'https://cdn.example.com/covers/diana.jpg'),
(6,  'Just here for the memes.',                 'https://cdn.example.com/avatars/eve.jpg',       'https://cdn.example.com/covers/eve.jpg'),
(7,  'Coffee and code.',                         'https://cdn.example.com/avatars/frank.jpg',     NULL),
(8,  'Software engineer.',                       'https://cdn.example.com/avatars/grace.jpg',     'https://cdn.example.com/covers/grace.jpg'),
(9,  'Physics and tiny things.',                 NULL,                                              'https://cdn.example.com/covers/hank.jpg'),
(10, 'Nature first.',                            'https://cdn.example.com/avatars/ivy.jpg',       NULL),
(11, 'Sailing the digital seas.',                'https://cdn.example.com/avatars/jack.jpg',      'https://cdn.example.com/covers/jack.jpg'),
(12, 'Avid reader.',                             NULL,                                              NULL),
(13, 'Weekend cyclist.',                         'https://cdn.example.com/avatars/leo.jpg',       NULL),
(14, 'Foodie in HCMC.',                          'https://cdn.example.com/avatars/mia.jpg',       'https://cdn.example.com/covers/mia.jpg'),
(15, 'Database course HK252.',                   NULL,                                              NULL);

-- ---- Admins ----
INSERT INTO ADMINS (user_id, admin_level) VALUES
(1, 'SUPER'),
(3, 'STANDARD'),
(4, 'STANDARD'),
(5, 'STANDARD'),
(7, 'STANDARD'),
(9, 'STANDARD');

-- ---- Verified Users ----
INSERT INTO VERIFIED_USERS (user_id) VALUES
(2), (3), (4), (5), (6), (7), (8), (9);

-- ---- Verification Docs ----
INSERT INTO VERIFICATION_DOCS (user_id, document_url, status) VALUES
(2, 'https://cdn.example.com/docs/alice_id.pdf',       'APPROVED'),
(2, 'https://cdn.example.com/docs/alice_passport.pdf', 'APPROVED'),
(3, 'https://cdn.example.com/docs/bob_cccd.pdf',       'APPROVED'),
(3, 'https://cdn.example.com/docs/bob_passport.pdf',   'APPROVED'),
(4, 'https://cdn.example.com/docs/charlie_id.pdf',     'PENDING'),
(4, 'https://cdn.example.com/docs/charlie_dl.pdf',     'REJECTED'),
(5, 'https://cdn.example.com/docs/diana_id.pdf',       'APPROVED'),
(6, 'https://cdn.example.com/docs/eve_passport.pdf',   'PENDING'),
(7, 'https://cdn.example.com/docs/frank_id.pdf',       'APPROVED'),
(8, 'https://cdn.example.com/docs/grace_id.pdf',       'APPROVED');

-- ---- Friendships (chỉ PENDING / ACCEPTED; không tạo cặp đảo chiều) ----
INSERT INTO FRIENDSHIPS (sender_id, receiver_id, status) VALUES
(2, 3, 'ACCEPTED'),
(2, 4, 'ACCEPTED'),
(3, 5, 'PENDING'),
(4, 5, 'ACCEPTED'),
(2, 6, 'ACCEPTED'),
(6, 7, 'PENDING'),
(7, 8, 'ACCEPTED'),
(8, 9, 'ACCEPTED'),
(9, 10, 'PENDING'),
(10, 11, 'ACCEPTED'),
(11, 12, 'PENDING'),
(12, 13, 'ACCEPTED'),
(13, 14, 'ACCEPTED'),
(14, 15, 'PENDING'),
(5, 6, 'PENDING'),
(3, 8, 'ACCEPTED');

-- ---- Posts ----
INSERT INTO POSTS (post_id, user_id, content, visibility) VALUES
(1,  2,  'Hello world! This is my first post.',                    'PUBLIC'),
(2,  3,  'Good morning everyone!',                                 'FRIENDS'),
(3,  4,  'Anyone up for a meetup this weekend?',                   'PUBLIC'),
(4,  5,  'Beautiful sunset today 🌅',                             'PUBLIC'),
(5,  6,  'Sharing thoughts on the new DB assignment.',           'PUBLIC'),
(6,  7,  'Coffee shop recommendations downtown?',                  'FRIENDS'),
(7,  8,  'Shipped a big feature today.',                           'PUBLIC'),
(8,  9,  'Tiny things matter.',                                    'PRIVATE'),
(9,  10, 'Park cleanup this Saturday — who is in?',                'PUBLIC'),
(10, 11, 'Sea stories (thread) 🏴‍☠️',                               'PUBLIC'),
(11, 12, 'Finished another novel, ask me anything.',               'FRIENDS'),
(12, 13, 'Cycling route along the river.',                         'PUBLIC'),
(13, 14, 'Hidden banh mi spot near District 3.',                    'PUBLIC'),
(14, 15, 'Normalization saves friendships.',                       'PUBLIC'),
(15, 2,  'Reminder: backup your database before demo day.',        'PUBLIC');

-- ---- Shared Posts (post_id ≠ parent_post_id) ----
INSERT INTO SHARED_POSTS (post_id, parent_post_id) VALUES
(3, 1),
(6, 2),
(7, 1),
(8, 4),
(9, 5),
(10, 3);

-- ---- Tags ----
INSERT INTO TAG (user_id, post_id) VALUES
(3, 1),
(4, 2),
(5, 4),
(6, 5),
(7, 6),
(8, 7),
(9, 8),
(10, 9),
(11, 10),
(12, 11);

-- ---- Reactions (PK user_id, post_id — mỗi cặp một lần) ----
INSERT INTO REACTIONS (user_id, post_id, react_type) VALUES
(3, 1, 'LIKE'),
(4, 1, 'LOVE'),
(2, 2, 'HAHA'),
(5, 3, 'LIKE'),
(2, 4, 'LOVE'),
(6, 1, 'WOW'),
(7, 2, 'LIKE'),
(8, 5, 'LOVE'),
(9, 7, 'HAHA'),
(10, 8, 'LIKE'),
(11, 9, 'WOW'),
(12, 10, 'LIKE'),
(13, 11, 'LOVE'),
(14, 12, 'HAHA'),
(15, 13, 'LIKE');

-- ---- Comments ----
INSERT INTO COMMENTS (user_id, post_id, content) VALUES
(3, 1, 'Welcome Alice!'),
(4, 1, 'Great first post!'),
(2, 2, 'Good morning Bob!'),
(5, 3, 'I am in! Where do we meet?'),
(6, 5, 'Solid take on indexes.'),
(7, 6, 'Try the one on Nguyen Hue.'),
(8, 7, 'Congrats on the launch!'),
(9, 8, 'Agreed — measure twice.'),
(10, 9, 'I can bring gloves.'),
(11, 10, 'Following for part 2.'),
(12, 11, 'Which genre next?'),
(13, 12, 'Saving this route.'),
(14, 13, 'Adding to my list.'),
(15, 14, 'Third normal form for life.');

-- ---- Reports ----
INSERT INTO REPORTS (report_id, user_id, post_id, reason, status) VALUES
(1, 2, 4,  'This post contains inappropriate content.', 'PENDING'),
(2, 3, 3,  'Suspected spam.',                           'REVIEWED'),
(3, 4, 6,  'Spam content.',                             'PENDING'),
(4, 5, 7,  'Inappropriate language.',                   'ACTION_TAKEN'),
(5, 6, 8,  'Harassment.',                               'REVIEWED'),
(6, 7, 9,  'False report (duplicate).',                 'DISMISSED'),
(7, 8, 10, 'Copyright concern.',                        'PENDING');

-- ---- Review Reports ----
INSERT INTO REVIEW_REPORTS (report_id, admin_id) VALUES
(2, 1),
(4, 3),
(5, 4),
(6, 5),
(7, 7);

-- ---- Groups ----
INSERT INTO `GROUPS` (group_id, name, description, owner_id) VALUES
(1, 'Database Study Group',     'For HK252 database assignment',           2),
(2, 'HCMC Food Lovers',         'Share food spots in HCMC',                3),
(3, 'Tech Enthusiasts',         'Latest in technology and tools.',        6),
(4, 'Book Club',                'Monthly reading and discussions.',         12),
(5, 'Gamers Unite',             'Co-op and reviews.',                     11),
(6, 'Fitness Freaks',           'Workout routines and tips.',             14);

-- ---- Memberships (owner đã có trong seed; trigger chỉ áp dụng insert sau khi init) ----
INSERT INTO MEMBERSHIPS (group_id, user_id) VALUES
(1, 2), (1, 3), (1, 4), (1, 5),
(2, 3), (2, 5), (2, 14),
(3, 6), (3, 7), (3, 8), (3, 9),
(4, 12), (4, 2), (4, 13), (4, 14),
(5, 11), (5, 10), (5, 3), (5, 15),
(6, 14), (6, 5), (6, 13), (6, 4), (6, 12);

-- ---- Group Rules ----
INSERT INTO GROUP_RULES (group_id, rule_id, title, description) VALUES
(1, 1, 'Be respectful',      'Treat all members with respect.'),
(1, 2, 'No spam',            'Do not post irrelevant content.'),
(2, 1, 'Food posts only',    'Only share food-related content.'),
(2, 2, 'Credit your source', 'Always credit the original creator.'),
(3, 1, 'No spamming',        'Do not post promotional links.'),
(3, 2, 'Stay on topic',      'Keep threads technical.'),
(4, 1, 'No spoilers',        'Use spoiler tags for plot twists.'),
(4, 2, 'Be respectful',      'Kind discussion only.'),
(5, 1, 'No toxicity',        'Keep competitive talk friendly.'),
(5, 2, 'Tag your platform',  'Mention PC/console when relevant.'),
(6, 1, 'Share routines',     'Post details when you share workouts.'),
(6, 2, 'Safety first',       'No dangerous challenges.');
