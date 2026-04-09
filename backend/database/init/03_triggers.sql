-- ============================================================
-- 2.2 TRIGGERS IMPLEMENTATION
-- This script adds necessary columns, initializes them, 
-- and creates triggers for business constraints and derived attributes.
-- ============================================================

-- USE db_assignment;

-- ------------------------------------------------------------
-- INITIALIZATION: Add columns for derived attributes
-- ------------------------------------------------------------

-- Add B: reaction_count to POSTS
ALTER TABLE POSTS ADD COLUMN reaction_count INT NOT NULL DEFAULT 0;

-- Add A: total_received_reactions to USERS
ALTER TABLE USERS ADD COLUMN total_received_reactions INT NOT NULL DEFAULT 0;

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

-- Sync A: Calculate total received reactions for each user
UPDATE USERS u
SET u.total_received_reactions = (
    SELECT COALESCE(SUM(p.reaction_count), 0)
    FROM POSTS p 
    WHERE p.user_id = u.user_id
);


DELIMITER //

-- ============================================================
-- 2.2.1 BUSINESS CONSTRAINT TRIGGER
-- Constraint: A user cannot report their own post.
-- ============================================================

CREATE TRIGGER tg_check_report_self
BEFORE INSERT ON REPORTS
FOR EACH ROW
BEGIN
    DECLARE v_post_owner_id BIGINT;
    
    -- Find the owner of the post being reported
    SELECT user_id INTO v_post_owner_id 
    FROM POSTS 
    WHERE post_id = NEW.post_id;
    
    -- Violation check
    IF NEW.user_id = v_post_owner_id THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Business Constraint Violation: Post owners are not allowed to report their own content.';
    END IF;
END //

-- Also handle UPDATE just in case someone tries to change the reporter or post_id
CREATE TRIGGER tg_check_report_self_update
BEFORE UPDATE ON REPORTS
FOR EACH ROW
BEGIN
    DECLARE v_post_owner_id BIGINT;
    
    SELECT user_id INTO v_post_owner_id 
    FROM POSTS 
    WHERE post_id = NEW.post_id;
    
    IF NEW.user_id = v_post_owner_id THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Business Constraint Violation: Post owners are not allowed to report their own content.';
    END IF;
END //


-- ============================================================
-- 2.2.2 DERIVED ATTRIBUTE TRIGGERS
-- Attribute B: POSTS.reaction_count
-- Attribute A: USERS.total_received_reactions (depends on B)
-- ============================================================

-- TRIGGER: AFTER INSERT ON REACTIONS
-- Automatically updates the reaction count for the post and the owner
CREATE TRIGGER tg_after_insert_reaction
AFTER INSERT ON REACTIONS
FOR EACH ROW
BEGIN
    DECLARE v_post_owner_id BIGINT;

    -- 1. Compute/Update B: Increment post's reaction count
    UPDATE POSTS 
    SET reaction_count = reaction_count + 1 
    WHERE post_id = NEW.post_id;

    -- 2. Compute/Update A: Increment user's total popularity
    -- Note: We first find the owner of the post that received the reaction
    SELECT user_id INTO v_post_owner_id 
    FROM POSTS 
    WHERE post_id = NEW.post_id;
    
    UPDATE USERS 
    SET total_received_reactions = total_received_reactions + 1 
    WHERE user_id = v_post_owner_id;
END //

-- TRIGGER: AFTER DELETE ON REACTIONS
-- Automatically updates the reaction count for the post and the owner
CREATE TRIGGER tg_after_delete_reaction
AFTER DELETE ON REACTIONS
FOR EACH ROW
BEGIN
    DECLARE v_post_owner_id BIGINT;

    -- 1. Update B: Decrement post's reaction count
    UPDATE POSTS 
    SET reaction_count = reaction_count - 1 
    WHERE post_id = OLD.post_id;

    -- 2. Update A: Decrement user's total popularity
    SELECT user_id INTO v_post_owner_id 
    FROM POSTS 
    WHERE post_id = OLD.post_id;
    
    UPDATE USERS 
    SET total_received_reactions = total_received_reactions - 1 
    WHERE user_id = v_post_owner_id;
END //

DELIMITER ;