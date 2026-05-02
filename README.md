Zozo: The Community Hub
Welcome to Zozo, a real-time community chat platform designed to bring people together in a shared space. Zozo focuses on simplicity, user identity, and instant, communal interaction.

🚀 Overview
Zozo is a web-based community chat application where every registered user contributes to a single, vibrant conversation feed. By requiring users to establish a profile, we ensure that every voice in the community is identifiable and authentic.

✨ Key Features
Profile-First Access: Users create a unique identity (Username, Avatar, Bio) before joining the community.

Global Community Feed: A unified chat stream where all registered members interact in real-time.

Persistent Identity: Every message is anchored to a user's profile, fostering meaningful community connections.

Live Updates: Built with high-performance real-time technology to ensure messages appear instantly for all users.

🛠 Tech Stack
Frontend: Built with React/Next.js for a responsive, modern interface.

Database & Backend: Powered by Supabase for secure user authentication and lightning-fast real-time database capabilities.

Real-time Engine: Utilizing WebSockets via Supabase to keep the chat active and synchronized.

📋 Getting Started
Prerequisites
A Supabase account.

A configured messages table and profiles table in your database.

Setup
Clone the repository:

Bash
git clone https://github.com/your-repo/zozo
Install dependencies:

Bash
npm install
Configure Environment Variables:
Create a .env.local file and add your Supabase project credentials:

Code snippet
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
Run the development server:

Bash
npm run dev
🤝 Community Guidelines
Be respectful and kind to all members.

Keep the conversation productive and community-focused.

Help us grow by reporting any bugs or issues you encounter.

🛠 Troubleshooting
If you encounter a not-null constraint error when sending messages, ensure that your sendMessage function is correctly passing the chat_id associated with your primary community room.
