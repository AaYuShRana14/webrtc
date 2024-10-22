import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import classes from './Call.module.css';

const Call = () => {
    const socket = useRef(null);
    const iceCandidatesQueue = useRef([]);
    const [userId, setUserId] = useState('');
    const [roomId, setRoomId] = useState('');
    const [localStream, setLocalStream] = useState(null);
    const localRef = useRef();
    const location = useLocation();
    const peerConnection = useRef(null);
    const remoteRef = useRef();
    const navigate = useNavigate();
    const configuration = {
        iceServers: [
            {
                urls: 'stun:stun.l.google.com:19302',
            },
        ],
    };

    const toggleMute = () => {
        if (localStream) {
            localStream.getAudioTracks().forEach(track => {
                track.enabled = !track.enabled;
            });
        }
    };

    const endCall = () => {
        if (socket.current) {
            socket.current.close();
        }
        if (peerConnection.current) {
            peerConnection.current.close();
        }
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
        }
        setLocalStream(null);
        localRef.current.srcObject = null;
        remoteRef.current.srcObject = null;
        console.log('Call ended');
        navigate('/')
    };

    const toggleVideo = () => {
        if (localStream) {
            localStream.getVideoTracks().forEach(track => {
                track.enabled = !track.enabled;
            });
        }
    };

    async function startCall() {
        if (!socket.current) {
            console.error('Socket is not initialized');
            return;
        }
        socket.current.send(JSON.stringify({ type: 'join', roomId, userId }));
        let localStream;
        try {
            localStream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true,
            });
        } catch (err) {
            console.error('Error accessing media devices:', err);
            localStream = new MediaStream();
        }
        localRef.current.srcObject = localStream;
        setLocalStream(localStream);
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
                socket.current.send(JSON.stringify({ type: 'ice', ice: e.candidate, roomId, userId }));
            }
        };

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.current.send(JSON.stringify({ type: 'offer', offer, roomId, userId }));
    }

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const id = queryParams.get('roomId');
        const name = queryParams.get('userName');
        setRoomId(id);
        setUserId(name);
    }, [location]);

    useEffect(() => {
        const ws = new WebSocket('wss://webrtc-1-vnlv.onrender.com');
        ws.onopen = () => {
            console.log('Connected to server');
            socket.current = ws;
        };

        ws.onmessage = (message) => {
            const data = JSON.parse(message.data);
            if(data.type==='start-call'){
                console.log(data);
            }
            if (data.type === 'offer') {
                handleOffer(data.offer);
            }
            if (data.type === 'answer') {
                handleAnswer(data.answer);
            }
            if (data.type === 'ice') {
                handleIce(data.ice);
            }
        };

        ws.onclose = () => {
            console.log('Disconnected from server');
        };

        return () => {
            ws.close();
        };
    }, [userId, roomId]);

    const handleOffer = async (offer) => {
        const pc = peerConnection.current;
        if (!pc) {
            console.error('Peer connection not established yet');
            return;
        }
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        iceCandidatesQueue.current.forEach(async (ice) => {
            await pc.addIceCandidate(new RTCIceCandidate(ice)).catch(err => {
                console.error('Error adding ICE candidate from queue:', err);
            });
        });
        iceCandidatesQueue.current = [];
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.current.send(JSON.stringify({ type: "answer", answer, roomId, userId }));
    };

    const handleAnswer = async (answer) => {
        const pc = peerConnection.current;
        if (!pc) {
            console.error('Peer connection not established yet');
            return;
        }
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
    };

    const handleIce = async (ice) => {
        const pc = peerConnection.current;
        if (!pc) {
            console.error('Peer connection not established yet');
            return;
        }
        if (!pc.remoteDescription) {
            iceCandidatesQueue.current.push(ice);
            return;
        }
        await pc.addIceCandidate(new RTCIceCandidate(ice)).catch(err => {
            console.error('Error adding ICE candidate:', err);
        });
    };

    return (
        <div className={classes.container}>
            <h1>Peer-Pressure-Video Call</h1>
            <div className={classes.videocontainer}>
                <video ref={remoteRef} autoPlay className={classes.remotevideo}></video>
                <div className={classes.localVideoContainer}>
                    <video ref={localRef} autoPlay muted className={classes.localvideo}></video>
                </div>
            </div>
            <div className={classes.btncontainer}>
                <button onClick={startCall} className={classes.btns}>Start Call</button>
                <button onClick={toggleMute} className={classes.btns}>Mute/Unmute</button>
                <button onClick={toggleVideo} className={classes.btns}>Start/Stop Video</button>
                <button onClick={endCall} className={classes.btns}>End Call</button>
            </div>
        </div>
    );
};

export default Call;
