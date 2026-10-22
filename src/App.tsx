import React, { useState, useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  NavLink,
  Link,
  Navigate,
  useLocation,
} from 'react-router-dom';
import { Heart, Menu, X } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { supabase } from './supabase';

// Pages
import HomePage from './pages/HomePage';
import ProfilePage from './pages/ProfilePage';
import MemoriesPage from './pages/MemoriesPage';
import TimelinePage from './pages/TimelinePage';
import GalleryPage from './pages/GalleryPage';
import AchievementsPage from './pages/AchievementsPage';
import AgentPage from './pages/AgentPage';
import SettingsPage from './pages/SettingsPage';
import AuthPage from './pages/AuthPage';

function ProtectedRoute({
  user,
  children,
}: {
  user: User | null | undefined;
  children: React.ReactNode;
}) {
  const location = useLocation();

  if (user === undefined) {
    return (
      <div className="glass-panel mx-6 my-12 p-8 text-center text-ink-500" role="status">
        Checking your sign-in...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}

function Layout({ children }: { children: React.ReactNode }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { path: '/', label: 'Home' },
    { path: '/memories', label: 'My Memories' },
    { path: '/timeline', label: 'My Timeline' },
    { path: '/gallery', label: 'My Gallery' },
    { path: '/profile', label: 'My Profile' },
  ];

  if (location.pathname === '/' || location.pathname === '/auth') {
    return <div className="min-h-screen">{children}</div>;
  }

  return (
    <div className="min-h-screen flex flex-col font-sans bg-cream-50">
      {/* Top Navigation Bar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white/80 backdrop-blur-md shadow-sm py-3' : 'bg-transparent py-5'}`}>
        <div className="max-w-7xl mx-auto px-6 md:px-12 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2 group">
            <Heart size={24} className="text-sage-600 transition-transform group-hover:scale-110" />
            <span className="text-2xl font-serif font-bold text-ink-900 italic">MyLife</span>
          </Link>
          
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => 
                  `text-sm font-medium tracking-wide transition-colors hover:text-sage-700 ${isActive ? 'text-sage-700 border-b-2 border-sage-500 pb-1' : 'text-ink-600'}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                `text-sm font-medium transition-colors hover:text-sage-700 ${
                  isActive ? 'text-sage-700' : 'text-ink-600'
                }`
              }
            >
              Settings
            </NavLink>
            <Link to="/agent" className="text-sm font-medium text-ink-600 hover:text-sage-700 transition-colors">AI Assistant</Link>
            <Link to="/auth" onClick={() => setIsMobileMenuOpen(false)} className="btn-primary text-center bg-ink-900 text-white hover:bg-ink-800">Sign In</Link>
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden text-ink-900"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-white border-t border-cream-200 shadow-lg py-4 px-6 flex flex-col space-y-4">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) => 
                  `block py-2 text-lg font-serif ${isActive ? 'text-sage-700 font-bold' : 'text-ink-600'}`
                }
              >
                {item.label}
              </NavLink>
            ))}
            <div className="pt-4 border-t border-cream-200 flex flex-col space-y-3">
              <NavLink
                to="/settings"
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `py-2 font-medium ${isActive ? 'text-sage-700' : 'text-ink-600'}`
                }
              >
                Settings
              </NavLink>
              <Link to="/agent" onClick={() => setIsMobileMenuOpen(false)} className="py-2 text-ink-600 font-medium">AI Assistant</Link>
              <Link to="/auth" onClick={() => setIsMobileMenuOpen(false)} className="btn-primary text-center bg-ink-900 text-white hover:bg-ink-800">Sign In</Link>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="flex-grow pt-20">
        <div className="max-w-7xl mx-auto h-full">
          {children}
        </div>
      </main>
    </div>
  );
}

function App() {
  const [user, setUser] = useState<User | null>();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/profile" element={<ProtectedRoute user={user}><ProfilePage key={user?.id ?? ''} userId={user?.id ?? ''} /></ProtectedRoute>} />
          <Route path="/memories" element={<ProtectedRoute user={user}><MemoriesPage key={user?.id ?? ''} userId={user?.id ?? ''} /></ProtectedRoute>} />
          <Route path="/timeline" element={<ProtectedRoute user={user}><TimelinePage key={user?.id ?? ''} userId={user?.id ?? ''} /></ProtectedRoute>} />
          <Route path="/gallery" element={<ProtectedRoute user={user}><GalleryPage key={user?.id ?? ''} userId={user?.id ?? ''} /></ProtectedRoute>} />
          <Route path="/achievements" element={<ProtectedRoute user={user}><AchievementsPage /></ProtectedRoute>} />
          <Route path="/agent" element={<ProtectedRoute user={user}><AgentPage key={user?.id ?? ''} userId={user?.id ?? ''} /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute user={user}><SettingsPage userEmail={user?.email} /></ProtectedRoute>} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
