import React, { useEffect, useRef, useState } from 'react';
import Head from 'next/head';
import { io } from 'socket.io-client';
import { Mic, MicOff, SkipForward, LogOut } from 'lucide-react';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

export default function Chat() {
  const [socket, setSocket] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const pcRef = useRef();

  useEffect(() => {
    // 1. Initialize socket
    const s = io(SOCKET_URL);
    setSocket(s);

    // 2. Initialize media stream
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        setLocalStream(stream);
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      })
      .catch(err => console.error("Media Error:", err));

    return () => {
      s.disconnect();
      if (localStream) localStream.getTracks().forEach(t => t.stop());
    };
  }, []);

  useEffect(() => {
    if (!socket || !localStream) return;

    socket.on('match-found', async ({ peerId, initiator }) => {
      console.log('Match Found!', peerId);
      setIsSearching(false);
      createPC(peerId, initiator);
    });

    socket.on('offer', async ({ from, offer }) => {
      if (!pcRef.current) createPC(from, false);
      await pcRef.current.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pcRef.current.createAnswer();
      await pcRef.current.setLocalDescription(answer);
      socket.emit('answer', { to: from, answer });
    });

    socket.on('answer', async ({ answer }) => {
      await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
    });

    socket.on('ice-candidate', async ({ candidate }) => {
      try {
        if (pcRef.current) await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {}
    });

    socket.on('peer-disconnected', () => {
      nextChat();
    });

    // Auto start search
    nextChat();

    return () => {
      socket.off('match-found');
      socket.off('offer');
      socket.off('answer');
      socket.off('ice-candidate');
      socket.off('peer-disconnected');
    };
  }, [socket, localStream]);

  const createPC = (to, initiator) => {
    const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
    pcRef.current = pc;
    localStream.getTracks().forEach(t => pc.addTrack(t, localStream));

    pc.onicecandidate = (e) => e.candidate && socket.emit('ice-candidate', { to, candidate: e.candidate });
    pc.ontrack = (e) => {
      setRemoteStream(e.streams[0]);
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = e.streams[0];
    };

    if (initiator) {
      pc.onnegotiationneeded = async () => {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('offer', { to, offer });
      };
    }
  };

  const nextChat = () => {
    if (pcRef.current) { pcRef.current.close(); pcRef.current = null; }
    setRemoteStream(null);
    setIsSearching(true);
    socket.emit('join-queue');
  };

  const toggleMute = () => {
    localStream.getAudioTracks().forEach(t => t.enabled = !t.enabled);
    setIsMuted(!isMuted);
  };

  return (
    <div style={{ backgroundColor: '#050505', color: 'white', minHeight: '100vh', padding: '20px', fontFamily: 'sans-serif' }}>
      <Head><title>Live Chat</title></Head>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ color: '#3b82f6', margin: 0 }}>Jam Chat</h2>
        <button onClick={() => window.location.href = '/'} style={{ background: 'transparent', border: 'none', color: '#4b5563', cursor: 'pointer' }}><LogOut /></button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '20px' }}>
        {/* Remote Video Container */}
        <div style={{ backgroundColor: '#111827', borderRadius: '15px', overflow: 'hidden', height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          {isSearching ? <p style={{ color: '#4b5563', animate: 'pulse' }}>Finding match...</p> : 
           remoteStream ? <video ref={remoteVideoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : 
           <p style={{ color: '#1f2937' }}>Waiting...</p>}
          <span style={{ position: 'absolute', bottom: '10px', left: '10px', background: 'rgba(0,0,0,0.5)', padding: '4px 10px', fontSize: '12px', borderRadius: '5px' }}>Stranger</span>
        </div>

        {/* Local Video Container */}
        <div style={{ backgroundColor: '#111827', borderRadius: '15px', overflow: 'hidden', height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          <video ref={localVideoRef} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <span style={{ position: 'absolute', bottom: '10px', left: '10px', background: 'rgba(0,0,0,0.5)', padding: '4px 10px', fontSize: '12px', borderRadius: '5px' }}>You</span>
        </div>
      </div>

      {/* Control Bar */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', position: 'fixed', bottom: '40px', left: 0, right: 0 }}>
        <button onClick={toggleMute} style={{ padding: '15px', borderRadius: '50%', backgroundColor: isMuted ? '#ef4444' : '#1f2937', color: 'white', border: 'none', cursor: 'pointer' }}>
          {isMuted ? <MicOff /> : <Mic />}
        </button>
        <button onClick={nextChat} style={{ padding: '15px 40px', borderRadius: '15px', backgroundColor: 'white', color: 'black', fontWeight: 'bold', fontSize: '18px', border: 'none', cursor: 'pointer' }}>
          <SkipForward style={{ verticalAlign: 'middle', marginRight: '10px' }} /> NEXT
        </button>
      </div>
    </div>
  );
}
