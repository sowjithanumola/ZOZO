interface UserProfileProps {
  name: string;
  avatarUrl?: string;
  status?: 'online' | 'offline';
}

export default function UserProfile({ name, avatarUrl, status = 'online' }: UserProfileProps) {
  return (
    <div className="flex items-center gap-3 p-4 bg-white border-b border-gray-200">
      <div className="relative">
        <img
          src={avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}`}
          alt={name}
          className="w-10 h-10 rounded-full object-cover"
        />
        <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${status === 'online' ? 'bg-green-500' : 'bg-gray-400'}`} />
      </div>
      <div>
        <h2 className="text-sm font-semibold text-gray-900">{name}</h2>
        <p className="text-xs text-gray-500">{status === 'online' ? 'Online' : 'Offline'}</p>
      </div>
    </div>
  );
}
