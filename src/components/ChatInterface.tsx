import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { ChannelProvider, useChannel } from 'ably/react';
import { Send, Image as ImageIcon, Smile } from 'lucide-react';
import ChatSkeleton from './ChatSkeleton';
import EmojiPicker from 'emoji-picker-react';

export default function ChatInterface({ selectedUser, currentUser, darkMode }: { selectedUser: any; currentUser: any; darkMode: boolean }) {
  const [chatId, setChatId] = useState<number | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initChat = async () => {
      if (!selectedUser?.id || !currentUser?.id) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setMessages([]);
      setChatId(null);
      try {
        const { data: participants, error: pError } = await supabase()
          .from('chat_participants')
          .select('chat_id')
          .in('user_id', [currentUser.id, selectedUser.id]);
        
        if (pError) console.error('Error fetching participants:', pError);

        const chatCounts: Record<number, number> = {};
        participants?.forEach(p => chatCounts[p.chat_id] = (chatCounts[p.chat_id] || 0) + 1);
        
        const existingChatId = Object.keys(chatCounts).find(id => chatCounts[Number(id)] >= 2);
        
        if (existingChatId) {
          setChatId(Number(existingChatId));
        } else {
          const { data: newChat, error: cError } = await supabase().from('chats').insert({ is_group: false }).select().single();
          if (cError) {
             console.error('Error creating chat:', cError);
          } else if (newChat) {
            const { error: p2Error } = await supabase().from('chat_participants').insert([
              { chat_id: newChat.id, user_id: currentUser.id },
              { chat_id: newChat.id, user_id: selectedUser.id }
            ]);
            if (p2Error) console.error('Error creating participants:', p2Error);
            setChatId(newChat.id);
          }
        }
      } catch (err) {
        console.error('Unexpected error in initChat:', err);
      } finally {
        setLoading(false);
      }
    };
    initChat();
  }, [selectedUser, currentUser]);

  useEffect(() => {
    if (chatId === null) return;

    // Fetch historical messages from Supabase
    const fetchMessages = async () => {
      try {
        const { data, error } = await supabase()
          .from('messages')
          .select('*')
          .eq('chat_id', chatId)
          .order('created_at', { ascending: true });
        
        if (error) {
          console.error('Error fetching messages:', error);
        } else if (data) {
          setMessages(data);
        }
      } catch (e) {
        console.error('Unexpected error fetching messages:', e);
      }
    };
    fetchMessages();
  }, [chatId]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const bgClass = darkMode ? 'bg-zinc-950' : 'bg-white';
  const borderClass = darkMode ? 'border-zinc-800' : 'border-zinc-200';
  const textClass = darkMode ? 'text-zinc-50' : 'text-zinc-900';
  
  if (loading) return <ChatSkeleton />;
  if (chatId === null) return <div className="flex-1 flex items-center justify-center text-zinc-500">Could not initialize chat.</div>;

  return (
    <ChannelProvider channelName={`chat-${chatId}`}>
      <ChatContent key={chatId} chatId={chatId} messages={messages} setMessages={setMessages} selectedUser={selectedUser} currentUser={currentUser} darkMode={darkMode} messagesEndRef={messagesEndRef} bgClass={bgClass} borderClass={borderClass} textClass={textClass} />
    </ChannelProvider>
  );
}

function ChatContent({ chatId, messages, setMessages, selectedUser, currentUser, darkMode, messagesEndRef, bgClass, borderClass, textClass }: any) {
  const [newMessage, setNewMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { channel } = useChannel(`chat-${chatId}`, (message) => {
     if (message.data.chat_id === chatId) {
        setMessages((prev: any) => [...prev, message.data]);
     }
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
      const { data, error } = await supabase().storage
        .from('chat-files')
        .upload(fileName, file);

      if (error) {
        alert('Error uploading file: ' + error.message);
        return;
      }
      
      const { data: publicUrlData } = supabase().storage.from('chat-files').getPublicUrl(fileName);
      
      // Save to Supabase (Persistence)
      const { data: newMsg, error: msgError } = await supabase().from('messages').insert({
        chat_id: chatId,
        sender_id: currentUser.id,
        content: `[FILE]: ${publicUrlData.publicUrl}`,
      }).select().single();

      if (msgError) {
        alert('Failed to send file message: ' + msgError.message);
        return;
      }
      
      // Publish to Ably (Real-time)
      await channel.publish('new-message', newMsg);
  };

  const onEmojiClick = (emojiData: any) => {
      setNewMessage(prev => prev + emojiData.emoji);
      setShowEmojiPicker(false);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || chatId === null) return;
    
    const msgToSend = newMessage;
    setNewMessage(''); // Optimistic update

    // Save to Supabase (Persistence)
    const { data: newMsg, error } = await supabase().from('messages').insert({
        chat_id: chatId,
        sender_id: currentUser.id,
        content: msgToSend,
    }).select().single();

    if (error) {
        console.error('Error saving message to database:', error);
        alert('Failed to send message: ' + error.message);
        setNewMessage(msgToSend); // Revert
        return;
    }

    // Publish to Ably (Real-time)
    await channel.publish('new-message', newMsg);
  };

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
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg: any) => (
          <div key={msg.id} className={`flex ${msg.sender_id === currentUser.id ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[60%] p-4 rounded-3xl text-sm ${msg.sender_id === currentUser.id ? msgOwnClass : msgOtherClass}`}>
              {msg.content}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className={`p-4 border-t ${borderClass} ${bgClass}`}>
        {showEmojiPicker && (
            <div className="absolute bottom-20 z-10">
                <EmojiPicker onEmojiClick={onEmojiClick} />
            </div>
        )}
        <div className="relative flex items-center gap-2">
            <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="text-zinc-500 hover:text-zinc-200"><Smile /></button>
            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
            <button onClick={() => fileInputRef.current?.click()} className="text-zinc-500 hover:text-zinc-200"><ImageIcon /></button>
            <input 
              value={newMessage} 
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  sendMessage();
                }
              }}
              className={`flex-1 ${inputBgClass} border ${borderClass} rounded-full px-5 py-3 text-sm outline-none focus:ring-1 focus:ring-blue-500`}
              placeholder="Message..."
            />
            <button onClick={sendMessage} className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"><Send size={18} /></button>
        </div>
      </div>
    </div>
  );
}
