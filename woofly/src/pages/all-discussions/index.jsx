import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Search, Filter, TrendingUp, Clock, 
  MessageCircle, Heart, Eye, Tag
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import TabNavigation from '../../components/TabNavigation';
import Footer from '../../components/Footer';

/**
 * Page AllDiscussions - Toutes les discussions de la communauté
 */
const AllDiscussions = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [forums, setForums] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filtres
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [forumFilter, setForumFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState(''); // all, questions, discussions

  const categories = [
    { value: '', label: 'Toutes les catégories' },
    { value: 'Santé', label: '🏥 Santé' },
    { value: 'Nutrition', label: '🍖 Nutrition' },
    { value: 'Comportement', label: '🐾 Comportement' },
    { value: 'Education', label: '🎓 Éducation' },
    { value: 'Toilettage', label: '✂️ Toilettage' },
    { value: 'Activités', label: '⚽ Activités' },
    { value: 'Voyages', label: '✈️ Voyages' },
    { value: 'Adoption', label: '❤️ Adoption' },
    { value: 'Autre', label: '💬 Autre' }
  ];

  // Charger tous les forums et posts
  useEffect(() => {
    fetchAllData();
  }, []);

  // Filtrer et trier
  useEffect(() => {
    let filtered = [...posts];
    
    // Filtre recherche
    if (searchQuery.trim()) {
      filtered = filtered.filter(post =>
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.authorName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Filtre catégorie
    if (categoryFilter) {
      filtered = filtered.filter(post => post.category === categoryFilter);
    }
    
    // Filtre forum
    if (forumFilter) {
      filtered = filtered.filter(post => post.forum_id === forumFilter);
    }
    
    // Filtre type
    if (typeFilter === 'questions') {
      filtered = filtered.filter(post => post.is_question);
    } else if (typeFilter === 'discussions') {
      filtered = filtered.filter(post => !post.is_question);
    }
    
    // Tri
    switch (sortBy) {
      case 'popular':
        filtered.sort((a, b) => b.like_count - a.like_count);
        break;
      case 'discussed':
        filtered.sort((a, b) => b.comment_count - a.comment_count);
        break;
      case 'views':
        filtered.sort((a, b) => b.view_count - a.view_count);
        break;
      case 'recent':
      default:
        filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        break;
    }
    
    setFilteredPosts(filtered);
  }, [posts, searchQuery, sortBy, categoryFilter, forumFilter, typeFilter]);

  const fetchAllData = async () => {
    setLoading(true);
    
    try {
      // 1. Charger les forums
      const { data: forumsData } = await supabase
        .from('forums')
        .select('id, name, slug')
        .eq('is_active', true)
        .order('name');
      
      if (forumsData) setForums(forumsData);
      
      // 2. Charger tous les posts
      const { data: postsData } = await supabase
        .from('forum_posts')
        .select(`
          *,
          forums(name, slug),
          author:user_id (
            id,
            email,
            raw_user_meta_data
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (postsData) {
        const formattedPosts = postsData.map(post => ({
          ...post,
          forumName: post.forums?.name || 'Forum',
          authorName: post.author?.raw_user_meta_data?.full_name || 
                      post.author?.email?.split('@')[0] || 
                      'Utilisateur'
        }));
        setPosts(formattedPosts);
      }
      
    } catch (error) {
      console.error('Erreur chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    return date.toLocaleDateString('fr-FR');
  };

  const clearFilters = () => {
    setSearchQuery('');
    setCategoryFilter('');
    setForumFilter('');
    setTypeFilter('');
    setSortBy('recent');
  };

  const hasActiveFilters = searchQuery || categoryFilter || forumFilter || typeFilter;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-card border-b border-border shadow-soft">
        <div className="max-w-screen-xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-muted rounded-lg transition-smooth"
              >
                <ArrowLeft size={24} className="text-foreground" />
              </button>
              <div>
                <h1 className="text-2xl font-heading font-semibold text-foreground">
                  Toutes les discussions
                </h1>
                <p className="text-sm text-muted-foreground">
                  {filteredPosts.length} discussion{filteredPosts.length > 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <TabNavigation />

      {/* Main content */}
      <main className="main-content flex-1">
        <div className="max-w-screen-xl mx-auto px-4 py-6">
          
          {/* Filtres */}
          <div className="bg-card rounded-2xl border border-border p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-heading font-semibold text-foreground flex items-center gap-2">
                <Filter size={20} />
                Filtres et tri
              </h2>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-primary hover:underline"
                >
                  Réinitialiser
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              
              {/* Recherche */}
              <div className="lg:col-span-3">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Recherche
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Rechercher dans les titres, contenus..."
                    className="w-full pl-10 pr-4 py-3 border border-border rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Tri */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Trier par
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-4 py-3 border border-border rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="recent">Plus récent</option>
                  <option value="popular">Plus populaire</option>
                  <option value="discussed">Plus commenté</option>
                  <option value="views">Plus vu</option>
                </select>
              </div>

              {/* Forum */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Forum
                </label>
                <select
                  value={forumFilter}
                  onChange={(e) => setForumFilter(e.target.value)}
                  className="w-full px-4 py-3 border border-border rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Tous les forums</option>
                  {forums.map(forum => (
                    <option key={forum.id} value={forum.id}>{forum.name}</option>
                  ))}
                </select>
              </div>

              {/* Catégorie */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Catégorie
                </label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full px-4 py-3 border border-border rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              {/* Type */}
              <div className="lg:col-span-3">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Type de contenu
                </label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setTypeFilter('')}
                    className={`flex-1 px-4 py-3 rounded-lg border transition-smooth ${
                      typeFilter === '' 
                        ? 'bg-primary text-primary-foreground border-primary' 
                        : 'border-border hover:bg-muted'
                    }`}
                  >
                    Tous
                  </button>
                  <button
                    onClick={() => setTypeFilter('questions')}
                    className={`flex-1 px-4 py-3 rounded-lg border transition-smooth ${
                      typeFilter === 'questions' 
                        ? 'bg-primary text-primary-foreground border-primary' 
                        : 'border-border hover:bg-muted'
                    }`}
                  >
                    ❓ Questions
                  </button>
                  <button
                    onClick={() => setTypeFilter('discussions')}
                    className={`flex-1 px-4 py-3 rounded-lg border transition-smooth ${
                      typeFilter === 'discussions' 
                        ? 'bg-primary text-primary-foreground border-primary' 
                        : 'border-border hover:bg-muted'
                    }`}
                  >
                    💬 Discussions
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Liste des posts */}
          <div className="space-y-4">
            {filteredPosts.length === 0 ? (
              <div className="bg-card rounded-2xl border border-border p-12 text-center">
                <MessageCircle size={48} className="mx-auto text-muted-foreground mb-3" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Aucune discussion trouvée
                </h3>
                <p className="text-muted-foreground">
                  Essayez de modifier vos critères de recherche ou filtres
                </p>
              </div>
            ) : (
              filteredPosts.map(post => (
                <div
                  key={post.id}
                  onClick={() => navigate(`/discussion/${post.id}`)}
                  className="bg-card rounded-2xl border border-border p-6 hover:shadow-lg transition-smooth cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      {/* Forum badge */}
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded-full font-medium">
                          {post.forumName}
                        </span>
                        {post.is_question && (
                          <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full font-medium">
                            ❓ Question
                          </span>
                        )}
                        {post.is_expert_post && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                            ✓ Expert
                          </span>
                        )}
                        {post.category && (
                          <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full font-medium">
                            {post.category}
                          </span>
                        )}
                      </div>

                      {/* Titre */}
                      <h3 className="text-lg font-heading font-semibold text-foreground mb-2 hover:text-primary transition-colors">
                        {post.title}
                      </h3>

                      {/* Preview */}
                      <p className="text-muted-foreground text-sm line-clamp-2 mb-3">
                        {post.content}
                      </p>

                      {/* Meta */}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="font-medium">{post.authorName}</span>
                        <span className="flex items-center gap-1">
                          <Clock size={14} />
                          {formatTimeAgo(post.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-6 pt-3 border-t border-border">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Heart size={16} />
                      <span className="text-sm">{post.like_count}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MessageCircle size={16} />
                      <span className="text-sm">{post.comment_count}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Eye size={16} />
                      <span className="text-sm">{post.view_count}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AllDiscussions;
