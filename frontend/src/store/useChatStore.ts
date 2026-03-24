import { create } from 'zustand';

interface ChatStore {
    isSearching: boolean;
    setIsSearching: (val: boolean) => void;
    peerId: string | null;
    setPeerId: (id: string | null) => void;
    localStream: MediaStream | null;
    setLocalStream: (stream: MediaStream | null) => void;
    remoteStream: MediaStream | null;
    setRemoteStream: (stream: MediaStream | null) => void;
    isMuted: boolean;
    setIsMuted: (val: boolean) => void;
    isCameraOff: boolean;
    setIsCameraOff: (val: boolean) => void;
    messages: { from: string; text: string }[];
    addMessage: (msg: { from: string; text: string }) => void;
    clearMessages: () => void;
}

export const useChatStore = create<ChatStore>((set) => ({
    isSearching: false,
    setIsSearching: (val) => set({ isSearching: val }),
    peerId: null,
    setPeerId: (id) => set({ peerId: id }),
    localStream: null,
    setLocalStream: (stream) => set({ localStream: stream }),
    remoteStream: null,
    setRemoteStream: (stream) => set({ remoteStream: stream }),
    isMuted: false,
    setIsMuted: (val) => set({ isMuted: val }),
    isCameraOff: false,
    setIsCameraOff: (val) => set({ isCameraOff: val }),
    messages: [],
    addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),
    clearMessages: () => set({ messages: [] }),
}));
