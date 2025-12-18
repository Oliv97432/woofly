import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../hooks/useNotifications';
import { 
  Heart, MessageCircle, UserPlus, ArrowLeft, Check 
} from 'lucide-react';
import TabNavigation from '../components/TabNavigation';
import Footer from '../components/Footer';

const Notifications = () => {
  const navigate = useNavigate();
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications();

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'like':
        return <Heart className="text-red-500" size={20} />;
      case 'comment':
        return <MessageCircle className="text-blue-500" size={20} />;
      case 'follow':
        return <UserPlus className="text-green-500" size={20} />;
      default:
        return null;
    }
  };

  const getNotificationText = (notification) => {
    const actorName = notification.actor?.user_profiles?.full_name || 
                      notification.actor?.email?.split('@')[0] || 
                      'Quelqu\'un';

    switch (notification.type) {
      case 'like':
        return `${actorName} a aimé votre post`;
      case 'comment':
        return `${actorName} a commenté votre post`;
      case 'follow':
        return `${actorName} vous suit maintenant`;
      default:
        return 'Nouvelle notification';
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }

    if (notification.type === 'follow') {
      navigate(`/profile/${notification.actor_id}`);
    } else if (notification.post_id) {
      navigate(`/social-feed?post=${notification.post_id}`);
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

  const getActorAvatar = (notification) => {
    const avatarUrl = notification.actor?.user_profiles?.avatar_url;
    
    if (!avatarUrl) return null;
    
    if (avatarUrl.startsWith('http')) {
      return avatarUrl;
    }
    
    return supabase.storage.from('user-avatars').getPublicUrl(avatarUrl).data.publicUrl;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-card border-b border-border shadow-soft">
        <div className="max-w-screen-xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-muted rounded-full transition-smooth"
              >
                <ArrowLeft size={20} />
              </button>
              <h1 className="text-2xl font-heading font-semibold text-foreground">
                Notifications
              </h1>
            </div>
            
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-2 text-blue-500 hover:text-blue-600 font-medium text-sm"
              >
                <Check size={16} />
                Tout marquer lu
              </button>
            )}
          </div>
        </div>
      </div>

      <TabNavigation />

      {/* Content */}
      <main className="main-content flex-1">
        <div className="max-w-3xl mx-auto px-4 py-6">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
            </div>
          ) : notifications.length > 0 ? (
            <div className="space-y-2">
              {notifications.map((notification) => {
                const actorName = notification.actor?.user_profiles?.full_name || 
                                  notification.actor?.email?.split('@')[0] || 
                                  'Utilisateur';
                const actorAvatar = getActorAvatar(notification);

                return (
                  <button
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`w-full flex items-start gap-3 p-4 rounded-xl transition-smooth text-left ${
                      notification.is_read 
                        ? 'bg-white hover:bg-gray-50' 
                        : 'bg-blue-50 hover:bg-blue-100 border-l-4 border-blue-500'
                    }`}
                  >
                    {/* Avatar acteur */}
                    <div className="flex-shrink-0">
                      {actorAvatar ? (
                        <img
                          src={actorAvatar}
                          alt={actorName}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                          {actorName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      
                      {/* Icon type notification */}
                      <div className="absolute -mt-3 -ml-2 bg-white rounded-full p-1 shadow-md">
                        {getNotificationIcon(notification.type)}
                      </div>
                    </div>

                    {/* Contenu */}
                    <div className="flex-1 min-w-0">
                      <p className="text-base text-gray-900 font-medium">
                        {getNotificationText(notification)}
                      </p>
                      
                      {notification.post?.content && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          "{notification.post.content}"
                        </p>
                      )}
                      
                      {notification.comment?.content && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          "{notification.comment.content}"
                        </p>
                      )}
                      
                      <p className="text-sm text-gray-500 mt-1">
                        {formatDate(notification.created_at)}
                      </p>
                    </div>

                    {/* Badge non lu */}
                    {!notification.is_read && (
                      <div className="w-3 h-3 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-12 text-center border border-gray-200">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="text-gray-400" size={32} />
              </div>
              <h3 className="text-xl font-heading font-semibold text-gray-900 mb-2">
                Aucune notification
              </h3>
              <p className="text-gray-600">
                Vos notifications apparaîtront ici
              </p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Notifications;
