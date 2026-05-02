import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Profile({ onSave }: { onSave?: () => void }) {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [website, setWebsite] = useState('');
  const [gender, setGender] = useState('Male');

  useEffect(() => {
    async function fetchProfile() {
      const { data: { user } } = await supabase().auth.getUser();
      if (!user) return;

      const { data, error } = await supabase()
        .from('users')
        .select('*')
        .eq('id', user.id)
        .maybeSingle(); 
      
      if (error) {
        console.error('Fetch profile error:', error);
      } else if (data) {
        setName(data.name || '');
        setUsername(data.username || '');
        setBio(data.bio || '');
        setWebsite(data.website || '');
        setGender(data.gender || 'Male');
        setAvatarUrl(data.avatar_url || '');
      }
    }
    fetchProfile();
  }, []);

  const [avatarUrl, setAvatarUrl] = useState('');

  const updateProfile = async () => {
    const { data: { user } } = await supabase().auth.getUser();
    if (!user) return;

    let final_avatar_url = avatarUrl;
    // Removed avatar upload logic

    const { error } = await supabase()
      .from('users')
      .upsert({ 
        id: user.id, 
        name, 
        username,
        bio, 
        website, 
        gender,
        avatar_url: final_avatar_url
      });
      
    if (error) {
      alert(`Error updating profile: ${error.message}`);
    } else {
      alert('Profile updated successfully!');
      if (onSave) onSave();
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 shadow-2xl border border-zinc-200 dark:border-zinc-800 space-y-10 max-w-xl mx-auto animate-in fade-in zoom-in-95 duration-500">
      <div className="text-center space-y-2">
        <h2 className="text-4xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">Profile</h2>
        <p className="text-zinc-500 font-medium">Customize how others see you on ZOZO</p>
      </div>
      
      {/* Avatar Section */}
      <div className="flex flex-col items-center gap-6">
        <div className="relative group">
          <img 
            src={avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'A')}&background=random&size=256`} 
            className="w-32 h-32 rounded-full object-cover ring-4 ring-blue-500/20 transition-all duration-300"
            alt="Profile Avatar"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-widest text-zinc-400 ml-2">Username</label>
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 text-sm font-medium transition-all" placeholder="username" />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-widest text-zinc-400 ml-2">Full Name</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 text-sm font-medium transition-all" placeholder="Full Name" />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-black uppercase tracking-widest text-zinc-400 ml-2">Bio</label>
        <textarea value={bio} onChange={(e) => setBio(e.target.value)} className="w-full p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 text-sm font-medium h-24 resize-none transition-all" placeholder="A little about yourself..." maxLength={150}></textarea>
        <div className="text-right text-[10px] font-bold text-zinc-400 px-2">{bio.length} / 150 CHARACTERS</div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-black uppercase tracking-widest text-zinc-400 ml-2">Gender</label>
        <select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 text-sm font-medium transition-all appearance-none cursor-pointer">
          <option>Male</option>
          <option>Female</option>
          <option>Other</option>
          <option>Prefer not to say</option>
        </select>
      </div>

      <button onClick={updateProfile} className="w-full py-5 bg-blue-600 text-white font-black rounded-[1.5rem] hover:bg-blue-700 shadow-xl shadow-blue-500/20 active:scale-[0.98] transition-all tracking-widest uppercase text-sm">Save Changes</button>
    </div>
  );
}
