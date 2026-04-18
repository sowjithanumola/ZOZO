import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Search } from 'lucide-react';

export default function Sidebar({ onSelectUser }: { onSelectUser: (user: any) => void }) {
  const [users, setUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      const { data } = await supabase.from('users').select('*');
      if (data) setUsers(data);
    };
    fetchUsers();
  }, []);

  const filteredUsers = users.filter((u) => u.name?.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="relative">
        <Search className="absolute left-3 top-3 text-zinc-500" size={18} />
        <input 
          type="text" 
          placeholder="Search people..." 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-full text-sm outline-none focus:ring-1 focus:ring-zinc-600 text-zinc-50"
        />
      </div>
      <div className="text-xs text-zinc-500 uppercase tracking-wider font-semibold px-2">Contacts</div>
      <ul className="flex-1 overflow-y-auto space-y-2">
        {filteredUsers.map((user) => (
          <li key={user.id} onClick={() => onSelectUser(user)} className="flex items-center gap-3 p-3 hover:bg-zinc-800 rounded-xl cursor-pointer transition-colors">
            <img src={user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'A')}`} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
            <div className="font-medium text-sm text-zinc-100">{user.name || 'Anonymous'}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
