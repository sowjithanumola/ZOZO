interface MessageBubbleProps {
  content: string;
  isOwnMessage: boolean;
  timestamp: string;
}

export default function MessageBubble({ content, isOwnMessage, timestamp }: MessageBubbleProps) {
  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`p-3 rounded-lg max-w-xs ${isOwnMessage ? 'bg-blue-500 text-white' : 'bg-white border'}`}>
        <p>{content}</p>
        <span className="text-xs opacity-75">{timestamp}</span>
      </div>
    </div>
  );
}
