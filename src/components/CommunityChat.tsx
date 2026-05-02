import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { ChannelProvider, useChannel } from 'ably/react';
import { Send, Image as ImageIcon, Smile, MessageSquareCode } from 'lucide-react';
import ChatSkeleton from './ChatSkeleton';
import EmojiPicker from 'emoji-picker-react';

export default function CommunityChat({ currentUser, darkMode }: { currentUser: any; darkMode: boolean }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const { data, error } = await supabase()
          .from('messages')
          .select('*')
          .order('created_at', { ascending: true });
        
        if (error) {
          console.error('Error fetching messages:', error);
        } else if (data) {
          setMessages(data);
        }
      } catch (e) {
        console.error('Unexpected error fetching messages:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchMessages();
  }, []);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  if (loading) return <ChatSkeleton />;

  return (
    <div className={`flex flex-col h-full bg-white dark:bg-zinc-950`}>
      <ChannelProvider channelName="crazy-souls">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 font-bold text-lg dark:text-zinc-50">
          Crazy Souls
        </div>
        <ChatContent 
          messages={messages} 
          setMessages={setMessages} 
          currentUser={currentUser} 
          darkMode={darkMode} 
          messagesEndRef={messagesEndRef} 
        />
      </ChannelProvider>
    </div>
  );
}

function ChatContent({ messages, setMessages, currentUser, darkMode, messagesEndRef }: any) {
  const [newMessage, setNewMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { channel } = useChannel('crazy-souls', (message) => {
     setMessages((prev: any) => {
        if (prev.some((m: any) => String(m.id) === String(message.data.id))) return prev;
        return [...prev, message.data];
     });
  });

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    
    const msgToSend = newMessage;
    setNewMessage('');

    const { data: newMsg, error } = await supabase().from('messages').insert({
        sender_id: currentUser.id,
        content: msgToSend,
    }).select().single();

    if (error) {
        console.error('Error saving message:', error);
        return;
    }

    await channel.publish('new-message', newMsg);
  };

  return (
    <>
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {messages.map((msg: any) => (
          <div key={msg.id} className={`flex ${msg.sender_id === currentUser.id ? 'justify-end' : 'justify-start'}`}>
            <div className={`p-3 rounded-2xl max-w-[70%] ${msg.sender_id === currentUser.id ? 'bg-blue-600 text-white' : 'bg-zinc-100 dark:bg-zinc-800'}`}>
                {msg.content}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-2">
            <input 
              value={newMessage} 
              onChange={(e) => setNewMessage(e.target.value)}
              className="flex-1 p-2 rounded-lg bg-zinc-100 dark:bg-zinc-900"
              placeholder="Type a message..."
            />
            <button onClick={sendMessage} className="p-2 bg-blue-600 text-white rounded-lg">
              <Send size={18} />
            </button>
        </div>
      </div>
    </>
  );
}
