import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Sidebar({ onSelectUser }: { onSelectUser: (user: any) => void }) {
  const [users, setUsers] = useState<any[]>([]);

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

  return (
    <div className="flex flex-col h-full gap-6">
      <div className="flex-1 overflow-y-auto px-2 space-y-1 custom-scrollbar">
        <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold px-4 mb-2">Recent Users</div>
        {users.map((user) => (
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
              </div>
            </li>
          ))}
      </div>
    </div>
  );
}
