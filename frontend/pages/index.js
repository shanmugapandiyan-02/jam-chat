import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Video, Users, Zap, Shield } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0f172a] text-white flex flex-col items-center justify-center p-6 space-y-12">
      <Head>
        <title>Jam Chat | Random Video Chat</title>
        <meta name="description" content="Meet strangers and make friends on Jam Chat." />
      </Head>

      <div className="text-center space-y-4">
        <h1 className="text-6xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
          Jam Chat
        </h1>
        <p className="text-xl text-slate-400 max-w-lg mx-auto">
          The simplest way to connect with strangers worldwide. Start a random video chat in one click.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto w-full">
        <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 hover:border-blue-500 transition-all">
          <Zap className="w-10 h-10 text-yellow-400 mb-4" />
          <h3 className="text-xl font-bold mb-2">Fast Connection</h3>
          <p className="text-slate-400">Find someone to talk to in seconds. Our matching engine is light and fast.</p>
        </div>
        <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 hover:border-indigo-500 transition-all">
          <Video className="w-10 h-10 text-indigo-400 mb-4" />
          <h3 className="text-xl font-bold mb-2">HD Video Chat</h3>
          <p className="text-slate-400">High-quality WebRTC video and audio for the best communication experience.</p>
        </div>
        <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 hover:border-teal-500 transition-all">
          <Shield className="w-10 h-10 text-teal-400 mb-4" />
          <h3 className="text-xl font-bold mb-2">Private & Secure</h3>
          <p className="text-slate-400">We don't store your video streams. All calls are peer-to-peer using WebRTC.</p>
        </div>
      </div>

      <div className="flex flex-col items-center space-y-4">
        <Link href="/chat">
          <button className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-6 px-16 rounded-full text-2xl transition-all hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(37,99,235,0.4)] flex items-center gap-3">
            <Users className="w-8 h-8" />
            Start Chatting
          </button>
        </Link>
        <p className="text-slate-500 text-sm">No registration required. Just hop in!</p>
      </div>

      <footer className="mt-20 text-slate-500 text-sm">
        &copy; 2024 Jam Chat. All rights reserved. Built with Next.js & Socket.io
      </footer>
    </div>
  );
}
