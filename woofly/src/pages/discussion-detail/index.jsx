import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Heart, MessageCircle, Share2, MoreVertical,
  Send, ThumbsUp, Clock, Eye, Tag
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import TabNavigation from '../../components/TabNavigation';
import Footer from '../../components/Footer';

/**
 * Page DiscussionDetail - Affiche une discussion complète avec commentaires
 */
const DiscussionDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [post, setPost] = useState(null);
  const [author, setAuthor] = useState(null);
  const [images, setImages] = useState([]);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Charger la discussion
  useEffect(() => {
    fetchDiscussion();
    incrementViewCount();
  }, [id]);

  // Charger les données
  const fetchDiscussion = async () => {
    setLoading(true);
    
    try {
      // 1. Charger le post
      const { data: postData, error: postError } = await supabase
        .from('forum_posts')
        .select(`
          *,
          forums(name, slug)
        `)
        .eq('id', id)
        .single();
      
      if (postError) throw postError;
      setPost(postData);
      
      // 2. Charger l'auteur
      const { data: userData } = await supabase
        .from('auth.users')
        .select('id, email, raw_user_meta_data')
        .eq('id', postData.user_id)
        .single();
      
      if (userData) {
        setAuthor({
          id: userData.id,
          name: userData.raw_user_meta_data?.full_name || userData.email?.split('@')[0] || 'Utilisateur',
          email: userData.email
        });
      }
      
      // 3. Charger les images
      const { data: imagesData } = await supabase
        .from('forum_post_images')
        .select('*')
        .eq('post_id', id)
        .order('display_order');
      
      if (imagesData) setImages(imagesData);
      
      // 4. Charger les commentaires
      await fetchComments();
      
      // 5. Vérifier si user a liké
      if (user) {
        const { data: likeData } = await supabase
          .from('forum_likes')
          .select('id')
          .eq('post_id', id)
          .eq('user_id', user.id)
          .single();
        
        setIsLiked(!!likeData);
      }
      
    } catch (error) {
      console.error('Erreur chargement discussion:', error);
      alert('❌ Discussion introuvable');
      navigate('/forum-hub');
    } finally {
      setLoading(false);
    }
  };

  // Charger les commentaires
  const fetchComments = async () => {
    const { data, error } = await supabase
      .from('forum_comments')
      .select(`
        *,
        author:user_id (
          id,
          email,
          raw_user_meta_data
        )
      `)
      .eq('post_id', id)
      .is('parent_id', null)
      .order('created_at', { ascending: true });
    
    if (!error && data) {
      const formattedComments = data.map(comment => ({
        ...comment,
        authorName: comment.author?.raw_user_meta_data?.full_name || 
                    comment.author?.email?.split('@')[0] || 
                    'Utilisateur'
      }));
      setComments(formattedComments);
    }
  };

  // Incrémenter le compteur de vues
  const incrementViewCount = async () => {
    await supabase.rpc('increment_post_view', { post_id: id });
  };

  // Gérer le like
  const handleLike = async () => {
    if (!user) {
      alert('Veuillez vous connecter pour aimer ce post');
      return;
    }
    
    try {
      if (isLiked) {
        // Unlike
        await supabase
          .from('forum_likes')
          .delete()
          .eq('post_id', id)
          .eq('user_id', user.id);
        
        setIsLiked(false);
        setPost(prev => ({ ...prev, like_count: prev.like_count - 1 }));
      } else {
        // Like
        await supabase
          .from('forum_likes')
          .insert([{ post_id: id, user_id: user.id }]);
        
        setIsLiked(true);
        setPost(prev => ({ ...prev, like_count: prev.like_count + 1 }));
      }
    } catch (error) {
      console.error('Erreur like:', error);
    }
  };

  // Soumettre un commentaire
  const handleSubmitComment = async (e) => {
    e.preventDefault();
    
    if (!user) {
      alert('Veuillez vous connecter pour commenter');
      return;
    }
    
    if (!newComment.trim()) return;
    
    setSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('forum_comments')
        .insert([{
          post_id: id,
          user_id: user.id,
          content: newComment.trim()
        }]);
      
      if (error) throw error;
      
      setNewComment('');
      await fetchComments();
      
    } catch (error) {
      console.error('Erreur commentaire:', error);
      alert('❌ Erreur lors de l\'envoi du commentaire');
    } finally {
      setSubmitting(false);
    }
  };

  // Partager
  const handleShare = async () => {
    const url = window.location.href;
    const title = post?.title || 'Discussion Woofly';
    
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch (error) {
        // User cancelled
      }
    } else {
      // Fallback: copier le lien
      navigator.clipboard.writeText(url);
      alert('✅ Lien copié dans le presse-papiers !');
    }
  };

  // Format date relative
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

  if (!post) return null;

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
                <h1 className="text-xl font-heading font-semibold text-foreground line-clamp-1">
                  {post.title}
                </h1>
                <p className="text-sm text-muted-foreground">
                  Forum {post.forums?.name}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <TabNavigation />

      {/* Main content */}
      <main className="main-content flex-1">
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
          
          {/* Post principal */}
          <article className="bg-card rounded-2xl border border-border p-6">
            
            {/* Header du post */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                  {author?.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <div>
                  <p className="font-semibold text-foreground">{author?.name}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock size={14} />
                    <span>{formatTimeAgo(post.created_at)}</span>
                    <span>•</span>
                    <Eye size={14} />
                    <span>{post.view_count} vues</span>
                  </div>
                </div>
              </div>
              <button className="p-2 hover:bg-muted rounded-lg transition-smooth">
                <MoreVertical size={20} className="text-muted-foreground" />
              </button>
            </div>

            {/* Catégorie */}
            {post.category && (
              <div className="mb-4">
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                  <Tag size={14} />
                  {post.category}
                </span>
                {post.is_question && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium ml-2">
                    ❓ Question
                  </span>
                )}
              </div>
            )}

            {/* Titre */}
            <h2 className="text-2xl font-heading font-bold text-foreground mb-4">
              {post.title}
            </h2>

            {/* Contenu */}
            <div className="prose max-w-none text-foreground mb-6">
              <p className="whitespace-pre-wrap">{post.content}</p>
            </div>

            {/* Images */}
            {images.length > 0 && (
              <div className="grid grid-cols-2 gap-3 mb-6">
                {images.map((img, index) => (
                  <img
                    key={img.id}
                    src={img.image_url}
                    alt={img.caption || `Image ${index + 1}`}
                    className="w-full h-64 object-cover rounded-lg"
                  />
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-6 pt-4 border-t border-border">
              <button
                onClick={handleLike}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-smooth ${
                  isLiked 
                    ? 'bg-red-50 text-red-600' 
                    : 'hover:bg-muted text-muted-foreground'
                }`}
              >
                <Heart size={20} className={isLiked ? 'fill-current' : ''} />
                <span className="font-medium">{post.like_count}</span>
              </button>
              
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-muted text-muted-foreground transition-smooth">
                <MessageCircle size={20} />
                <span className="font-medium">{post.comment_count}</span>
              </button>
              
              <button
                onClick={handleShare}
                className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-muted text-muted-foreground transition-smooth ml-auto"
              >
                <Share2 size={20} />
                <span className="font-medium">Partager</span>
              </button>
            </div>
          </article>

          {/* Formulaire commentaire */}
          {user && (
            <form onSubmit={handleSubmitComment} className="bg-card rounded-2xl border border-border p-6">
              <h3 className="text-lg font-heading font-semibold text-foreground mb-4">
                Ajouter un commentaire
              </h3>
              <div className="flex gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                  {user.email?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="flex-1">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Partagez votre avis..."
                    rows={3}
                    className="w-full px-4 py-3 border border-border rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  />
                  <div className="flex justify-end mt-2">
                    <button
                      type="submit"
                      disabled={!newComment.trim() || submitting}
                      className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-smooth flex items-center gap-2 disabled:opacity-50"
                    >
                      {submitting ? 'Envoi...' : (
                        <>
                          <Send size={16} />
                          Envoyer
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          )}

          {/* Liste des commentaires */}
          <div className="space-y-4">
            <h3 className="text-lg font-heading font-semibold text-foreground">
              Commentaires ({comments.length})
            </h3>
            
            {comments.length === 0 ? (
              <div className="bg-card rounded-2xl border border-border p-8 text-center">
                <MessageCircle size={48} className="mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">
                  Aucun commentaire pour le moment. Soyez le premier à réagir !
                </p>
              </div>
            ) : (
              comments.map(comment => (
                <div key={comment.id} className="bg-card rounded-2xl border border-border p-6">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                      {comment.authorName?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="font-semibold text-foreground">{comment.authorName}</p>
                        <span className="text-xs text-muted-foreground">
                          {formatTimeAgo(comment.created_at)}
                        </span>
                      </div>
                      <p className="text-foreground whitespace-pre-wrap">{comment.content}</p>
                      <div className="flex items-center gap-4 mt-3">
                        <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-smooth">
                          <ThumbsUp size={14} />
                          <span>{comment.like_count || 0}</span>
                        </button>
                        <button className="text-sm text-muted-foreground hover:text-primary transition-smooth">
                          Répondre
                        </button>
                      </div>
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

export default DiscussionDetail;
