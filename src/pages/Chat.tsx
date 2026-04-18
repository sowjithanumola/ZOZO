import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import ChatInterface from '../components/ChatInterface';
import Sidebar from '../components/Sidebar';
import Profile from '../components/Profile';
import { MessageSquareCode, User, Settings, LogOut, Sun, Moon } from 'lucide-react';

export default function Chat() {
  const [user, setUser] = useState<any>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [view, setView] = useState<'chat' | 'profile' | 'settings'>('chat');
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase().auth.getSession();
      if (!session) {
        navigate('/login');
      } else {
        setUser(session.user);
        setLoading(false);
      }
    };
    getUser();
  }, [navigate]);

  if (loading) {
    return <div className="h-screen flex items-center justify-center">Loading...</div>;
  }

  const toggleTheme = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <div className={`flex h-screen ${darkMode ? 'dark bg-zinc-950 text-zinc-50' : 'bg-white text-zinc-900'} font-sans`}>
      {/* Sidebar */}
      <div className={`w-80 border-r ${darkMode ? 'border-zinc-800' : 'border-zinc-200'} flex flex-col p-4 gap-6`}>
        <div className="flex items-center gap-2 px-2">
          <MessageSquareCode size={24} />
          <span className="font-semibold text-lg">ZOZO</span>
        </div>
        
        <Sidebar onSelectUser={(u) => { setSelectedUser(u); setView('chat'); }} />
        
        <div className={`border-t ${darkMode ? 'border-zinc-800' : 'border-zinc-200'} pt-4 flex items-center justify-between`}>
           <User size={20} className="cursor-pointer hover:text-blue-500" onClick={() => setView('profile')}/>
           <Settings size={20} className="cursor-pointer hover:text-blue-500" onClick={() => setView('settings')}/>
           <button onClick={toggleTheme}>
             {darkMode ? <Sun size={20} /> : <Moon size={20} />}
           </button>
           <LogOut size={20} className="cursor-pointer hover:text-red-500" onClick={() => supabase().auth.signOut().then(() => navigate('/login'))}/>
        </div>
      </div>

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col ${darkMode ? 'bg-zinc-950' : 'bg-zinc-50'} overflow-y-auto`}>
          {view === 'profile' ? <div className="p-8 max-w-2xl w-full mx-auto"><Profile /></div> :
           view === 'settings' ? <div className="p-8 text-xl font-bold">Settings (Coming Soon)</div> :
           selectedUser ? <ChatInterface selectedUser={selectedUser} currentUser={user} darkMode={darkMode} /> :
           <div className="flex-1 flex flex-col items-center justify-center p-8 text-center opacity-60">
                <MessageSquareCode size={64} className="mb-4" />
                <h2 className="text-2xl font-bold mb-2">Fast. Private. Simple. ZOZO.</h2>
                <p>Select a conversation to start messaging.</p>
            </div>
          }
      </div>
    </div>
  );
}
