"use client";

import { useEffect, useRef, useCallback } from "react";
import { socket } from "@/socket";
import { useChatStore } from "@/store/useChatStore";

const configuration = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" }
    ]
};

export const useWebRTC = () => {
    const pc = useRef<RTCPeerConnection | null>(null);
    const {
        localStream,
        setLocalStream,
        setRemoteStream,
        setIsSearching,
        setPeerId,
        addMessage,
        clearMessages
    } = useChatStore();

    const cleanup = useCallback(() => {
        if (pc.current) {
            pc.current.getSenders().forEach((sender) => pc.current?.removeTrack(sender));
            pc.current.close();
            pc.current = null;
        }
        setRemoteStream(null);
        setPeerId(null);
    }, [setPeerId, setRemoteStream]);

    const initLocalStream = useCallback(async () => {
        if (localStream) return localStream;
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            setLocalStream(stream);
            return stream;
        } catch (err) {
            console.error("Error accessing media devices.", err);
            return null;
        }
    }, [localStream, setLocalStream]);

    const createPeerConnection = useCallback((peerId: string) => {
        cleanup();
        pc.current = new RTCPeerConnection(configuration);

        pc.current.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit("ice-candidate", { to: peerId, candidate: event.candidate });
            }
        };

        pc.current.ontrack = (event) => {
            if (event.streams && event.streams[0]) {
                console.log("Remote track received:", event.streams[0]);
                setRemoteStream(event.streams[0]);
            }
        };

        if (localStream) {
            localStream.getTracks().forEach((track) => {
                pc.current?.addTrack(track, localStream);
            });
        }

        return pc.current;
    }, [cleanup, localStream, setRemoteStream]);

    useEffect(() => {
        socket.connect();

        socket.on("match-found", async ({ peerId, role }) => {
            console.log(`Matched with ${peerId} as ${role}`);
            setIsSearching(false);
            setPeerId(peerId);
            clearMessages();

            const peerConn = createPeerConnection(peerId);

            if (role === "initiator") {
                const offer = await peerConn.createOffer();
                await peerConn.setLocalDescription(offer);
                socket.emit("offer", { to: peerId, offer });
            }
        });

        socket.on("offer", async ({ from, offer }) => {
            console.log(`Received offer from ${from}`);
            const peerConn = createPeerConnection(from);
            await peerConn.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await peerConn.createAnswer();
            await peerConn.setLocalDescription(answer);
            socket.emit("answer", { to: from, answer });
        });

        socket.on("answer", async ({ from, answer }) => {
            console.log(`Received answer from ${from}`);
            if (pc.current) {
                await pc.current.setRemoteDescription(new RTCSessionDescription(answer));
            }
        });

        socket.on("ice-candidate", async ({ from, candidate }) => {
            console.log(`Received candidate from ${from}`);
            if (pc.current) {
                await pc.current.addIceCandidate(new RTCIceCandidate(candidate));
            }
        });

        socket.on("peer-disconnected", () => {
            console.log("Peer disconnected");
            cleanup();
            setIsSearching(true);
            socket.emit("start-chat");
        });

        socket.on("receive-message", ({ from, message }) => {
            addMessage({ from: "stranger", text: message });
        });

        socket.on("disconnect", () => {
            console.log("Socket disconnected");
            cleanup();
        });

        return () => {
            socket.off("match-found");
            socket.off("offer");
            socket.off("answer");
            socket.off("ice-candidate");
            socket.off("peer-disconnected");
            socket.off("receive-message");
            socket.off("disconnect");
            socket.disconnect();
            cleanup();
        };
    }, [createPeerConnection, cleanup, setIsSearching, setPeerId, clearMessages, addMessage]);

    const startChat = () => {
        setIsSearching(true);
        socket.emit("start-chat");
    };

    const nextChat = () => {
        cleanup();
        setIsSearching(true);
        socket.emit("next-chat");
        socket.emit("start-chat");
    };

    const sendMessage = (text: string) => {
        const peerId = useChatStore.getState().peerId;
        if (peerId) {
            socket.emit("send-message", { to: peerId, message: text });
            addMessage({ from: "me", text });
        }
    };

    return { startChat, nextChat, sendMessage, initLocalStream };
};
