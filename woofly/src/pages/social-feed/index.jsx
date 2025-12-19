import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Heart, MessageCircle, TrendingUp, Plus, Share2, Send, 
  Bell, Sparkles, Users as UsersIcon,
  Hash, UserPlus, Settings as SettingsIcon
} from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import TabNavigation from '../../components/TabNavigation';
import UserMenu from '../../components/UserMenu';
import Footer from '../../components/Footer';
import CreatePostModal from '../../components/CreatePostModal';

const SocialFeed = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { unreadCount } = useNotifications();
  
  const [posts, setPosts] = useState([]);
  const [topPosts, setTopPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [selectedTag, setSelectedTag] = useState('all');
  const [feedType, setFeedType] = useState('explore');
  const [currentProfile, setCurrentProfile] = useState(null);
  const [dogProfiles, setDogProfiles] = useState([]);
  const [userAvatar, setUserAvatar] = useState(null);
  const [userName, setUserName] = useState('');
  const [tagStats, setTagStats] = useState([]);
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [followedUsers, setFollowedUsers] = useState(new Set());
  const [userStats, setUserStats] = useState({ posts: 0, followers: 0, following: 0 });
  
  const TAGS = ['all', 'santé', 'chiot', 'alimentation', 'comportement', 'balade', 'astuce'];
  
  useEffect(() => {
    const fetchDogProfiles = async () => {
      if (!user?.id) return;
      
      try {
        const { data, error } = await supabase
          .from('dogs')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true });
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          setDogProfiles(data);
          
          const savedProfile = localStorage.getItem('currentDogProfile');
          if (savedProfile) {
            setCurrentProfile(JSON.parse(savedProfile));
          } else {
            setCurrentProfile(data[0]);
            localStorage.setItem('currentDogProfile', JSON.stringify(data[0]));
          }
        }
      } catch (error) {
        console.error('Erreur chargement chiens:', error);
      }
    };
    
    fetchDogProfiles();
  }, [user?.id]);
  
  useEffect(() => {
    const fetchUserInfo = async () => {
      if (!user?.id) return;
      
      try {
        const { data: profile, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (error) {
          console.error('Erreur chargement profil:', error);
          setUserName(user.email?.split('@')[0] || 'Utilisateur');
          return;
        }
        
        if (profile) {
          setUserName(profile.full_name || user.email?.split('@')[0] || 'Utilisateur');
          
          const avatarPath = profile.avatar_url;
          if (avatarPath) {
            if (avatarPath.startsWith('http')) {
              setUserAvatar(avatarPath);
            } else {
              const { data } = supabase.storage
                .from('user-avatars')
                .getPublicUrl(avatarPath);
              
              setUserAvatar(data.publicUrl);
            }
          }
        }
      } catch (error) {
        console.error('Erreur chargement infos utilisateur:', error);
      }
    };
    
    fetchUserInfo();
  }, [user?.id]);
  
  useEffect(() => {
    fetchTopPosts();
    fetchTagStats();
    fetchSuggestedUsers();
    fetchFollowedUsers();
    fetchUserStats();
  }, [user?.id]);
  
  useEffect(() => {
    fetchPosts();
  }, [selectedTag, feedType, followedUsers]);
  
  const fetchUserStats = async () => {
    if (!user?.id) return;
    
    try {
      const { count: postsCount } = await supabase
        .from('forum_posts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .is('forum_id', null);
      
      const { count: followersCount } = await supabase
        .from('user_follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', user.id);
      
      const { count: followingCount } = await supabase
        .from('user_follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', user.id);
      
      setUserStats({
        posts: postsCount || 0,
        followers: followersCount || 0,
        following: followingCount || 0
      });
    } catch (error) {
      console.error('Erreur stats:', error);
    }
  };
  
  const fetchFollowedUsers = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('user_follows')
        .select('following_id')
        .eq('follower_id', user.id);
      
      if (error && error.code !== 'PGRST116') {
        console.error('Erreur chargement follows:', error);
        return;
      }
      
      if (data) {
        setFollowedUsers(new Set(data.map(f => f.following_id)));
      }
    } catch (error) {
      console.error('Erreur follows:', error);
    }
  };
  
  const fetchSuggestedUsers = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, full_name, email, avatar_url')
        .neq('id', user.id)
        .limit(5);
      
      if (error) throw error;
      
      const usersWithDogs = await Promise.all(
        (data || []).map(async (profile) => {
          const { data: dogs } = await supabase
            .from('dogs')
            .select('breed')
            .eq('user_id', profile.id)
            .limit(1)
            .single();
          
          return {
            ...profile,
            dogBreed: dogs?.breed || 'Chien'
          };
        })
      );
      
      setSuggestedUsers(usersWithDogs);
    } catch (error) {
      console.error('Erreur suggestions:', error);
    }
  };
  
  const handleFollow = async (userId) => {
    if (!user?.id) return;
    
    try {
      if (followedUsers.has(userId)) {
        await supabase
          .from('user_follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', userId);
        
        setFollowedUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(userId);
          return newSet;
        });
      } else {
        await supabase
          .from('user_follows')
          .insert({
            follower_id: user.id,
            following_id: userId
          });
        
        await supabase.rpc('create_notification', {
          p_user_id: userId,
          p_actor_id: user.id,
          p_type: 'follow'
        });
        
        setFollowedUsers(prev => new Set(prev).add(userId));
      }
      
      fetchUserStats();
    } catch (error) {
      console.error('Erreur follow:', error);
    }
  };
  
  const fetchTagStats = async () => {
    try {
      const { data, error } = await supabase
        .from('forum_posts')
        .select('tags')
        .is('forum_id', null)
        .eq('is_hidden', false);
      
      if (error) throw error;
      
      const tagCount = {};
      data.forEach(post => {
        if (post.tags) {
          post.tags.forEach(tag => {
            tagCount[tag] = (tagCount[tag] || 0) + 1;
          });
        }
      });
      
      const stats = Object.entries(tagCount)
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      
      setTagStats(stats);
    } catch (error) {
      console.error('Erreur stats tags:', error);
    }
  };
  
  const fetchTopPosts = async () => {
    try {
      const { data: postsData, error: postsError } = await supabase
        .from('forum_posts')
        .select('*')
        .is('forum_id', null)
        .eq('is_hidden', false)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('like_count', { ascending: false })
        .limit(5);
      
      if (postsError) throw postsError;
      
      const filtered = postsData.filter(post => post.like_count >= 3);
      
      const postsWithAuthors = await Promise.all(
        filtered.map(async (post) => {
          const { data: authorData } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', post.user_id)
            .single();
          
          return {
            ...post,
            author: authorData
          };
        })
      );
      
      setTopPosts(postsWithAuthors);
    } catch (error) {
      console.error('Erreur chargement top posts:', error);
    }
  };
  
  const fetchPosts = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('forum_posts')
        .select('*')
        .is('forum_id', null)
        .eq('is_hidden', false)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (feedType === 'following' && followedUsers.size > 0) {
        query = query.in('user_id', Array.from(followedUsers));
      }
      
      if (selectedTag !== 'all') {
        query = query.contains('tags', [selectedTag]);
      }
      
      const { data: postsData, error: postsError } = await query;
      
      if (postsError) throw postsError;
      
      const postsWithAuthors = await Promise.all(
        (postsData || []).map(async (post) => {
          try {
            const { data } = await supabase
              .from('user_profiles')
              .select('*')
              .eq('id', post.user_id)
              .single();
            
            return {
              ...post,
              author: data
            };
          } catch (err) {
            return post;
          }
        })
      );
      
      setPosts(postsWithAuthors);
    } catch (error) {
      console.error('Erreur chargement posts:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleProfileChange = (profile) => {
    setCurrentProfile(profile);
    localStorage.setItem('currentDogProfile', JSON.stringify(profile));
  };
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="sticky top-0 z-50 bg-card border-b border-border shadow-soft">
        <div className="max-w-screen-xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-heading font-semibold text-foreground">
              Communauté
            </h1>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={() => navigate('/notifications')}
                className="relative p-2 hover:bg-muted rounded-full transition-smooth"
              >
                <Bell size={24} className="text-foreground" />
                {unreadCount > 0 && (
                  <div className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </div>
                )}
              </button>
              
              <UserMenu
                dogProfiles={dogProfiles}
                currentDog={currentProfile}
                onDogChange={handleProfileChange}
              />
            </div>
          </div>
        </div>
      </div>
      
      <TabNavigation />
      
      <main className="main-content flex-1">
        <div className="max-w-screen-xl mx-auto px-4 py-6">
          <div className="flex gap-6">
            
            <aside className="hidden lg:block lg:w-64 xl:w-80 flex-shrink-0">
              <div className="sticky top-24 space-y-4">
                
                <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-6">
                  <div className="text-center mb-4">
                    {userAvatar ? (
                      <img
                        src={userAvatar}
                        alt={userName}
                        className="w-20 h-20 rounded-full mx-auto object-cover mb-3"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl mx-auto mb-3">
                        {userName?.charAt(0).toUpperCase() || 'U'}
                      </div>
                    )}
                    <h3 className="font-heading font-semibold text-gray-900">{userName}</h3>
                    {currentProfile && (
                      <p className="text-sm text-gray-600">🐕 {currentProfile.name}</p>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="text-center">
                      <div className="font-bold text-gray-900">{userStats.posts}</div>
                      <div className="text-xs text-gray-600">Posts</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-gray-900">{userStats.followers}</div>
                      <div className="text-xs text-gray-600">Abonnés</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-gray-900">{userStats.following}</div>
                      <div className="text-xs text-gray-600">Abonnements</div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => navigate('/settings')}
                    className="w-full py-2 px-4 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium text-gray-700 transition-smooth flex items-center justify-center gap-2"
                  >
                    <SettingsIcon size={16} />
                    Paramètres
                  </button>
                </div>
                
              </div>
            </aside>
            
            <div className="flex-1 max-w-2xl mx-auto space-y-6">
              
              <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-6">
                <button
                  onClick={() => setShowCreatePost(true)}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl transition-smooth text-left"
                >
                  {userAvatar ? (
                    <img
                      src={userAvatar}
                      alt="Avatar"
                      className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                      {userName?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                  <span className="text-gray-600">Quoi de neuf avec ton chien ?</span>
                  <Plus size={20} className="ml-auto text-blue-500 flex-shrink-0" />
                </button>
              </div>
              
              <div className="flex gap-2 bg-white rounded-3xl shadow-sm border border-gray-200 p-2">
                <button
                  onClick={() => setFeedType('following')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-smooth ${
                    feedType === 'following'
                      ? 'bg-blue-500 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Sparkles size={20} />
                  <span>Pour toi</span>
                </button>
                
                <button
                  onClick={() => setFeedType('explore')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-smooth ${
                    feedType === 'explore'
                      ? 'bg-blue-500 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <UsersIcon size={20} />
                  <span>Explorer</span>
                </button>
              </div>
              
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {TAGS.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(tag)}
                    className={`px-4 py-3 rounded-full text-sm font-medium whitespace-nowrap transition-smooth flex-shrink-0 ${
                      selectedTag === tag
                        ? 'bg-blue-500 text-white'
                        : 'bg-white border border-gray-200 hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    {tag === 'all' ? 'Tous' : `#${tag}`}
                  </button>
                ))}
              </div>
              
              {loading ? (
                <div className="flex justify-center py-20">
                  <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                </div>
              ) : posts.length > 0 ? (
                <div className="space-y-4">
                  {posts.map((post) => (
                    <PostCard 
                      key={post.id} 
                      post={post} 
                      currentUserId={user?.id}
                      currentUserAvatar={userAvatar}
                      currentUserName={userName}
                      onUpdate={fetchPosts}
                      isTopPost={false}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-3xl p-12 text-center border border-gray-200">
                  <p className="text-gray-600">Aucun post pour le moment</p>
                </div>
              )}
            </div>
            
            <aside className="hidden md:block md:w-72 lg:w-80 flex-shrink-0">
              <div className="sticky top-24 space-y-4">
                
                <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-6">
                  <h3 className="font-heading font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <UserPlus size={20} className="text-blue-500" />
                    Qui suivre
                  </h3>
                  <div className="space-y-3">
                    {suggestedUsers.slice(0, 3).map((suggestedUser) => (
                      <div key={suggestedUser.id} className="flex items-center gap-3">
                        {suggestedUser.avatar_url ? (
                          <img
                            src={suggestedUser.avatar_url.startsWith('http') 
                              ? suggestedUser.avatar_url 
                              : supabase.storage.from('user-avatars').getPublicUrl(suggestedUser.avatar_url).data.publicUrl}
                            alt={suggestedUser.full_name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                            {(suggestedUser.full_name || suggestedUser.email)?.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-sm truncate">
                            {suggestedUser.full_name || suggestedUser.email?.split('@')[0]}
                          </p>
                          <p className="text-xs text-gray-600 truncate">{suggestedUser.dogBreed}</p>
                        </div>
                        <button
                          onClick={() => handleFollow(suggestedUser.id)}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition-smooth ${
                            followedUsers.has(suggestedUser.id)
                              ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                              : 'bg-blue-500 text-white hover:bg-blue-600'
                          }`}
                        >
                          {followedUsers.has(suggestedUser.id) ? 'Suivi' : 'Suivre'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                
                {tagStats.length > 0 && (
                  <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-6">
                    <h3 className="font-heading font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Hash size={20} className="text-blue-500" />
                      Tags populaires
                    </h3>
                    <div className="space-y-2">
                      {tagStats.map((stat) => (
                        <button
                          key={stat.tag}
                          onClick={() => setSelectedTag(stat.tag)}
                          className="w-full flex items-center justify-between px-3 py-2 hover:bg-gray-50 rounded-xl transition-smooth text-left"
                        >
                          <span className="text-sm font-medium text-gray-900">#{stat.tag}</span>
                          <span className="text-xs text-gray-600">{stat.count} posts</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-6">
                  <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                    <Link to="/cgu" className="hover:underline">CGU</Link>
                    <span>·</span>
                    <Link to="/mentions-legales" className="hover:underline">Mentions légales</Link>
                    <span>·</span>
                    <Link to="/politique-confidentialite" className="hover:underline">Confidentialité</Link>
                    <span>·</span>
                    <Link to="/contact" className="hover:underline">Contact</Link>
                  </div>
                  <p className="text-xs text-gray-500 mt-3">© 2024 Doogybook</p>
                </div>
                
              </div>
            </aside>
            
          </div>
        </div>
      </main>
      
      <Footer />
      
      {showCreatePost && (
        <CreatePostModal
          onClose={() => setShowCreatePost(false)}
          onSuccess={() => {
            setShowCreatePost(false);
            fetchPosts();
            fetchTopPosts();
            fetchTagStats();
            fetchUserStats();
          }}
        />
      )}
    </div>
  );
};

const PostCard = ({ post, currentUserId, currentUserAvatar, currentUserName, onUpdate, isTopPost }) => {
  const navigate = useNavigate();
  const [hasLiked, setHasLiked] = useState(false);
  const [localLikeCount, setLocalLikeCount] = useState(post.like_count || 0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [postImages, setPostImages] = useState([]);
  const [loadingImages, setLoadingImages] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showShareToast, setShowShareToast] = useState(false);
  
  const authorName = post.author?.full_name || post.author?.email?.split('@')[0] || 'Utilisateur';
  const authorAvatar = post.author?.avatar_url 
    ? (post.author.avatar_url.startsWith('http') 
        ? post.author.avatar_url 
        : supabase.storage.from('user-avatars').getPublicUrl(post.author.avatar_url).data.publicUrl)
    : null;
  
  useEffect(() => {
    checkIfLiked();
    fetchPostImages();
  }, [post.id, currentUserId]);
  
  useEffect(() => {
    if (showComments) {
      fetchComments();
    }
  }, [showComments]);
  
  const fetchPostImages = async () => {
    setLoadingImages(true);
    try {
      const { data, error } = await supabase
        .from('forum_post_images')
        .select('*')
        .eq('post_id', post.id)
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      setPostImages(data || []);
    } catch (error) {
      console.error('Erreur chargement images:', error);
    } finally {
      setLoadingImages(false);
    }
  };
  
  const checkIfLiked = async () => {
    if (!currentUserId) return;
    
    try {
      const { data } = await supabase
        .from('forum_likes')
        .select('id')
        .eq('post_id', post.id)
        .eq('user_id', currentUserId)
        .maybeSingle();
      
      setHasLiked(!!data);
    } catch (error) {
      console.error('Erreur vérification like:', error);
    }
  };
  
  const fetchComments = async () => {
    setLoadingComments(true);
    try {
      const { data: commentsData, error } = await supabase
        .from('forum_comments')
        .select('*')
        .eq('post_id', post.id)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      const commentsWithAuthors = await Promise.all(
        (commentsData || []).map(async (comment) => {
          try {
            const { data: authorData } = await supabase
              .from('user_profiles')
              .select('*')
              .eq('id', comment.user_id)
              .single();
            
            return {
              ...comment,
              author: authorData
            };
          } catch (err) {
            return comment;
          }
        })
      );
      
      setComments(commentsWithAuthors);
    } catch (error) {
      console.error('Erreur chargement commentaires:', error);
    } finally {
      setLoadingComments(false);
    }
  };
  
  const handleLike = async (e) => {
    e.stopPropagation();
    if (!currentUserId) return;
    
    try {
      if (hasLiked) {
        await supabase
          .from('forum_likes')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', currentUserId);
        
        setHasLiked(false);
        setLocalLikeCount(prev => prev - 1);
      } else {
        await supabase
          .from('forum_likes')
          .insert({
            post_id: post.id,
            user_id: currentUserId
          });
        
        await supabase.rpc('create_notification', {
          p_user_id: post.user_id,
          p_actor_id: currentUserId,
          p_type: 'like',
          p_post_id: post.id
        });
        
        setHasLiked(true);
        setLocalLikeCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('Erreur like:', error);
    }
  };
  
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUserId) return;
    
    setSubmittingComment(true);
    try {
      const { data: newCommentData, error } = await supabase
        .from('forum_comments')
        .insert({
          post_id: post.id,
          user_id: currentUserId,
          content: newComment.trim()
        })
        .select()
        .single();
      
      if (error) throw error;
      
      await supabase.rpc('create_notification', {
        p_user_id: post.user_id,
        p_actor_id: currentUserId,
        p_type: 'comment',
        p_post_id: post.id,
        p_comment_id: newCommentData.id
      });
      
      setNewComment('');
      fetchComments();
      
      await supabase
        .from('forum_posts')
        .update({ comment_count: (post.comment_count || 0) + 1 })
        .eq('id', post.id);
      
      onUpdate();
    } catch (error) {
      console.error('Erreur ajout commentaire:', error);
      alert('Erreur lors de l\'ajout du commentaire');
    } finally {
      setSubmittingComment(false);
    }
  };
  
  const copyText = async () => {
    const textToCopy = `${post.title ? post.title + '\n\n' : ''}${post.content}\n\nPublié par ${authorName}`;
    
    try {
      await navigator.clipboard.writeText(textToCopy);
      setShowShareToast(true);
      setTimeout(() => setShowShareToast(false), 3000);
      setShowShareModal(false);
    } catch (err) {
      alert('Texte copié !');
    }
  };
  
  const copyLink = async () => {
    const postUrl = `${window.location.origin}/social-feed?post=${post.id}`;
    
    try {
      await navigator.clipboard.writeText(postUrl);
      setShowShareToast(true);
      setTimeout(() => setShowShareToast(false), 3000);
      setShowShareModal(false);
    } catch (err) {
      alert('Lien copié !');
    }
  };
  
  const shareToWhatsApp = () => {
    const text = `${post.title ? post.title + '\n\n' : ''}${post.content}\n\n👉 ${window.location.origin}/social-feed?post=${post.id}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
    setShowShareModal(false);
  };
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 60) return `Il y a ${minutes} min`;
    if (hours < 24) return `Il y a ${hours}h`;
    if (days < 7) return `Il y a ${days}j`;
    return date.toLocaleDateString('fr-FR');
  };
  
  const cardClasses = isTopPost 
    ? "bg-gradient-to-br from-orange-50 to-yellow-50 border-2 border-orange-200 rounded-3xl shadow-sm p-6 transition-smooth"
    : "bg-white border border-gray-200 rounded-3xl shadow-sm p-6 transition-smooth";
  
  return (
    <div className={cardClasses}>
      <div className="flex items-start gap-3 mb-4">
        <button
          onClick={() => navigate(`/profile/${post.user_id}`)}
          className="flex-shrink-0"
        >
          {authorAvatar ? (
            <img
              src={authorAvatar}
              alt={authorName}
              className="w-12 h-12 rounded-full object-cover cursor-pointer hover:opacity-80 transition-smooth"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold cursor-pointer hover:opacity-80 transition-smooth">
              {authorName.charAt(0).toUpperCase()}
            </div>
          )}
        </button>
        
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(`/profile/${post.user_id}`)}
              className="font-semibold text-gray-900 hover:underline"
            >
              {authorName}
            </button>
            {isTopPost && <TrendingUp size={16} className="text-orange-500" />}
          </div>
          <span className="text-sm text-gray-600">{formatDate(post.created_at)}</span>
        </div>
      </div>
      
      {post.title && (
        <h3 className="text-lg font-heading font-semibold text-gray-900 mb-2">{post.title}</h3>
      )}
      
      <p className="text-base text-gray-900 whitespace-pre-wrap leading-relaxed mb-4">{post.content}</p>
      
      {!loadingImages && postImages.length > 0 && (
        <div className="mb-4 space-y-2">
          {postImages.map((img) => (
            <img
              key={img.id}
              src={img.image_url}
              alt={img.caption || 'Image'}
              className="w-full rounded-xl"
              style={{ maxHeight: '400px', objectFit: 'contain' }}
            />
          ))}
        </div>
      )}
      
      {post.tags && post.tags.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-4">
          {post.tags.map((tag, idx) => (
            <span 
              key={idx} 
              className={`px-3 py-1 text-sm font-medium rounded-full ${
                isTopPost ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
              }`}
            >
              #{tag}
            </span>
          ))}
        </div>
      )}
      
      <div className="flex items-center gap-6 pt-4 border-t border-gray-200">
        <button onClick={handleLike} className="flex items-center gap-2">
          <Heart 
            size={24} 
            className={hasLiked ? 'text-red-600' : 'text-gray-400'} 
            fill={hasLiked ? 'currentColor' : 'none'} 
          />
          <span className="text-base font-medium text-gray-700">{localLikeCount}</span>
        </button>
        
        <button onClick={() => setShowComments(!showComments)} className="flex items-center gap-2">
          <MessageCircle size={24} className="text-gray-400" />
          <span className="text-base font-medium text-gray-700">{post.comment_count || 0}</span>
        </button>
        
        <button onClick={() => setShowShareModal(true)} className="flex items-center gap-2 ml-auto">
          <Share2 size={24} className="text-gray-400" />
        </button>
      </div>
      
      {showComments && (
        <div className="mt-6 pt-6 border-t border-gray-200 space-y-4">
          <form onSubmit={handleCommentSubmit} className="flex gap-3">
            {currentUserAvatar ? (
              <img src={currentUserAvatar} alt="Avatar" className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                {currentUserName?.charAt(0).toUpperCase() || 'U'}
              </div>
            )}
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Écrivez un commentaire..."
                className="w-full px-4 py-3 text-base border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 resize-none"
                rows={3}
              />
              <button
                type="submit"
                disabled={!newComment.trim() || submittingComment}
                className="mt-2 px-4 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-smooth disabled:bg-gray-300 flex items-center gap-2"
              >
                <Send size={18} />
                {submittingComment ? 'Envoi...' : 'Commenter'}
              </button>
            </div>
          </form>
          
          {loadingComments ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
            </div>
          ) : comments.length > 0 ? (
            <div className="space-y-4">
              {comments.map((comment) => {
                const commentAuthorName = comment.author?.full_name || comment.author?.email?.split('@')[0] || 'Utilisateur';
                const commentAuthorAvatar = comment.author?.avatar_url 
                  ? (comment.author.avatar_url.startsWith('http') 
                      ? comment.author.avatar_url 
                      : supabase.storage.from('user-avatars').getPublicUrl(comment.author.avatar_url).data.publicUrl)
                  : null;
                
                return (
                  <div key={comment.id} className="flex gap-3">
                    <button
                      onClick={() => navigate(`/profile/${comment.user_id}`)}
                      className="flex-shrink-0"
                    >
                      {commentAuthorAvatar ? (
                        <img src={commentAuthorAvatar} alt={commentAuthorName} className="w-10 h-10 rounded-full object-cover cursor-pointer hover:opacity-80 transition-smooth" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold cursor-pointer hover:opacity-80 transition-smooth">
                          {commentAuthorName.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </button>
                    <div className="flex-1">
                      <div className="bg-gray-100 rounded-xl px-4 py-3">
                        <button
                          onClick={() => navigate(`/profile/${comment.user_id}`)}
                          className="font-semibold text-sm text-gray-900 mb-1 hover:underline block"
                        >
                          {commentAuthorName}
                        </button>
                        <p className="text-base text-gray-900">{comment.content}</p>
                      </div>
                      <p className="text-sm text-gray-600 mt-1 ml-3">{formatDate(comment.created_at)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-600 text-center py-8">Aucun commentaire</p>
          )}
        </div>
      )}
      
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50" onClick={() => setShowShareModal(false)}>
          <div className="bg-white rounded-t-3xl sm:rounded-3xl p-6 max-w-md w-full space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-heading font-semibold text-gray-900 mb-4">Partager</h3>
            <button onClick={copyText} className="w-full flex items-center gap-4 px-4 py-4 rounded-xl hover:bg-gray-100 text-left">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span className="font-medium text-gray-900">Copier le texte</span>
            </button>
            <button onClick={shareToWhatsApp} className="w-full flex items-center gap-4 px-4 py-4 rounded-xl hover:bg-gray-100 text-left">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
              </div>
              <span className="font-medium text-gray-900">WhatsApp</span>
            </button>
            <button onClick={copyLink} className="w-full flex items-center gap-4 px-4 py-4 rounded-xl hover:bg-gray-100 text-left">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <span className="font-medium text-gray-900">Copier le lien</span>
            </button>
          </div>
        </div>
      )}
      
      {showShareToast && (
        <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-50 bg-green-600 text-white px-6 py-3 rounded-xl shadow-xl">
          ✅ Copié !
        </div>
      )}
    </div>
  );
};

export default SocialFeed;
