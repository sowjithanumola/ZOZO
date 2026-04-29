/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import * as Ably from 'ably';
import { AblyProvider } from 'ably/react';
import Login from './pages/Login';
import Chat from './pages/Chat';

const apiKey = import.meta.env.VITE_ABLY_API_KEY;

// Only initialize if we have a key
const ablyClient = apiKey ? new Ably.Realtime({ key: apiKey }) : null;

export default function App() {
  if (!ablyClient) {
     return (
       <div className="flex h-screen items-center justify-center p-4">
         <p className="text-red-500">Configuration Error: VITE_ABLY_API_KEY is not defined.</p>
       </div>
     );
  }

  return (
    <AblyProvider client={ablyClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Chat />} />
        </Routes>
      </BrowserRouter>
    </AblyProvider>
  );
}
