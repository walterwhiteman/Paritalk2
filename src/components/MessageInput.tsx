// src/components/MessageInput.tsx
import React, { useState, useRef } from 'react';
import { Send, Paperclip, Image, Smile } from 'lucide-react';

interface MessageInputProps {
  onSendMessage: (text: string) => void;
  onSendFile: (file: File) => void;
  onTyping: (isTyping: boolean) => void;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  onSendFile,
  onTyping
}) => {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage(message.trim());
      setMessage('');
      handleTypingEnd();
    }
  };

  const handleTypingStart = () => {
    if (!isTyping) {
      setIsTyping(true);
      onTyping(true);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      handleTypingEnd();
    }, 1000);
  };

  const handleTypingEnd = () => {
    setIsTyping(false);
    onTyping(false);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
    handleTypingStart();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onSendFile(file);
    }
  };

  return (
    <div
      className="
        fixed bottom-0 left-0 right-0 z-20 // This is correct: Fixed positioning and high z-index
        bg-white border-t border-gray-200 px-6 py-4 shadow-lg // Added shadow for better visual separation
        // If you had transform: 'translate3d(0,0,0)' here as a style prop, you can add it to the class string
        // For example: transform translate-z-0 (if you have tailwind transforms enabled) or just keep it as a style prop
      "
    >
      <form onSubmit={handleSubmit} className="flex items-center space-x-3">
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors duration-200"
            title="Attach file"
          >
            <Paperclip className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors duration-200"
            title="Send image"
          >
            <Image className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 relative">
          <input
            type="text"
            value={message}
            onChange={handleInputChange}
            placeholder="Type a message..."
            className="w-full px-4 py-2 bg-gray-50 rounded-2xl border-0 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all duration-200"
          />
        </div>

        <button
          type="submit"
          disabled={!message.trim()}
          className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileSelect}
        accept="*/*"
      />

      <input
        ref={imageInputRef}
        type="file"
        className="hidden"
        onChange={handleFileSelect}
        accept="image/*"
      />
    </div>
  );
};