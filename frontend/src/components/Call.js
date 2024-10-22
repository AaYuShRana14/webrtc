import { useEffect, useRef, useState } from 'react';

const Call = () => {
    const socket = useRef(null);
    const [roomId, setRoomId] = useState('');
    const localRef = useRef();
    const peerConnection = useRef(null);
    const remoteRef = useRef();
    const configuration = {
        iceServers: [
            {
                urls: 'stun:stun.l.google.com:19302',
            },
        ],
    };

    async function startCall() {
        if (!socket.current) {
            console.error('Socket is not initialized');
            return;
        }
        socket.current.send(JSON.stringify({ type: 'join', roomId }));
        let localStream;
        try {
            localStream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: false,
            });
        } catch (err) {
            console.error('Error accessing media devices:', err);
            localStream = new MediaStream();
        }
        localRef.current.srcObject = localStream;
        peerConnection.current = new RTCPeerConnection(configuration);
        const pc = peerConnection.current;
        localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
        pc.ontrack = (e) => {
            if (e.streams && e.streams[0]) {
                remoteRef.current.srcObject = e.streams[0];
            }
        };
        pc.onicecandidate = (e) => {
            if (e.candidate) {
                socket.current.send(JSON.stringify({ type: 'ice', ice: e.candidate,roomId }));
            }
        };

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.current.send(JSON.stringify({ type: 'offer', offer,roomId}));
    }

    useEffect(() => {
        setRoomId('room123');

        const ws = new WebSocket('ws://localhost:8080');
        ws.onopen = () => {
            console.log('Connected to server');
            socket.current = ws;
            console.log(socket.current);
        };

        ws.onmessage = (message) => {
            const data = JSON.parse(message.data);
            console.log(data);

            if (data.type === 'joined') {
                console.log('New user joined room');
            }

            if (data.type === 'offer') {
                console.log('Received offer');
                handleOffer(data.offer);
            }
            if(data.type==='answer'){
                console.log('Received answer');
                handleAnswer(data.answer);
            }
            if (data.type === 'ice') {
                console.log('Received ICE candidate');
                handleIce(data.ice);
            }

            if (data.type === 'room-full') {
                console.log("Room is full");
            }

            if (data.type === 'start-call') {
                console.log("Ready for call");
            }
        };

        ws.onclose = () => {
            console.log('Disconnected from server');
        };

        return () => {
            ws.close();
        };
    }, []);

    const handleOffer = async (offer) => {
        const pc = peerConnection.current;
        if (!pc) {
            console.error('Peer connection not established yet');
            return;
        }
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        if (!socket.current) {
            console.error('Socket is not initialized');
            return;
        }
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.current.send(JSON.stringify({ type: "answer", answer, roomId }));
    };
    const handleAnswer = async (answer) => {
        const pc = peerConnection.current;
        if (!pc) {
            console.error('Peer connection not established yet');
            return;
        }
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        console.log(pc.remoteDescription);
    }
    const handleIce =async (ice) => {
        const pc = peerConnection.current;
        console.log(pc.remoteDescription);
        if (!pc) {
            console.error('Peer connection not established yet');
            return;
        }
        if (!pc.remoteDescription) {
            console.error('Remote description is not set. Cannot add ICE candidate.');
            return;
        }
        await pc.addIceCandidate(new RTCIceCandidate(ice)).catch(err => {
            console.error('Error adding ICE candidate:', err);
        });
    };

    return (
        <>
            <h1>Peer-to-Peer Video Chat</h1>
            <video ref={localRef} autoPlay style={{ width: '300px', marginRight: '20px', border: '1px solid black' }}></video>
            <video ref={remoteRef} autoPlay style={{ width: '300px', border: '1px solid black' }}></video>
            <button onClick={startCall}>Start Call</button>
            
        </>
    );
};

export default Call;
