/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import * as Ably from 'ably';
import { AblyProvider } from 'ably/react';
import Login from './pages/Login';
import Chat from './pages/Chat';

const ablyApiKey = import.meta.env.VITE_ABLY_API_KEY;
console.log("DEBUG: Is VITE_ABLY_API_KEY found?", ablyApiKey ? "Yes, it is loaded" : "No, it is UNDEFINED");

const ablyClient = new Ably.Realtime({ 
  key: ablyApiKey 
});

export default function App() {
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
