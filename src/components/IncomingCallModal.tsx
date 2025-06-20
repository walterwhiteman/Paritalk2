import React from 'react';
import { Phone, PhoneOff, User } from 'lucide-react';

interface IncomingCallModalProps {
  callerName: string;
  onAccept: () => void;
  onReject: () => void;
  isDarkMode?: boolean;
}

export const IncomingCallModal: React.FC<IncomingCallModalProps> = ({
  callerName,
  onAccept,
  onReject,
  isDarkMode = false
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className={`rounded-3xl shadow-2xl p-8 w-full max-w-sm mx-4 transform transition-all duration-300 scale-100 ${
        isDarkMode ? 'bg-gray-800' : 'bg-white'
      }`}>
        <div className="text-center">
          {/* Caller Avatar */}
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
            isDarkMode ? 'bg-blue-900' : 'bg-blue-100'
          }`}>
            <User className={`w-10 h-10 ${
              isDarkMode ? 'text-blue-400' : 'text-blue-600'
            }`} />
          </div>
          
          {/* Caller Info */}
          <h2 className={`text-2xl font-bold mb-2 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            {callerName}
          </h2>
          <p className={`text-lg mb-8 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Incoming video call...
          </p>
          
          {/* Call Actions */}
          <div className="flex items-center justify-center space-x-8">
            {/* Reject Button */}
            <button
              onClick={onReject}
              className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transform transition-all duration-200 hover:scale-110 active:scale-95 shadow-lg"
            >
              <PhoneOff className="w-8 h-8 text-white" />
            </button>
            
            {/* Accept Button */}
            <button
              onClick={onAccept}
              className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center hover:bg-green-600 transform transition-all duration-200 hover:scale-110 active:scale-95 shadow-lg animate-pulse"
            >
              <Phone className="w-8 h-8 text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
