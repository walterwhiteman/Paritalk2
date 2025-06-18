// src/components/MessageBubble.tsx
import React from 'react';
import { Download } from 'lucide-react';
import { Message } from '../types'; 

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  onMediaClick: (url: string, mediaType: 'image' | 'video') => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwn,
  onMediaClick,
}) => {
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const isVideoFile = (url: string) => {
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi'];
    const lowerCaseUrl = url.toLowerCase();
    return videoExtensions.some(ext => lowerCaseUrl.endsWith(ext));
  };

  // NEW: Determine max-width classes based on message type
  const bubbleMaxWidthClasses = 
    (message.type === 'image' || (message.type === 'file' && isVideoFile(message.fileUrl || '')))
      ? 'w-fit max-w-[15rem]' // Smaller fixed max-width for image/video (15rem = 240px)
      : 'w-fit max-w-xs sm:max-w-sm md:max-w-md'; // Original responsive max-widths for text/other files

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4 group`}>
      <div className={`relative ${isOwn ? 'order-2' : ''}`}> 
        <div
          className={`
            rounded-2xl px-4 py-4 shadow-sm // Padding is set to 1rem (py-4)
            ${isOwn ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'}
            ${bubbleMaxWidthClasses} // Dynamically apply max-width based on message type
          `}
        >
          {message.type === 'text' && (
            <p className="text-sm leading-relaxed">{message.text}</p>
          )}
          
          {message.type === 'image' && message.fileUrl && (
            <div className="flex flex-col items-center">
              <img
                src={message.fileUrl}
                alt="Shared image"
                className="
                  rounded-lg mb-2
                  max-w-[180px] max-h-[180px] object-cover
                  cursor-pointer
                "
                onClick={() => onMediaClick(message.fileUrl!, 'image')}
              />
              {message.text && message.text.trim() !== '' && ( 
                <p className="text-sm leading-relaxed text-center">{message.text}</p>
              )}
            </div>
          )}
          
          {message.type === 'file' && message.fileUrl && isVideoFile(message.fileUrl) ? (
            <div className="flex flex-col items-center">
              <video
                src={message.fileUrl}
                controls={false}
                preload="metadata"
                className="
                  rounded-lg mb-2
                  max-w-[180px] max-h-[180px] object-cover
                  cursor-pointer
                "
                onClick={() => onMediaClick(message.fileUrl!, 'video')}
              />
              {message.text && message.text.trim() !== '' && (
                <p className="text-sm leading-relaxed text-center">{message.text}</p>
              )}
            </div>
          ) : message.type === 'file' && message.fileUrl ? (
            <div className="flex items-center space-x-2">
              <Download className="w-4 h-4" />
              <a
                href={message.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm underline hover:no-underline"
              >
                {message.fileName || 'Shared File'}
              </a>
            </div>
          ) : null}
        </div>
        
        <div className="flex items-center mt-1 space-x-2">
          <span className={`text-xs ${isOwn ? 'text-gray-500' : 'text-gray-500'}`}>
            {formatTime(message.timestamp)}
          </span>
        </div>
        
      </div>
    </div>
  );
};