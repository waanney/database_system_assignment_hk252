-- ============================================================
-- ASSIGNMENT REQUIREMENTS: 
-- - Stored procedures for 1 table covering insert, update, delete
-- - Table must have complex conditions 
-- - Derived attribute
-- ============================================================

USE PHOBODTB;

-- The 'age' column is now added in 03_triggers.sql as a materialized derived attribute.

DELIMITER $$

-- ============================================================
-- 1. STORED PROCEDURE: INSERT USER
-- Target Table: USERS
-- Complex Conditions: 
--   - Calculates the 'age' derived attribute from 'date_of_birth'. 
--   - The user must be >= 13 years old to create an account (age logic validation).
--   - The email format must contain an '@' character.
-- ============================================================
DROP PROCEDURE IF EXISTS sp_InsertUser$$
CREATE PROCEDURE sp_InsertUser(
    IN p_email         VARCHAR(255),
    IN p_phone_number  VARCHAR(20),
    IN p_password_hash VARCHAR(255),
    IN p_first_name    VARCHAR(100),
    IN p_last_name     VARCHAR(100),
    IN p_gender        ENUM('MALE','FEMALE','OTHER','UNSPECIFIED'),
    IN p_date_of_birth DATE
)
BEGIN
    DECLARE v_age INT;

    -- Validation 1: Email must be valid
    IF p_email NOT REGEXP '^[^@]+@[^@]+\\.[^@]+$' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid email.';
    END IF;

    IF p_phone_number NOT REGEXP '^[0-9]{10}$' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid phone number: Must be 10 numbers long and contain only numbers';
    END IF;

    -- Validation 2: Complex Condition (Calculated from p_date_of_birth)
    -- This check is required by the assignment guidelines for "Complex Conditions" in procedures.
    SET v_age = TIMESTAMPDIFF(YEAR, p_date_of_birth, CURDATE());
    IF v_age < 18 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Insert rejected: User must be at least 18 years old to register.';
    END IF;

    -- Insert user with validated information.
    -- The 'age' derived attribute column is automatically populated by the BEFORE INSERT trigger.
    INSERT INTO USERS (
        email, phone_number, password_hash, first_name, last_name, gender, date_of_birth
    ) VALUES (
        p_email, p_phone_number, p_password_hash, p_first_name, p_last_name, p_gender, p_date_of_birth
    );
END$$

-- ============================================================
-- 2. STORED PROCEDURE: UPDATE USER
-- Target Table: USERS
-- Complex Conditions: 
--   - Recalculates and updates 'age' (derived attr) if 'date_of_birth' is changed.
--   - Ensures the new age remains >= 13 years old.
-- ============================================================
DROP PROCEDURE IF EXISTS sp_UpdateUser$$
CREATE PROCEDURE sp_UpdateUser(
    IN p_user_id       BIGINT,
    IN p_email         VARCHAR(255),
    IN p_phone_number  VARCHAR(20),
    IN p_password_hash VARCHAR(255),
    IN p_first_name    VARCHAR(100),
    IN p_last_name     VARCHAR(100),
    IN p_gender        ENUM('MALE','FEMALE','OTHER','UNSPECIFIED'),
    IN p_date_of_birth DATE
)
BEGIN
    DECLARE v_age INT;

    -- Complex Condition Check: If date_of_birth is updated, ensure the user remains >= 18 years old.
    IF p_date_of_birth IS NOT NULL THEN
        SET v_age = TIMESTAMPDIFF(YEAR, p_date_of_birth, CURDATE());
        IF v_age < 18 THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Update rejected: User must be at least 18 years old.';
        END IF;
    END IF;

    IF p_email IS NOT NULL AND p_email NOT REGEXP '^[^@]+@[^@]+\\.[^@]+$' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid email.';
    END IF;

    IF p_phone_number IS NOT NULL AND p_phone_number NOT REGEXP '^[0-9]{10}$' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid phone number: Must be 10 numbers long and contain only numbers';
    END IF;
    -- Update information.
    -- The 'age' derived attribute column is automatically refreshed by the BEFORE UPDATE trigger.
    UPDATE USERS
    SET 
        email = COALESCE(p_email, email),
        phone_number = COALESCE(p_phone_number, phone_number),
        password_hash = COALESCE(p_password_hash, password_hash),
        first_name = COALESCE(p_first_name, first_name),
        last_name = COALESCE(p_last_name, last_name),
        gender = COALESCE(p_gender, gender),
        date_of_birth = COALESCE(p_date_of_birth, date_of_birth)
    WHERE user_id = p_user_id;

END$$

-- ============================================================
-- 3. STORED PROCEDURE: DELETE USER
-- Target Table: USERS
-- Complex Conditions: 
--   - Referential Integrity: Prevents deletion if the user is the owner of a group (owner_id in GROUPS table).
--   - System Protection: Prevents deletion if the user account is a SUPER admin (in ADMINS table).
-- ============================================================
DROP PROCEDURE IF EXISTS sp_DeleteUser$$
CREATE PROCEDURE sp_DeleteUser(
    IN p_user_id BIGINT
)
BEGIN
    DECLARE v_is_super_admin INT DEFAULT 0;
    DECLARE v_owned_groups INT DEFAULT 0;

    -- Complex condition check 1: Is the user a SUPER ADMIN?
    SELECT COUNT(*) INTO v_is_super_admin 
    FROM ADMINS 
    WHERE user_id = p_user_id AND admin_level = 'SUPER';

    IF v_is_super_admin > 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Delete rejected: Cannot delete a SUPER admin user.';
    END IF;

    -- Complex condition check 2: Does the user own any Groups?
    SELECT COUNT(*) INTO v_owned_groups
    FROM `GROUPS`
    WHERE owner_id = p_user_id;

    IF v_owned_groups > 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Delete rejected: User is currently the Owner of one or more groups. Transfer ownership first.';
    END IF;

    -- Proceed with deletion if all conditions are met
    DELETE FROM USERS WHERE user_id = p_user_id;
END$$

-- ============================================================
-- 4. FRIEND REQUEST PROCEDURE
-- ============================================================
DROP PROCEDURE IF EXISTS friend_request$$
CREATE PROCEDURE friend_request (IN s_id BIGINT, IN r_id BIGINT)
BEGIN
    DECLARE incoming INT;
    DECLARE sending INT;
    DECLARE friends INT;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    IF s_id = r_id THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Cannot friend yourself.';
    END IF;

    START TRANSACTION;

    SELECT 1 FROM FRIENDSHIPS 
    WHERE (SENDER_ID = s_id AND RECEIVER_ID = r_id)
    OR (SENDER_ID = r_id AND RECEIVER_ID = s_id) 
    FOR UPDATE;

    SELECT COUNT(*) INTO incoming
    FROM FRIENDSHIPS
    WHERE RECEIVER_ID = s_id AND SENDER_ID = r_id
    FOR UPDATE;

    SELECT COUNT(*) INTO sending
    FROM FRIENDSHIPS
    WHERE RECEIVER_ID = r_id AND SENDER_ID = s_id
    FOR UPDATE;

    SELECT COUNT(*) INTO friends
    FROM FRIENDSHIPS
    WHERE (SENDER_ID = s_id AND RECEIVER_ID = r_id AND status = 'ACCEPTED')
       OR (SENDER_ID = r_id AND RECEIVER_ID = s_id AND status = 'ACCEPTED')
    FOR UPDATE;

    IF friends > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Already friends.';

    ELSEIF sending > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Already sent friend request.';

    ELSEIF incoming > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'User already sent you a request. Please accept it.';

    ELSE
        INSERT INTO FRIENDSHIPS (SENDER_ID, RECEIVER_ID, status)
        VALUES (s_id, r_id, 'PENDING');
    END IF;

    COMMIT;
END$$

-- ============================================================
-- 5. ACCEPT FRIEND PROCEDURE
-- ============================================================
DROP PROCEDURE IF EXISTS accept_friend$$
CREATE PROCEDURE accept_friend (IN s_id BIGINT, IN r_id BIGINT)
BEGIN
    DECLARE incoming INT;
    DECLARE friends INT;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    IF s_id = r_id THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Cannot friend yourself.';
    END IF;

    START TRANSACTION;

    SELECT 1 FROM FRIENDSHIPS 
    WHERE (SENDER_ID = s_id AND RECEIVER_ID = r_id)
    OR (SENDER_ID = r_id AND RECEIVER_ID = s_id) 
    FOR UPDATE;

    SELECT COUNT(*) INTO incoming
    FROM FRIENDSHIPS
    WHERE SENDER_ID = s_id AND RECEIVER_ID = r_id AND status = 'PENDING';

    SELECT COUNT(*) INTO friends
    FROM FRIENDSHIPS
    WHERE (SENDER_ID = s_id AND RECEIVER_ID = r_id AND status = 'ACCEPTED')
    OR (SENDER_ID = r_id AND RECEIVER_ID = s_id AND status = 'ACCEPTED');

    IF incoming = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Business Constraint Violation: No pending friend request.';
    ELSEIF friends > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Business Constraint Violation: Already friends.';
    ELSE
        UPDATE FRIENDSHIPS
        SET status = 'ACCEPTED'
        WHERE SENDER_ID = s_id AND RECEIVER_ID = r_id AND status = 'PENDING';
    END IF;
    COMMIT;
END$$

-- ============================================================
-- 6. UNFRIEND PROCEDURE
-- ============================================================
DROP PROCEDURE IF EXISTS unfriend$$
CREATE PROCEDURE unfriend (IN s_id BIGINT, IN r_id BIGINT)
BEGIN
    DECLARE friends INT;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    IF s_id = r_id THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Cannot unfriend yourself.';
    END IF;

    START TRANSACTION;

    SELECT 1 FROM FRIENDSHIPS 
    WHERE (SENDER_ID = s_id AND RECEIVER_ID = r_id)
    OR (SENDER_ID = r_id AND RECEIVER_ID = s_id) 
    FOR UPDATE;

    SELECT COUNT(*) INTO friends
    FROM FRIENDSHIPS
    WHERE (SENDER_ID = s_id AND RECEIVER_ID = r_id AND status = 'ACCEPTED')
    OR (SENDER_ID = r_id AND RECEIVER_ID = s_id AND status = 'ACCEPTED');

    IF friends = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Business Constraint Violation: Not friends.';
    ELSE
        DELETE FROM FRIENDSHIPS
        WHERE (SENDER_ID = s_id AND RECEIVER_ID = r_id AND status = 'ACCEPTED') OR (SENDER_ID = r_id AND RECEIVER_ID = s_id AND status = 'ACCEPTED');
    END IF;
    COMMIT;
END$$

-- ============================================================
-- 7. DECLINE/CANCEL FRIEND REQUEST PROCEDURE
-- ============================================================
DROP PROCEDURE IF EXISTS decline_cancel_fr$$
CREATE PROCEDURE decline_cancel_fr (IN s_id BIGINT, IN r_id BIGINT)
BEGIN
    DECLARE incoming INT;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    IF s_id = r_id THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Cannot friend yourself.';
    END IF;

    START TRANSACTION;

    SELECT 1 FROM FRIENDSHIPS 
    WHERE (SENDER_ID = s_id AND RECEIVER_ID = r_id)
    OR (SENDER_ID = r_id AND RECEIVER_ID = s_id) 
    FOR UPDATE;

    SELECT COUNT(*) INTO incoming
    FROM FRIENDSHIPS
    WHERE SENDER_ID = s_id AND RECEIVER_ID = r_id AND status = 'PENDING';

    IF incoming = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'No pending friend request.';
    ELSE
        DELETE FROM FRIENDSHIPS
        WHERE SENDER_ID = s_id AND RECEIVER_ID = r_id AND status = 'PENDING';
    END IF;
    COMMIT;
END$$

DELIMITER ;
