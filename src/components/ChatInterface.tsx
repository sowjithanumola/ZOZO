import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Send, Image as ImageIcon, Smile } from 'lucide-react';
import ChatSkeleton from './ChatSkeleton';

export default function ChatInterface({ selectedUser, currentUser, darkMode }: { selectedUser: any; currentUser: any; darkMode: boolean }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ... (keep useEffect for fetching and subscribing)
  useEffect(() => {
    const fetchMessages = async () => {
      const { data } = await supabase()
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${currentUser.id},sender_id.eq.${selectedUser.id}`)
        .order('created_at', { ascending: true });
      if (data) setMessages(data);
      setLoading(false);
    };
    fetchMessages();

    const channel = supabase()
      .channel('messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        setMessages((prev) => [...prev, payload.new]);
      })
      .subscribe();

    return () => { supabase().removeChannel(channel); };
  }, [selectedUser, currentUser]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    await supabase().from('messages').insert({
      chat_id: 1, 
      sender_id: currentUser.id,
      content: newMessage,
    });
    setNewMessage('');
  };

  const bgClass = darkMode ? 'bg-zinc-950' : 'bg-white';
  const borderClass = darkMode ? 'border-zinc-800' : 'border-zinc-200';
  const textClass = darkMode ? 'text-zinc-50' : 'text-zinc-900';
  const msgOwnClass = 'bg-blue-600 text-white rounded-br-none';
  const msgOtherClass = darkMode ? 'bg-zinc-800 text-zinc-50 rounded-bl-none' : 'bg-zinc-200 text-zinc-900 rounded-bl-none';
  const inputBgClass = darkMode ? 'bg-zinc-900' : 'bg-zinc-100';

  return (
    <div className={`flex flex-col h-full ${bgClass} ${textClass}`}>
      {/* Header */}
      <div className={`p-4 border-b ${borderClass} flex items-center gap-3`}>
        <div className="w-10 h-10 rounded-full bg-zinc-700"></div>
        <div className="font-semibold">{selectedUser.name}</div>
      </div>

      {/* Messages */}
      {loading ? <ChatSkeleton /> : (
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender_id === currentUser.id ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[60%] p-4 rounded-3xl text-sm ${msg.sender_id === currentUser.id ? msgOwnClass : msgOtherClass}`}>
                {msg.content}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Input */}
      <div className={`p-4 border-t ${borderClass} ${bgClass}`}>
        <div className="relative flex items-center gap-2">
            <button className="text-zinc-500 hover:text-zinc-200"><Smile /></button>
            <button className="text-zinc-500 hover:text-zinc-200"><ImageIcon /></button>
            <input 
              value={newMessage} 
              onChange={(e) => setNewMessage(e.target.value)}
              className={`flex-1 ${inputBgClass} border ${borderClass} rounded-full px-5 py-3 text-sm outline-none focus:ring-1 focus:ring-blue-500`}
              placeholder="Message..."
            />
            <button onClick={sendMessage} className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"><Send size={18} /></button>
        </div>
      </div>
    </div>
  );
}
