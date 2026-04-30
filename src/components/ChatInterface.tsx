import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { ChannelProvider, useChannel } from 'ably/react';
import { Send, Image as ImageIcon, Smile, MessageSquareCode } from 'lucide-react';
import ChatSkeleton from './ChatSkeleton';
import EmojiPicker from 'emoji-picker-react';

export default function ChatInterface({ selectedUser, currentUser, darkMode }: { selectedUser: any; currentUser: any; darkMode: boolean }) {
  const [chatId, setChatId] = useState<number | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;
    const initChat = async () => {
      if (!selectedUser?.id || !currentUser?.id) {
        if (isMounted) setLoading(false);
        return;
      }
      if (isMounted) {
        setLoading(true);
        setMessages([]);
        setChatId(null);
      }
      try {
        // Find private chats (is_group = false) where BOTH users are participants
        const { data: commonChats, error: cError } = await supabase()
          .from('chat_participants')
          .select(`
            chat_id,
            user_id,
            chats!inner(is_group)
          `)
          .eq('chats.is_group', false); // Get all private chats

        if (cError) throw cError;

        // Group chats by ID and find one that contains both users
        const chatParticipants: Record<number, Set<string>> = {};
        commonChats?.forEach(p => {
          if (!chatParticipants[p.chat_id]) chatParticipants[p.chat_id] = new Set();
          chatParticipants[p.chat_id].add(p.user_id);
        });

        // Find a chat where both currentUser and selectedUser are present
        const existingChatId = Object.keys(chatParticipants).find(id => 
          chatParticipants[Number(id)].has(currentUser.id) && 
          chatParticipants[Number(id)].has(selectedUser.id)
        );
        
        if (!isMounted) return;

        if (existingChatId) {
          const cid = Number(existingChatId);
          // Verify this chat ONLY has these 2 people to be super safe
          const { count, error: countErr } = await supabase()
            .from('chat_participants')
            .select('*', { count: 'exact', head: true })
            .eq('chat_id', cid);
          
          if (!countErr && count === 2) {
             setChatId(cid);
          } else {
             // If the found chat has more than 2 people, it's not a private chat, so we create one
             await createNewPrivateChat();
          }
        } else {
          await createNewPrivateChat();
        }
      } catch (err) {
        console.error('Unexpected error in initChat:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    const createNewPrivateChat = async () => {
      const { data: newChat, error: c2Error } = await supabase().from('chats').insert({ is_group: false }).select().single();
      if (c2Error) throw c2Error;
      if (newChat) {
        const { error: p2Error } = await supabase().from('chat_participants').insert([
          { chat_id: newChat.id, user_id: currentUser.id },
          { chat_id: newChat.id, user_id: selectedUser.id }
        ]);
        if (p2Error) throw p2Error;
        if (isMounted) setChatId(newChat.id);
      }
    };

    initChat();
    return () => { isMounted = false; };
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
  if (chatId === null) return <div className="flex-1 flex items-center justify-center text-zinc-500">Select a user to start chatting.</div>;

  return (
    <div className={`flex flex-col h-full ${bgClass} ${textClass}`}>
      <ChannelProvider channelName={`chat-v10-${chatId}`}>
        <ChatContent 
          key={chatId} 
          chatId={chatId} 
          messages={messages} 
          setMessages={setMessages} 
          selectedUser={selectedUser} 
          currentUser={currentUser} 
          darkMode={darkMode} 
          messagesEndRef={messagesEndRef} 
          borderClass={borderClass} 
          bgClass={bgClass}
          textClass={textClass}
          loading={loading}
        />
      </ChannelProvider>
    </div>
  );
}

// Ably Message Isolation Fix: Using ChannelProvider with unique chatId and strict filtering
function ChatContent({ chatId, messages, setMessages, selectedUser, currentUser, darkMode, messagesEndRef, borderClass, bgClass, textClass, loading }: any) {
  const [newMessage, setNewMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Subscription to a unique channel for THIS specific chat ID
  // This ensures that even if user names or IDs are somehow ambiguous, the DB chat ID separates them
  const { channel } = useChannel(`chat-v10-${chatId}`, (message) => {
     console.log(`[Chat-${chatId}] Real-time message received:`, message.data);
     
     // CRITICAL: Prevent processing messages from a different chat or deleted ones
     if (!message.data || String(message.data.chat_id) !== String(chatId)) {
        console.warn(`[Chat-${chatId}] Message discarded - wrong chat_id:`, message.data?.chat_id);
        return;
     }

     setMessages((prev: any) => {
        // Prevent duplicate messages (very common in real-time)
        if (prev.some((m: any) => String(m.id) === String(message.data.id))) return prev;
        return [...prev, message.data];
     });
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

  const msgOwnClass = 'bg-blue-500 text-white rounded-2xl rounded-tr-none shadow-sm';
  const msgOtherClass = darkMode ? 'bg-zinc-800 text-zinc-100 rounded-2xl rounded-tl-none shadow-sm' : 'bg-white text-zinc-900 border border-zinc-200 rounded-2xl rounded-tl-none shadow-sm';
  const inputBgClass = darkMode ? 'bg-zinc-900' : 'bg-white';

  return (
    <div className={`flex flex-col h-full ${bgClass} ${textClass} relative overflow-hidden shadow-2xl`}>
      {/* Header */}
      <div className={`p-4 border-b ${borderClass} flex items-center justify-between bg-opacity-90 backdrop-blur-md sticky top-0 z-10`}>
        <div className="flex items-center gap-3">
          <div className="relative">
            <img 
              src={selectedUser.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedUser.name || 'A')}&background=random`} 
              alt={selectedUser.name} 
              className="w-10 h-10 rounded-full object-cover border-2 border-blue-500"
            />
          </div>
          <div>
            <div className="font-bold text-sm tracking-tight">{selectedUser.name}</div>
          </div>
        </div>
        <div className="flex items-center gap-4 text-zinc-400">
           {/* Add dummy icons for completeness */}
           <div className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer">
             <span className="text-lg">⋮</span>
           </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-opacity-50" style={{ backgroundImage: darkMode ? 'radial-gradient(circle at 2px 2px, #18181b 1px, transparent 0)' : 'radial-gradient(circle at 2px 2px, #f4f4f5 1px, transparent 0)', backgroundSize: '24px 24px' }}>
        {messages.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-full opacity-20 transform scale-90">
             <MessageSquareCode size={80} />
             <p className="mt-4 font-medium text-lg">No messages yet</p>
          </div>
        )}
        {messages.map((msg: any, idx: number) => {
          const isOwn = msg.sender_id === currentUser.id;
          const showTime = idx === 0 || new Date(msg.created_at).getTime() - new Date(messages[idx-1].created_at).getTime() > 300000;
          
          return (
            <div key={msg.id} className="space-y-1">
              {showTime && (
                <div className="flex justify-center my-4">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-3 py-1 bg-zinc-100 dark:bg-zinc-900 rounded-full border border-zinc-200 dark:border-zinc-800">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              )}
              <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300 px-1`}>
                <div className="flex flex-col gap-1 max-w-[85%] md:max-w-[70%] lg:max-w-[60%]">
                    <div className={`p-3 md:p-4 text-[15px] leading-relaxed relative ${isOwn ? msgOwnClass : msgOtherClass}`}>
                      {msg.content.startsWith('[FILE]: ') ? (
                        <div className="rounded-lg overflow-hidden">
                          <img 
                            src={msg.content.replace('[FILE]: ', '')} 
                            alt="Sent" 
                            className="max-w-full h-auto rounded-md shadow-sm cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => window.open(msg.content.replace('[FILE]: ', ''), '_blank')}
                          />
                        </div>
                      ) : (
                        <div className="break-words font-medium">{msg.content}</div>
                      )}
                      
                      {isOwn && (
                        <div className="flex justify-end mt-1">
                          <div className="text-[9px] opacity-70 font-bold uppercase tracking-tighter">Sent</div>
                        </div>
                      )}
                    </div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className={`p-4 border-t ${borderClass} ${bgClass} relative`}>
        {showEmojiPicker && (
            <div className="absolute bottom-full left-4 z-50 mb-2 shadow-2xl rounded-2xl overflow-hidden ring-1 ring-black/5 animate-in slide-in-from-bottom-5">
                <EmojiPicker 
                    onEmojiClick={onEmojiClick} 
                    theme={darkMode ? 'dark' : 'light' as any}
                    width={320}
                    height={400}
                />
            </div>
        )}
        <div className="max-w-4xl mx-auto flex items-end gap-2 bg-zinc-100 dark:bg-zinc-900/50 p-2 rounded-3xl border border-zinc-200 dark:border-zinc-800/50">
            <div className="flex gap-1 p-1">
                <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-2 text-zinc-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-all">
                  <Smile size={20} />
                </button>
                <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
                <button onClick={() => fileInputRef.current?.click()} className="p-2 text-zinc-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-all">
                  <ImageIcon size={20} />
                </button>
            </div>
            <textarea 
              rows={1}
              value={newMessage} 
              onChange={(e) => {
                setNewMessage(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = e.target.scrollHeight + 'px';
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              className={`flex-1 bg-transparent border-none py-3 text-sm outline-none resize-none max-h-32 px-2`}
              placeholder="Type a message..."
            />
            <button 
              onClick={sendMessage} 
              disabled={!newMessage.trim()}
              className={`p-3 rounded-2xl transition-all shadow-lg ${newMessage.trim() ? 'bg-blue-600 text-white hover:scale-105 active:scale-95 shadow-blue-500/20' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed'}`}
            >
              <Send size={18} />
            </button>
        </div>
      </div>
    </div>
  );
}
