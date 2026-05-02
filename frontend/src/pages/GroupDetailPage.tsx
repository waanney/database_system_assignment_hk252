import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import PostCard from '../components/PostCard.tsx'
import CreatePostBox from '../components/CreatePostBox.tsx'
import { groupApi, postApi, reactionApi, commentApi, queryApi, getErrorMessage, type Post, type ReactType } from '../services/api'

type Visibility = 'PUBLIC' | 'FRIENDS' | 'PRIVATE' | 'CUSTOM'

type Tab = 'discussion' | 'members' | 'rules'

export default function GroupDetailPage() {
  const { groupId } = useParams<{ groupId: string }>()
  const gid = Number(groupId)

  const [group, setGroup] = useState<any>(null)
  const [members, setMembers] = useState<any[]>([])
  const [rules, setRules] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isMember, setIsMember] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('discussion')

  // Search state (stored procedure: search_user)
  const [memberSearchTerm, setMemberSearchTerm] = useState('')
  const [searchedMembers, setSearchedMembers] = useState<any[]>([])
  const [memberSearchLoading, setMemberSearchLoading] = useState(false)

  const [posts, setPosts] = useState<Post[]>([])
  const [postsLoading, setPostsLoading] = useState(true)
  const [reactions, setReactions] = useState<{ post_id: number; user_id: number; react_type: ReactType }[]>([])
  const [comments, setComments] = useState<any[]>([])
  const [expandedPostId, setExpandedPostId] = useState<number | null>(null)
  const [friendsInGroup, setFriendsInGroup] = useState<any[]>([])

  useEffect(() => {
    let isCancelled = false

    async function fetchGroupData() {
      setLoading(true)
      if (!Number.isInteger(gid) || gid <= 0) {
        setGroup(null)
        setLoading(false)
        return
      }

      try {
        const groupRes = await groupApi.getOne(gid)
        if (isCancelled) return

        setGroup(groupRes.data)

        const [membersRes, membershipRes, friendsRes] = await Promise.all([
          groupApi.getMembers(gid).catch(err => {
            console.error('Failed to fetch group members:', err)
            return null
          }),
          groupApi.checkMembership(gid).catch(err => {
            console.error('Failed to fetch group membership:', err)
            return null
          }),
          queryApi.getFriendsInGroup(gid).catch(err => {
            console.error('Failed to fetch friends in group:', err)
            return null
          }),
        ])

        if (isCancelled) return
        setMembers(membersRes?.data ?? [])
        setIsMember(membershipRes?.data.is_member ?? false)
        setFriendsInGroup((friendsRes?.data as any[]) ?? [])
      } catch (err) {
        console.error('Failed to fetch group:', err)
        if (isCancelled) return
        setGroup(null)
      } finally {
        if (!isCancelled) setLoading(false)
      }
    }
    fetchGroupData()

    return () => { isCancelled = true }
  }, [gid])

  useEffect(() => {
    async function fetchRules() {
      if (activeTab !== 'rules') return
      try {
        const res = await groupApi.getRules(gid)
        setRules(res.data)
      } catch (err) {
        console.error('Failed to fetch rules:', err)
      }
    }
    fetchRules()
  }, [gid, activeTab])

  // Search members via stored procedure: search_user(p_search_term)
  useEffect(() => {
    if (!memberSearchTerm.trim()) {
      setSearchedMembers([])
      return
    }

    const timer = setTimeout(async () => {
      setMemberSearchLoading(true)
      try {
        const res = await queryApi.searchUsers(memberSearchTerm.trim())
        // Filter to only show members of this group
        const memberIds = members.map((m: any) => m.user_id)
        setSearchedMembers((res.data as any[]).filter((u: any) => memberIds.includes(u.user_id)))
      } catch (err) {
        console.error('Search failed:', err)
        setSearchedMembers([])
      } finally {
        setMemberSearchLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [memberSearchTerm, members])

  useEffect(() => {
    let isCancelled = false

    async function fetchPosts() {
      if (!Number.isInteger(gid) || gid <= 0) {
        setPosts([])
        setPostsLoading(false)
        return
      }

      setPostsLoading(true)
      try {
        const res = await postApi.groupPosts(gid)
        if (isCancelled) return
        setPosts(res.data)
        setReactions([])
        setComments([])
      } catch (err) {
        console.error('Failed to fetch posts:', err)
        if (isCancelled) return
        setPosts([])
      } finally {
        if (!isCancelled) setPostsLoading(false)
      }
    }
    fetchPosts()

    return () => { isCancelled = true }
  }, [gid])

  useEffect(() => {
    if (expandedPostId === null) return
    const epId = expandedPostId

    async function fetchComments() {
      try {
        const res = await commentApi.list(epId)
        setComments(prev => {
          const without = prev.filter(c => c.post_id !== epId)
          return [...without, ...res.data]
        })
      } catch (err) { console.error('Failed to fetch comments:', err) }
    }
    fetchComments()
  }, [expandedPostId])

  async function handleJoinLeave() {
    try {
      if (isMember) {
        await groupApi.leave(gid)
        setIsMember(false)
      } else {
        await groupApi.join(gid)
        setIsMember(true)
        const membersRes = await groupApi.getMembers(gid)
        setMembers(membersRes.data)
      }
    } catch (err) { alert(getErrorMessage(err)) }
  }

  async function handlePost({ content, visibility }: { content: string; visibility: Visibility; user_id: number }) {
    try {
      const response = await postApi.create({ content, visibility, group_id: gid })
      const newPost: Post = response.data
      setPosts(ps => [newPost, ...ps])
    } catch (err: any) {
      alert(err.message || 'Failed to create post.')
    }
  }

  async function handleReact(postId: number, type: ReactType, userId: number) {
    const existing = reactions.find(r => r.post_id === postId && r.user_id === userId)
    try {
      if (existing) {
        if (existing.react_type === type) {
          await reactionApi.unreact(postId)
          setReactions(prev => prev.filter(r => !(r.post_id === postId && r.user_id === userId)))
        } else {
          await reactionApi.react(postId, type)
          setReactions(prev => prev.map(r => r.post_id === postId && r.user_id === userId ? { ...r, react_type: type } : r))
        }
      } else {
        await reactionApi.react(postId, type)
        setReactions(prev => [...prev, { post_id: postId, user_id: userId, react_type: type }])
      }
    } catch (err: any) { alert(err.message || 'Failed to react.') }
  }

  async function handleComment(postId: number, content: string, _userId: number, parentCommentId?: number) {
    const tempId = -Date.now()
    const optimistic = {
      comment_id: tempId, post_id: postId, user_id: _userId,
      content, created_at: new Date().toISOString(),
      parent_comment_id: parentCommentId ?? null,
    }
    setComments((prev: any[]) => [...prev, optimistic])
    try {
      const res = await commentApi.create(postId, content, parentCommentId)
      setComments((prev: any[]) => prev.map((c: any) => c.comment_id === tempId ? res.data : c))
    } catch (err: any) {
      setComments((prev: any[]) => prev.filter((c: any) => c.comment_id !== tempId))
      alert(getErrorMessage(err))
    }
  }

  async function handleShare(postId: number) {
    try {
      await postApi.share(postId)
      alert('Post shared successfully.')
    } catch (err: any) { alert(getErrorMessage(err)) }
  }

  const handleToggleComments = useCallback((postId: number) => {
    setExpandedPostId(prev => prev === postId ? null : postId)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-fb-blue border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!group) {
    return <div className="text-center py-20 text-fb-text-2">Group not found.</div>
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: 'discussion', label: 'Discussion' },
    { key: 'members', label: 'Members' },
    { key: 'rules', label: 'Rules' },
  ]

  return (
    <div className="max-w-4xl mx-auto">
      <div className="card overflow-hidden mb-4">
        <div className="h-48 lg:h-64 bg-gradient-to-br from-purple-600 to-fb-blue">
          {group.cover_url && <img src={group.cover_url} alt="" className="w-full h-full object-cover" />}
        </div>
        <div className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold">{group.name}</h1>
              <p className="text-fb-text-2 text-sm">
                {members.length} member{members.length !== 1 ? 's' : ''}
              </p>
            </div>
            <button
              onClick={handleJoinLeave}
              className={isMember ? 'btn-secondary px-4 py-2 text-sm' : 'btn-primary px-4 py-2 text-sm'}
            >
              {isMember ? 'Joined' : '+ Join Group'}
            </button>
          </div>
        </div>
        <div className="flex border-t border-fb-gray-2 px-4">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors
                ${activeTab === tab.key ? 'border-fb-blue text-fb-blue' : 'border-transparent text-fb-text-2 hover:bg-fb-gray-2 rounded-lg'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-4">
        <div className="hidden lg:block w-64 flex-shrink-0 space-y-4">
          <div className="card p-4 space-y-2">
            <h3 className="font-bold">About</h3>
            {group.description && <p className="text-sm text-fb-text-2">{group.description}</p>}
            <p className="text-sm text-fb-text-2">
              {group.first_name || ''} {group.last_name || ''} &middot; Group Owner
            </p>
            <p className="text-sm text-fb-text-2">{members.length} members</p>
          </div>

          {members.length > 0 && (
            <div className="card p-4">
              <div className="flex justify-between mb-3">
                <h3 className="font-bold">Members</h3>
                <button onClick={() => setActiveTab('members')} className="text-fb-blue text-sm hover:underline">See all</button>
              </div>
              <div className="space-y-2">
                {members.slice(0, 5).map(member => (
                  <Link key={member.user_id} to={`/profile/${member.user_id}`}
                    className="flex items-center gap-2 hover:bg-fb-gray rounded-lg p-1 transition-colors">
                    <img
                      src={`https://ui-avatars.com/api/?name=${encodeURIComponent((member.first_name || '') + ' ' + (member.last_name || ''))}&background=1877F2&color=fff`}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <div>
                      <p className="text-sm font-medium">
                        {member.first_name && member.last_name
                          ? `${member.first_name} ${member.last_name}`
                          : member.email?.split('@')[0]}
                      </p>
                      {member.is_owner && <p className="text-xs text-fb-text-2">Owner</p>}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {friendsInGroup.length > 0 && (
            <div className="card p-4">
              <h3 className="font-bold mb-3">Friends in this Group</h3>
              <div className="space-y-2">
                {friendsInGroup.map(friend => (
                  <Link key={friend.user_id} to={`/profile/${friend.user_id}`}
                    className="flex items-center gap-2 hover:bg-fb-gray rounded-lg p-1 transition-colors">
                    <img
                      src={`https://ui-avatars.com/api/?name=${encodeURIComponent((friend.first_name || '') + ' ' + (friend.last_name || ''))}&background=1877F2&color=fff`}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <p className="text-sm font-medium">
                      {friend.first_name && friend.last_name
                        ? `${friend.first_name} ${friend.last_name}`
                        : friend.email?.split('@')[0]}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 space-y-4">
          {activeTab === 'discussion' && (
            <>
              {isMember && (
                <CreatePostBox onPost={handlePost} groupId={gid} />
              )}
              {postsLoading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="w-8 h-8 border-4 border-fb-blue border-t-transparent rounded-full animate-spin" />
                </div>
              ) : posts.length === 0 ? (
                <div className="card p-8 text-center text-fb-text-2 text-sm">
                  No posts in this group yet.
                </div>
              ) : (
                posts.map(p => (
                  <PostCard
                    key={p.post_id}
                    post={p}
                    reactions={reactions.filter(r => r.post_id === p.post_id)}
                    comments={comments.filter(c => c.post_id === p.post_id)}
                    onReact={handleReact}
                    onComment={handleComment}
                    onShare={handleShare}
                    onToggleComments={handleToggleComments}
                    commentsExpanded={expandedPostId === p.post_id}
                  />
                ))
              )}
            </>
          )}

          {activeTab === 'members' && (
            <div className="card p-4">
              <h3 className="font-bold text-lg mb-4">Members ({members.length})</h3>

              {/* Search members (stored procedure: search_user) */}
              <div className="relative mb-4">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fb-gray-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search members by name..."
                  value={memberSearchTerm}
                  onChange={e => setMemberSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm border border-fb-gray-3 rounded-full bg-fb-gray focus:outline-none focus:border-fb-blue text-fb-text placeholder:text-fb-gray-3"
                />
                {memberSearchLoading && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-fb-blue border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>

              {memberSearchTerm.trim() ? (
                searchedMembers.length === 0 && !memberSearchLoading ? (
                  <p className="text-sm text-fb-text-2 text-center py-3">No members found matching "{memberSearchTerm}".</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {searchedMembers.map(member => (
                      <Link
                        key={member.user_id}
                        to={`/profile/${member.user_id}`}
                        className="hover:opacity-80 transition-opacity"
                      >
                        <img
                          src={`https://ui-avatars.com/api/?name=${encodeURIComponent((member.first_name || '') + ' ' + (member.last_name || ''))}&background=1877F2&color=fff`}
                          className="w-full aspect-square rounded-lg object-cover"
                        />
                        <p className="font-semibold text-sm mt-2 truncate">
                          {member.first_name && member.last_name
                            ? `${member.first_name} ${member.last_name}`
                            : member.email?.split('@')[0]}
                        </p>
                      </Link>
                    ))}
                  </div>
                )
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {members.map(member => (
                    <Link
                      key={member.user_id}
                      to={`/profile/${member.user_id}`}
                      className="hover:opacity-80 transition-opacity"
                    >
                      <img
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent((member.first_name || '') + ' ' + (member.last_name || ''))}&background=1877F2&color=fff`}
                        className="w-full aspect-square rounded-lg object-cover"
                      />
                      <p className="font-semibold text-sm mt-2 truncate">
                        {member.first_name && member.last_name
                          ? `${member.first_name} ${member.last_name}`
                          : member.email?.split('@')[0]}
                      </p>
                      {member.is_owner && (
                        <p className="text-xs text-fb-text-2">Owner</p>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'rules' && (
            <div className="card p-4">
              <h3 className="font-bold text-lg mb-4">Group Rules</h3>
              {rules.length === 0 ? (
                <p className="text-fb-text-2 text-sm">No rules set for this group.</p>
              ) : (
                <div className="space-y-3">
                  {rules.map((rule, idx) => (
                    <div key={rule.rule_id} className="flex items-start gap-2">
                      <span className="text-fb-blue font-bold">{idx + 1}.</span>
                      <div>
                        <p className="font-semibold text-sm">{rule.title}</p>
                        {rule.description && <p className="text-sm text-fb-text-2">{rule.description}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
