import React from 'react';
import Link from 'next/link';
import Head from 'next/head';

export default function Index() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      backgroundColor: '#0a0a0a',
      color: 'white',
      fontFamily: 'sans-serif'
    }}>
      <Head>
        <title>Jam Chat</title>
      </Head>

      <h1 style={{ fontSize: '3rem', marginBottom: '1rem', background: 'linear-gradient(to right, #3b82f6, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
        Jam Chat
      </h1>
      <p style={{ color: '#9ca3af', marginBottom: '2rem' }}>Experience the simplest random video chat.</p>

      <Link href="/chat">
        <button style={{
          backgroundColor: '#2563eb',
          color: 'white',
          padding: '1.25rem 3rem',
          fontSize: '1.5rem',
          fontWeight: 'bold',
          borderRadius: '9999px',
          border: 'none',
          cursor: 'pointer',
          transition: 'transform 0.2s',
          boxShadow: '0 0 20px rgba(37,99,235,0.4)'
        }}
        onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
        onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
        >
          Start Chat
        </button>
      </Link>
    </div>
  );
}
