// src/components/ChatHeader.tsx
import React from 'react';
import { Video, LogOut, Users } from 'lucide-react';

interface ChatHeaderProps {
  roomCode: string;
  username: string;
  isPartnerOnline: boolean;
  onVideoCall: () => void;
  onLeaveRoom: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  roomCode,
  username,
  isPartnerOnline,
  onVideoCall,
  onLeaveRoom
}) => {
  return (
    <header
      className="
        fixed top-0 left-0 right-0 z-20 // This is correct: Fixed positioning and high z-index
        bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm
        // If you had transform: 'translate3d(0,0,0)' here as a style prop, you can add it to the class string
        // For example: transform translate-z-0 (if you have tailwind transforms enabled) or just keep it as a style prop
      "
    >
      <div className="flex items-center space-x-4">
        <div className="bg-blue-100 w-10 h-10 rounded-full flex items-center justify-center">
          <Users className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h1 className="font-semibold text-gray-900">Room: {roomCode}</h1>
          <p className="text-sm text-gray-500">
            {isPartnerOnline ? 'Partner is online' : 'Partner is offline'}
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        <button
          onClick={onVideoCall}
          className="p-2 bg-green-100 text-green-600 rounded-xl hover:bg-green-200 transition-colors duration-200"
          title="Start video call"
        >
          <Video className="w-5 h-5" />
        </button>

        <button
          onClick={onLeaveRoom}
          className="p-2 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 transition-colors duration-200"
          title="Leave room"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};