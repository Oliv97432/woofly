import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Heart, MessageCircle, TrendingUp, Plus, Eye, Share2, Send, ChevronDown, ChevronUp, User, Play } from 'lucide-react';
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
  
  const TAGS = ['all', 'santé', 'chiot', 'alimentation', 'comportement', 'balade', 'astuce'];
  
  // Charger les profils de chiens
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
  
  // Charger l'avatar et le nom de l'utilisateur connecté
  useEffect(() => {
    const fetchUserInfo = async () => {
      if (!user?.id) return;
      
      try {
        // Récupérer les infos depuis auth.users
        const { data: userData, error } = await supabase.auth.getUser();
        
        if (error) throw error;
        
        if (userData?.user) {
          const metadata = userData.user.user_metadata || {};
          
          // Nom
          setUserName(metadata.full_name || user.email?.split('@')[0] || 'Utilisateur');
          
          // Avatar
          const avatarPath = metadata.avatar_url;
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
  
  // Charger les top posts
  useEffect(() => {
    fetchTopPosts();
  }, []);
  
  // Charger les posts du feed
  useEffect(() => {
    fetchPosts();
  }, [selectedTag]);
  
  const fetchTopPosts = async () => {
    try {
      // Récupérer les posts
      const { data: postsData, error: postsError } = await supabase
        .from('forum_posts')
        .select('*')
        .is('forum_id', null)
        .eq('is_hidden', false)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('like_count', { ascending: false })
        .limit(5);
      
      if (postsError) throw postsError;
      
      // Filtrer ceux avec au moins 3 likes
      const filtered = postsData.filter(post => post.like_count >= 3);
      
      // Récupérer les infos des auteurs
      const postsWithAuthors = await Promise.all(
        filtered.map(async (post) => {
          const { data: authorData } = await supabase
            .from('users')
            .select('id, email, raw_user_meta_data')
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
      // Construire la query
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
      
      // Récupérer les infos des auteurs séparément
      const postsWithAuthors = await Promise.all(
        (postsData || []).map(async (post) => {
          // Essayer d'abord avec la table users
          let authorData = null;
          
          try {
            const { data } = await supabase
              .from('users')
              .select('id, email, raw_user_meta_data')
              .eq('id', post.user_id)
              .single();
            
            authorData = data;
          } catch (err) {
            // Si pas de table users, utiliser les métadonnées auth
            console.log('Pas de table users, fallback sur auth');
          }
          
          return {
            ...post,
            author: authorData
          };
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-card border-b border-border shadow-soft">
        <div className="max-w-screen-xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-heading font-semibold text-foreground">
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
      
      <main className="main-content">
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
          
          {/* Bouton Créer un post */}
          <div className="bg-card border border-border rounded-3xl p-4">
            <button
              onClick={() => setShowCreatePost(true)}
              className="w-full flex items-center gap-3 px-4 py-3 bg-muted hover:bg-muted/80 rounded-2xl transition-smooth text-left"
            >
              {userAvatar ? (
                <img
                  src={userAvatar}
                  alt="Avatar"
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                  {userName?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
              <span className="text-muted-foreground">Quoi de neuf avec ton chien ?</span>
              <Plus size={20} className="ml-auto text-primary" />
            </button>
          </div>
          
          {/* Section Top Posts */}
          {topPosts.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="text-orange-500" size={24} />
                <h2 className="text-xl font-heading font-bold text-foreground">
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
                <h3 className="text-lg font-heading font-semibold text-foreground mb-4">
                  Tous les posts
                </h3>
              </div>
            </div>
          )}
          
          {/* Filtres par tags */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-smooth ${
                  selectedTag === tag
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card border border-border hover:bg-muted'
                }`}
              >
                {tag === 'all' ? 'Tous' : `#${tag}`}
              </button>
            ))}
          </div>
          
          {/* Feed des posts */}
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
              <p className="text-muted-foreground mb-4">
                Aucun post pour le moment
              </p>
              <button
                onClick={() => setShowCreatePost(true)}
                className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-smooth inline-flex items-center gap-2"
              >
                <Plus size={18} />
                Créer le premier post
              </button>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
      
      {/* Modal Créer un post */}
      {showCreatePost && (
        <CreatePostModal
          onClose={() => setShowCreatePost(false)}
          onSuccess={() => {
            setShowCreatePost(false);
            fetchPosts();
            fetchTopPosts();
          }}
        />
      )}
    </div>
  );
};

// Fonction helper pour obtenir l'avatar
const getUserAvatar = (author) => {
  if (!author) return null;
  
  const avatarPath = author.raw_user_meta_data?.avatar_url;
  
  if (!avatarPath) return null;
  
  if (avatarPath.startsWith('http')) {
    return avatarPath;
  }
  
  const { data } = supabase.storage
    .from('user-avatars')
    .getPublicUrl(avatarPath);
  
  return data.publicUrl;
};

// Composant Avatar
const Avatar = ({ src, name, size = 'md', className = '' }) => {
  const [imageError, setImageError] = useState(false);
  
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg'
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
      {name ? name.charAt(0).toUpperCase() : <User size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} />}
    </div>
  );
};

// Composant PostCard avec commentaires inline
const PostCard = ({ post, currentUserId, currentUserAvatar, currentUserName, onUpdate, isTopPost }) => {
  const [hasLiked, setHasLiked] = useState(false);
  const [localLikeCount, setLocalLikeCount] = useState(post.like_count || 0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [postImages, setPostImages] = useState([]);
  const [loadingImages, setLoadingImages] = useState(true);
  
  // Extraire les infos de l'auteur
  const authorName = post.author?.raw_user_meta_data?.full_name || 
                     post.author?.email?.split('@')[0] || 
                     'Utilisateur';
  const authorAvatar = getUserAvatar(post.author);
  
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
      
      // Récupérer les infos des auteurs de commentaires
      const commentsWithAuthors = await Promise.all(
        (commentsData || []).map(async (comment) => {
          try {
            const { data: authorData } = await supabase
              .from('users')
              .select('id, email, raw_user_meta_data')
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
  
  const toggleComments = () => {
    setShowComments(!showComments);
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
    ? "bg-gradient-to-br from-orange-50 to-yellow-50 border-2 border-orange-200 rounded-3xl p-6 transition-smooth"
    : "bg-card border border-border rounded-3xl p-6 transition-smooth";
  
  return (
    <div className={cardClasses}>
      {/* Header du post */}
      <div className="flex items-start gap-4 mb-4">
        <Avatar 
          src={authorAvatar} 
          name={authorName} 
          size="lg" 
          className={isTopPost ? 'bg-gradient-to-br from-orange-500 to-yellow-600' : ''}
        />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground">{authorName}</span>
              {isTopPost && <TrendingUp size={16} className="text-orange-500" />}
              {post.is_short && <Play size={16} className="text-primary" />}
              <span className="text-muted-foreground text-sm">
                {formatDate(post.created_at)}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Contenu du post */}
      <div>
        {post.title && (
          <h3 className="text-lg font-bold text-foreground mb-2">{post.title}</h3>
        )}
        
        <p className="text-foreground whitespace-pre-wrap mb-3">{post.content}</p>
        
        {/* Vidéo du post (si c'est un short) - FORMAT VERTICAL */}
        {post.is_short && post.video_url && (
          <div className="mb-3 flex justify-center relative">
            <video
              src={post.video_url}
              controls
              className="rounded-2xl"
              style={{ maxWidth: '100%', maxHeight: '700px', width: 'auto' }}
              preload="metadata"
            >
              Votre navigateur ne supporte pas la lecture de vidéos.
            </video>
            {post.video_duration && (
              <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded-lg text-xs">
                {post.video_duration}s
              </div>
            )}
          </div>
        )}
        
        {/* Images du post (seulement si pas de vidéo) - FORMAT FACEBOOK */}
        {!post.is_short && !loadingImages && postImages.length > 0 && (
          <div className="mb-3 space-y-2">
            {postImages.map((img) => (
              <div key={img.id} className="w-full">
                <img
                  src={img.image_url}
                  alt={img.caption || 'Image du post'}
                  className="w-full rounded-2xl"
                  style={{ maxHeight: '600px', objectFit: 'contain', backgroundColor: '#f3f4f6' }}
                />
              </div>
            ))}
          </div>
        )}
        
        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex gap-2 mb-4">
            {post.tags.map((tag, idx) => (
              <span 
                key={idx} 
                className={`px-3 py-1 text-xs font-medium rounded-full ${
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
      </div>
      
      {/* Actions */}
      <div className="flex items-center gap-6 pt-4 border-t border-border">
        <button
          onClick={handleLike}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-smooth ${
            hasLiked
              ? 'bg-red-100 text-red-600'
              : 'hover:bg-muted'
          }`}
        >
          <Heart size={20} fill={hasLiked ? 'currentColor' : 'none'} />
          <span>{localLikeCount}</span>
        </button>
        
        <button
          onClick={toggleComments}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-smooth"
        >
          <MessageCircle size={20} />
          <span>{post.comment_count || 0}</span>
          {showComments ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        
        <button className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-smooth ml-auto">
          <Share2 size={20} />
        </button>
      </div>
      
      {/* Section Commentaires */}
      {showComments && (
        <div className="mt-6 pt-6 border-t border-border space-y-4">
          {/* Formulaire nouveau commentaire */}
          <form onSubmit={handleCommentSubmit} className="flex gap-3">
            <Avatar src={currentUserAvatar} name={currentUserName} size="md" />
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Écrivez un commentaire..."
                className="w-full px-4 py-2 border border-border rounded-xl focus:ring-2 focus:ring-primary resize-none"
                rows={2}
                disabled={submittingComment}
              />
              <button
                type="submit"
                disabled={!newComment.trim() || submittingComment}
                className="mt-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-smooth disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Send size={16} />
                {submittingComment ? 'Envoi...' : 'Commenter'}
              </button>
            </div>
          </form>
          
          {/* Liste des commentaires */}
          {loadingComments ? (
            <div className="flex justify-center py-6">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : comments.length > 0 ? (
            <div className="space-y-4">
              {comments.map((comment) => {
                const commentAuthorName = comment.author?.raw_user_meta_data?.full_name || 
                                         comment.author?.email?.split('@')[0] || 
                                         'Utilisateur';
                const commentAuthorAvatar = getUserAvatar(comment.author);
                
                return (
                  <div key={comment.id} className="flex gap-3">
                    <Avatar src={commentAuthorAvatar} name={commentAuthorName} size="sm" />
                    <div className="flex-1">
                      <div className="bg-muted rounded-2xl px-4 py-3">
                        <div className="font-semibold text-sm mb-1">{commentAuthorName}</div>
                        <p className="text-sm text-foreground">{comment.content}</p>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 ml-2">
                        {formatDate(comment.created_at)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-6">
              Aucun commentaire pour le moment. Soyez le premier à commenter !
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default SocialFeed;
