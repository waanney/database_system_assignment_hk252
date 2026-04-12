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
    -- Validation: Email must be valid
    IF p_email NOT LIKE '%@%' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid email: Must contain @ character';
    END IF;

    -- Insert user with validated information.
    -- The 'age' derived attribute is automatically calculated by the BEFORE INSERT trigger.
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
CREATE PROCEDURE sp_UpdateUser(
    IN p_user_id       BIGINT,
    IN p_email         VARCHAR(255),
    IN p_date_of_birth DATE
)
BEGIN
    -- Update information.
    -- If date_of_birth is updated, the 'age' derived attribute 
    -- is automatically recalculated and validated by the BEFORE UPDATE trigger.
    UPDATE USERS
    SET 
        email = COALESCE(p_email, email),
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
    FROM GROUPS
    WHERE owner_id = p_user_id;

    IF v_owned_groups > 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Delete rejected: User is currently the Owner of one or more groups. Transfer ownership first.';
    END IF;

    -- Proceed with deletion if all conditions are met
    DELETE FROM USERS WHERE user_id = p_user_id;
END$$

DELIMITER ;
