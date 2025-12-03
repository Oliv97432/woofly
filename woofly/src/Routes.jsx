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
import UserProfile from './pages/UserProfile';  // ✅ AJOUTE CETTE LIGNE

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
        <Route path="/user-profile" element={<UserProfile />} />  {/* ✅ AJOUTE CETTE LIGNE */}
        <Route path="*" element={<NotFound />} />
      </RouterRoutes>
      </ErrorBoundary>
    </BrowserRouter>
  );
};

export default Routes;
