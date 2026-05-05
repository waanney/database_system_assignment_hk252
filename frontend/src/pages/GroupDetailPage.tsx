import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import PostCard from '../components/PostCard.tsx'
import CreatePostBox from '../components/CreatePostBox.tsx'
import { useAuth } from '../context/AuthContext.tsx'
import { groupApi, postApi, reactionApi, commentApi, queryApi, getErrorMessage, type GroupRule, type Post, type Reaction, type ReactType } from '../services/api'

type Visibility = 'PUBLIC' | 'FRIENDS' | 'PRIVATE' | 'CUSTOM'

type Tab = 'discussion' | 'members' | 'rules'

export default function GroupDetailPage() {
  const { groupId } = useParams<{ groupId: string }>()
  const { user } = useAuth()
  const gid = Number(groupId)

  const [group, setGroup] = useState<any>(null)
  const [members, setMembers] = useState<any[]>([])
  const [rules, setRules] = useState<GroupRule[]>([])
  const [loading, setLoading] = useState(true)
  const [isMember, setIsMember] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('discussion')
  const [ruleForm, setRuleForm] = useState({ title: '', description: '' })
  const [editingRuleId, setEditingRuleId] = useState<number | null>(null)
  const [ruleSaving, setRuleSaving] = useState(false)

  // Search state (stored procedure: search_user)
  const [memberSearchTerm, setMemberSearchTerm] = useState('')
  const [searchedMembers, setSearchedMembers] = useState<any[]>([])
  const [memberSearchLoading, setMemberSearchLoading] = useState(false)

  const [posts, setPosts] = useState<Post[]>([])
  const [postsLoading, setPostsLoading] = useState(true)
  const [reactions, setReactions] = useState<Reaction[]>([])
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
        const postIds = res.data.map(p => p.post_id)
        try {
          const reactionsRes = postIds.length
            ? await reactionApi.list(postIds)
            : { data: [] }
          if (isCancelled) return
          setReactions(reactionsRes.data)
        } catch (err) {
          console.error('Failed to fetch reactions:', err)
          if (isCancelled) return
          setReactions([])
        }
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
          setPosts(prev => prev.map(p => p.post_id === postId
            ? { ...p, reaction_count: Math.max((p.reaction_count ?? 1) - 1, 0) }
            : p
          ))
        } else {
          const response = await reactionApi.react(postId, type)
          setReactions(prev => prev.map(r => r.post_id === postId && r.user_id === userId ? { ...r, ...response.data } : r))
        }
      } else {
        const response = await reactionApi.react(postId, type)
        setReactions(prev => [...prev, response.data])
        setPosts(prev => prev.map(p => p.post_id === postId
          ? { ...p, reaction_count: (p.reaction_count ?? 0) + 1 }
          : p
        ))
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

  async function handleRuleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const title = ruleForm.title.trim()
    const description = ruleForm.description.trim()
    if (!title) {
      alert('Rule title is required.')
      return
    }

    setRuleSaving(true)
    try {
      if (editingRuleId !== null) {
        const res = await groupApi.updateRule(gid, editingRuleId, {
          title,
          description: description || null,
        })
        setRules(prev => prev.map(rule => rule.rule_id === editingRuleId ? res.data : rule))
      } else {
        const res = await groupApi.createRule(gid, {
          title,
          description: description || null,
        })
        setRules(prev => [...prev, res.data].sort((a, b) => a.rule_id - b.rule_id))
      }
      setRuleForm({ title: '', description: '' })
      setEditingRuleId(null)
    } catch (err) {
      alert(getErrorMessage(err))
    } finally {
      setRuleSaving(false)
    }
  }

  function startEditRule(rule: GroupRule) {
    setEditingRuleId(rule.rule_id)
    setRuleForm({
      title: rule.title,
      description: rule.description ?? '',
    })
  }

  function cancelEditRule() {
    setEditingRuleId(null)
    setRuleForm({ title: '', description: '' })
  }

  async function handleDeleteRule(ruleId: number) {
    if (!window.confirm('Delete this rule?')) return
    try {
      await groupApi.deleteRule(gid, ruleId)
      setRules(prev => prev.filter(rule => rule.rule_id !== ruleId))
      if (editingRuleId === ruleId) cancelEditRule()
    } catch (err) {
      alert(getErrorMessage(err))
    }
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
  const isOwner = Boolean(user && group.owner_id === user.user_id)

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

              {isOwner && (
                <form onSubmit={handleRuleSubmit} className="mb-4 space-y-3 rounded-xl bg-fb-gray p-3">
                  <input
                    type="text"
                    value={ruleForm.title}
                    onChange={e => setRuleForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Rule title"
                    className="w-full rounded-lg border border-fb-gray-3 bg-white px-3 py-2 text-sm text-fb-text placeholder:text-fb-gray-3 focus:border-fb-blue focus:outline-none"
                    disabled={ruleSaving}
                  />
                  <textarea
                    value={ruleForm.description}
                    onChange={e => setRuleForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Rule description"
                    rows={3}
                    className="w-full resize-none rounded-lg border border-fb-gray-3 bg-white px-3 py-2 text-sm text-fb-text placeholder:text-fb-gray-3 focus:border-fb-blue focus:outline-none"
                    disabled={ruleSaving}
                  />
                  <div className="flex justify-end gap-2">
                    {editingRuleId !== null && (
                      <button
                        type="button"
                        onClick={cancelEditRule}
                        className="btn-secondary px-3 py-1.5 text-sm"
                        disabled={ruleSaving}
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      type="submit"
                      className="btn-primary px-3 py-1.5 text-sm disabled:opacity-60"
                      disabled={ruleSaving}
                    >
                      {ruleSaving ? 'Saving...' : editingRuleId !== null ? 'Update Rule' : 'Add Rule'}
                    </button>
                  </div>
                </form>
              )}

              {rules.length === 0 ? (
                <p className="text-fb-text-2 text-sm">No rules set for this group.</p>
              ) : (
                <div className="space-y-3">
                  {rules.map((rule, idx) => (
                    <div key={rule.rule_id} className="flex items-start gap-2">
                      <span className="text-fb-blue font-bold">{idx + 1}.</span>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm">{rule.title}</p>
                        {rule.description && <p className="text-sm text-fb-text-2">{rule.description}</p>}
                      </div>
                      {isOwner && (
                        <div className="flex shrink-0 gap-1">
                          <button
                            type="button"
                            onClick={() => startEditRule(rule)}
                            className="rounded-lg p-2 text-fb-blue hover:bg-fb-gray"
                            title="Edit rule"
                            aria-label="Edit rule"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 7.125L16.875 4.5" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteRule(rule.rule_id)}
                            className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                            title="Delete rule"
                            aria-label="Delete rule"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673A2.25 2.25 0 0115.916 21H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                            </svg>
                          </button>
                        </div>
                      )}
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
