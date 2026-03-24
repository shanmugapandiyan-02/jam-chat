import React, { useEffect, useRef, useState } from 'react';
import Head from 'next/head';
import { io } from 'socket.io-client';
import { Mic, MicOff, Video, VideoOff, SkipForward, Users, LogOut } from 'lucide-react';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

export default function Chat() {
  const [socket, setSocket] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [peerId, setPeerId] = useState(null);

  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const pcRef = useRef();

  useEffect(() => {
    // Initialize socket
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    // Initialize camera and mic
    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(stream);
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      } catch (err) {
        console.error("Error accessing media devices", err);
        alert("Please enable camera and microphone access to chat.");
      }
    };

    initCamera();

    return () => {
      newSocket.disconnect();
      if (localStream) localStream.getTracks().forEach(track => track.stop());
    };
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on('match-found', async ({ peerId, initiator }) => {
      console.log('Match found with:', peerId, 'Initiator:', initiator);
      setPeerId(peerId);
      setIsSearching(false);
      createPeerConnection(peerId, initiator);
    });

    socket.on('offer', async ({ from, offer }) => {
      console.log('Received offer from:', from);
      if (!pcRef.current) createPeerConnection(from, false);
      await pcRef.current.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pcRef.current.createAnswer();
      await pcRef.current.setLocalDescription(answer);
      socket.emit('answer', { to: from, answer });
    });

    socket.on('answer', async ({ from, answer }) => {
      console.log('Received answer from:', from);
      await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
    });

    socket.on('ice-candidate', async ({ from, candidate }) => {
      console.log('Received ICE candidate from:', from);
      try {
        if (pcRef.current) await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        console.error('Error adding received ice candidate', e);
      }
    });

    socket.on('peer-disconnected', () => {
      console.log('Peer disconnected');
      resetChat();
      nextChat();
    });

    // Auto-start search once connected
    socket.on('connect', () => {
      nextChat();
    });

    return () => {
      socket.off('match-found');
      socket.off('offer');
      socket.off('answer');
      socket.off('ice-candidate');
      socket.off('peer-disconnected');
    };
  }, [socket, localStream]);

  const createPeerConnection = (to, initiator) => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    pcRef.current = pc;

    // Add local tracks to peer connection
    if (localStream) {
      localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
    }

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ice-candidate', { to, candidate: event.candidate });
      }
    };

    pc.ontrack = (event) => {
      console.log('Received remote track');
      setRemoteStream(event.streams[0]);
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = event.streams[0];
    };

    if (initiator) {
      pc.onnegotiationneeded = async () => {
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit('offer', { to, offer });
        } catch (err) {
          console.error('Error during negotiation', err);
        }
      };
    }
  };

  const nextChat = () => {
    resetChat();
    setIsSearching(true);
    socket.emit('join-queue');
  };

  const resetChat = () => {
    if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
    }
    setRemoteStream(null);
    setPeerId(null);
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
  };

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => track.enabled = !track.enabled);
      setIsMuted(!isMuted);
    }
  };

  const toggleCamera = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => track.enabled = !track.enabled);
      setIsCameraOff(!isCameraOff);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col p-4 md:p-8 space-y-6 overflow-hidden">
      <Head>
        <title>Live Chat | Jam Chat</title>
      </Head>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2 text-blue-500">
           Jam Chat
        </h1>
        <div className="flex items-center gap-4">
             <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-slate-800/50 rounded-full border border-slate-700">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs uppercase font-bold text-slate-400">Live</span>
             </div>
             <button onClick={() => window.location.href = "/"} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 transition-all">
               <LogOut />
             </button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 relative">
        {/* Remote Video */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden relative shadow-2xl flex items-center justify-center">
          {isSearching ? (
            <div className="flex flex-col items-center space-y-4">
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-slate-500 text-lg font-medium animate-pulse">Finding someone to talk to...</p>
            </div>
          ) : remoteStream ? (
            <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
          ) : (
            <div className="text-slate-600 text-center space-y-2">
                 <Users className="w-16 h-16 mx-auto opacity-20" />
                 <p>Starting chat...</p>
            </div>
          )}
          
          <div className="absolute bottom-6 left-6 px-4 py-2 bg-black/60 backdrop-blur-md rounded-xl text-xs font-bold uppercase tracking-widest border border-white/5">
            Stranger
          </div>
        </div>

        {/* Local Video */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden relative shadow-2xl flex items-center justify-center">
          <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover grayscale-[0.1]" />
          {isCameraOff && (
            <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center space-y-4">
               <VideoOff className="w-12 h-12 text-slate-700" />
               <p className="text-slate-600 font-bold uppercase tracking-widest text-sm">Camera Off</p>
            </div>
          )}
          <div className="absolute bottom-6 left-6 px-4 py-2 bg-black/60 backdrop-blur-md rounded-xl text-xs font-bold uppercase tracking-widest border border-white/5">
            You
          </div>
        </div>
      </div>

      {/* Global Controls Overlay */}
      <div className="flex items-center justify-center py-6">
        <div className="bg-slate-900/90 backdrop-blur-3xl border border-slate-700/50 p-6 rounded-[3rem] shadow-2xl flex items-center gap-6">
            <button onClick={toggleMute} className={`p-4 rounded-3xl transition-all ${isMuted ? 'bg-red-500/20 text-red-500 border border-red-500/50' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>
                {isMuted ? <MicOff className="w-7 h-7" /> : <Mic className="w-7 h-7" />}
            </button>
            <button onClick={toggleCamera} className={`p-4 rounded-3xl transition-all ${isCameraOff ? 'bg-red-500/20 text-red-500 border border-red-500/50' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>
                {isCameraOff ? <VideoOff className="w-7 h-7" /> : <Video className="w-7 h-7" />}
            </button>
            <div className="w-px h-10 bg-slate-700 shadow-inner" />
            <button onClick={nextChat} className="bg-white text-black font-extrabold px-12 py-5 rounded-3xl flex items-center gap-3 hover:bg-blue-100 transition-all hover:scale-105 active:scale-95 shadow-xl group">
                <SkipForward className="w-6 h-6 fill-black" />
                <span className="text-xl">NEXT</span>
            </button>
        </div>
      </div>

      <style jsx global>{`
        body {
          margin: 0;
          font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif;
        }
      `}</style>
    </div>
  );
}
