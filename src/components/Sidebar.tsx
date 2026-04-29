import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Search } from 'lucide-react';

export default function Sidebar({ onSelectUser }: { onSelectUser: (user: any) => void }) {
  const [users, setUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data, error } = await supabase().from('users').select('*');
        if (error) {
          console.error('Error fetching users:', error);
        } else if (data) {
          setUsers(data);
        }
      } catch (e) {
        console.error('Unexpected error fetching users:', e);
      }
    };
    fetchUsers();
  }, []);

  const filteredUsers = users.filter((u) => u.name?.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="flex flex-col h-full gap-6">
      <div className="px-2">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-blue-500 transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Search messages..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-zinc-100 dark:bg-zinc-900 border-none rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-zinc-500"
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto px-2 space-y-1 custom-scrollbar">
        <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold px-4 mb-2">Recent Chats</div>
        {filteredUsers.length === 0 ? (
          <div className="text-center py-8 text-zinc-500 text-sm italic">No users found</div>
        ) : (
          filteredUsers.map((user) => (
            <li 
              key={user.id} 
              onClick={() => onSelectUser(user)} 
              className="flex items-center gap-4 p-3 hover:bg-white dark:hover:bg-zinc-900 rounded-2xl cursor-pointer transition-all active:scale-[0.98] group relative"
            >
              <div className="relative">
                <img 
                  src={user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'A')}&background=random`} 
                  alt={user.name} 
                  className="w-12 h-12 rounded-full object-cover border-2 border-transparent group-hover:border-blue-500 transition-all" 
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-0.5">
                  <div className="font-bold text-sm text-zinc-900 dark:text-zinc-100 truncate">{user.name || 'Anonymous'}</div>
                </div>
                <div className="text-xs text-zinc-500 truncate font-medium">Tap to open chat</div>
              </div>
              {/* Message indicator dot could go here */}
            </li>
          ))
        )}
      </div>
    </div>
  );
}
