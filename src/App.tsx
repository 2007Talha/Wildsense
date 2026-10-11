import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAppStore } from './store/app-store';
import { aiRouter } from './services/ai/ai-router';
import { AppLayout } from './components/layout/AppLayout';
import { LandingPage } from './pages/LandingPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { ExploreDashboard } from './pages/ExploreDashboard';
import { CreateAdventure } from './pages/CreateAdventure';
import { GuidedAdventure } from './pages/GuidedAdventure';
import { DiscoveryJournal } from './pages/DiscoveryJournal';
import { IdentificationLab } from './pages/IdentificationLab';
import { ProgressPage } from './pages/ProgressPage';
import { SettingsPage } from './pages/SettingsPage';
import { BadgeToast } from './components/common/BadgeToast';

export default function App() {
  const { preferences, loadPreferences, loadCompletedMissions, loadJournalEntries, setAIStatus, setIsOnline } = useAppStore();

  useEffect(() => {
    loadPreferences();
    loadCompletedMissions();
    loadJournalEntries();

    // Initialize AI
    aiRouter.initialize();
    const unsub = aiRouter.subscribe(setAIStatus);

    // Online/offline
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      unsub();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={
          preferences?.completedOnboarding ? <Navigate to="/explore" replace /> : <LandingPage />
        } />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/adventure" element={<GuidedAdventure />} />
        <Route element={<AppLayout />}>
          <Route path="/explore" element={<ExploreDashboard />} />
          <Route path="/create" element={<CreateAdventure />} />
          <Route path="/journal" element={<DiscoveryJournal />} />
          <Route path="/identify" element={<IdentificationLab />} />
          <Route path="/progress" element={<ProgressPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
      <BadgeToast />
    </BrowserRouter>
  );
}
