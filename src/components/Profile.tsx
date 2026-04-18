import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Profile() {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [website, setWebsite] = useState('');
  const [gender, setGender] = useState('Male');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      const { data: { user } } = await supabase().auth.getUser();
      if (!user) return;

      const { data, error } = await supabase()
        .from('users')
        .select('*')
        .eq('id', user.id)
        .maybeSingle(); // Use maybeSingle to avoid 406/PGRST116 errors
      
      if (error) {
        console.error('Fetch profile error:', error);
      } else if (data) {
        setName(data.name || '');
        setUsername(data.username || '');
        setBio(data.bio || '');
        setWebsite(data.website || '');
        setGender(data.gender || 'Male');
      }
    }
    fetchProfile();
  }, []);

  const updateProfile = async () => {
    const { data: { user } } = await supabase().auth.getUser();
    if (!user) return;

    let avatar_url = '';
    if (avatarFile) {
      const fileExt = avatarFile.name.split('.').pop();
      const fileName = `${user.id}.${fileExt}`;
      const { error: uploadError } = await supabase().storage
        .from('avatars')
        .upload(fileName, avatarFile, { upsert: true });
      if (uploadError) { alert(uploadError.message); return; }
      
      const { data } = supabase().storage.from('avatars').getPublicUrl(fileName);
      avatar_url = data.publicUrl;
    }

    const { error } = await supabase()
      .from('users')
      .upsert({ 
        id: user.id, 
        name, 
        username,
        bio, 
        website, 
        gender,
        ...(avatar_url && { avatar_url }) 
      });
      
    if (error) {
      console.error('Upsert error:', error); // Log full error object
      alert(`Error updating profile: ${error.message} - ${error.details || ''}`);
    } else {
      alert('Profile updated!');
    }
  };

  return (
    <div className="bg-zinc-900 rounded-3xl border border-zinc-800 p-8 space-y-8">
      <h2 className="text-3xl font-bold text-zinc-50">Edit profile</h2>
      
      {/* Avatar Section */}
      <div className="bg-zinc-950 p-6 rounded-2xl flex items-center justify-between border border-zinc-800">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-zinc-700"></div>
          <div>
            <div className="font-bold text-zinc-50">{username || 'Username'}</div>
            <div className="text-zinc-400">{name || 'Full Name'}</div>
          </div>
        </div>
        <input type="file" onChange={(e) => setAvatarFile(e.target.files?.[0] || null)} className="hidden" id="photo-upload" />
        <label htmlFor="photo-upload" className="px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 cursor-pointer transition-colors text-sm">Change photo</label>
      </div>

      {/* Basic Info */}
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="font-semibold text-zinc-50">Username</label>
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full p-4 bg-zinc-950 border border-zinc-700 rounded-2xl outline-none focus:ring-1 focus:ring-zinc-600 text-zinc-200" placeholder="your_username" />
        </div>
        <div className="space-y-2">
          <label className="font-semibold text-zinc-50">Name</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full p-4 bg-zinc-950 border border-zinc-700 rounded-2xl outline-none focus:ring-1 focus:ring-zinc-600 text-zinc-200" placeholder="Your Name" />
        </div>
      </div>

      {/* Bio */}
      <div className="space-y-2">
        <label className="font-semibold text-zinc-50">Bio</label>
        <textarea value={bio} onChange={(e) => setBio(e.target.value)} className="w-full p-4 bg-zinc-950 border border-zinc-700 rounded-2xl outline-none focus:ring-1 focus:ring-zinc-600 text-zinc-200 h-32" placeholder="Tell us about yourself..." maxLength={150}></textarea>
        <div className="text-right text-sm text-zinc-500">{bio.length} / 150</div>
      </div>

      {/* Gender */}
      <div className="space-y-2">
        <label className="font-semibold text-zinc-50">Gender</label>
        <select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full p-4 bg-zinc-950 border border-zinc-700 rounded-2xl outline-none focus:ring-1 focus:ring-zinc-600 text-zinc-200">
          <option>Male</option>
          <option>Female</option>
          <option>Other</option>
          <option>Prefer not to say</option>
        </select>
      </div>

      <button onClick={updateProfile} className="w-full py-4 bg-zinc-50 text-zinc-950 font-bold rounded-2xl hover:bg-zinc-200 transition-colors">Save Profile</button>
    </div>
  );
}
