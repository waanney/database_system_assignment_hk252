-- Update Alice's password to alice123
USE PHOBODTB;

-- Password hash for 'alice123': $2b$12$DpYBJLkRVv.hVHy7f6FaROVaXxji4LYl6LEqHEFiyC9lV9dFMIymi
UPDATE USERS SET password_hash = '$2b$12$DpYBJLkRVv.hVHy7f6FaROVaXxji4LYl6LEqHEFiyC9lV9dFMIymi' WHERE user_id = 2;
