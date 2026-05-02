"""Add parent_comment_id column to COMMENTS table.

Run with: python -m database.migrate_comments
"""
import pymysql

# Load credentials from environment or .env
import os
from pathlib import Path

env_file = Path(__file__).parent.parent.parent / ".env"
env = {}
if env_file.exists():
    for line in env_file.read_text().splitlines():
        line = line.strip()
        if "=" in line and not line.startswith("#"):
            k, v = line.split("=", 1)
            env[k] = v.strip().strip('"').strip("'")

db_host = env.get("DB_HOST", "localhost")
db_port = int(env.get("DB_PORT", "3306"))
db_user = env.get("DB_USER", "root")
db_password = env.get("DB_PASSWORD", "password")
db_name = env.get("DB_NAME", "PHOBODTB")

conn = pymysql.connect(
    host=db_host,
    port=db_port,
    user=db_user,
    password=db_password,
    database=db_name,
)
cursor = conn.cursor()

print("Checking if parent_comment_id column exists...")
cursor.execute("SHOW COLUMNS FROM COMMENTS LIKE 'parent_comment_id'")
row = cursor.fetchone()

if row:
    print("Column already exists, nothing to do.")
else:
    print("Adding parent_comment_id column...")
    cursor.execute(
        "ALTER TABLE COMMENTS "
        "ADD COLUMN parent_comment_id BIGINT NULL, "
        "ADD CONSTRAINT fk_comments_parent "
        "FOREIGN KEY (parent_comment_id) REFERENCES COMMENTS(comment_id) ON DELETE CASCADE"
    )
    conn.commit()
    print("Done. Column added successfully.")

cursor.close()
conn.close()
