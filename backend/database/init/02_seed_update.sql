-- Keep Alice's password consistent with all other demo accounts: password123
USE PHOBODTB;

-- Password hash for 'password123': $2b$12$OUTELpzoIWbf5PhU99Qml.Jyw7.EkmaisU.BcdTqZfmCFilZyXija
UPDATE USERS SET password_hash = '$2b$12$OUTELpzoIWbf5PhU99Qml.Jyw7.EkmaisU.BcdTqZfmCFilZyXija' WHERE user_id = 2;
