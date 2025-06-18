import React, { useEffect, useRef } from 'react';
import { X, ExternalLink } from 'lucide-react';

interface VideoCallProps {
  roomCode: string;
  username: string;
  onClose: () => void;
}

export const VideoCall: React.FC<VideoCallProps> = ({ roomCode, username, onClose }) => {
  const jitsiRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<any>(null);

  useEffect(() => {
    // Check if JitsiMeetExternalAPI is available
    if (typeof window !== 'undefined' && (window as any).JitsiMeetExternalAPI && jitsiRef.current) {
      try {
        const domain = 'meet.jit.si';
        const options = {
          roomName: `paritalk-${roomCode}`,
          width: '100%',
          height: '100%',
          parentNode: jitsiRef.current,
          userInfo: {
            displayName: username
          },
          configOverwrite: {
            startWithAudioMuted: false,
            startWithVideoMuted: false,
            enableWelcomePage: false,
            prejoinPageEnabled: false,
            disableDeepLinking: true
          },
          interfaceConfigOverwrite: {
            SHOW_JITSI_WATERMARK: false,
            SHOW_WATERMARK_FOR_GUESTS: false,
            TOOLBAR_BUTTONS: [
              'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
              'fodeviceselection', 'hangup', 'profile', 'chat', 'recording',
              'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
              'videoquality', 'filmstrip', 'invite', 'feedback', 'stats', 'shortcuts',
              'tileview', 'videobackgroundblur', 'download', 'help', 'mute-everyone'
            ]
          }
        };

        apiRef.current = new (window as any).JitsiMeetExternalAPI(domain, options);

        apiRef.current.addEventListener('videoConferenceLeft', () => {
          onClose();
        });

        apiRef.current.addEventListener('readyToClose', () => {
          onClose();
        });

      } catch (error) {
        console.error('Failed to initialize Jitsi Meet:', error);
      }
    }

    return () => {
      if (apiRef.current) {
        try {
          apiRef.current.dispose();
        } catch (error) {
          console.error('Error disposing Jitsi API:', error);
        }
      }
    };
  }, [roomCode, username, onClose]);

  const openInNewTab = () => {
    const jitsiUrl = `https://meet.jit.si/paritalk-${roomCode}#userInfo.displayName="${encodeURIComponent(username)}"`;
    window.open(jitsiUrl, '_blank', 'noopener,noreferrer');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <div className="bg-white px-4 py-3 flex items-center justify-between shadow-lg">
        <h3 className="text-lg font-semibold text-gray-900">Video Call - {roomCode}</h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={openInNewTab}
            className="flex items-center space-x-2 px-3 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors duration-200"
            title="Open in new tab"
          >
            <ExternalLink className="w-4 h-4" />
            <span className="text-sm">Open in New Tab</span>
          </button>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      <div className="flex-1 flex items-center justify-center bg-gray-100">
        <div ref={jitsiRef} className="w-full h-full" />
        
        {/* Fallback content */}
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
          <div className="text-center p-8">
            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <ExternalLink className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Video Call Ready</h3>
            <p className="text-gray-600 mb-4">
              If the video call doesn't load automatically, click the button above to open it in a new tab.
            </p>
            <button
              onClick={openInNewTab}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors duration-200"
            >
              Join Video Call
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};