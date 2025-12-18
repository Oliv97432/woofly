import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Heart, MessageCircle, Share2, User, MapPin, Calendar, Edit, Settings, ArrowLeft } from 'lucide-react';
import TabNavigation from '../../components/TabNavigation';
import Footer from '../../components/Footer';

const UserProfile = () => {
  const { userId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [dogs, setDogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('posts'); // posts, chiens, stats
  
  const isOwnProfile = user?.id === userId;
  
  useEffect(() => {
    fetchProfileData();
    fetchPosts();
    fetchDogs();
    checkIfFollowing();
  }, [userId]);
  
  const fetchProfileData = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Erreur chargement profil:', error);
    }
  };
  
  const fetchPosts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('forum_posts')
        .select('*')
        .eq('user_id', userId)
        .eq('is_hidden', false)
        .is('forum_id', null)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      const postsWithImages = await Promise.all(
        (data || []).map(async (post) => {
          const { data: images } = await supabase
            .from('forum_post_images')
            .select('*')
            .eq('post_id', post.id)
            .order('display_order', { ascending: true });
          
          return {
            ...post,
            images: images || []
          };
        })
      );
      
      setPosts(postsWithImages);
    } catch (error) {
      console.error('Erreur chargement posts:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchDogs = async () => {
    try {
      const { data, error } = await supabase
        .from('dogs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      setDogs(data || []);
    } catch (error) {
      console.error('Erreur chargement chiens:', error);
    }
  };
  
  const checkIfFollowing = async () => {
    if (!user?.id || isOwnProfile) return;
    
    try {
      const { data } = await supabase
        .from('user_follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', userId)
        .maybeSingle();
      
      setIsFollowing(!!data);
    } catch (error) {
      console.error('Erreur vérification follow:', error);
    }
  };
  
  const handleFollow = async () => {
    if (!user?.id) {
      navigate('/login');
      return;
    }
    
    setFollowLoading(true);
    try {
      if (isFollowing) {
        await supabase
          .from('user_follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', userId);
        
        setIsFollowing(false);
      } else {
        await supabase
          .from('user_follows')
          .insert({
            follower_id: user.id,
            following_id: userId
          });
        
        setIsFollowing(true);
      }
      
      fetchProfileData();
    } catch (error) {
      console.error('Erreur follow:', error);
    } finally {
      setFollowLoading(false);
    }
  };
  
  const getUserAvatar = () => {
    if (!profile?.avatar_url) return null;
    
    if (profile.avatar_url.startsWith('http')) {
      return profile.avatar_url;
    }
    
    const { data } = supabase.storage
      .from('user-avatars')
      .getPublicUrl(profile.avatar_url);
    
    return data.publicUrl;
  };
  
  const getDogPhoto = (dog) => {
    if (!dog.photo_url) return null;
    
    if (dog.photo_url.startsWith('http')) {
      return dog.photo_url;
    }
    
    const { data } = supabase.storage
      .from('dog-photos')
      .getPublicUrl(dog.photo_url);
    
    return data.publicUrl;
  };
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { 
      year: 'numeric', 
      month: 'long' 
    });
  };
  
  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  const avatarUrl = getUserAvatar();
  const displayName = profile.full_name || profile.email?.split('@')[0] || 'Utilisateur';
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-card border-b border-border shadow-soft">
        <div className="max-w-screen-xl mx-auto px-3 sm:px-4 py-3">
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-muted rounded-full transition-smooth flex-shrink-0"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-xl font-heading font-semibold text-foreground truncate">
                {displayName}
              </h1>
              <p className="text-xs text-muted-foreground">
                {profile.posts_count || 0} posts
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <TabNavigation />
      
      <main className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* Profile Header */}
        <div className="bg-card border border-border rounded-2xl p-4 md:p-6 mb-4 md:mb-6">
          <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
            {/* Avatar */}
            <div className="w-full sm:w-auto flex justify-center sm:block">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-border"
                />
              ) : (
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl sm:text-3xl border-4 border-border">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            
            {/* Info */}
            <div className="flex-1 w-full">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
                <div className="w-full sm:w-auto text-center sm:text-left">
                  <h2 className="text-xl sm:text-2xl font-heading font-bold text-foreground">
                    {displayName}
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    @{profile.email?.split('@')[0] || 'user'}
                  </p>
                </div>
                
                {isOwnProfile ? (
                  <button
                    onClick={() => navigate('/settings')}
                    className="w-full sm:w-auto px-4 py-2 border border-border rounded-xl hover:bg-muted transition-smooth flex items-center justify-center gap-2 text-sm"
                  >
                    <Edit size={16} />
                    Modifier le profil
                  </button>
                ) : (
                  <button
                    onClick={handleFollow}
                    disabled={followLoading}
                    className={`w-full sm:w-auto px-6 py-2 rounded-xl font-medium transition-smooth text-sm ${
                      isFollowing
                        ? 'bg-muted text-foreground hover:bg-muted/80'
                        : 'bg-primary text-primary-foreground hover:bg-primary/90'
                    }`}
                  >
                    {followLoading ? 'Chargement...' : isFollowing ? 'Suivi' : 'Suivre'}
                  </button>
                )}
              </div>
              
              {/* Stats */}
              <div className="flex justify-center sm:justify-start gap-6 sm:gap-8 mb-4">
                <div className="text-center">
                  <div className="text-lg sm:text-xl font-bold text-foreground">
                    {profile.posts_count || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">Posts</div>
                </div>
                
                <div className="text-center">
                  <div className="text-lg sm:text-xl font-bold text-foreground">
                    {profile.followers_count || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">Followers</div>
                </div>
                
                <div className="text-center">
                  <div className="text-lg sm:text-xl font-bold text-foreground">
                    {profile.following_count || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">Suivis</div>
                </div>
              </div>
              
              {/* Bio */}
              {profile.bio && (
                <p className="text-foreground mb-3 text-sm sm:text-base text-center sm:text-left">{profile.bio}</p>
              )}
              
              {/* Membre depuis */}
              <div className="flex items-center justify-center sm:justify-start gap-2 text-muted-foreground text-xs sm:text-sm">
                <Calendar size={14} />
                Membre depuis {formatDate(profile.created_at)}
              </div>
            </div>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="bg-card border border-border rounded-2xl mb-4 md:mb-6">
          <div className="flex border-b border-border">
            <button
              onClick={() => setActiveTab('posts')}
              className={`flex-1 px-3 py-3 text-sm font-medium transition-smooth ${
                activeTab === 'posts'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Posts ({posts.length})
            </button>
            
            <button
              onClick={() => setActiveTab('chiens')}
              className={`flex-1 px-3 py-3 text-sm font-medium transition-smooth ${
                activeTab === 'chiens'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Chiens ({dogs.length})
            </button>
          </div>
          
          {/* Tab Content */}
          <div className="p-3 sm:p-4 md:p-6">
            {activeTab === 'posts' && (
              <div>
                {loading ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                  </div>
                ) : posts.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
                    {posts.map((post) => (
                      <div
                        key={post.id}
                        onClick={() => navigate(`/social-feed?post=${post.id}`)}
                        className="bg-muted rounded-xl overflow-hidden cursor-pointer hover:opacity-80 transition-smooth aspect-square relative group"
                      >
                        {post.images.length > 0 ? (
                          <img
                            src={post.images[0].image_url}
                            alt={post.title || 'Post'}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center p-2 sm:p-3 md:p-4 bg-gradient-to-br from-blue-50 to-purple-50">
                            <p className="text-xs sm:text-sm text-foreground line-clamp-6">
                              {post.content}
                            </p>
                          </div>
                        )}
                        
                        {/* Overlay */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-3 sm:gap-4 opacity-0 group-hover:opacity-100">
                          <div className="flex items-center gap-1 text-white">
                            <Heart size={16} className="sm:w-5 sm:h-5" fill="white" />
                            <span className="font-medium text-xs sm:text-base">{post.like_count || 0}</span>
                          </div>
                          <div className="flex items-center gap-1 text-white">
                            <MessageCircle size={16} className="sm:w-5 sm:h-5" fill="white" />
                            <span className="font-medium text-xs sm:text-base">{post.comment_count || 0}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground mb-4 text-sm sm:text-base">
                      {isOwnProfile ? 'Vous n\'avez pas encore publié de post' : 'Aucun post pour le moment'}
                    </p>
                    {isOwnProfile && (
                      <button
                        onClick={() => navigate('/social-feed')}
                        className="px-4 sm:px-6 py-2 sm:py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-smooth text-sm sm:text-base"
                      >
                        Créer mon premier post
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'chiens' && (
              <div>
                {dogs.length > 0 ? (
                  <div className="grid grid-cols-1 gap-3 sm:gap-4">
                    {dogs.map((dog) => {
                      const dogPhoto = getDogPhoto(dog);
                      
                      return (
                        <div key={dog.id} className="bg-muted rounded-xl p-3 sm:p-4 flex items-start gap-3 sm:gap-4">
                          {dogPhoto ? (
                            <img
                              src={dogPhoto}
                              alt={dog.name}
                              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-orange-400 to-pink-600 flex items-center justify-center text-white font-bold text-xl sm:text-2xl flex-shrink-0">
                              {dog.name?.charAt(0).toUpperCase()}
                            </div>
                          )}
                          
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-base sm:text-lg text-foreground mb-1 truncate">
                              {dog.name}
                            </h3>
                            <p className="text-sm text-muted-foreground mb-2 truncate">
                              {dog.breed}
                            </p>
                            {dog.birth_date && (
                              <p className="text-xs text-muted-foreground">
                                {new Date().getFullYear() - new Date(dog.birth_date).getFullYear()} ans
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground text-sm sm:text-base">
                      {isOwnProfile ? 'Vous n\'avez pas encore ajouté de chien' : 'Aucun chien enregistré'}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default UserProfile;
