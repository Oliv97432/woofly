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
import ForumDetail from './pages/forum-detail';        // ✅ AJOUTÉ
import PostDetail from './pages/post-detail';          // ✅ AJOUTÉ
import MultiProfileManagement from './pages/multi-profile-management';
import Register from './pages/register';
import UserProfile from './pages/UserProfile';
import Settings from './pages/settings';
import CGU from './pages/CGU';
import MentionsLegales from './pages/MentionsLegales';
import PolitiqueConfidentialite from './pages/PolitiqueConfidentialite';
import About from './pages/About';
import Contact from './pages/Contact';

const Routes = () => {
  return (
    <BrowserRouter>
      <ErrorBoundary>
      <ScrollToTop />
      <RouterRoutes>
        {/* Define your route here */}
        <Route path="/" element={<Login />} />
        <Route path="/important-contacts" element={<ImportantContacts />} />
        <Route path="/forum-discussion" element={<ForumDiscussion />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dog-profile/:id" element={<DogProfile />} />
        <Route path="/daily-tip" element={<DailyTip />} />
        <Route path="/forum-hub" element={<ForumHub />} />
        <Route path="/forum/:slug" element={<ForumDetail />} />        {/* ✅ AJOUTÉ */}
        <Route path="/post/:id" element={<PostDetail />} />            {/* ✅ AJOUTÉ */}
        <Route path="/multi-profile-management" element={<MultiProfileManagement />} />
        <Route path="/register" element={<Register />} />
        <Route path="/user-profile" element={<UserProfile />} />
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
