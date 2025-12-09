import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import TabNavigation from '../../components/TabNavigation';
import UserMenu from '../../components/UserMenu';
import ForumCard from '../forum-hub/components/ForumCard';
import SearchBar from '../forum-hub/components/SearchBar';
import FeaturedDiscussion from '../forum-hub/components/FeaturedDiscussion';
import QuickActions from '../forum-hub/components/QuickActions';
import CommunityStats from '../forum-hub/components/CommunityStats';
import Footer from '../../components/Footer';

const ForumHub = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredForums, setFilteredForums] = useState([]);
  const [currentProfile, setCurrentProfile] = useState(null);
  
  // Profils de chiens (chargés depuis Supabase)
  const [dogProfiles, setDogProfiles] = useState([]);

  const communityStats = {
    totalMembers: "12.5k",
    totalPosts: "8.2k",
    totalLikes: "45k",
    activeToday: "1.2k"
  };

  const forums = [
    {
      id: 1,
      name: "Malinois",
      description: "Berger belge malinois - Éducation et comportement",
      image: "https://images.unsplash.com/photo-1713917032646-4703f3feffde",
      imageAlt: "Belgian Malinois dog with alert expression standing in outdoor field with golden sunlight",
      memberCount: "3.2k",
      postCount: "2.1k",
      isActive: true,
      trendingTopics: ["Dressage", "Agilité"],
      latestPost: {
        title: "Conseils pour l'entraînement d'obéissance avancé",
        author: "Marie Dubois",
        authorAvatar: "https://img.rocket.new/generatedImages/rocket_gen_img_1ad9e1013-1763294640440.png",
        authorAvatarAlt: "Professional woman with shoulder-length brown hair wearing casual blue sweater smiling warmly",
        timeAgo: "Il y a 15 min"
      }
    },
    {
      id: 2,
      name: "Shih-Tzu",
      description: "Petits compagnons - Soins et toilettage",
      image: "https://images.unsplash.com/photo-1599228127629-0a6d721fce06",
      imageAlt: "Adorable Shih-Tzu dog with long silky white and brown coat sitting on grooming table",
      memberCount: "2.8k",
      postCount: "1.9k",
      isActive: true,
      trendingTopics: ["Toilettage", "Santé"],
      latestPost: {
        title: "Meilleures techniques de brossage pour éviter les nœuds",
        author: "Sophie Martin",
        authorAvatar: "https://images.unsplash.com/photo-1578006711491-890dec58badb",
        authorAvatarAlt: "Young woman with blonde hair in ponytail wearing pink top with friendly smile",
        timeAgo: "Il y a 32 min"
      }
    },
    {
      id: 3,
      name: "American Bully",
      description: "Bully américain - Force et caractère",
      image: "https://images.unsplash.com/photo-1704044985311-b363b415cb0d",
      imageAlt: "Muscular American Bully dog with broad chest and confident stance in urban setting",
      memberCount: "2.1k",
      postCount: "1.4k",
      isActive: false,
      trendingTopics: ["Nutrition", "Musculation"],
      latestPost: {
        title: "Programme d'exercice pour maintenir la masse musculaire",
        author: "Thomas Leroy",
        authorAvatar: "https://img.rocket.new/generatedImages/rocket_gen_img_1b44763a5-1763295696725.png",
        authorAvatarAlt: "Athletic man with short dark hair wearing black athletic shirt with determined expression",
        timeAgo: "Il y a 1 heure"
      }
    },
    {
      id: 4,
      name: "Races Mixtes",
      description: "Chiens croisés - Diversité et unicité",
      image: "https://images.unsplash.com/photo-1683051147071-657d46aa1e3c",
      imageAlt: "Happy mixed breed dog with brown and white coat running joyfully through green grass field",
      memberCount: "4.4k",
      postCount: "3.8k",
      isActive: true,
      trendingTopics: ["Adoption", "Comportement"],
      latestPost: {
        title: "Mon chien croisé a des comportements surprenants",
        author: "Julie Bernard",
        authorAvatar: "https://images.unsplash.com/photo-1612439289738-15a4cba74d9f",
        authorAvatarAlt: "Middle-aged woman with curly red hair wearing green cardigan with warm smile",
        timeAgo: "Il y a 45 min"
      }
    }
  ];

  const featuredDiscussions = [
    {
      id: 1,
      title: "Comment gérer l'anxiété de séparation chez les chiots ?",
      preview: "Mon chiot de 4 mois pleure beaucoup quand je pars travailler. J'ai essayé plusieurs techniques mais rien ne semble fonctionner. Des conseils ?",
      author: "Claire Rousseau",
      authorAvatar: "https://img.rocket.new/generatedImages/rocket_gen_img_1a32a3733-1763295164509.png",
      authorAvatarAlt: "Young woman with long dark hair wearing white blouse with concerned expression",
      timeAgo: "Il y a 2 heures",
      likes: 47,
      replies: 23,
      category: "Comportement",
      isExpert: false
    },
    {
      id: 2,
      title: "Alimentation BARF : Guide complet pour débutants",
      preview: "Après 6 mois de BARF avec mon Malinois, je partage mon expérience complète : avantages, défis, recettes et conseils pratiques pour bien commencer.",
      author: "Dr. Antoine Moreau",
      authorAvatar: "https://img.rocket.new/generatedImages/rocket_gen_img_1e95cb24a-1763296883553.png",
      authorAvatarAlt: "Professional veterinarian with gray hair wearing white medical coat with stethoscope",
      timeAgo: "Il y a 3 heures",
      likes: 156,
      replies: 89,
      category: "Nutrition",
      isExpert: true
    },
    {
      id: 3,
      title: "Vaccination : Nouveau protocole 2025 expliqué",
      preview: "Les nouvelles recommandations vétérinaires pour la vaccination des chiens en 2025. Quels changements et pourquoi ?",
      author: "Dr. Isabelle Petit",
      authorAvatar: "https://img.rocket.new/generatedImages/rocket_gen_img_1be4365a3-1763296831000.png",
      authorAvatarAlt: "Female veterinarian with short blonde hair wearing blue scrubs with professional smile",
      timeAgo: "Il y a 5 heures",
      likes: 203,
      replies: 67,
      category: "Santé",
      isExpert: true
    },
    {
      id: 4,
      title: "Toilettage maison : Mes astuces pour un pelage parfait",
      preview: "Je toilette mon Shih-Tzu moi-même depuis 2 ans. Voici tous mes secrets pour un résultat professionnel à la maison sans stress.",
      author: "Nathalie Girard",
      authorAvatar: "https://img.rocket.new/generatedImages/rocket_gen_img_154a96764-1763300123486.png",
      authorAvatarAlt: "Woman with medium brown hair wearing casual pink sweater with friendly smile",
      timeAgo: "Il y a 6 heures",
      likes: 92,
      replies: 41,
      category: "Toilettage",
      isExpert: false
    }
  ];

  // Charger les profils de chiens depuis Supabase
  useEffect(() => {
    const fetchDogProfiles = async () => {
      if (!user?.id) return;
      
      try {
        const { data, error } = await supabase
          .from('dog_profiles')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true });
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          setDogProfiles(data);
          
          // Si pas de profil actuel, sélectionner le premier
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
    if (searchQuery?.trim() === '') {
      setFilteredForums(forums);
    } else {
      const filtered = forums?.filter((forum) =>
        forum?.name?.toLowerCase()?.includes(searchQuery?.toLowerCase()) ||
        forum?.description?.toLowerCase()?.includes(searchQuery?.toLowerCase()) ||
        forum?.trendingTopics?.some((topic) =>
          topic?.toLowerCase()?.includes(searchQuery?.toLowerCase())
        )
      );
      setFilteredForums(filtered);
    }
  }, [searchQuery]);

  const handleProfileChange = (profile) => {
    setCurrentProfile(profile);
    localStorage.setItem('currentDogProfile', JSON.stringify(profile));
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  // ✅ NOUVEAU : Handlers pour les boutons
  const handleAskQuestion = () => {
    // TODO: Créer la page /create-question
    alert('🚧 Fonctionnalité "Poser une question" en cours de développement.\n\nProchainement disponible !');
  };

  const handleBrowsePhotos = () => {
    // TODO: Créer la page /community-photos
    alert('🚧 Galerie photos de la communauté en cours de développement.\n\nProchainement disponible !');
  };

  const handleCreateDiscussion = () => {
    // TODO: Créer la page /create-discussion
    alert('🚧 Fonctionnalité "Créer une discussion" en cours de développement.\n\nProchainement disponible !');
  };

  const handleForumClick = (forumId, forumName) => {
    // TODO: Créer la page /forum/:id
    alert(`🚧 Page du forum "${forumName}" en cours de développement.\n\nProchainement disponible !`);
  };

  const handleDiscussionClick = (discussionId, discussionTitle) => {
    // TODO: Créer la page /discussion/:id
    alert(`🚧 Discussion "${discussionTitle}" en cours de développement.\n\nProchainement disponible !`);
  };

  const handleViewAllDiscussions = () => {
    // TODO: Créer la page /all-discussions
    alert('🚧 Page "Toutes les discussions" en cours de développement.\n\nProchainement disponible !');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-50 bg-card border-b border-border shadow-soft">
        <div className="max-w-screen-xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-heading font-semibold text-foreground">
                Communauté
              </h1>
            </div>
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
        <div className="max-w-screen-xl mx-auto px-4 py-6 space-y-8">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-heading font-semibold text-foreground mb-1">
                  Rejoignez votre communauté
                </h2>
                <p className="text-muted-foreground font-caption">
                  Partagez, apprenez et connectez-vous avec d'autres propriétaires
                </p>
              </div>
              {/* ✅ CORRIGÉ : QuickActions avec handlers */}
              <QuickActions 
                onAskQuestion={handleAskQuestion}
                onBrowsePhotos={handleBrowsePhotos}
              />
            </div>
            <SearchBar onSearch={handleSearch} />
          </div>

          <CommunityStats stats={communityStats} />

          <div>
            <h3 className="text-lg font-heading font-semibold text-foreground mb-4">
              Forums par race
            </h3>
            {filteredForums?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                {filteredForums?.map((forum) => (
                  /* ✅ CORRIGÉ : ForumCard cliquable */
                  <div 
                    key={forum?.id}
                    onClick={() => handleForumClick(forum.id, forum.name)}
                    className="cursor-pointer"
                  >
                    <ForumCard forum={forum} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-card rounded-lg p-8 text-center border border-border">
                <p className="text-muted-foreground font-caption">
                  Aucun forum trouvé pour "{searchQuery}"
                </p>
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-heading font-semibold text-foreground">
                Discussions populaires
              </h3>
              {/* ✅ CORRIGÉ : Bouton "Voir tout" fonctionnel */}
              <button 
                onClick={handleViewAllDiscussions}
                className="text-sm text-primary font-medium hover:underline"
              >
                Voir tout
              </button>
            </div>
            <div className="space-y-4">
              {featuredDiscussions?.map((discussion) => (
                /* ✅ CORRIGÉ : Discussion cliquable */
                <div
                  key={discussion?.id}
                  onClick={() => handleDiscussionClick(discussion.id, discussion.title)}
                  className="cursor-pointer"
                >
                  <FeaturedDiscussion discussion={discussion} />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg p-6 border border-border">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-center md:text-left">
                <h3 className="text-xl font-heading font-semibold text-foreground mb-2">
                  Partagez votre expérience
                </h3>
                <p className="text-muted-foreground font-caption">
                  Aidez d'autres propriétaires en partageant vos connaissances et conseils
                </p>
              </div>
              {/* ✅ CORRIGÉ : Bouton "Créer une discussion" fonctionnel */}
              <button
                onClick={handleCreateDiscussion}
                className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-smooth whitespace-nowrap"
              >
                Créer une discussion
              </button>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default ForumHub;
