# Changelog: Facebook Clone Database Schema

Tổng hợp tất cả thay đổi qua các phiên bản schema.

---

## Diagram v1 → v2 (Restructuring ER Modeling)

Áp dụng các khái niệm ER: **subclass, union, weak entity**.

### Bảng đã XÓA

| Bảng | Lý do |
|------|-------|
| `ROLES` | Thay bằng User subclass tables |
| `USER_ROLES` | Thay bằng User subclass tables |
| `REPORT_REASONS` | Thay bằng Report subclass tables |

### Bảng MỚI thêm

| Bảng | Vai trò |
|------|---------|
| `ADMINS` | User subclass (partial, overlapping) |
| `MODERATORS` | User subclass (partial, overlapping) |
| `VERIFIED_USERS` | User subclass (partial, overlapping) |
| `AUTHORS` | Union: User + Page (total). Dùng cho POSTS, PAGE_FOLLOWS |
| `COMMENT_REACTION_TARGETS` | Union: Post + Comment + File (total). Dùng cho COMMENTS, REACTIONS |
| `EVENT_ACTORS` | Union: User + Page + Group (total). Dùng cho EVENTS, EVENT_PUBLICATIONS |
| `REPORT_TARGETS` | Union: Group + User + Page + Post + Comment (total). Dùng cho REPORTS |
| `PAGE_ROLE_ADMINS` | Page role subclass (full, overlapping) |
| `PAGE_ROLE_EDITORS` | Page role subclass (full, overlapping) |
| `PAGE_ROLE_MODERATORS` | Page role subclass (full, overlapping) |
| `PAGE_ROLE_ADVERTISERS` | Page role subclass (full, overlapping) |
| `PAGE_ROLE_ANALYSTS` | Page role subclass (full, overlapping) |
| `PAGE_ROLE_MEMBERS` | Page role subclass (full, overlapping) |
| `REPORT_SPAM` | Report subclass (full/partial, overlapping) |
| `REPORT_HARASSMENT` | Report subclass (full/partial, overlapping) |
| `REPORT_INAPPROPRIATE_CONTENT` | Report subclass (full/partial, overlapping) |
| `REPORT_IMPERSONATION` | Report subclass (full/partial, overlapping) |
| `REPORT_OTHER` | Report subclass (full/partial, overlapping) |

---

### 1. User Subclass (Partial, Overlapping)

Bỏ `ROLES` + `USER_ROLES` generic, tạo subclass tables trực tiếp.

```diff
- Table ROLES { role_id, name, description, created_at }
- Table USER_ROLES { user_id, role_id, granted_at, note_ }
+ Table ADMINS { user_id [pk], admin_level, granted_at, permissions }
+ Table MODERATORS { user_id [pk], assigned_area, granted_at }
+ Table VERIFIED_USERS { user_id [pk], verified_at, verified_by }
```

---

### 2. Union AUTHOR (User + Page) — Total

Tạo bảng `AUTHORS` làm superclass. `POSTS` và `PAGE_FOLLOWS` reference `AUTHORS`.

**POSTS**:
```diff
- author_id   bigint [not null]
- author_type ENUM('USER', 'PAGE') [not null]
+ author_id   bigint [not null]  // FK to AUTHORS
```

**PAGE_FOLLOWS**:
```diff
- page_id     bigint [not null]
- user_id     bigint [not null]
+ follower_author_id  bigint [not null]  // FK to AUTHORS
+ followed_author_id  bigint [not null]  // FK to AUTHORS
```

---

### 3. Union COMMENT_REACTION_TARGET (Post + Comment + File) — Total

**COMMENTS**:
```diff
- post_id     bigint [not null]
- post_type   enum('POST','FILE','COMMENT')
+ target_id   bigint [not null]  // FK to COMMENT_REACTION_TARGETS
```

**REACTIONS**:
```diff
- target_type  enum('POST','COMMENT','FILE') [not null]
- target_id    bigint [not null]
+ target_id    bigint [not null]  // FK to COMMENT_REACTION_TARGETS
```

---

### 4. Union EVENT_ACTOR (User + Page + Group) — Total

**EVENTS**:
```diff
- host_id    bigint [not null]
- host_type  enum('USER','PAGE','GROUP') [not null]
+ host_actor_id  bigint [not null]  // FK to EVENT_ACTORS
```

**EVENT_PUBLICATIONS**:
```diff
- publisher_id    bigint [not null]
- publisher_type  enum('GROUP','USER','PAGE')
+ publisher_actor_id  bigint [not null]  // FK to EVENT_ACTORS
```

---

### 5. Union REPORT_TARGET — Total

**REPORTS**:
```diff
- target_id    bigint [not null]
- target_type  enum('POST','COMMENT','USER','PAGE','GROUP') [not null]
- reason_id    int [not null]  // FK to REPORT_REASONS
+ target_id    bigint [not null]  // FK to REPORT_TARGETS
```

---

### 6. Page Roles → Weak Entity + Subclass (Full, Overlapping)

`PAGE_ROLES` trở thành weak entity (page_id + user_id + role = composite PK). Thêm 6 subclass tables.

```diff
- page_role_id   bigint [pk, increment]
  ...
  indexes {
-   (page_id, user_id) [unique]
+   (page_id, user_id, role) [pk]  // weak entity composite PK
  }
```

---

### 7. Weak Entities cho Group Tables

**GROUP_RULES**:
```diff
- rule_id        bigint [pk, increment]
- display_order  int [not null, default: 0]
+ rule_number    int [not null]  // partial key
  indexes {
+   (group_id, rule_number) [pk]
  }
```

**MEMBERSHIP_QUESTIONS**:
```diff
- question_id    bigint [pk, increment]
- sort_order     int [not null, default: 0]
+ question_number int [not null]  // partial key
  indexes {
+   (group_id, question_number) [pk]
  }
```

**MEMBERSHIP_ANSWERS**:
```diff
- answer_id    bigint [pk, increment]
- question_id  bigint [not null]
+ question_number  int [not null]  // partial key
  indexes {
+   (group_id, user_id, question_number) [pk]
  }
```

---

### 8. Reports Subclass + Bỏ REPORT_REASONS

```diff
- Table REPORT_REASONS { reason_id, title, description, code, created_at }
- REPORTS.reason_id  int [not null]
+ Table REPORT_SPAM { report_id [pk], spam_type }
+ Table REPORT_HARASSMENT { report_id [pk], severity_level }
+ Table REPORT_INAPPROPRIATE_CONTENT { report_id [pk], content_category }
+ Table REPORT_IMPERSONATION { report_id [pk], impersonated_user_id }
+ Table REPORT_OTHER { report_id [pk], reason_text }
```

---

### Fix bổ sung (từ review ban đầu)

| Fix | Trước | Sau |
|-----|-------|-----|
| Lat/Lng sai kiểu | `bigint` | `decimal(10,7)` |
| `is_deleted` thiếu default | `boolean [not null]` | `boolean [not null, default: false]` |
| `published_at` sai kiểu | `varchar(255)` | `timestamp` |
| `granted_at` sai quote | `default: 'CURRENT_TIMESTAMP'` | `` default: `CURRENT_TIMESTAMP` `` |
| `file_size` quá nhỏ | `int` | `bigint` |

---

---

## Diagram v2 → v3 (Review Fixes)

### 🔴 Critical Fixes

#### 1. Union tables thiếu `source_id`
**Bảng**: `AUTHORS`, `COMMENT_REACTION_TARGETS`, `EVENT_ACTORS`, `REPORT_TARGETS`

Trước đó chỉ có `type` mà không có cách trỏ ngược về entity gốc.

```diff
 Table AUTHORS {
   author_id    bigint [pk, increment]
   author_type  enum('USER','PAGE') [not null]
+  source_id    bigint [not null]
+
+  indexes {
+    (author_type, source_id) [unique]
+  }
 }
```
> Tương tự cho 3 union tables còn lại.

---

#### 2. FK `MEMBERSHIP_ANSWERS.question_number` sai
`question_number` không unique trong `MEMBERSHIP_QUESTIONS` → FK lỗi.

```diff
- Ref: MEMBERSHIP_ANSWERS.question_number > MEMBERSHIP_QUESTIONS.question_number
+ // Composite FK: (group_id, question_number) -> MEMBERSHIP_QUESTIONS.(group_id, question_number)
+ // dbdiagram.io does not support composite FK — enforce at app layer
```

---

#### 3. Page Role subclass thiếu ghi chú FK về superclass

```diff
+ // Note: Subclass tables' composite FK (page_id, user_id) -> PAGE_ROLES
+ //       cannot be expressed in dbdiagram.io — enforce at app layer
```

---

### 🟡 Improvements

#### 4. `PROFILES` — bỏ surrogate `profile_id`
1-1 với USERS → dùng `user_id` làm PK.

```diff
- profile_id     bigint [pk, increment]
- user_id        bigint [not null, unique]
+ user_id        bigint [pk]
```

---

#### 5. `FRIENDSHIPS` — bỏ surrogate `friendship_id`

```diff
- friendship_id  bigint [pk, increment]
  ...
  indexes {
-   (user_one_id, user_two_id) [unique]
+   (user_one_id, user_two_id) [pk]
  }
```

---

#### 6. `POST_FILES` — unique → PK

```diff
  indexes {
-   (post_id, file_id) [unique]
+   (post_id, file_id) [pk]
  }
```

---

#### 7. `PAGE_FOLLOWS` — unique → PK

```diff
  indexes {
-   (follower_author_id, followed_author_id) [unique]
+   (follower_author_id, followed_author_id) [pk]
  }
```

---

#### 8. Thêm `updated_at` cho `EVENTS` và `REPORTS`

```diff
 Table EVENTS {
   ...
+  updated_at      timestamp
 }

 Table REPORTS {
   ...
+  updated_at      timestamp
 }
```

---

#### 9. `VERIFIED_USERS.verified_by` → FK tới `ADMINS`
Chỉ admin mới verify được.

```diff
- Ref: VERIFIED_USERS.verified_by > USERS.user_id
+ Ref: VERIFIED_USERS.verified_by > ADMINS.user_id
```

---

## Thống kê tổng

| Version | Bảng xóa | Bảng mới | Cột thay đổi | FK sửa |
|---------|----------|----------|---------------|--------|
| v1 → v2 | 3 | 18 | ~20 | ~15 |
| v2 → v3 | 0 | 0 | 10 | 3 |
| **Tổng** | **3** | **18** | **~30** | **~18** |

**Tổng bảng trong schema cuối (v3)**: 35 tables
