import { useState, useEffect, useRef } from 'react';
import { ref, push, onValue, off, remove, set } from 'firebase/database';
import { database } from '../config/firebase';

interface CallSignal {
  type: 'call-request' | 'call-accepted' | 'call-rejected' | 'call-ended';
  caller: string;
  target: string;
  timestamp: number;
  callId: string;
}

interface IncomingCall {
  caller: string;
  callId: string;
  timestamp: number;
}

export const useVideoCallSignaling = (
  roomCode: string, 
  username: string,
  onCallAccepted: (accepted: boolean) => void
) => {
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);
  const currentCallIdRef = useRef<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!roomCode || !username) return;

    const callSignalsRef = ref(database, `call-signals/${roomCode}`);
    
    const handleCallSignals = (snapshot: any) => {
      const data = snapshot.val();
      if (data) {
        Object.entries(data).forEach(([key, signal]: [string, any]) => {
          const callSignal = signal as CallSignal;
          
          // Only process signals meant for this user
          if (callSignal.target === username) {
            handleIncomingSignal(callSignal, key);
          }
          
          // Clean up old signals (older than 1 minute)
          if (Date.now() - callSignal.timestamp > 60000) {
            remove(ref(database, `call-signals/${roomCode}/${key}`));
          }
        });
      }
    };

    onValue(callSignalsRef, handleCallSignals);
    
    return () => {
      off(callSignalsRef, 'value', handleCallSignals);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [roomCode, username]);

  const handleIncomingSignal = (signal: CallSignal, signalKey: string) => {
    switch (signal.type) {
      case 'call-request':
        // Show incoming call modal
        setIncomingCall({
          caller: signal.caller,
          callId: signal.callId,
          timestamp: signal.timestamp
        });
        
        // Auto-reject after 30 seconds if no response
        timeoutRef.current = setTimeout(() => {
          rejectCall();
        }, 30000);
        
        // Remove the processed signal
        remove(ref(database, `call-signals/${roomCode}/${signalKey}`));
        break;

      case 'call-accepted':
        if (signal.callId === currentCallIdRef.current) {
          setIsWaitingForResponse(false);
          onCallAccepted(true);
          // Remove the processed signal
          remove(ref(database, `call-signals/${roomCode}/${signalKey}`));
        }
        break;

      case 'call-rejected':
        if (signal.callId === currentCallIdRef.current) {
          setIsWaitingForResponse(false);
          currentCallIdRef.current = null;
          // Remove the processed signal
          remove(ref(database, `call-signals/${roomCode}/${signalKey}`));
        }
        break;

      case 'call-ended':
        if (signal.callId === currentCallIdRef.current) {
          setIsWaitingForResponse(false);
          setIncomingCall(null);
          currentCallIdRef.current = null;
          // Remove the processed signal
          remove(ref(database, `call-signals/${roomCode}/${signalKey}`));
        }
        break;
    }
  };

  const sendCallSignal = (signal: Omit<CallSignal, 'timestamp'>) => {
    const callSignalsRef = ref(database, `call-signals/${roomCode}`);
    push(callSignalsRef, {
      ...signal,
      timestamp: Date.now()
    });
  };

  const getPartnerUsername = () => {
    // In a real app, you'd get this from the users list
    // For now, we'll assume it's the other person in the room
    return username === 'Yash' ? 'Pari' : username === 'Pari' ? 'Yash' : 'Partner';
  };

  const initiateCall = async () => {
    const callId = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    currentCallIdRef.current = callId;
    setIsWaitingForResponse(true);

    sendCallSignal({
      type: 'call-request',
      caller: username,
      target: getPartnerUsername(),
      callId
    });

    // Auto-cancel call after 30 seconds if no response
    timeoutRef.current = setTimeout(() => {
      if (isWaitingForResponse) {
        setIsWaitingForResponse(false);
        currentCallIdRef.current = null;
      }
    }, 30000);
  };

  const acceptCall = () => {
    if (incomingCall) {
      sendCallSignal({
        type: 'call-accepted',
        caller: username,
        target: incomingCall.caller,
        callId: incomingCall.callId
      });
      
      setIncomingCall(null);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    }
  };

  const rejectCall = () => {
    if (incomingCall) {
      sendCallSignal({
        type: 'call-rejected',
        caller: username,
        target: incomingCall.caller,
        callId: incomingCall.callId
      });
      
      setIncomingCall(null);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    }
  };

  const endCall = () => {
    if (currentCallIdRef.current) {
      sendCallSignal({
        type: 'call-ended',
        caller: username,
        target: getPartnerUsername(),
        callId: currentCallIdRef.current
      });
      
      currentCallIdRef.current = null;
      setIsWaitingForResponse(false);
    }
  };

  return {
    incomingCall,
    isWaitingForResponse,
    initiateCall,
    acceptCall,
    rejectCall,
    endCall
  };
};
