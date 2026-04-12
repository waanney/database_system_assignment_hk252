-- ============================================================
-- 2.2 TRIGGERS IMPLEMENTATION
-- This script adds necessary columns, initializes them, 
-- and creates triggers for business constraints and derived attributes.
-- ============================================================

Using PHOBODTB;

-- ------------------------------------------------------------
-- INITIALIZATION: Add columns for derived attributes
-- ------------------------------------------------------------

-- Add B: reaction_count to POSTS
ALTER TABLE POSTS ADD COLUMN reaction_count INT NOT NULL DEFAULT 0;

-- Add C: age to USERS (Materialized Derived Attribute)
ALTER TABLE USERS ADD COLUMN age INT;

-- ------------------------------------------------------------
-- SYNC: Update initial values for existing seed data
-- ------------------------------------------------------------

-- Sync B: Calculate counts from existing REACTIONS
UPDATE POSTS p
SET p.reaction_count = (
    SELECT COUNT(*) 
    FROM REACTIONS r 
    WHERE r.post_id = p.post_id
);

-- Sync C: Calculate age from existing USERS
UPDATE USERS 
SET age = TIMESTAMPDIFF(YEAR, date_of_birth, CURDATE()) 
WHERE date_of_birth IS NOT NULL;


DELIMITER //

-- ============================================================
-- 2.2.1 BUSINESS CONSTRAINT TRIGGERS (REPORTS)
-- Constraint 1: A user cannot report their own post.
-- Constraint 2: A user can report a specific post only once.
-- ============================================================

-- TRIGGER: BEFORE INSERT ON REPORTS
-- Prevent self-reporting and duplicate reports
CREATE TRIGGER tg_check_report_self
BEFORE INSERT ON REPORTS
FOR EACH ROW
BEGIN
    DECLARE v_post_owner_id BIGINT;
    DECLARE v_duplicate_report_count INT DEFAULT 0;
    
    -- Find the owner of the post being reported
    SELECT user_id INTO v_post_owner_id 
    FROM POSTS 
    WHERE post_id = NEW.post_id;
    
    -- Violation check
    IF NEW.user_id = v_post_owner_id THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Post owners are not allowed to report their own content.';
    END IF;

    -- A user should not create multiple reports for the same post
    SELECT COUNT(*) INTO v_duplicate_report_count
    FROM REPORTS
    WHERE user_id = NEW.user_id
      AND post_id = NEW.post_id;

    IF v_duplicate_report_count > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'A user can report the same post only once.';
    END IF;
END //

-- TRIGGER: BEFORE UPDATE ON REPORTS
-- Prevent self-reporting and duplicate reports after edits
CREATE TRIGGER tg_check_report_self_update
BEFORE UPDATE ON REPORTS
FOR EACH ROW
BEGIN
    DECLARE v_post_owner_id BIGINT;
    DECLARE v_duplicate_report_count INT DEFAULT 0;
    
    SELECT user_id INTO v_post_owner_id 
    FROM POSTS 
    WHERE post_id = NEW.post_id;
    
    IF NEW.user_id = v_post_owner_id THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Post owners are not allowed to report their own content.';
    END IF;

    -- A user should not update a report into a duplicated (user_id, post_id) pair
    SELECT COUNT(*) INTO v_duplicate_report_count
    FROM REPORTS
    WHERE user_id = NEW.user_id
      AND post_id = NEW.post_id
      AND report_id <> OLD.report_id;

    IF v_duplicate_report_count > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'A user can report the same post only once.';
    END IF;
END //


-- ============================================================
-- 2.2.2 BUSINESS CONSTRAINT TRIGGERS (FRIENDSHIPS)
-- Constraint 3: If (A -> B) exists, (B -> A) must not exist.
-- ============================================================

-- TRIGGER: BEFORE INSERT ON FRIENDSHIPS
-- Prevent reciprocal duplicate friendship records
CREATE TRIGGER tg_check_friendship_reverse_insert
BEFORE INSERT ON FRIENDSHIPS
FOR EACH ROW
BEGIN
    DECLARE v_reverse_count INT DEFAULT 0;

    SELECT COUNT(*) INTO v_reverse_count
    FROM FRIENDSHIPS
    WHERE sender_id = NEW.receiver_id
      AND receiver_id = NEW.sender_id;

    IF v_reverse_count > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Reciprocal friendship entries (A->B and B->A) are not allowed.';
    END IF;
END //

-- TRIGGER: BEFORE UPDATE ON FRIENDSHIPS
-- Prevent updates that create reciprocal duplicate friendship records
CREATE TRIGGER tg_check_friendship_reverse_update
BEFORE UPDATE ON FRIENDSHIPS
FOR EACH ROW
BEGIN
    DECLARE v_reverse_count INT DEFAULT 0;

    SELECT COUNT(*) INTO v_reverse_count
    FROM FRIENDSHIPS
    WHERE sender_id = NEW.receiver_id
      AND receiver_id = NEW.sender_id;

    IF v_reverse_count > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Reciprocal friendship entries (A->B and B->A) are not allowed.';
    END IF;
END //


-- ============================================================
-- 2.2.3 BUSINESS CONSTRAINT TRIGGERS (GROUPS & MEMBERSHIPS)
-- Constraint 4: Group owner must always be a member of the group.
-- Constraint 5: MEMBERSHIPS.joined_at cannot be earlier than GROUPS.created_at.
-- ============================================================

-- TRIGGER: AFTER INSERT ON GROUPS
-- Automatically add owner into MEMBERSHIPS when a group is created
CREATE TRIGGER tg_after_insert_group_owner_membership
AFTER INSERT ON GROUPS
FOR EACH ROW
BEGIN
    INSERT IGNORE INTO MEMBERSHIPS (group_id, user_id)
    VALUES (NEW.group_id, NEW.owner_id);
END //

-- TRIGGER: AFTER UPDATE ON GROUPS
-- Ensure the (new) owner is also a member whenever owner_id changes
CREATE TRIGGER tg_after_update_group_owner_membership
AFTER UPDATE ON GROUPS
FOR EACH ROW
BEGIN
    IF NEW.owner_id <> OLD.owner_id THEN
        INSERT IGNORE INTO MEMBERSHIPS (group_id, user_id)
        VALUES (NEW.group_id, NEW.owner_id);
    END IF;
END //

-- TRIGGER: BEFORE DELETE ON MEMBERSHIPS
-- Prevent deleting the membership row of the current group owner
CREATE TRIGGER tg_check_owner_membership_delete
BEFORE DELETE ON MEMBERSHIPS
FOR EACH ROW
BEGIN
    DECLARE v_owner_id BIGINT;

    SELECT owner_id INTO v_owner_id
    FROM GROUPS
    WHERE group_id = OLD.group_id;

    IF v_owner_id = OLD.user_id THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Group owner membership cannot be deleted.';
    END IF;
END //

-- TRIGGER: BEFORE INSERT ON MEMBERSHIPS
-- Ensure joined_at is not earlier than the group's created_at
CREATE TRIGGER tg_check_membership_joined_at_insert
BEFORE INSERT ON MEMBERSHIPS
FOR EACH ROW
BEGIN
    DECLARE v_group_created_at TIMESTAMP;

    IF NEW.joined_at IS NULL THEN
        SET NEW.joined_at = CURRENT_TIMESTAMP;
    END IF;

    SELECT created_at INTO v_group_created_at
    FROM GROUPS
    WHERE group_id = NEW.group_id;

    IF NEW.joined_at < v_group_created_at THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Membership joined_at must be on or after group created_at.';
    END IF;
END //

-- TRIGGER: BEFORE UPDATE ON MEMBERSHIPS
-- Ensure joined_at is not earlier than the group's created_at after edits
CREATE TRIGGER tg_check_membership_joined_at_update
BEFORE UPDATE ON MEMBERSHIPS
FOR EACH ROW
BEGIN
    DECLARE v_group_created_at TIMESTAMP;

    SELECT created_at INTO v_group_created_at
    FROM GROUPS
    WHERE group_id = NEW.group_id;

    IF NEW.joined_at < v_group_created_at THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Membership joined_at must be on or after group created_at.';
    END IF;
END //


-- ============================================================
-- 2.2.4 DERIVED ATTRIBUTE TRIGGERS
-- Attribute B: POSTS.reaction_count
-- ============================================================

-- TRIGGER: AFTER INSERT ON REACTIONS
-- Automatically updates the reaction count for the post
CREATE TRIGGER tg_after_insert_reaction
AFTER INSERT ON REACTIONS
FOR EACH ROW
BEGIN
    -- Increment post's reaction count
    UPDATE POSTS 
    SET reaction_count = reaction_count + 1 
    WHERE post_id = NEW.post_id;
END //

-- TRIGGER: AFTER DELETE ON REACTIONS
-- Automatically updates the reaction count for the post
CREATE TRIGGER tg_after_delete_reaction
AFTER DELETE ON REACTIONS
FOR EACH ROW
BEGIN
    -- Decrement post's reaction count
    UPDATE POSTS 
    SET reaction_count = reaction_count - 1 
    WHERE post_id = OLD.post_id;
END //

-- ============================================================
-- 2.2.5 DERIVED ATTRIBUTE TRIGGERS (USERS)
-- Attribute C: USERS.age
-- ============================================================

-- TRIGGER: BEFORE INSERT ON USERS
-- Automatically calculates the age based on date_of_birth
CREATE TRIGGER tg_users_age_before_insert
BEFORE INSERT ON USERS
FOR EACH ROW
BEGIN
    IF NEW.date_of_birth IS NOT NULL THEN
        SET NEW.age = TIMESTAMPDIFF(YEAR, NEW.date_of_birth, CURDATE());
        
        -- Business Constraint Check: User must be at least 18 years old
        IF NEW.age < 18 THEN
            SIGNAL SQLSTATE '45000' 
            SET MESSAGE_TEXT = 'User must be at least 18 years old.';
        END IF;
    END IF;
END //

-- TRIGGER: BEFORE UPDATE ON USERS
-- Automatically recalculates the age if date_of_birth is changed
CREATE TRIGGER tg_users_age_before_update
BEFORE UPDATE ON USERS
FOR EACH ROW
BEGIN
    IF NEW.date_of_birth IS NOT NULL THEN
        SET NEW.age = TIMESTAMPDIFF(YEAR, NEW.date_of_birth, CURDATE());
        
        -- Business Constraint Check: User must be at least 18 years old
        IF NEW.age < 18 THEN
            SIGNAL SQLSTATE '45000' 
            SET MESSAGE_TEXT = 'User must be at least 18 years old.';
        END IF;
    END IF;
END //

DELIMITER ;

-- 1. Thêm cột member_count và set mặc định
ALTER TABLE GROUPS ADD COLUMN member_count INT NOT NULL DEFAULT 0;

-- 2. Khởi tạo dữ liệu (tính tổng số member hiện có cho từng group)
UPDATE GROUPS g 
SET g.member_count = (
    SELECT COUNT(*) FROM MEMBERSHIPS m WHERE m.group_id = g.group_id
);

-- Bật DELIMITER để viết cấu trúc BEGIN...END cho Trigger
DELIMITER //

-- 3. Trigger cộng member_count khi có người JOIN group (INSERT vào MEMBERSHIPS)
CREATE TRIGGER tg_after_insert_membership
AFTER INSERT ON MEMBERSHIPS
FOR EACH ROW
BEGIN 
    UPDATE GROUPS 
    SET member_count = member_count + 1
    WHERE group_id = NEW.group_id;
END //

-- 4. Trigger trừ member_count khi có người LEAVE group (DELETE khỏi MEMBERSHIPS)
CREATE TRIGGER tg_after_delete_membership
AFTER DELETE ON MEMBERSHIPS
FOR EACH ROW
BEGIN 
    UPDATE GROUPS 
    SET member_count = member_count - 1
    WHERE group_id = OLD.group_id;
END //

-- Trả lại DELIMITER mặc định
DELIMITER ;
