import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Heart, MessageCircle, TrendingUp, Plus, Flag, Eye, Share2 } from 'lucide-react';
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
      const { data, error } = await supabase
        .from('forum_posts')
        .select(`
          *,
          author:user_id (
            id,
            email,
            raw_user_meta_data
          ),
          images:forum_post_images (
            image_url,
            caption
          )
        `)
        .eq('is_hidden', false)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('like_count', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      
      // Filtrer ceux avec au moins 3 likes
      const filtered = data.filter(post => post.like_count >= 3);
      setTopPosts(filtered);
    } catch (error) {
      console.error('Erreur chargement top posts:', error);
    }
  };
  
  const fetchPosts = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('forum_posts')
        .select(`
          *,
          author:user_id (
            id,
            email,
            raw_user_meta_data
          ),
          images:forum_post_images (
            image_url,
            caption
          )
        `)
        .eq('is_hidden', false)
        .order('created_at', { ascending: false })
        .limit(50);
      
      // Filtrer par tag si sélectionné
      if (selectedTag !== 'all') {
        query = query.contains('tags', [selectedTag]);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      setPosts(data || []);
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
  
  const handlePostClick = (postId) => {
    navigate(`/post/${postId}`);
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
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
          
          {/* Bouton Créer un post */}
          <div className="bg-card border border-border rounded-3xl p-4">
            <button
              onClick={() => setShowCreatePost(true)}
              className="w-full flex items-center gap-3 px-4 py-3 bg-muted hover:bg-muted/80 rounded-2xl transition-smooth text-left"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                {user?.email?.charAt(0).toUpperCase()}
              </div>
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
                  <TopPostCard 
                    key={post.id} 
                    post={post} 
                    onClick={() => handlePostClick(post.id)}
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
                  onClick={() => handlePostClick(post.id)}
                  currentUserId={user?.id}
                  onUpdate={fetchPosts}
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

// Composant TopPostCard
const TopPostCard = ({ post, onClick }) => {
  const authorName = post.author?.raw_user_meta_data?.full_name || 
                     post.author?.email?.split('@')[0] || 
                     'Utilisateur';
  
  return (
    <div
      onClick={onClick}
      className="bg-gradient-to-br from-orange-50 to-yellow-50 border-2 border-orange-200 rounded-3xl p-6 hover:shadow-lg transition-smooth cursor-pointer"
    >
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-yellow-600 flex items-center justify-center text-white font-bold flex-shrink-0">
          {authorName.charAt(0).toUpperCase()}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-semibold text-foreground">{authorName}</span>
            <TrendingUp size={16} className="text-orange-500" />
          </div>
          
          <h3 className="text-lg font-bold text-foreground mb-2">{post.title}</h3>
          <p className="text-muted-foreground line-clamp-2 mb-3">{post.content}</p>
          
          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex gap-2 mb-3">
              {post.tags.map((tag, idx) => (
                <span key={idx} className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                  #{tag}
                </span>
              ))}
            </div>
          )}
          
          {/* Stats */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1 text-orange-600 font-semibold">
              <Heart size={16} fill="currentColor" />
              <span>{post.like_count || 0}</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <MessageCircle size={16} />
              <span>{post.comment_count || 0}</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Eye size={16} />
              <span>{post.view_count || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Composant PostCard
const PostCard = ({ post, onClick, currentUserId, onUpdate }) => {
  const [hasLiked, setHasLiked] = useState(false);
  const [localLikeCount, setLocalLikeCount] = useState(post.like_count || 0);
  
  const authorName = post.author?.raw_user_meta_data?.full_name || 
                     post.author?.email?.split('@')[0] || 
                     'Utilisateur';
  
  useEffect(() => {
    checkIfLiked();
  }, [post.id, currentUserId]);
  
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
  
  return (
    <div className="bg-card border border-border rounded-3xl p-6 hover:shadow-md transition-smooth">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold flex-shrink-0">
          {authorName.charAt(0).toUpperCase()}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-semibold text-foreground">{authorName}</span>
              <span className="text-muted-foreground text-sm ml-2">
                {formatDate(post.created_at)}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <div onClick={onClick} className="cursor-pointer">
        {post.title && (
          <h3 className="text-lg font-bold text-foreground mb-2">{post.title}</h3>
        )}
        
        <p className="text-foreground whitespace-pre-wrap mb-3">{post.content}</p>
        
        {/* Images */}
        {post.images && post.images.length > 0 && (
          <div className="grid grid-cols-2 gap-2 mb-3">
            {post.images.slice(0, 2).map((img, idx) => (
              <img
                key={idx}
                src={img.image_url}
                alt={img.caption || ''}
                className="w-full h-48 object-cover rounded-2xl"
              />
            ))}
          </div>
        )}
        
        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex gap-2 mb-4">
            {post.tags.map((tag, idx) => (
              <span key={idx} className="px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
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
          onClick={onClick}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-smooth"
        >
          <MessageCircle size={20} />
          <span>{post.comment_count || 0}</span>
        </button>
        
        <button className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-smooth ml-auto">
          <Share2 size={20} />
        </button>
      </div>
    </div>
  );
};

export default SocialFeed;
