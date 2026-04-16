USE PHOBODTB;

DROP FUNCTION IF EXISTS get_mutual_friends_count;
DROP FUNCTION IF EXISTS get_post_reaction_weighted_score;
DROP FUNCTION IF EXISTS count_group_members_with_min_public_posts;

DELIMITER $$

CREATE FUNCTION get_mutual_friends_count(user_id1 BIGINT, user_id2 BIGINT)
RETURNS INT
READS SQL DATA
NOT DETERMINISTIC
BEGIN
    DECLARE mutual_count INT DEFAULT 0;
    DECLARE current_friend_id BIGINT;
    DECLARE done INT DEFAULT FALSE;

    DECLARE friend_cursor CURSOR FOR
        SELECT CASE
            WHEN sender_id = user_id1 THEN receiver_id
            ELSE sender_id
        END
        FROM FRIENDSHIPS
        WHERE (sender_id = user_id1 OR receiver_id = user_id1) AND status = 'ACCEPTED';

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

    IF user_id1 = user_id2 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Two users cannot be the same';
    END IF;

    OPEN friend_cursor;

    read_loop: LOOP
        FETCH friend_cursor INTO current_friend_id;
        IF done THEN
            LEAVE read_loop;
        END IF;

        IF EXISTS (
            SELECT 1 FROM FRIENDSHIPS
            WHERE ((sender_id = user_id2 AND receiver_id = current_friend_id)
                OR (sender_id = current_friend_id AND receiver_id = user_id2))
              AND status = 'ACCEPTED'
        ) THEN
            SET mutual_count = mutual_count + 1;
        END IF;
    END LOOP;

    CLOSE friend_cursor;

    RETURN mutual_count;
END$$

CREATE FUNCTION get_post_reaction_weighted_score(p_post_id BIGINT)
RETURNS INT
READS SQL DATA
NOT DETERMINISTIC
BEGIN
    DECLARE total_score INT DEFAULT 0;
    DECLARE r_type VARCHAR(20);
    DECLARE done INT DEFAULT FALSE;

    DECLARE reaction_cursor CURSOR FOR
        SELECT react_type FROM REACTIONS WHERE post_id = p_post_id;

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

    IF p_post_id IS NULL OR p_post_id <= 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'post_id must be a positive integer';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM POSTS WHERE post_id = p_post_id) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Post does not exist';
    END IF;

    OPEN reaction_cursor;

    score_loop: LOOP
        FETCH reaction_cursor INTO r_type;
        IF done THEN
            LEAVE score_loop;
        END IF;

        SET total_score = total_score + CASE r_type
            WHEN 'LIKE'  THEN 1
            WHEN 'LOVE'  THEN 3
            WHEN 'HAHA'  THEN 2
            WHEN 'WOW'   THEN 2
            WHEN 'CARE'  THEN 2
            WHEN 'SAD'   THEN 0
            WHEN 'ANGRY' THEN 0
            ELSE 0
        END;
    END LOOP;

    CLOSE reaction_cursor;

    RETURN total_score;
END$$

CREATE FUNCTION count_group_members_with_min_public_posts(p_group_id BIGINT, p_min_posts INT)
RETURNS INT
READS SQL DATA
NOT DETERMINISTIC
BEGIN
    DECLARE qualified_count INT DEFAULT 0;
    DECLARE current_user_id BIGINT;
    DECLARE public_post_count INT DEFAULT 0;
    DECLARE done INT DEFAULT FALSE;

    DECLARE member_cursor CURSOR FOR
        SELECT user_id FROM MEMBERSHIPS WHERE group_id = p_group_id;

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

    IF p_group_id IS NULL OR p_group_id <= 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'group_id must be a positive integer';
    END IF;

    IF p_min_posts IS NULL OR p_min_posts < 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'p_min_posts must be non-negative';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM `GROUPS` WHERE group_id = p_group_id) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Group does not exist';
    END IF;

    OPEN member_cursor;

    member_loop: LOOP
        FETCH member_cursor INTO current_user_id;
        IF done THEN
            LEAVE member_loop;
        END IF;

        SELECT COUNT(*) INTO public_post_count
        FROM POSTS
        WHERE user_id = current_user_id AND visibility = 'PUBLIC';

        IF public_post_count >= p_min_posts THEN
            SET qualified_count = qualified_count + 1;
        END IF;
    END LOOP;

    CLOSE member_cursor;

    RETURN qualified_count;
END$$

DELIMITER ;
