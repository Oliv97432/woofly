import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { MessageSquare, Heart, Eye, Pin, Award, Plus, Search, Filter } from 'lucide-react';
import TabNavigation from '../../components/TabNavigation';
import UserMenu from '../../components/UserMenu';
import Footer from '../../components/Footer';

const ForumDetail = () => {
  const { slug } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [forum, setForum] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('recent'); // recent, popular, trending
  
  // Chargement du forum
  useEffect(() => {
    fetchForum();
    if (user) {
      checkMembership();
    }
  }, [slug, user]);
  
  // Chargement des posts
  useEffect(() => {
    if (forum) {
      fetchPosts();
    }
  }, [forum, selectedCategory, sortBy]);
  
  const fetchForum = async () => {
    try {
      const { data, error } = await supabase
        .from('forums')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .single();
      
      if (error) throw error;
      setForum(data);
    } catch (error) {
      console.error('Erreur chargement forum:', error);
      navigate('/forum-hub');
    }
  };
  
  const checkMembership = async () => {
    if (!forum || !user) return;
    
    try {
      const { data } = await supabase
        .from('forum_memberships')
        .select('id')
        .eq('forum_id', forum.id)
        .eq('user_id', user.id)
        .maybeSingle();
      
      setIsMember(!!data);
    } catch (error) {
      console.error('Erreur vérification membre:', error);
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
        .eq('forum_id', forum.id);
      
      // Filtre par catégorie
      if (selectedCategory !== 'all') {
        query = query.eq('category', selectedCategory);
      }
      
      // Tri
      if (sortBy === 'recent') {
        query = query.order('created_at', { ascending: false });
      } else if (sortBy === 'popular') {
        query = query.order('like_count', { ascending: false });
      } else if (sortBy === 'trending') {
        query = query.order('view_count', { ascending: false });
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
  
  const handleJoinForum = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    try {
      const { error } = await supabase
        .from('forum_memberships')
        .insert({
          forum_id: forum.id,
          user_id: user.id
        });
      
      if (error) throw error;
      
      setIsMember(true);
      // Rafraîchir le compteur de membres
      fetchForum();
    } catch (error) {
      console.error('Erreur rejoindre forum:', error);
      alert('❌ Erreur lors de l\'inscription au forum');
    }
  };
  
  const handleLeaveForum = async () => {
    if (!confirm('Êtes-vous sûr de vouloir quitter ce forum ?')) return;
    
    try {
      const { error } = await supabase
        .from('forum_memberships')
        .delete()
        .eq('forum_id', forum.id)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      setIsMember(false);
      fetchForum();
    } catch (error) {
      console.error('Erreur quitter forum:', error);
    }
  };
  
  const handlePostClick = (postId) => {
    navigate(`/post/${postId}`);
  };
  
  if (!forum) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  const categories = ['all', 'Santé', 'Comportement', 'Nutrition', 'Éducation', 'Toilettage'];
  
  const filteredPosts = posts.filter(post =>
    searchQuery === '' ||
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.content.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-card border-b border-border shadow-soft">
        <div className="max-w-screen-xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/forum-hub')}
              className="text-muted-foreground hover:text-foreground"
            >
              ← Retour
            </button>
            <UserMenu />
          </div>
        </div>
      </div>
      
      <TabNavigation />
      
      <main className="main-content">
        <div className="max-w-screen-xl mx-auto px-4 py-6">
          
          {/* Cover du forum */}
          <div className="relative h-64 rounded-3xl overflow-hidden mb-6">
            <img
              src={forum.cover_image_url}
              alt={forum.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              <h1 className="text-3xl font-heading font-bold mb-2">{forum.name}</h1>
              <p className="text-white/90">{forum.description}</p>
              <div className="flex items-center gap-6 mt-4 text-sm">
                <span>{forum.member_count?.toLocaleString()} membres</span>
                <span>{forum.post_count?.toLocaleString()} posts</span>
              </div>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              {isMember ? (
                <>
                  <button
                    onClick={() => setShowCreatePost(true)}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-smooth flex items-center gap-2"
                  >
                    <Plus size={18} />
                    Créer un post
                  </button>
                  <button
                    onClick={handleLeaveForum}
                    className="px-4 py-2 border-2 border-border rounded-xl font-medium hover:bg-muted transition-smooth"
                  >
                    Membre
                  </button>
                </>
              ) : (
                <button
                  onClick={handleJoinForum}
                  className="px-6 py-2 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-smooth"
                >
                  Rejoindre le forum
                </button>
              )}
            </div>
            
            {/* Tri */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSortBy('recent')}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-smooth ${
                  sortBy === 'recent'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card border border-border hover:bg-muted'
                }`}
              >
                Récents
              </button>
              <button
                onClick={() => setSortBy('popular')}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-smooth ${
                  sortBy === 'popular'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card border border-border hover:bg-muted'
                }`}
              >
                Populaires
              </button>
              <button
                onClick={() => setSortBy('trending')}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-smooth ${
                  sortBy === 'trending'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card border border-border hover:bg-muted'
                }`}
              >
                Tendances
              </button>
            </div>
          </div>
          
          {/* Recherche et filtres */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex-1 min-w-[300px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher un post..."
                  className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-xl focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
            
            <div className="flex gap-2 overflow-x-auto">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-smooth ${
                    selectedCategory === cat
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card border border-border hover:bg-muted'
                  }`}
                >
                  {cat === 'all' ? 'Toutes' : cat}
                </button>
              ))}
            </div>
          </div>
          
          {/* Liste des posts */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : filteredPosts.length > 0 ? (
            <div className="space-y-4">
              {filteredPosts.map((post) => (
                <PostCard key={post.id} post={post} onClick={() => handlePostClick(post.id)} />
              ))}
            </div>
          ) : (
            <div className="bg-card rounded-3xl p-12 text-center border border-border">
              <p className="text-muted-foreground mb-4">Aucun post trouvé</p>
              {isMember && (
                <button
                  onClick={() => setShowCreatePost(true)}
                  className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-smooth inline-flex items-center gap-2"
                >
                  <Plus size={18} />
                  Créer le premier post
                </button>
              )}
            </div>
          )}
        </div>
      </main>
      
      <Footer />
      
      {/* Modal Créer un post */}
      {showCreatePost && (
        <CreatePostModal
          forumId={forum.id}
          onClose={() => setShowCreatePost(false)}
          onSuccess={() => {
            setShowCreatePost(false);
            fetchPosts();
          }}
        />
      )}
    </div>
  );
};

// Composant PostCard
const PostCard = ({ post, onClick }) => {
  const authorName = post.author?.raw_user_meta_data?.full_name || 
                     post.author?.email?.split('@')[0] || 
                     'Utilisateur';
  
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
    <div
      onClick={onClick}
      className="bg-card border border-border rounded-3xl p-6 hover:shadow-lg transition-smooth cursor-pointer"
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold flex-shrink-0">
          {authorName.charAt(0).toUpperCase()}
        </div>
        
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 mb-2">
            <span className="font-medium text-foreground">{authorName}</span>
            {post.is_expert_post && (
              <Award size={16} className="text-yellow-500" title="Expert" />
            )}
            <span className="text-muted-foreground text-sm">•</span>
            <span className="text-muted-foreground text-sm">{formatDate(post.created_at)}</span>
            {post.is_pinned && (
              <>
                <span className="text-muted-foreground text-sm">•</span>
                <Pin size={14} className="text-primary" title="Épinglé" />
              </>
            )}
          </div>
          
          {/* Titre */}
          <h3 className="text-lg font-semibold text-foreground mb-2">{post.title}</h3>
          
          {/* Contenu */}
          <p className="text-muted-foreground line-clamp-2 mb-3">{post.content}</p>
          
          {/* Images */}
          {post.images && post.images.length > 0 && (
            <div className="grid grid-cols-2 gap-2 mb-3">
              {post.images.slice(0, 2).map((img, idx) => (
                <img
                  key={idx}
                  src={img.image_url}
                  alt={img.caption || ''}
                  className="w-full h-32 object-cover rounded-xl"
                />
              ))}
            </div>
          )}
          
          {/* Catégorie */}
          {post.category && (
            <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full mb-3">
              {post.category}
            </span>
          )}
          
          {/* Stats */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Heart size={16} />
              <span>{post.like_count || 0}</span>
            </div>
            <div className="flex items-center gap-1">
              <MessageSquare size={16} />
              <span>{post.comment_count || 0}</span>
            </div>
            <div className="flex items-center gap-1">
              <Eye size={16} />
              <span>{post.view_count || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Composant CreatePostModal (simplifié, sera détaillé dans un autre fichier)
const CreatePostModal = ({ forumId, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !content) {
      alert('❌ Titre et contenu requis');
      return;
    }
    
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('forum_posts')
        .insert({
          forum_id: forumId,
          user_id: user.id,
          title,
          content,
          category: category || null
        });
      
      if (error) throw error;
      
      alert('✅ Post créé avec succès !');
      onSuccess();
    } catch (error) {
      console.error('Erreur création post:', error);
      alert('❌ Erreur lors de la création du post');
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="bg-card rounded-3xl shadow-elevated max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-heading font-bold">Créer un post</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            ✕
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Titre *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Donnez un titre à votre post..."
              className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Catégorie</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary"
            >
              <option value="">Sélectionner une catégorie</option>
              <option value="Santé">Santé</option>
              <option value="Comportement">Comportement</option>
              <option value="Nutrition">Nutrition</option>
              <option value="Éducation">Éducation</option>
              <option value="Toilettage">Toilettage</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Contenu *</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Partagez votre expérience, posez une question..."
              rows={8}
              className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary resize-none"
              required
            />
          </div>
          
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-primary text-primary-foreground py-3 rounded-xl font-semibold hover:bg-primary/90 transition-smooth disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {submitting ? 'Publication...' : 'Publier'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border-2 border-border rounded-xl font-medium hover:bg-muted transition-smooth"
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForumDetail;
