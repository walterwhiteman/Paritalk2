// src/App.tsx
import React, { useState, useEffect, useRef } from 'react';
import { LoginForm } from './components/LoginForm';
import { ChatHeader } from './components/ChatHeader';
import { MessageBubble } from './components/MessageBubble';
import { MessageInput } from './components/MessageInput';
import { TypingIndicator } from './components/TypingIndicator';
import { Toast } from './components/Toast';
import { VideoCall } from './components/VideoCall';
import { MediaPreviewModal } from './components/MediaPreviewModal'; 
import { useFirebaseChat } from './hooks/useFirebaseChat';
import { useSupabaseStorage } from './hooks/useSupabaseStorage';

interface AppState {
  isLoggedIn: boolean;
  username: string;
  roomCode: string;
  showVideoCall: boolean;
  toast: string | null;
}

function App() {
  const [state, setState] = useState<AppState>({
    isLoggedIn: false,
    username: '',
    roomCode: '',
    showVideoCall: false,
    toast: null
  });

  const [showMediaPreview, setShowMediaPreview] = useState<boolean>(false);
  const [previewMediaUrl, setPreviewMediaUrl] = useState<string | null>(null);
  const [previewMediaType, setPreviewMediaType] = useState<'image' | 'video' | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    users,
    isConnected,
    sendMessage,
    setTyping,
    getPartnerTypingStatus,
    getPartnerOnlineStatus
  } = useFirebaseChat(state.roomCode, state.username);

  const { uploadFile, uploading } = useSupabaseStorage();

  // Helper function for video detection by extension (added to App.tsx)
  const isVideoFileByExtension = (fileName: string) => {
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv']; // Added .mkv for common formats
    const lowerCaseFileName = fileName.toLowerCase();
    return videoExtensions.some(ext => lowerCaseFileName.endsWith(ext));
  };

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('SW registered: ', registration);
        })
        .catch(registrationError => {
          console.log('SW registration failed: ', registrationError);
        });
    }
  }, []);

  useEffect(() => {
    if (!state.isLoggedIn) return;

    const partnerUser = Object.values(users).find(user => user.username !== state.username);
    if (partnerUser && users[state.username]?.isOnline && !partnerUser.isOnline) {
      setState(prev => ({ ...prev, toast: `${partnerUser.username} is offline` }));
    } else if (partnerUser && partnerUser.isOnline && !users[state.username]?.isOnline) {
      setState(prev => ({ ...prev, toast: `${partnerUser.username} joined the chat` }));
    }
    if (state.toast) {
      const toastTimeout = setTimeout(() => {
        setState(prev => ({ ...prev, toast: null }));
      }, 3000);
      return () => clearTimeout(toastTimeout);
    }
  }, [users, state.username, state.isLoggedIn, state.toast]);


  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);


  const handleLogin = (username: string, roomCode: string) => {
    setState(prev => ({
      ...prev,
      isLoggedIn: true,
      username,
      roomCode
    }));
  };

  const handleLeaveRoom = () => {
    setState({
      isLoggedIn: false,
      username: '',
      roomCode: '',
      showVideoCall: false,
      toast: null
    });
    setShowMediaPreview(false);
    setPreviewMediaUrl(null);
    setPreviewMediaType(null);
  };

  const handleSendMessage = async (text: string) => {
    await sendMessage(text);
  };

  const handleSendFile = async (file: File) => {
    const fileUrl = await uploadFile(file);
    if (fileUrl) {
      const isImage = file.type.startsWith('image/');
      // IMPROVED: Check both MIME type AND file extension for more robust video detection
      const isVideo = file.type.startsWith('video/') || isVideoFileByExtension(file.name); 

      let messageType: 'text' | 'image' | 'file';
      let messageText = ''; // Initialize messageText to empty string

      if (isImage) {
        messageType = 'image';
        // messageText remains empty for images
      } else if (isVideo) {
        messageType = 'file'; // MessageBubble will interpret as video using its own checks
        // messageText remains empty for videos
      } else {
        messageType = 'file'; // Generic file
        messageText = `Shared file: ${file.name}`; // Only add text for generic files
      }

      await sendMessage(
        messageText, // This will now be an empty string for image/video messages
        messageType,
        fileUrl,
        file.name
      );
    } else {
      setState(prev => ({ ...prev, toast: 'Failed to upload file' }));
    }
  };

  const handleVideoCall = () => {
    setState(prev => ({ ...prev, showVideoCall: true }));
  };

  const handleCloseVideoCall = () => {
    setState(prev => ({ ...prev, showVideoCall: false }));
  };

  const handleTyping = async (isTyping: boolean) => {
    await setTyping(isTyping);
  };

  const handleMediaClick = (url: string, type: 'image' | 'video') => {
    setPreviewMediaUrl(url);
    setPreviewMediaType(type);
    setShowMediaPreview(true);
  };

  const handleCloseMediaPreview = () => {
    setShowMediaPreview(false);
    setPreviewMediaUrl(null);
    setPreviewMediaType(null);
  };

  const partnerTyping = getPartnerTypingStatus();
  const isPartnerOnline = getPartnerOnlineStatus();

  if (!state.isLoggedIn) {
    return <LoginForm onLogin={handleLogin} />;
  }

  return (
    <div className="relative min-h-svh bg-gray-50">
      <ChatHeader
        roomCode={state.roomCode}
        username={state.username}
        isPartnerOnline={isPartnerOnline}
        onVideoCall={handleVideoCall}
        onLeaveRoom={handleLeaveRoom}
      />

      <div
        className={`
          absolute top-[78px] bottom-[74px] left-0 right-0
          overflow-y-auto px-4 py-6 space-y-4
        `}
      >
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            isOwn={message.sender === state.username}
            onMediaClick={handleMediaClick}
          />
        ))}

        {partnerTyping && (
          <TypingIndicator username={partnerTyping.username} />
        )}

        <div ref={messagesEndRef} />
      </div>

      <MessageInput
        onSendMessage={handleSendMessage}
        onSendFile={handleSendFile}
        onTyping={handleTyping}
      />

      {state.showVideoCall && (
        <VideoCall
          roomCode={state.roomCode}
          username={state.username}
          onClose={handleCloseVideoCall}
        />
      )}

      {state.toast && (
        <Toast
          message={state.toast}
          onClose={() => setState(prev => ({ ...prev, toast: null }))}
        />
      )}

      <MediaPreviewModal
        isOpen={showMediaPreview}
        mediaUrl={previewMediaUrl}
        mediaType={previewMediaType}
        onClose={handleCloseMediaPreview}
      />
    </div>
  );
}

export default App;