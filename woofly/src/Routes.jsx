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

// Pages Adoption - NOUVELLES VERSIONS
import PublicAdoptionPage from './pages/PublicAdoptionPage';
import PublicDogDetail from './pages/PublicDogDetail';

// Page Premium
import PremiumPage from './pages/PremiumPage';

// Page Recettes Premium ⭐
import RecipesPage from './pages/RecipesPage';

// Page Rappels Premium ⭐ NOUVEAU
import RemindersPage from './pages/RemindersPage';

// Route hybride /chien/:id
import HybridDogProfile from './pages/chien/HybridDogProfile';

// Pages Professionnelles
import ProRegistration from './pages/pro/ProRegistration';
import ProDashboard from './pages/pro/ProDashboard';
import ProSettings from './pages/pro/ProSettings';
import ProDogManagement from './pages/pro/ProDogManagement';
import ProDogDetail from './pages/pro/ProDogDetail';
import ProDogsList from './pages/pro/ProDogsList';
import ProFosterFamilies from './pages/pro/ProFosterFamilies';
import ProApplications from './pages/pro/ProApplications';
import InstagramGenerator from './pages/pro/InstagramGenerator';

// Pages CRM
import CRMContacts from './pages/pro/crm/CRMContacts';
import CRMContactDetail from './pages/pro/crm/CRMContactDetail';
import CRMContactForm from './pages/pro/crm/CRMContactForm';

// Redirection intelligente
import DashboardRedirect from './components/DashboardRedirect';

// Dashboard Admin
import AdminDashboard from './pages/admin/AdminDashboard';

// Page de récupération de chien
import ClaimDogPage from './pages/ClaimDogPage';

const Routes = () => {
  return (
    <BrowserRouter>
      <ErrorBoundary>
      <ScrollToTop />
      <RouterRoutes>
        <Route path="/" element={<LandingPage />} />
        
        <Route path="/important-contacts" element={<ImportantContacts />} />
        <Route path="/forum-discussion" element={<ForumDiscussion />} />
        <Route path="/login" element={<Login />} />
        
        <Route path="/chien/:id" element={<HybridDogProfile />} />
        
        <Route path="/dashboard" element={<DashboardRedirect />} />
        
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        
        <Route path="/claim-dog" element={<ClaimDogPage />} />
        
        <Route path="/dog-profile" element={<DogProfile />} />
        <Route path="/dog-profile/:id" element={<DogProfile />} />
        
        <Route path="/daily-tip" element={<DailyTip />} />
        <Route path="/forum-hub" element={<ForumHub />} />
        <Route path="/social-feed" element={<SocialFeed />} />
        <Route path="/forum/:slug" element={<ForumDetail />} />
        <Route path="/post/:id" element={<PostDetail />} />
        <Route path="/multi-profile-management" element={<MultiProfileManagement />} />
        <Route path="/register" element={<Register />} />
        
        <Route path="/profile/:userId" element={<UserProfile />} />
        
        <Route path="/notifications" element={<Notifications />} />
        
        <Route path="/adoption" element={<PublicAdoptionPage />} />
        <Route path="/adoption/:dogId" element={<PublicDogDetail />} />
        
        <Route path="/premium" element={<PremiumPage />} />
        
        {/* Routes Premium Features ⭐ */}
        <Route path="/recipes" element={<RecipesPage />} />
        <Route path="/reminders" element={<RemindersPage />} />
        
        {/* Routes Professionnelles */}
        <Route path="/pro/register" element={<ProRegistration />} />
        <Route path="/pro/dashboard" element={<ProDashboard />} />
        <Route path="/pro/settings" element={<ProSettings />} />
        <Route path="/pro/dogs" element={<ProDogManagement />} />
        <Route path="/pro/dogs/new" element={<ProDogManagement />} />
        <Route path="/pro/dogs/:dogId" element={<ProDogDetail />} />
        <Route path="/pro/dogs-list" element={<ProDogsList />} />
        <Route path="/pro/foster-families" element={<ProFosterFamilies />} />
        <Route path="/pro/applications" element={<ProApplications />} />
        <Route path="/pro/instagram" element={<InstagramGenerator />} />
        
        {/* Routes CRM */}
        <Route path="/pro/crm/contacts" element={<CRMContacts />} />
        <Route path="/pro/crm/contacts/new" element={<CRMContactForm />} />
        <Route path="/pro/crm/contacts/:contactId" element={<CRMContactDetail />} />
        <Route path="/pro/crm/contacts/:contactId/edit" element={<CRMContactForm />} />
        
        <Route path="/settings" element={<Settings />} />
        
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
