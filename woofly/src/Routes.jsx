import React from "react";
import { BrowserRouter, Routes as RouterRoutes, Route } from "react-router-dom";
import ScrollToTop from "components/ScrollToTop";
import ErrorBoundary from "components/ErrorBoundary";
import NotFound from "pages/NotFound";
import ImportantContacts from './pages/important-contacts';
import ForumDiscussion from './pages/forum-discussion';
import Login from './pages/login';
import DogProfile from './pages/dog-profile';
import DailyTip from './pages/daily-tip';
import ForumHub from './pages/forum-hub';
import SocialFeed from './pages/social-feed';
import ForumDetail from './pages/forum-detail';
import PostDetail from './pages/post-detail';
import MultiProfileManagement from './pages/multi-profile-management';
import Register from './pages/register';
import UserProfile from './pages/profile/UserProfile';
import Notifications from './pages/Notifications';
import Settings from './pages/settings';
import CGU from './pages/CGU';
import MentionsLegales from './pages/MentionsLegales';
import PolitiqueConfidentialite from './pages/PolitiqueConfidentialite';
import About from './pages/About';
import Contact from './pages/Contact';

// Landing Page
import LandingPage from './pages/LandingPage';

// Pages Adoption
import AdoptionPage from './pages/adoption';
import AdoptionDetail from './pages/adoption/AdoptionDetail';

// Route hybride /chien/:id
import HybridDogProfile from './pages/chien/HybridDogProfile';

// Pages Professionnelles - NOUVEAU ⬇️
import ProRegistration from './pages/pro/ProRegistration';
import ProDashboard from './pages/pro/ProDashboard';
import ProDogManagement from './pages/pro/ProDogManagement';
import ProApplications from './pages/pro/ProApplications';

const Routes = () => {
  return (
    <BrowserRouter>
      <ErrorBoundary>
      <ScrollToTop />
      <RouterRoutes>
        {/* Landing Page publique */}
        <Route path="/" element={<LandingPage />} />
        
        <Route path="/important-contacts" element={<ImportantContacts />} />
        <Route path="/forum-discussion" element={<ForumDiscussion />} />
        <Route path="/login" element={<Login />} />
        
        {/* Route hybride PUBLIC/PRIVÉ */}
        <Route path="/chien/:id" element={<HybridDogProfile />} />
        
        {/* Route privée (dashboard santé) */}
        <Route path="/dog-profile" element={<DogProfile />} />
        <Route path="/dog-profile/:id" element={<DogProfile />} />
        
        <Route path="/daily-tip" element={<DailyTip />} />
        <Route path="/forum-hub" element={<ForumHub />} />
        <Route path="/social-feed" element={<SocialFeed />} />
        <Route path="/forum/:slug" element={<ForumDetail />} />
        <Route path="/post/:id" element={<PostDetail />} />
        <Route path="/multi-profile-management" element={<MultiProfileManagement />} />
        <Route path="/register" element={<Register />} />
        
        {/* Profils publics */}
        <Route path="/profile/:userId" element={<UserProfile />} />
        
        {/* Notifications */}
        <Route path="/notifications" element={<Notifications />} />
        
        {/* Pages Adoption */}
        <Route path="/adoption" element={<AdoptionPage />} />
        <Route path="/adoption/:dogId" element={<AdoptionDetail />} />
        
        {/* Routes Professionnelles - NOUVEAU ⬇️ */}
        <Route path="/pro/register" element={<ProRegistration />} />
        <Route path="/pro/dashboard" element={<ProDashboard />} />
        <Route path="/pro/dogs" element={<ProDogManagement />} />
        <Route path="/pro/dogs/new" element={<ProDogManagement />} />
        <Route path="/pro/dogs/:dogId" element={<ProDogManagement />} />
        <Route path="/pro/applications" element={<ProApplications />} />
        
        <Route path="/settings" element={<Settings />} />
        
        {/* Pages légales */}
        <Route path="/cgu" element={<CGU />} />
        <Route path="/mentions-legales" element={<MentionsLegales />} />
        <Route path="/politique-confidentialite" element={<PolitiqueConfidentialite />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        
        <Route path="*" element={<NotFound />} />
      </RouterRoutes>
      </ErrorBoundary>
    </BrowserRouter>
  );
};
export default Routes;
