// ── Types ─────────────────────────────────────────────────

export type Gender     = 'MALE' | 'FEMALE' | 'OTHER' | 'UNSPECIFIED'
export type Visibility = 'PUBLIC' | 'FRIENDS' | 'PRIVATE' | 'CUSTOM'
export type ReactType  = 'LIKE' | 'LOVE' | 'HAHA' | 'WOW' | 'CARE' | 'SAD' | 'ANGRY'
export type FriendStatus = 'PENDING' | 'ACCEPTED' | 'BLOCKED' | 'DECLINED'
export type GroupPrivacy = 'PUBLIC' | 'PRIVATE'

export interface User {
  user_id:      number
  email:        string
  first_name:   string
  last_name:    string
  gender:       Gender
  password:     string
  is_active:    boolean
  is_admin?:    boolean
  is_verified?: boolean
}

export interface UserProfile {
  profile_id:     number
  user_id:        number
  bio:            string | null
  avatar_url:     string | null
  cover_page_url: string | null
}

export interface Friendship {
  sender_id:   number
  receiver_id: number
  status:      FriendStatus
}

export interface Post {
  post_id:    number
  user_id:    number
  content:    string
  visibility: Visibility
  created_at: string
  image_url?: string
  // injected at runtime by feed pages
  _reactions?: Reaction[]
  _comments?:  Comment[]
}

export interface Reaction {
  user_id:   number
  post_id:   number
  react_type: ReactType
}

export interface Comment {
  comment_id: number
  user_id:    number
  post_id:    number
  content:    string
  created_at: string
}

export interface Group {
  group_id:    number
  name:        string
  description: string
  owner_id:    number
  privacy:     GroupPrivacy
  created_at:  string
  cover_url?:  string
  member_count?: number
}

export interface Membership {
  group_id: number
  user_id:  number
}

export interface GroupRule {
  group_id:    number
  rule_id:     number
  title:       string
  description: string
}

// ── Mock data (mirrors 02_seed.sql) ───────────────────────

export const USERS: User[] = [
  { user_id: 1, email: 'admin@example.com',   first_name: 'Super',   last_name: 'Admin',  gender: 'UNSPECIFIED', password: 'admin123',   is_active: true, is_admin: true },
  { user_id: 2, email: 'alice@example.com',   first_name: 'Alice',   last_name: 'Nguyen', gender: 'FEMALE',      password: 'alice123',   is_active: true, is_verified: true },
  { user_id: 3, email: 'bob@example.com',     first_name: 'Bob',     last_name: 'Tran',   gender: 'MALE',        password: 'bob123',     is_active: true, is_verified: true },
  { user_id: 4, email: 'charlie@example.com', first_name: 'Charlie', last_name: 'Le',     gender: 'MALE',        password: 'charlie123', is_active: true },
  { user_id: 5, email: 'diana@example.com',   first_name: 'Diana',   last_name: 'Pham',   gender: 'FEMALE',      password: 'diana123',   is_active: true },
]

export const USER_PROFILES: UserProfile[] = [
  { profile_id: 1, user_id: 1, bio: 'System administrator.',    avatar_url: null,                                    cover_page_url: null },
  { profile_id: 2, user_id: 2, bio: 'Hello, I am Alice!',       avatar_url: 'https://i.pravatar.cc/150?img=47',      cover_page_url: 'https://picsum.photos/seed/alice/800/300' },
  { profile_id: 3, user_id: 3, bio: 'Just Bob.',                avatar_url: 'https://i.pravatar.cc/150?img=12',      cover_page_url: 'https://picsum.photos/seed/bob/800/300' },
  { profile_id: 4, user_id: 4, bio: 'Charlie here.',            avatar_url: 'https://i.pravatar.cc/150?img=33',      cover_page_url: null },
  { profile_id: 5, user_id: 5, bio: 'Diana from the south.',    avatar_url: 'https://i.pravatar.cc/150?img=56',      cover_page_url: 'https://picsum.photos/seed/diana/800/300' },
]

export const FRIENDSHIPS: Friendship[] = [
  { sender_id: 2, receiver_id: 3, status: 'ACCEPTED' },
  { sender_id: 2, receiver_id: 4, status: 'ACCEPTED' },
  { sender_id: 3, receiver_id: 5, status: 'PENDING'  },
  { sender_id: 4, receiver_id: 5, status: 'ACCEPTED' },
]

export const POSTS: Post[] = [
  { post_id: 1, user_id: 2, content: 'Hello world! This is my first post 🎉',     visibility: 'PUBLIC',  created_at: '2026-04-07T08:00:00Z' },
  { post_id: 2, user_id: 3, content: 'Good morning everyone! ☀️',                 visibility: 'FRIENDS', created_at: '2026-04-07T09:15:00Z' },
  { post_id: 3, user_id: 4, content: 'Anyone up for a meetup this weekend? 📍',   visibility: 'PUBLIC',  created_at: '2026-04-07T10:30:00Z' },
  { post_id: 4, user_id: 5, content: 'Beautiful sunset today 🌅',                 visibility: 'PUBLIC',  created_at: '2026-04-07T17:45:00Z',
    image_url: 'https://picsum.photos/seed/sunset/600/400' },
]

export const REACTIONS: Reaction[] = [
  { user_id: 3, post_id: 1, react_type: 'LIKE' },
  { user_id: 4, post_id: 1, react_type: 'LOVE' },
  { user_id: 2, post_id: 2, react_type: 'HAHA' },
  { user_id: 5, post_id: 3, react_type: 'LIKE' },
  { user_id: 2, post_id: 4, react_type: 'LOVE' },
]

export const COMMENTS: Comment[] = [
  { comment_id: 1, user_id: 3, post_id: 1, content: 'Welcome Alice! 👋',              created_at: '2026-04-07T08:10:00Z' },
  { comment_id: 2, user_id: 4, post_id: 1, content: 'Great first post!',              created_at: '2026-04-07T08:20:00Z' },
  { comment_id: 3, user_id: 2, post_id: 2, content: 'Good morning Bob!',              created_at: '2026-04-07T09:25:00Z' },
  { comment_id: 4, user_id: 5, post_id: 3, content: 'I am in! Where do we meet? 📍', created_at: '2026-04-07T10:45:00Z' },
]

export const GROUPS: Group[] = [
  { group_id: 1, name: 'Database Study Group', description: 'For HK252 database assignment', owner_id: 2, privacy: 'PRIVATE', created_at: '2026-04-01T00:00:00Z', cover_url: 'https://picsum.photos/seed/db/800/300' },
  { group_id: 2, name: 'HCMC Food Lovers',     description: 'Share food spots in HCMC',      owner_id: 3, privacy: 'PUBLIC',  created_at: '2026-04-02T00:00:00Z', cover_url: 'https://picsum.photos/seed/food/800/300' },
]

export const MEMBERSHIPS: Membership[] = [
  { group_id: 1, user_id: 2 },
  { group_id: 1, user_id: 3 },
  { group_id: 1, user_id: 4 },
  { group_id: 2, user_id: 3 },
  { group_id: 2, user_id: 5 },
]

export const GROUP_RULES: GroupRule[] = [
  { group_id: 1, rule_id: 1, title: 'Be respectful',     description: 'Treat all members with respect.' },
  { group_id: 1, rule_id: 2, title: 'No spam',           description: 'Do not post irrelevant content.' },
  { group_id: 2, rule_id: 1, title: 'Food posts only',   description: 'Only share food-related content.' },
  { group_id: 2, rule_id: 2, title: 'Credit your source',description: 'Always credit the original creator.' },
]

// ── Helpers ───────────────────────────────────────────────

export function getUser(userId: number): User | undefined {
  return USERS.find(u => u.user_id === userId)
}

export function getProfile(userId: number): UserProfile | undefined {
  return USER_PROFILES.find(p => p.user_id === userId)
}

// Get full name - checks current user first, then mock data
export function getFullName(userId: number): string {
  // Check if this is the current logged-in user
  try {
    const stored = localStorage.getItem('user')
    if (stored) {
      const currentUser = JSON.parse(stored)
      if (currentUser && currentUser.user_id === userId) {
        if (currentUser.first_name || currentUser.last_name) {
          return `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim()
        }
      }
    }
  } catch {
    // ignore parse errors
  }
  // Fall back to mock data
  const u = getUser(userId)
  return u ? `${u.first_name} ${u.last_name}` : 'Unknown'
}

// Get avatar - checks current user first, then mock data
export function getAvatar(userId: number): string {
  // Check if this is the current logged-in user
  try {
    const stored = localStorage.getItem('user')
    if (stored) {
      const currentUser = JSON.parse(stored)
      if (currentUser && currentUser.user_id === userId) {
        const name = `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim() || currentUser.email.split('@')[0]
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1877F2&color=fff`
      }
    }
  } catch {
    // ignore parse errors
  }
  // Fall back to mock data
  const p = getProfile(userId)
  return p?.avatar_url ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(getFullName(userId))}&background=1877F2&color=fff`
}

export function getPostReactions(postId: number): Reaction[] {
  return REACTIONS.filter(r => r.post_id === postId)
}

export function getPostComments(postId: number): Comment[] {
  return COMMENTS.filter(c => c.post_id === postId)
}

export function getFriends(userId: number): number[] {
  return FRIENDSHIPS
    .filter(f => f.status === 'ACCEPTED' && (f.sender_id === userId || f.receiver_id === userId))
    .map(f => (f.sender_id === userId ? f.receiver_id : f.sender_id))
}

export function getFriendRequests(userId: number): number[] {
  return FRIENDSHIPS
    .filter(f => f.status === 'PENDING' && f.receiver_id === userId)
    .map(f => f.sender_id)
}

export function getUserGroups(userId: number): Group[] {
  const groupIds = MEMBERSHIPS.filter(m => m.user_id === userId).map(m => m.group_id)
  return GROUPS.filter(g => groupIds.includes(g.group_id))
}

export function getGroupMembers(groupId: number): number[] {
  return MEMBERSHIPS.filter(m => m.group_id === groupId).map(m => m.user_id)
}

export function getGroupRules(groupId: number): GroupRule[] {
  return GROUP_RULES.filter(r => r.group_id === groupId)
}

export function isFriend(userId: number, targetId: number): boolean {
  return FRIENDSHIPS.some(
    f => f.status === 'ACCEPTED' &&
      ((f.sender_id === userId && f.receiver_id === targetId) ||
       (f.sender_id === targetId && f.receiver_id === userId))
  )
}
