import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import classes from './Home.module.css';
const Home = () => {
    const [userName, setUserName] = useState('');
    const [roomId, setRoomId] = useState('');
    const navigate = useNavigate();

    const generateRoomId = () => {
        const newRoomId = `room-${Math.floor(Math.random() * 10000)}`;
        setRoomId(newRoomId);
    };

    const joinRoom = () => {
        if (userName.trim() && (roomId.trim() || roomId)) {
            navigate(`/call?roomId=${roomId}&userName=${userName}`);
        } else {
            alert('Please enter a valid name and room ID');
        }
    };

    return (
        <div className={classes.homecontainer}>
            <h1>Welcome to Video Chat</h1>
            <input
                type="text"
                placeholder="Enter your name"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className={classes.input}
            />
            <div className={classes.roomidcontainer}>
                <input
                    type="text"
                    placeholder="Enter Room ID"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                    className={classes.input}
                />
                <button onClick={generateRoomId} className={classes.btn}>Generate Room ID</button>
            </div>
            <button onClick={joinRoom} className={classes.btn}>Join Room</button>
        </div>
    );
};

export default Home;
