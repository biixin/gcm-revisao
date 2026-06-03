import { useEffect, useState } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './contexts/useAuth';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import StudyPage from './pages/StudyPage';
import LibrasStudyPage from './pages/LibrasStudyPage';
import LibrasInverseStudyPage from './pages/LibrasInverseStudyPage';
import AdminPage from './pages/AdminPage';
import { Subject } from './lib/supabase';
import { librasInverseSubjectId, librasSubjectId } from './data/librasCards';

type Page = 'auth' | 'dashboard' | 'study' | 'admin';

function AppInner() {
  const { user, loading } = useAuth();
  const [page, setPage] = useState<Page>('dashboard');
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [isGuest, setIsGuest] = useState(true);
  const effectiveIsGuest = isGuest && !user;

  useEffect(() => {
    if (loading) return;

    if (user && isGuest) {
      setIsGuest(false);
    }

    if (user && page === 'auth') {
      setIsGuest(false);
      setSelectedSubject(null);
      setPage('dashboard');
      return;
    }

    if (!user && !isGuest && page !== 'auth') {
      setSelectedSubject(null);
      setPage('auth');
    }
  }, [isGuest, loading, page, user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050a14] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (page === 'auth') {
    return (
      <LoginPage
        onGuestAccess={() => {
          setIsGuest(true);
          setSelectedSubject(null);
          setPage('dashboard');
        }}
      />
    );
  }

  if (page === 'study' && selectedSubject) {
    if (selectedSubject.id === librasSubjectId) {
      return (
        <LibrasStudyPage
          subject={selectedSubject}
          onBack={() => setPage('dashboard')}
          isGuest={effectiveIsGuest}
        />
      );
    }

    if (selectedSubject.id === librasInverseSubjectId) {
      return (
        <LibrasInverseStudyPage
          subject={selectedSubject}
          onBack={() => setPage('dashboard')}
          isGuest={effectiveIsGuest}
        />
      );
    }

    return (
      <StudyPage
        subject={selectedSubject}
        onBack={() => setPage('dashboard')}
        isGuest={effectiveIsGuest}
      />
    );
  }

  if (page === 'admin') {
    return <AdminPage onBack={() => setPage('dashboard')} />;
  }

  return (
    <DashboardPage
      onSelectSubject={s => { setSelectedSubject(s); setPage('study'); }}
      onAdmin={() => setPage('admin')}
      onLogout={() => { setIsGuest(false); setSelectedSubject(null); setPage('auth'); }}
      isGuest={effectiveIsGuest}
      user={user}
    />
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
