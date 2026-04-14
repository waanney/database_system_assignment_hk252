-- Migrated / superseded for the HK252 project: canonical seed is
-- backend/database/init/02_seed.sql (schema PHOBODTB: USERS, `GROUPS`, …).
-- This file kept for history; it targets an older table/column naming scheme.
--
-- Note: Birthdates are set to ensure the age constraint (> 18) is met.
INSERT INTO USER (EMAIL, GENDER, FIRST_NAME, LAST_NAME, PASSWORD_HASH, DATE_OF_BIRTH, PHONE_NUMBER) VALUES
('alice.smith@example.com', 'FEMALE', 'Alice', 'Smith', 'hashed_pw_1', '1992-05-14', '1234567890'),
('bob.jones@example.com', 'MALE', 'Bob', 'Jones', 'hashed_pw_2', '1988-11-20', '1234567891'),
('charlie.brown@example.com', 'MALE', 'Charlie', 'Brown', 'hashed_pw_3', '1995-02-10', '1234567892'),
('diana.prince@example.com', 'FEMALE', 'Diana', 'Prince', 'hashed_pw_4', '1990-07-01', '1234567893'),
('eve.adams@example.com', 'FEMALE', 'Eve', 'Adams', 'hashed_pw_5', '1999-12-15', '1234567894'),
('frank.castle@example.com', 'PREFER_NOT_TO_SAY', 'Frank', 'Castle', 'hashed_pw_6', '1985-03-22', '1234567895'),
('grace.hopper@example.com', 'OTHER', 'Grace', 'Hopper', 'hashed_pw_7', '1991-09-09', '1234567896'),
('hank.pym@example.com', 'MALE', 'Hank', 'Pym', 'hashed_pw_8', '1980-01-30', '1234567897'),
('ivy.poison@example.com', 'FEMALE', 'Ivy', 'Poison', 'hashed_pw_9', '1996-06-06', '1234567898'),
('jack.sparrow@example.com', 'OTHER', 'Jack', 'Sparrow', 'hashed_pw_10', '1989-10-31', '1234567899');
('taylor.swift@example.com', 'FEMALE', 'Taylor', 'Swift', 'hashed_pw_11', '1989-12-13', '1234561989');

INSERT INTO USER_PROFILE (BIO, COVER_PAGE_URL, AVATAR_URL, USER_ID) VALUES
('Professional Capcut Editor. Check out my work: Elizabeth Taylor MV.', 'https://example.com/covers/et.jpg', 'https://example.com/avatars/et.jpg', 11),
('Software engineer and coffee enthusiast.', 'https://example.com/covers/alice.jpg', 'https://example.com/avatars/alice.jpg', 1),
('Avid reader and gamer.', 'https://example.com/covers/bob.jpg', 'https://example.com/avatars/bob.jpg', 2),
('Traveling the world one country at a time.', 'https://example.com/covers/charlie.jpg', 'https://example.com/avatars/charlie.jpg', 3),
('Fitness coach.', 'https://example.com/covers/diana.jpg', 'https://example.com/avatars/diana.jpg', 4),
('Just here for the memes.', 'https://example.com/covers/eve.jpg', 'https://example.com/avatars/eve.jpg', 5);

INSERT INTO ADMIN (USER_ID, ADMIN_LEVEL) VALUES
(6, 1),
(7, 2),
(8, 3),
(9, 4),
(10, 5);

INSERT INTO VERIFIED_USER (USER_ID) VALUES
(1),
(2),
(3),
(4),
(5),
(7);

-- If A -> B is in table, B -> A is not in table.
INSERT INTO FRIENDSHIP (SENDER_ID, RECEIVER_ID, STATUS) VALUES
(1, 2, 'ACCEPTED'),
(2, 3, 'PENDING'),
(3, 4, 'ACCEPTED'),
(4, 5, 'DECLINED'),
(5, 6, 'BLOCKED');

-- Write trigger to add owner to membership when group is created. Owner is not currently added to membership.
INSERT INTO `GROUP` (NAME, DESCRIPTION, OWNER_ID) VALUES
('Tech Enthusiasts', 'A place to discuss the latest in technology.', 1),
('Book Club', 'Monthly reading assignments and discussions.', 2),
('Gamers Unite', 'Looking for group and game reviews.', 3),
('Fitness Freaks', 'Share your workout routines and tips.', 4),
('Travel Buddies', 'Share your travel stories and pictures.', 5);

INSERT INTO POST (VISIBILITY, CONTENT, USER_ID) VALUES
('PUBLIC', 'Hello world! This is my first post.', 1),
('FRIENDS_ONLY', 'Just had a great lunch at the new cafe.', 2),
('PRIVATE', 'Note to self: buy milk.', 3),
('PUBLIC', 'Check out this new game I just bought.', 4),
('PUBLIC', 'What a beautiful sunset today.', 5),
('PUBLIC', 'Sharing this awesome post from Alice.', 6),
('PUBLIC', 'Bob makes a good point here.', 7),
('PUBLIC', 'Look at this!', 8),
('PUBLIC', 'Highly recommend checking this out.', 9),
('PUBLIC', 'Can you believe this?', 10);

INSERT INTO VERIFICATION_DOCS (USER_ID, DOCUMENT_URL, STATUS) VALUES
(1, 'https://example.com/docs/alice_id.pdf', 'APPROVED'),
(1, 'https://example.com/docs/alice_passport.pdf', 'APPROVED'),
(2, 'https://example.com/docs/bob_id.pdf', 'APPROVED'),
(2, 'https://example.com/docs/bob_passport.pdf', 'APPROVED'),
(4, 'https://example.com/docs/diana_id.pdf', 'REJECTED'),
(5, 'https://example.com/docs/eve_passport.pdf', 'PENDING');

INSERT INTO GROUP_RULE (GROUP_ID, TITLE, DESCRIPTION) VALUES
(1, 'No spamming', 'Do not post promotional links or spam the feed.'),
(2, 'Be respectful', 'Treat all members with respect and kindness.'),
(2, 'No spamming', 'Do not post promotional links or spam the feed.'),
(3, 'No spoilers', 'Use spoiler tags when discussing story elements.'),
(4, 'Share routines', 'Please share your detailed workout routines.'),
(4, 'Be respectful', 'Treat all members with respect and kindness.');

-- Write trigger to add owner to membership when group is created. Owner is not currently added to membership.
INSERT INTO MEMBERSHIP (GROUP_ID, USER_ID) VALUES
(1, 2),
(1, 3),
(2, 4),
(3, 5),
(4, 1);

-- Ensure PARENT_POST_ID is not the same as POST_ID
INSERT INTO SHARED_POST (POST_ID, PARENT_POST_ID) VALUES
(6, 1),
(7, 2),
(8, 3),
(9, 4),
(10, 5);

INSERT INTO TAG (USER_ID, POST_ID) VALUES
(2, 1),
(3, 2),
(4, 4),
(5, 5),
(1, 6);

INSERT INTO REACT (USER_ID, POST_ID, REACT_TYPE) VALUES
(2, 1, 'LIKE'),
(3, 2, 'LOVE'),
(4, 4, 'WOW'),
(5, 5, 'HAHA'),
(1, 6, 'LIKE');

INSERT INTO COMMENT (CONTENT, USER_ID, POST_ID) VALUES
('Great post!', 2, 1),
('Looks delicious, where is that?', 3, 2),
('Awesome game, I play it too!', 9, 4),
('Where was this picture taken?', 11, 5),
('Thanks for sharing!', 1, 6);

INSERT INTO REPORT (STATUS, REASON, USER_ID, POST_ID) VALUES
('PENDING', 'Spam content', 2, 6),
('IN_REVIEW', 'Inappropriate language', 3, 7),
('RESOLVED', 'Harassment', 4, 8),
('DISMISSED', 'False report', 5, 9),
('PENDING', 'Copyright violation', 1, 10);

INSERT INTO REVIEW_REPORT (REPORT_ID, ADMIN_ID) VALUES
(1, 6),
(2, 7),
(3, 8),
(4, 9),
(5, 10);