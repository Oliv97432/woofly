import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Heart, MessageCircle, TrendingUp, Plus, Share2, Send, User, Play, Home, BookOpen, Settings, Dog } from 'lucide-react';
import TabNavigation from '../../components/TabNavigation';
import UserMenu from '../../components/UserMenu';
import Footer from '../../components/Footer';
import CreatePostModal from '../../components/CreatePostModal';

const SocialFeed = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [posts, setPosts] = useState([]);
  const [topPosts, setTopPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [selectedTag, setSelectedTag] = useState('all');
  const [currentProfile, setCurrentProfile] = useState(null);
  const [dogProfiles, setDogProfiles] = useState([]);
  const [userAvatar, setUserAvatar] = useState(null);
  const [userName, setUserName] = useState('');
  const [tagStats, setTagStats] = useState([]);
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [followedUsers, setFollowedUsers] = useState(new Set());
  
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
  }, [user?.id]);
  
  useEffect(() => {
    fetchPosts();
  }, [selectedTag]);
  
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
        
        setFollowedUsers(prev => new Set(prev).add(userId));
      }
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
    <div className="min-h-screen bg-background pb-20">
      {/* Header fixe */}
      <div className="sticky top-0 z-50 bg-card border-b border-border shadow-soft">
        <div className="max-w-screen-xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-heading font-bold text-foreground">
              Communauté
            </h1>
            <UserMenu
              dogProfiles={dogProfiles}
              currentDog={currentProfile}
              onDogChange={handleProfileChange}
            />
          </div>
        </div>
      </div>
      
      <TabNavigation />
      
      <div className="flex justify-center gap-6 px-4">
        {/* Sidebar gauche - Desktop uniquement */}
        <aside className="hidden lg:block w-64 sticky top-24 h-fit">
          <div className="bg-card border border-border rounded-2xl p-4 space-y-2">
            <Link
              to="/dog-profile"
              className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted transition-smooth text-foreground"
            >
              <Dog size={20} />
              <span className="font-medium">Mon Chien</span>
            </Link>
            
            <Link
              to="/social-feed"
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/10 text-primary font-medium"
            >
              <Home size={20} />
              <span>Communauté</span>
            </Link>
            
            <Link
              to="/daily-tip"
              className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted transition-smooth text-foreground"
            >
              <BookOpen size={20} />
              <span className="font-medium">Conseils</span>
            </Link>
            
            <Link
              to="/settings"
              className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted transition-smooth text-foreground"
            >
              <Settings size={20} />
              <span className="font-medium">Paramètres</span>
            </Link>
          </div>
        </aside>
        
        {/* Feed central */}
        <main className="flex-1 max-w-2xl py-4 space-y-4">
          {/* Bouton créer post */}
          <div className="bg-card border border-border rounded-2xl p-4">
            <button
              onClick={() => setShowCreatePost(true)}
              className="w-full flex items-center gap-3 px-4 py-3 bg-muted hover:bg-muted/80 rounded-xl transition-smooth text-left min-h-[56px]"
            >
              {userAvatar ? (
                <img
                  src={userAvatar}
                  alt="Avatar"
                  className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                  {userName?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
              <span className="text-muted-foreground text-base">Quoi de neuf avec ton chien ?</span>
              <Plus size={20} className="ml-auto text-primary flex-shrink-0" />
            </button>
          </div>
          
          {/* Top posts */}
          {topPosts.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-2">
                <TrendingUp className="text-orange-500" size={20} />
                <h2 className="text-lg font-heading font-bold text-foreground">
                  🔥 Les posts les plus utiles
                </h2>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                {topPosts.map((post) => (
                  <PostCard 
                    key={post.id} 
                    post={post} 
                    currentUserId={user?.id}
                    currentUserAvatar={userAvatar}
                    currentUserName={userName}
                    onUpdate={fetchPosts}
                    isTopPost={true}
                  />
                ))}
              </div>
              
              <div className="border-t border-border pt-4">
                <h3 className="text-base font-heading font-semibold text-foreground mb-3 px-2">
                  Tous les posts
                </h3>
              </div>
            </div>
          )}
          
          {/* Tags */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide px-1">
            {TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-smooth flex-shrink-0 min-h-[44px] ${
                  selectedTag === tag
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card border border-border hover:bg-muted'
                }`}
              >
                {tag === 'all' ? 'Tous' : `#${tag}`}
              </button>
            ))}
          </div>
          
          {/* Liste des posts */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
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
            <div className="bg-card rounded-3xl p-12 text-center border border-border">
              <p className="text-muted-foreground mb-4 text-base">
                Aucun post pour le moment
              </p>
              <button
                onClick={() => setShowCreatePost(true)}
                className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-smooth inline-flex items-center gap-2 min-h-[48px]"
              >
                <Plus size={20} />
                Créer le premier post
              </button>
            </div>
          )}
        </main>
        
        {/* Sidebar droite - Desktop uniquement */}
        <aside className="hidden xl:block w-72 sticky top-24 h-fit space-y-4">
          {/* Tendances */}
          {tagStats.length > 0 && (
            <div className="bg-card border border-border rounded-2xl p-4">
              <h3 className="font-heading font-bold text-foreground mb-3 flex items-center gap-2">
                <TrendingUp size={18} className="text-orange-500" />
                Tendances
              </h3>
              <div className="space-y-2">
                {tagStats.map(({ tag, count }) => (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(tag)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-muted transition-smooth text-left min-h-[44px]"
                  >
                    <span className="text-sm font-medium text-foreground">#{tag}</span>
                    <span className="text-xs text-muted-foreground">{count} posts</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Suggestions */}
          {suggestedUsers.length > 0 && (
            <div className="bg-card border border-border rounded-2xl p-4">
              <h3 className="font-heading font-bold text-foreground mb-3 flex items-center gap-2">
                <User size={18} />
                À suivre
              </h3>
              <div className="space-y-3">
                {suggestedUsers.map((suggestedUser) => {
                  const avatarUrl = suggestedUser.avatar_url 
                    ? (suggestedUser.avatar_url.startsWith('http') 
                        ? suggestedUser.avatar_url 
                        : supabase.storage.from('user-avatars').getPublicUrl(suggestedUser.avatar_url).data.publicUrl)
                    : null;
                  
                  const isFollowing = followedUsers.has(suggestedUser.id);
                  const displayName = suggestedUser.full_name || suggestedUser.email?.split('@')[0] || 'Utilisateur';
                  
                  return (
                    <div key={suggestedUser.id} className="flex items-center gap-3">
                      <button 
                        onClick={() => navigate(`/profile/${suggestedUser.id}`)}
                        className="flex-shrink-0"
                      >
                        {avatarUrl ? (
                          <img
                            src={avatarUrl}
                            alt={displayName}
                            className="w-12 h-12 rounded-full object-cover cursor-pointer hover:opacity-80 transition-smooth"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold cursor-pointer hover:opacity-80 transition-smooth">
                            {displayName.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </button>
                      <button 
                        onClick={() => navigate(`/profile/${suggestedUser.id}`)}
                        className="flex-1 min-w-0 text-left"
                      >
                        <div className="font-medium text-sm text-foreground truncate hover:underline">{displayName}</div>
                        <div className="text-xs text-muted-foreground truncate">{suggestedUser.dogBreed}</div>
                      </button>
                      <button 
                        onClick={() => handleFollow(suggestedUser.id)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-smooth min-h-[40px] ${
                          isFollowing
                            ? 'bg-muted text-foreground hover:bg-muted/80'
                            : 'bg-primary text-primary-foreground hover:bg-primary/90'
                        }`}
                      >
                        {isFollowing ? 'Suivi' : 'Suivre'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </aside>
      </div>
      
      <Footer />
      
      {showCreatePost && (
        <CreatePostModal
          onClose={() => setShowCreatePost(false)}
          onSuccess={() => {
            setShowCreatePost(false);
            fetchPosts();
            fetchTopPosts();
            fetchTagStats();
          }}
        />
      )}
    </div>
  );
};

// Composant Avatar
const Avatar = ({ src, name, size = 'md', className = '' }) => {
  const [imageError, setImageError] = useState(false);
  
  const sizeClasses = {
    sm: 'w-10 h-10 text-sm',
    md: 'w-12 h-12 text-base',
    lg: 'w-14 h-14 text-lg'
  };
  
  if (src && !imageError) {
    return (
      <img
        src={src}
        alt={name || 'Avatar'}
        className={`${sizeClasses[size]} rounded-full object-cover ${className}`}
        onError={() => setImageError(true)}
      />
    );
  }
  
  return (
    <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold ${className}`}>
      {name ? name.charAt(0).toUpperCase() : <User size={size === 'sm' ? 16 : size === 'lg' ? 24 : 20} />}
    </div>
  );
};

// Composant PostCard
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
      const { error } = await supabase
        .from('forum_comments')
        .insert({
          post_id: post.id,
          user_id: currentUserId,
          content: newComment.trim()
        });
      
      if (error) throw error;
      
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
      alert('Texte copié :\n\n' + textToCopy);
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
      alert('Lien : ' + postUrl);
    }
  };
  
  const shareToWhatsApp = () => {
    const text = `${post.title ? post.title + '\n\n' : ''}${post.content}\n\n👉 ${window.location.origin}/social-feed?post=${post.id}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
    setShowShareModal(false);
  };
  
  const shareToFacebook = () => {
    const postUrl = `${window.location.origin}/social-feed?post=${post.id}`;
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}&quote=${encodeURIComponent(post.content)}`;
    window.open(facebookUrl, '_blank', 'width=600,height=400');
    setShowShareModal(false);
  };
  
  const downloadImage = async () => {
    if (postImages.length === 0) return;
    
    try {
      const imageUrl = postImages[0].image_url;
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `doogybook-post-${post.id}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      setShowShareToast(true);
      setTimeout(() => setShowShareToast(false), 3000);
      setShowShareModal(false);
    } catch (err) {
      console.error('Erreur téléchargement:', err);
      alert('Erreur lors du téléchargement de l\'image');
    }
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
    ? "bg-gradient-to-br from-orange-50 to-yellow-50 border-2 border-orange-200 rounded-2xl p-4 transition-smooth"
    : "bg-card border border-border rounded-2xl p-4 transition-smooth";
  
  return (
    <div className={cardClasses}>
      {/* En-tête du post */}
      <div className="flex items-start gap-3 mb-3">
        <button 
          onClick={() => navigate(`/profile/${post.user_id}`)}
          className="flex-shrink-0"
        >
          <Avatar 
            src={authorAvatar} 
            name={authorName} 
            size="md" 
            className={`cursor-pointer hover:opacity-80 transition-smooth ${isTopPost ? 'bg-gradient-to-br from-orange-500 to-yellow-600' : ''}`}
          />
        </button>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <button 
              onClick={() => navigate(`/profile/${post.user_id}`)}
              className="font-semibold text-foreground text-base hover:underline"
            >
              {authorName}
            </button>
            {isTopPost && <TrendingUp size={16} className="text-orange-500 flex-shrink-0" />}
            {post.is_short && <Play size={16} className="text-primary flex-shrink-0" />}
          </div>
          <span className="text-muted-foreground text-sm block mt-0.5">
            {formatDate(post.created_at)}
          </span>
        </div>
      </div>
      
      {/* Contenu du post */}
      <div className="mb-3">
        {post.title && (
          <h3 className="text-base font-bold text-foreground mb-2">{post.title}</h3>
        )}
        
        <p className="text-base text-foreground whitespace-pre-wrap leading-relaxed">{post.content}</p>
      </div>
      
      {/* Vidéo (si short) */}
      {post.is_short && post.video_url && (
        <div className="mb-3 relative">
          <video
            src={post.video_url}
            controls
            className="w-full rounded-xl"
            style={{ maxHeight: '400px' }}
            preload="metadata"
          >
            Votre navigateur ne supporte pas la lecture de vidéos.
          </video>
          {post.video_duration && (
            <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded-lg text-xs font-medium">
              {post.video_duration}s
            </div>
          )}
        </div>
      )}
      
      {/* Images */}
      {!post.is_short && !loadingImages && postImages.length > 0 && (
        <div className="mb-3 space-y-2">
          {postImages.map((img) => (
            <div key={img.id} className="w-full">
              <img
                src={img.image_url}
                alt={img.caption || 'Image du post'}
                className="w-full rounded-xl"
                style={{ maxHeight: '400px', objectFit: 'contain', backgroundColor: '#f3f4f6' }}
              />
            </div>
          ))}
        </div>
      )}
      
      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-4">
          {post.tags.map((tag, idx) => (
            <span 
              key={idx} 
              className={`px-3 py-1.5 text-sm font-medium rounded-full ${
                isTopPost
                  ? 'bg-orange-100 text-orange-700'
                  : 'bg-primary/10 text-primary'
              }`}
            >
              #{tag}
            </span>
          ))}
        </div>
      )}
      
      {/* Actions */}
      <div className="flex items-center gap-6 pt-3 border-t border-border">
        <button
          onClick={handleLike}
          className="flex items-center gap-2 transition-smooth min-h-[44px]"
        >
          <Heart 
            size={24} 
            className={hasLiked ? 'text-red-600' : 'text-muted-foreground'} 
            fill={hasLiked ? 'currentColor' : 'none'} 
          />
          <span className={`text-base font-medium ${hasLiked ? 'text-red-600' : 'text-muted-foreground'}`}>
            {localLikeCount}
          </span>
        </button>
        
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-2 transition-smooth min-h-[44px]"
        >
          <MessageCircle size={24} className="text-muted-foreground" />
          <span className="text-base font-medium text-muted-foreground">
            {post.comment_count || 0}
          </span>
        </button>
        
        <button 
          onClick={() => setShowShareModal(true)}
          className="flex items-center gap-2 transition-smooth min-h-[44px] ml-auto"
        >
          <Share2 size={24} className="text-muted-foreground" />
        </button>
      </div>
      
      {/* Section commentaires */}
      {showComments && (
        <div className="mt-4 pt-4 border-t border-border space-y-4">
          <form onSubmit={handleCommentSubmit} className="flex gap-3">
            <Avatar src={currentUserAvatar} name={currentUserName} size="sm" />
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Écrivez un commentaire..."
                className="w-full px-4 py-3 text-base border border-border rounded-xl focus:ring-2 focus:ring-primary resize-none"
                rows={3}
                disabled={submittingComment}
              />
              <button
                type="submit"
                disabled={!newComment.trim() || submittingComment}
                className="mt-2 px-4 py-2.5 text-base bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-smooth disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2 min-h-[44px]"
              >
                <Send size={18} />
                {submittingComment ? 'Envoi...' : 'Commenter'}
              </button>
            </div>
          </form>
          
          {loadingComments ? (
            <div className="flex justify-center py-6">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
                      <Avatar src={commentAuthorAvatar} name={commentAuthorName} size="sm" className="cursor-pointer hover:opacity-80 transition-smooth" />
                    </button>
                    <div className="flex-1">
                      <div className="bg-muted rounded-xl px-4 py-3">
                        <button 
                          onClick={() => navigate(`/profile/${comment.user_id}`)}
                          className="font-semibold text-sm mb-1 hover:underline block"
                        >
                          {commentAuthorName}
                        </button>
                        <p className="text-base text-foreground">{comment.content}</p>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1 ml-3">
                        {formatDate(comment.created_at)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-muted-foreground text-center text-base py-6">
              Aucun commentaire pour le moment. Soyez le premier à commenter !
            </p>
          )}
        </div>
      )}
      
      {/* Modal de partage */}
      {showShareModal && (
        <div 
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4"
          onClick={() => setShowShareModal(false)}
        >
          <div 
            className="bg-card rounded-t-3xl sm:rounded-3xl p-6 max-w-md w-full space-y-4 shadow-xl animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-foreground">Partager ce post</h3>
              <button 
                onClick={() => setShowShareModal(false)}
                className="p-2 hover:bg-muted rounded-full transition-smooth min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-2">
              {/* Copier le texte */}
              <button
                onClick={copyText}
                className="w-full flex items-center gap-4 px-4 py-4 rounded-xl hover:bg-muted transition-smooth text-left min-h-[60px]"
              >
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="font-medium text-foreground text-base">Copier le texte</div>
                  <div className="text-sm text-muted-foreground">Texte du post</div>
                </div>
              </button>
              
              {/* WhatsApp */}
              <button
                onClick={shareToWhatsApp}
                className="w-full flex items-center gap-4 px-4 py-4 rounded-xl hover:bg-muted transition-smooth text-left min-h-[60px]"
              >
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="font-medium text-foreground text-base">WhatsApp</div>
                  <div className="text-sm text-muted-foreground">Partager sur WhatsApp</div>
                </div>
              </button>
              
              {/* Facebook */}
              <button
                onClick={shareToFacebook}
                className="w-full flex items-center gap-4 px-4 py-4 rounded-xl hover:bg-muted transition-smooth text-left min-h-[60px]"
              >
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="font-medium text-foreground text-base">Facebook</div>
                  <div className="text-sm text-muted-foreground">Partager sur Facebook</div>
                </div>
              </button>
              
              {/* Télécharger image */}
              {postImages.length > 0 && (
                <button
                  onClick={downloadImage}
                  className="w-full flex items-center gap-4 px-4 py-4 rounded-xl hover:bg-muted transition-smooth text-left min-h-[60px]"
                >
                  <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-foreground text-base">Télécharger l'image</div>
                    <div className="text-sm text-muted-foreground">Enregistrer sur votre appareil</div>
                  </div>
                </button>
              )}
              
              {/* Copier le lien */}
              <button
                onClick={copyLink}
                className="w-full flex items-center gap-4 px-4 py-4 rounded-xl hover:bg-muted transition-smooth text-left min-h-[60px]"
              >
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="font-medium text-foreground text-base">Copier le lien</div>
                  <div className="text-sm text-muted-foreground">URL du post</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Toast confirmation */}
      {showShareToast && (
        <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-50 bg-green-600 text-white px-6 py-3 rounded-xl shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="font-medium">Copié avec succès !</span>
        </div>
      )}
    </div>
  );
};

export default SocialFeed;
