"use client";

import React, { useEffect, useRef, useState } from "react";
import { useWebRTC } from "@/hooks/useWebRTC";
import { useChatStore } from "@/store/useChatStore";
import {
  Mic, MicOff, Video, VideoOff,
  SkipForward, LogOut, Send,
  Flag, ShieldAlert, Users,
  Play
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Home() {
  const { startChat, nextChat, sendMessage, initLocalStream } = useWebRTC();
  const {
    localStream, remoteStream, isSearching,
    isMuted, setIsMuted, isCameraOff, setIsCameraOff,
    messages, peerId
  } = useChatStore();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [inputText, setInputText] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initLocalStream();
  }, [initLocalStream]);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      console.log("Setting remote video source...");
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      sendMessage(inputText);
      setInputText("");
    }
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
    <main className="flex h-screen w-full bg-[#050505] overflow-hidden text-zinc-100 font-sans">
      {/* Sidebar - Video & Features */}
      <div className="flex-1 flex flex-col relative overflow-hidden">

        {/* Header */}
        <header className="absolute top-0 left-0 w-full z-50 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.4)]">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
              VibeConnect
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-zinc-900/50 backdrop-blur rounded-full border border-zinc-800/50">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
              <span className="text-xs font-medium text-zinc-400 uppercase tracking-widest">Online: 1,248</span>
            </div>
            <button className="p-2.5 rounded-full bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 transition-all">
              <ShieldAlert className="w-5 h-5 text-zinc-400" />
            </button>
          </div>
        </header>

        {/* Video Canvas */}
        <div className="flex-1 w-full flex flex-col md:flex-row p-4 gap-4 pb-28 md:pb-4 pt-20">
          {/* Main Remote Video */}
          <div className="flex-[3] relative bg-zinc-900/30 rounded-[2rem] border border-zinc-800/50 overflow-hidden shadow-2xl backdrop-blur-sm">
            <AnimatePresence mode="wait">
              {isSearching ? (
                <motion.div
                  key="searching"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex flex-col items-center justify-center gap-6"
                >
                  <div className="relative">
                    <div className="absolute inset-0 bg-blue-600/20 blur-[100px] animate-pulse rounded-full" />
                    <div className="w-32 h-32 border-4 border-t-blue-600 border-r-transparent border-b-zinc-800 border-l-transparent rounded-full animate-spin" />
                  </div>
                  <div className="text-center">
                    <h2 className="text-2xl font-semibold mb-2">Searching...</h2>
                    <p className="text-zinc-500 text-sm max-w-xs">Connecting you to someone awesome in the world.</p>
                  </div>
                </motion.div>
              ) : !peerId ? (
                <motion.div
                  key="idle"
                  className="absolute inset-0 flex flex-col items-center justify-center gap-6"
                >
                  <button
                    onClick={startChat}
                    className="group relative flex items-center gap-4 px-10 py-5 bg-blue-600 hover:bg-blue-500 rounded-2xl font-bold text-xl transition-all hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(37,99,235,0.3)]"
                  >
                    <Play className="fill-white" />
                    Start Chat
                  </button>
                  <p className="text-zinc-500 text-sm">Join the stream and make new friends instantly.</p>
                </motion.div>
              ) : (
                <motion.video
                  key="video"
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                  initial={{ scale: 1.1, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                />
              )}
            </AnimatePresence>

            {/* Legend / Overlay */}
            {!isSearching && peerId && (
              <div className="absolute bottom-6 left-6 flex items-center gap-3 p-3 bg-black/40 backdrop-blur-md rounded-2xl border border-white/10">
                <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium">Stranger Connected</span>
              </div>
            )}
          </div>

          {/* User Video (Side/Mobile Overlay) */}
          <div className="flex-1 md:max-w-[400px] h-full flex flex-col gap-4">
            {/* Text Chat */}
            <div className="flex-1 bg-zinc-900/30 rounded-[2rem] border border-zinc-800/50 flex flex-col overflow-hidden backdrop-blur-sm">
              <div className="p-4 border-b border-white/5 bg-white/5 flex items-center gap-3">
                <div className="w-8 h-8 bg-zinc-800 rounded-lg flex items-center justify-center font-bold text-xs uppercase text-zinc-400">
                  C
                </div>
                <span className="text-sm font-bold text-zinc-300">Live Chat</span>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {messages.map((msg, i) => (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={i}
                    className={cn(
                      "flex flex-col max-w-[85%]",
                      msg.from === 'me' ? "ml-auto items-end" : "items-start"
                    )}
                  >
                    <span className="text-[10px] uppercase font-bold text-zinc-600 mb-1 ml-1 mr-1">
                      {msg.from === 'me' ? 'You' : 'Stranger'}
                    </span>
                    <div className={cn(
                      "px-4 py-2 rounded-2xl text-sm break-all",
                      msg.from === 'me' ? "bg-blue-600 text-white rounded-tr-none" : "bg-zinc-800 text-zinc-300 rounded-tl-none"
                    )}>
                      {msg.text}
                    </div>
                  </motion.div>
                ))}
                {!isSearching && peerId && messages.length === 0 && (
                  <div className="text-center py-10 opacity-30 italic text-sm">
                    Say hi to start the conversation!
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <form onSubmit={handleSendMessage} className="p-4 bg-zinc-900/60 border-t border-white/10 flex gap-2">
                <input
                  disabled={!peerId}
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 transition-all"
                />
                <button
                  disabled={!peerId || !inputText.trim()}
                  type="submit"
                  className="p-2 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 rounded-xl transition-all shadow-lg active:scale-95"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>

            {/* Personal Camera */}
            <div className="hidden md:block relative h-48 bg-zinc-900 rounded-[2rem] border border-zinc-800 overflow-hidden group shadow-xl">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover grayscale-[0.2] hover:grayscale-0 transition-all duration-500"
              />
              <div className="absolute bottom-3 left-3 px-2 py-1 bg-black/60 backdrop-blur rounded-lg text-[10px] font-bold uppercase tracking-widest text-white/70">
                You
              </div>

              {isCameraOff && (
                <div className="absolute inset-0 bg-zinc-900 flex items-center justify-center">
                  <VideoOff className="w-10 h-10 text-zinc-700" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Global Controls Overlay */}
        <div className="absolute bottom-0 left-0 w-full p-4 md:p-8 pointer-events-none z-50">
          <div className="max-w-xl mx-auto flex items-center justify-center gap-3 pointer-events-auto bg-zinc-900/70 p-4 border border-white/10 rounded-[2.5rem] backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            <button
              onClick={toggleMute}
              className={cn("control-btn", !isMuted && "control-btn-active")}
            >
              {isMuted ? <MicOff /> : <Mic />}
            </button>
            <button
              onClick={toggleCamera}
              className={cn("control-btn", !isCameraOff && "control-btn-active")}
            >
              {isCameraOff ? <VideoOff /> : <Video />}
            </button>

            <div className="w-px h-8 bg-white/10 mx-2" />

            <button
              onClick={nextChat}
              className="px-8 py-4 bg-white text-black font-bold rounded-full hover:bg-zinc-200 active:scale-95 transition-all flex items-center gap-2 shadow-xl"
            >
              <SkipForward className="w-5 h-5 fill-black" />
              <span>NEXT</span>
            </button>

            <button
              className="control-btn control-btn-danger border-none"
              onClick={() => window.location.reload()}
            >
              <LogOut />
            </button>

            <button className="hidden sm:flex control-btn ml-2 border-red-500/20 text-red-500 hover:bg-red-500/10">
              <Flag className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Self-Video Overlay */}
      <div className="md:hidden fixed top-24 right-6 w-32 aspect-video bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden shadow-2xl z-40">
        <video
          ref={localVideoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-cover"
        />
        {isCameraOff && (
          <div className="absolute inset-0 bg-zinc-900 flex items-center justify-center">
            <VideoOff className="w-4 h-4 text-zinc-700" />
          </div>
        )}
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </main>
  );
}
