USE PHOBODTB;
DELIMITER $$

-- Search friends by term (simplified - searches by name)
DROP PROCEDURE IF EXISTS search_friend$$
CREATE PROCEDURE search_friend (
    IN p_search_term VARCHAR(255),
    IN p_current_user_id BIGINT
)
BEGIN
    SELECT USER_ID, FIRST_NAME, LAST_NAME, EMAIL
    FROM USERS
    WHERE (FIRST_NAME LIKE CONCAT('%', p_search_term, '%') COLLATE utf8mb4_unicode_ci
       OR LAST_NAME LIKE CONCAT('%', p_search_term, '%') COLLATE utf8mb4_unicode_ci
       OR CONCAT_WS(' ', FIRST_NAME, LAST_NAME) LIKE CONCAT('%', p_search_term, '%') COLLATE utf8mb4_unicode_ci)
      AND USER_ID != p_current_user_id
    ORDER BY FIRST_NAME ASC, LAST_NAME ASC;
END$$

-- Search pending friend requests received
DROP PROCEDURE IF EXISTS search_pending_fr$$
CREATE PROCEDURE search_pending_fr (
    IN p_user_id BIGINT
)
BEGIN
    SELECT U.USER_ID, U.FIRST_NAME, U.LAST_NAME, U.EMAIL
    FROM USERS U 
    JOIN FRIENDSHIPS F ON U.USER_ID = F.SENDER_ID
    WHERE F.STATUS = 'PENDING' 
      AND F.RECEIVER_ID = p_user_id
    ORDER BY U.FIRST_NAME ASC;
END$$

-- Search sent friend requests
DROP PROCEDURE IF EXISTS search_sent_fr$$
CREATE PROCEDURE search_sent_fr (
    IN p_user_id BIGINT
)
BEGIN
    SELECT U.USER_ID, U.FIRST_NAME, U.LAST_NAME, U.EMAIL
    FROM USERS U 
    JOIN FRIENDSHIPS F ON U.USER_ID = F.RECEIVER_ID
    WHERE F.STATUS = 'PENDING' 
      AND F.SENDER_ID = p_user_id
    ORDER BY U.FIRST_NAME ASC;
END$$

-- Get friends in a specific group
DROP PROCEDURE IF EXISTS get_friends_in_group$$
CREATE PROCEDURE get_friends_in_group (IN p_user_id BIGINT, IN p_group_id BIGINT)
BEGIN
    SELECT DISTINCT U.USER_ID, U.FIRST_NAME, U.LAST_NAME, U.EMAIL
    FROM MEMBERSHIPS M 
    JOIN (
        SELECT USER_ID, FIRST_NAME, LAST_NAME, EMAIL
        FROM USERS U JOIN FRIENDSHIPS F ON USER_ID = F.SENDER_ID
        WHERE F.STATUS = 'ACCEPTED' AND F.RECEIVER_ID = p_user_id
        UNION
        SELECT USER_ID, FIRST_NAME, LAST_NAME, EMAIL
        FROM USERS U JOIN FRIENDSHIPS F ON USER_ID = F.RECEIVER_ID
        WHERE F.STATUS = 'ACCEPTED' AND F.SENDER_ID = p_user_id
    ) U ON M.USER_ID = U.USER_ID
    WHERE M.GROUP_ID = p_group_id
    ORDER BY U.FIRST_NAME ASC;
END$$

-- Get all members of a group
DROP PROCEDURE IF EXISTS get_group_members$$
CREATE PROCEDURE get_group_members (IN p_group_id BIGINT)
BEGIN
    SELECT U.USER_ID, U.FIRST_NAME, U.LAST_NAME, U.EMAIL, M.JOINED_AT
    FROM MEMBERSHIPS M 
    JOIN USERS U ON M.USER_ID = U.USER_ID
    WHERE M.GROUP_ID = p_group_id
    ORDER BY U.FIRST_NAME ASC;
END$$

-- Count verified groups (groups with verified members)
DROP PROCEDURE IF EXISTS count_ver_group$$
CREATE PROCEDURE count_ver_group ()
BEGIN
    SELECT G.GROUP_ID, G.NAME AS GROUP_NAME, COUNT(DISTINCT M.USER_ID) AS MEMBER_COUNT
    FROM `GROUPS` G 
    JOIN MEMBERSHIPS M ON G.GROUP_ID = M.GROUP_ID 
    JOIN VERIFIED_USERS V ON M.USER_ID = V.USER_ID
    GROUP BY G.GROUP_ID, G.NAME
    ORDER BY MEMBER_COUNT DESC;
END$$

-- Search users by term
DROP PROCEDURE IF EXISTS search_user$$
CREATE PROCEDURE search_user(IN p_search_term VARCHAR(255))
BEGIN
    SELECT USER_ID, FIRST_NAME, LAST_NAME, EMAIL
    FROM USERS
    WHERE FIRST_NAME LIKE CONCAT('%', p_search_term, '%') COLLATE utf8mb4_unicode_ci
       OR LAST_NAME LIKE CONCAT('%', p_search_term, '%') COLLATE utf8mb4_unicode_ci
       OR CONCAT_WS(' ', FIRST_NAME, LAST_NAME) LIKE CONCAT('%', p_search_term, '%') COLLATE utf8mb4_unicode_ci
    ORDER BY FIRST_NAME ASC, LAST_NAME ASC;
END$$

-- Search groups by term
DROP PROCEDURE IF EXISTS search_group$$
CREATE PROCEDURE search_group(IN p_search_term VARCHAR(255))
BEGIN
    SELECT GROUP_ID, NAME, DESCRIPTION
    FROM `GROUPS`
    WHERE NAME LIKE CONCAT('%', p_search_term, '%') COLLATE utf8mb4_unicode_ci
       OR DESCRIPTION LIKE CONCAT('%', p_search_term, '%') COLLATE utf8mb4_unicode_ci
    ORDER BY NAME ASC;
END$$

DELIMITER ;
