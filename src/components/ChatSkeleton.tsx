export default function ChatSkeleton() {
  return (
    <div className="flex-1 p-6 space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex gap-4 animate-pulse">
          <div className="w-10 h-10 rounded-full bg-zinc-800" />
          <div className="space-y-2">
            <div className="h-4 w-48 bg-zinc-800 rounded" />
            <div className="h-4 w-32 bg-zinc-800 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
