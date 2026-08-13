import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { useCall } from './hooks/useCall';
import { Sidebar, BottomNav } from './components/layout/Sidebar';
import { IncomingCallModal } from './components/calls/IncomingCallModal';
import { ActiveCallScreen } from './components/calls/ActiveCallScreen';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ForgotPassword } from './pages/ForgotPassword';
import { Dashboard } from './pages/Dashboard';
import { Contacts } from './pages/Contacts';
import { Calls } from './pages/Calls';
import { Messages } from './pages/Messages';
import { Profile } from './pages/Profile';
import { Settings } from './pages/Settings';
import { UserProfile, CallType } from './types';
import { PhoneCall, Loader2 } from 'lucide-react';

function MainApp() {
  const { currentUser, userProfile, loading } = useAuth();
  const [authView, setAuthView] = useState<'login' | 'register' | 'forgot'>('login');
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [chatPeer, setChatPeer] = useState<UserProfile | null>(null);

  // Dark mode state
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode((prev) => !prev);

  // Call hook
  const {
    activeCall,
    incomingCall,
    localStream,
    remoteStream,
    isMuted,
    isVideoOff,
    callDuration,
    isConnecting,
    callError,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleVideo,
    clearError,
  } = useCall(userProfile);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white p-4">
        <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center mb-4 shadow-xl shadow-indigo-600/30 animate-bounce">
          <PhoneCall className="w-8 h-8" />
        </div>
        <Loader2 className="w-6 h-6 animate-spin text-indigo-400 mb-2" />
        <p className="text-xs text-slate-400 font-medium">Loading Calling App...</p>
      </div>
    );
  }

  // Auth Router
  if (!currentUser) {
    if (authView === 'register') {
      return <Register onSwitchToLogin={() => setAuthView('login')} />;
    }
    if (authView === 'forgot') {
      return <ForgotPassword onBackToLogin={() => setAuthView('login')} />;
    }
    return (
      <Login
        onSwitchToRegister={() => setAuthView('register')}
        onSwitchToForgot={() => setAuthView('forgot')}
      />
    );
  }

  const handleOpenChat = (peer: UserProfile) => {
    setChatPeer(peer);
    setCurrentTab('messages');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col md:flex-row transition-colors pb-16 md:pb-0">
      {/* Sidebar for Desktop */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
      />

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        {currentTab === 'dashboard' && (
          <Dashboard
            onStartCall={startCall}
            onOpenChat={handleOpenChat}
            onNavigateTab={setCurrentTab}
          />
        )}
        {currentTab === 'contacts' && (
          <Contacts onStartCall={startCall} onOpenChat={handleOpenChat} />
        )}
        {currentTab === 'calls' && <Calls onStartCall={startCall} />}
        {currentTab === 'messages' && (
          <Messages initialPeerUser={chatPeer} onStartCall={startCall} />
        )}
        {currentTab === 'profile' && <Profile />}
        {currentTab === 'settings' && (
          <Settings isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />
        )}
      </main>

      {/* Bottom Navigation for Mobile */}
      <BottomNav
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
      />

      {/* Incoming Call Modal Banner */}
      <IncomingCallModal
        incomingCall={incomingCall}
        onAccept={acceptCall}
        onReject={rejectCall}
      />

      {/* Active Call Full Screen / Overlay */}
      <ActiveCallScreen
        activeCall={activeCall}
        localStream={localStream}
        remoteStream={remoteStream}
        isMuted={isMuted}
        isVideoOff={isVideoOff}
        callDuration={callDuration}
        isConnecting={isConnecting}
        callError={callError}
        onEndCall={endCall}
        onToggleMute={toggleMute}
        onToggleVideo={toggleVideo}
        onClearError={clearError}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
