USE PHOBODTB;
DELIMITER $$
CREATE PROCEDURE search_friend (
    IN u_id BIGINT,
    IN cmp INT,
    IN cmp_date DATETIME
)
BEGIN
    SELECT USER_ID, CONCAT_WS(' ', FIRST_NAME, LAST_NAME) AS NAME
    FROM USERS U 
    JOIN FRIENDSHIPS F ON USER_ID = SENDER_ID
    WHERE F.STATUS = 'ACCEPTED' 
      AND RECEIVER_ID = u_id
      AND (
          (cmp = -1 AND F.created_at < cmp_date) OR
          (cmp =  0 AND F.created_at = cmp_date) OR
          (cmp =  1 AND F.created_at > cmp_date)
      )

    UNION

    SELECT USER_ID, CONCAT_WS(' ', FIRST_NAME, LAST_NAME) AS NAME
    FROM USERS U 
    JOIN FRIENDSHIPS F ON USER_ID = RECEIVER_ID
    WHERE F.STATUS = 'ACCEPTED' 
      AND SENDER_ID = u_id
      AND (
          (cmp = -1 AND F.created_at < cmp_date) OR
          (cmp =  0 AND F.created_at = cmp_date) OR
          (cmp =  1 AND F.created_at > cmp_date)
      )

    ORDER BY NAME ASC;
END $$;

CREATE PROCEDURE search_pending_fr (
    IN u_id BIGINT,
    IN cmp INT,
    IN cmp_date DATETIME
)
BEGIN
    SELECT USER_ID, CONCAT_WS(' ', FIRST_NAME, LAST_NAME) AS NAME
    FROM USERS U 
    JOIN FRIENDSHIPS F ON USER_ID = SENDER_ID
    WHERE F.STATUS = 'PENDING' 
      AND RECEIVER_ID = u_id
      AND (
          (cmp = -1 AND F.created_at < cmp_date) OR
          (cmp =  0 AND F.created_at = cmp_date) OR
          (cmp =  1 AND F.created_at > cmp_date)
      )
    ORDER BY NAME ASC;
END $$;

CREATE PROCEDURE search_sent_fr (
    IN u_id BIGINT,
    IN cmp INT,
    IN cmp_date DATETIME
)
BEGIN
    SELECT USER_ID, CONCAT_WS(' ', FIRST_NAME, LAST_NAME) AS NAME
    FROM USERS U 
    JOIN FRIENDSHIPS F ON USER_ID = RECEIVER_ID
    WHERE F.STATUS = 'PENDING' 
      AND SENDER_ID = u_id
      AND (
          (cmp = -1 AND F.created_at < cmp_date) OR
          (cmp =  0 AND F.created_at = cmp_date) OR
          (cmp =  1 AND F.created_at > cmp_date)
      )
    ORDER BY NAME ASC;
END $$;

CREATE PROCEDURE get_friends_in_group (IN u_id BIGINT, IN g_id BIGINT)
BEGIN
    SELECT U.USER_ID, NAME
    FROM MEMBERSHIPS M 
    JOIN
    (SELECT USER_ID, CONCAT_WS(' ', FIRST_NAME, LAST_NAME) AS NAME
    FROM USERS U JOIN FRIENDSHIPS F ON USER_ID = SENDER_ID
    WHERE F.STATUS = 'ACCEPTED' AND RECEIVER_ID = u_id
    UNION
    SELECT USER_ID, CONCAT_WS(' ', FIRST_NAME, LAST_NAME) AS NAME
    FROM USERS U JOIN FRIENDSHIPS F ON USER_ID = RECEIVER_ID
    WHERE F.STATUS = 'ACCEPTED' AND SENDER_ID = u_id) U ON M.USER_ID = U.USER_ID
    WHERE M.GROUP_ID = g_id
    ORDER BY NAME ASC;
END $$

CREATE PROCEDURE get_group_members (IN g_id BIGINT)
BEGIN
    SELECT U.USER_ID, CONCAT_WS(' ', FIRST_NAME, LAST_NAME) AS NAME
    FROM MEMBERSHIPS M JOIN USERS U ON M.USER_ID = U.USER_ID
    WHERE M.GROUP_ID = g_id
    ORDER BY NAME ASC;
END $$

CREATE PROCEDURE count_ver_group (IN p_date DATETIME)
BEGIN
    SELECT G.GROUP_ID, G.NAME, G.CREATED_AT, COUNT(*) AS TOTAL_VERIFIED
    FROM `GROUPS` G JOIN MEMBERSHIPS M ON G.GROUP_ID = M.GROUP_ID JOIN VERIFIED_USERS V ON M.USER_ID = V.USER_ID
    WHERE G.CREATED_AT > p_date
    GROUP BY G.GROUP_ID, G.NAME, G.CREATED_AT
    ORDER BY TOTAL_VERIFIED DESC;
END $$

CREATE PROCEDURE search_user(IN p_search_term VARCHAR(255))
BEGIN
    SELECT USER_ID, CONCAT_WS(' ', FIRST_NAME, LAST_NAME) AS NAME
    FROM USERS
    WHERE FIRST_NAME LIKE CONCAT('%', p_search_term, '%') OR LAST_NAME LIKE CONCAT('%', p_search_term, '%') OR CONCAT_WS(' ', FIRST_NAME, LAST_NAME) LIKE CONCAT('%', p_search_term, '%')
    ORDER BY NAME ASC;
END $$

CREATE PROCEDURE search_group(IN p_search_term VARCHAR(255))
BEGIN
    SELECT GROUP_ID, NAME
    FROM `GROUPS`
    WHERE NAME LIKE CONCAT('%', p_search_term, '%') OR DESCRIPTION LIKE CONCAT('%', p_search_term, '%')
    ORDER BY NAME ASC;
END $$
DELIMITER ;