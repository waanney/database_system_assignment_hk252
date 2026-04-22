import axios from 'axios'

// In development (npm run dev), Vite proxy handles /api → http://localhost:8000.
// In production (Docker), Nginx proxies /api → http://backend:8000.
// Set VITE_API_BASE_URL in .env.local for production, leave empty for dev proxy.
const API_BASE = import.meta.env.VITE_API_BASE_URL || ''

const apiClient = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT token if present
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token') || localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Normalize error messages
apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    const data = err.response?.data
    let message: string

    if (typeof data?.detail === 'string') {
      message = data.detail
    } else if (Array.isArray(data?.detail)) {
      // Pydantic validation error format
      message = data.detail.map((e: { msg?: string; loc?: string[] }) =>
        e.loc ? `${e.loc.join('.')}: ${e.msg}` : e.msg
      ).join('; ')
    } else if (typeof data?.message === 'string') {
      message = data.message
    } else {
      message = err.message || 'An unexpected error occurred.'
    }
    return Promise.reject(new Error(message))
  }
)

// ─── Types ────────────────────────────────────────────────────────────────

export type Gender = 'MALE' | 'FEMALE' | 'OTHER' | 'UNSPECIFIED'

export interface User {
  user_id: number
  email: string
  first_name: string
  last_name: string
  phone_number?: string
  date_of_birth?: string
  gender: Gender
  is_active: boolean
  is_admin?: boolean
  is_verified?: boolean
}

export interface RegisterData {
  email: string
  password: string
  first_name: string
  last_name: string
  phone_number?: string
  date_of_birth?: string
  gender: Gender
}

export interface UserFormData {
  email: string
  first_name: string
  last_name: string
  phone_number?: string
  date_of_birth?: string
  gender: Gender
  password?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  limit: number
  offset: number
}

// ─── Auth API ─────────────────────────────────────────────────────────────

export const authApi = {
  login: (email: string, password: string) =>
    apiClient.post<{ access_token: string; token_type: string; expires_in: number }>('/api/auth/login', { email, password }),

  register: (data: RegisterData) =>
    apiClient.post<User>('/api/auth/register', data),

  getMe: () =>
    apiClient.get<User>('/api/auth/me'),
}

// ─── User API (Stored Procedures) ─────────────────────────────────────────

export const userApi = {
  /** sp_InsertUser */
  create: (payload: UserFormData) =>
    apiClient.post<User>('/api/users', payload),

  /** sp_UpdateUser */
  update: (userId: number, payload: Partial<UserFormData>) =>
    apiClient.put<User>(`/api/users/${userId}`, payload),

  /** sp_DeleteUser */
  delete: (userId: number) =>
    apiClient.delete(`/api/users/${userId}`),

  /** search_user + pagination */
  list: (params: { search?: string; limit?: number; offset?: number }) =>
    apiClient.get<PaginatedResponse<User>>('/api/users', { params }),

  /** Get single user */
  getOne: (userId: number) =>
    apiClient.get<User>(`/api/users/${userId}`),

  /** Get all users (for dropdowns) */
  getAll: () =>
    apiClient.get<User[]>('/api/users/all'),
}

// ─── Friendship API ────────────────────────────────────────────────────────

export interface FriendshipData {
  friends: User[]
  sent_requests: User[]
  received_requests: User[]
}

export const friendshipApi = {
  getMutualFriends: (userId1: number, userId2: number) =>
    apiClient.get<{ count: number; friends: User[] }>(
      `/api/friendships/mutual/${userId1}/${userId2}`
    ),

  getMutualFriendsCount: (userId1: number, userId2: number) =>
    apiClient.get<{ count: number }>(
      `/api/friendships/mutual/${userId1}/${userId2}/count`
    ),

  getFriendshipData: () =>
    apiClient.get<FriendshipData>('/api/friendships/me'),

  sendRequest: (receiverId: number) =>
    apiClient.post(`/api/friendships/request/${receiverId}`),

  acceptRequest: (senderId: number) =>
    apiClient.post(`/api/friendships/accept/${senderId}`),

  declineRequest: (senderId: number) =>
    apiClient.post(`/api/friendships/decline/${senderId}`),

  unfriend: (userId: number) =>
    apiClient.delete(`/api/friendships/${userId}`),
}

// ─── Post / Reaction API ───────────────────────────────────────────────────

export const postApi = {
  list: (params?: { limit?: number; offset?: number; user_id?: number }) =>
    apiClient.get<Post[]>('/api/posts', { params }),

  getOne: (postId: number) =>
    apiClient.get<Post>(`/api/posts/${postId}`),

  create: (data: { content: string; visibility: string; group_id?: number | null }) =>
    apiClient.post<Post>('/api/posts', data),

  delete: (postId: number) =>
    apiClient.delete(`/api/posts/${postId}`),

  share: (postId: number) =>
    apiClient.post<Post>(`/api/posts/share/${postId}`),

  groupPosts: (groupId: number) =>
    apiClient.get<Post[]>(`/api/posts/group/${groupId}`),
}

export interface Post {
  post_id: number
  user_id: number
  content: string
  visibility: 'PUBLIC' | 'FRIENDS' | 'PRIVATE' | 'CUSTOM'
  created_at: string
  image_url?: string
  group_id?: number | null
  first_name?: string
  last_name?: string
}

export const reactionApi = {
  /** get_post_reaction_weighted_score */
  getWeightedScore: (postId: number) =>
    apiClient.get<{ score: number }>(`/api/reactions/weighted-score/${postId}`),

  react: (postId: number, reactType: ReactType) =>
    apiClient.post('/api/reactions', { post_id: postId, react_type: reactType }),

  unreact: (postId: number) =>
    apiClient.delete(`/api/reactions/${postId}`),
}

export type ReactType = 'LIKE' | 'LOVE' | 'HAHA' | 'WOW' | 'CARE' | 'SAD' | 'ANGRY'

// ─── Group API ─────────────────────────────────────────────────────────────

export interface Group {
  group_id: number
  name: string
  description: string
  owner_id: number
  created_at: string
  cover_url?: string
  member_count?: number
  first_name?: string
  last_name?: string
}

export const groupApi = {
  list: (params?: { limit?: number; offset?: number }) =>
    apiClient.get<Group[]>('/api/groups', { params }),

  getMyGroups: () =>
    apiClient.get<Group[]>('/api/groups/my-groups'),

  getOne: (groupId: number) =>
    apiClient.get<Group>(`/api/groups/${groupId}`),

  create: (data: { name: string; description?: string }) =>
    apiClient.post<Group>('/api/groups', data),

  getMembers: (groupId: number) =>
    apiClient.get<any[]>(`/api/groups/${groupId}/members`),

  getRules: (groupId: number) =>
    apiClient.get<any[]>(`/api/groups/${groupId}/rules`),

  checkMembership: (groupId: number) =>
    apiClient.get<{ is_member: boolean }>(`/api/groups/${groupId}/my-membership`),

  join: (groupId: number) =>
    apiClient.post(`/api/groups/${groupId}/join`),

  leave: (groupId: number) =>
    apiClient.delete(`/api/groups/${groupId}/leave`),

  /** count_group_members_with_min_public_posts */
  countMembersWithMinPosts: (groupId: number, minPosts: number) =>
    apiClient.get<{ count: number }>(
      `/api/groups/${groupId}/members/count?min_posts=${minPosts}`
    ),
}

// ─── Comment API ─────────────────────────────────────────────────────────────

export interface Comment {
  comment_id: number
  post_id: number
  user_id: number
  content: string
  created_at: string
  first_name?: string
  last_name?: string
}

export const commentApi = {
  list: (postId: number) =>
    apiClient.get<Comment[]>('/api/comments', { params: { post_id: postId } }),

  create: (postId: number, content: string) =>
    apiClient.post<Comment>('/api/comments', { post_id: postId, content }),
}

// ─── Query / Function API ───────────────────────────────────────────────────

export const queryApi = {
  /** Stored function: get_mutual_friends_count(user_id1, user_id2) */
  getMutualFriendsCount: (userId1: number, userId2: number) =>
    apiClient.get<{ user_id_1: number; user_id_2: number; mutual_friends_count: number }>(
      `/api/users/${userId1}/mutual-friends/${userId2}`
    ),

  /** Stored function: get_post_reaction_weighted_score(post_id) */
  getPostReactionScore: (postId: number) =>
    apiClient.get<{ post_id: number; weighted_score: number }>(
      `/api/posts/${postId}/reaction-score`
    ),

  /** Stored function: count_group_members_with_min_public_posts(group_id, min_posts) */
  countGroupMembersWithMinPosts: (groupId: number, minPosts: number) =>
    apiClient.get<any[]>(
      `/api/groups/${groupId}/qualified-members`,
      { params: { min_posts: minPosts } }
    ),

  /** Stored procedure: search_friend(p_search_term, p_current_user_id) */
  searchFriends: (searchTerm: string, _currentUserId: number) =>
    apiClient.get<any[]>(
      `/api/friends/search`,
      { params: { search_term: searchTerm } }
    ),

  /** Stored procedure: get_group_members(p_group_id) */
  getGroupMembers: (groupId: number) =>
    apiClient.get<any[]>(`/api/groups/${groupId}/members`),

  /** Stored procedure: count_ver_group() */
  getVerifiedGroups: () =>
    apiClient.get<any[]>('/api/groups/verified'),
}

// ─── Error Helper ────────────────────────────────────────────────────────

// ─── Report API ─────────────────────────────────────────────────────────────

export const reportApi = {
  submit: (postId: number, reason?: string) =>
    apiClient.post('/api/reports', { post_id: postId, reason }),

  list: (status?: string) =>
    apiClient.get<any[]>('/api/reports', { params: status ? { status } : {} }),

  getOne: (reportId: number) =>
    apiClient.get<any>(`/api/reports/${reportId}`),

  update: (reportId: number, status: string) =>
    apiClient.put(`/api/reports/${reportId}`, { status }),
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  if (error && typeof error === 'object') {
    const e = error as Record<string, unknown>
    if (typeof e.message === 'string') return e.message
    if (typeof e.detail === 'string') return e.detail
    if (Array.isArray(e.detail)) {
      return e.detail.map((item: unknown) => {
        if (typeof item === 'string') return item
        if (item && typeof item === 'object') {
          const itemObj = item as Record<string, unknown>
          return itemObj.msg || JSON.stringify(item)
        }
        return String(item)
      }).join('; ')
    }
    return JSON.stringify(error)
  }
  return 'Đã xảy ra lỗi không mong muốn.'
}