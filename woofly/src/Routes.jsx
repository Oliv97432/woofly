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
import MultiProfileManagement from './pages/multi-profile-management';
import Register from './pages/register';
import UserProfile from './pages/UserProfile';
import CGU from './pages/CGU';                                    // ✅ AJOUTE
import MentionsLegales from './pages/MentionsLegales';            // ✅ AJOUTE
import PolitiqueConfidentialite from './pages/PolitiqueConfidentialite';  // ✅ AJOUTE
import About from './pages/About';                                // ✅ AJOUTE
import Contact from './pages/Contact';                            // ✅ AJOUTE

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
        <Route path="/dog-profile" element={<DogProfile />} />
        <Route path="/daily-tip" element={<DailyTip />} />
        <Route path="/forum-hub" element={<ForumHub />} />
        <Route path="/multi-profile-management" element={<MultiProfileManagement />} />
        <Route path="/register" element={<Register />} />
        <Route path="/user-profile" element={<UserProfile />} />
        
        {/* Pages légales */}  {/* ✅ AJOUTE CE BLOC */}
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
