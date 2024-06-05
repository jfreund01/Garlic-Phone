import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useWebSocket } from '../WebSocketContext';
import { getGameInformation } from "../api";
import { TopBar2, TextInput, Loading, CustomButton, UserCard } from "../components";

const GameLobby = () => {
    const navigate = useNavigate();
    const [gameInfo, setGameInfo] = useState(null);
    const [errMsg, setErrMsg] = useState("");
    const { user } = useSelector(state => state.user);
    const [players, setPlayers] = useState([]);
    const [isHost, setIsHost] = useState(true);
    const [drawingTime, setDrawingTime] = useState("...");
    const [writingTime, setWritingTime] = useState("...");

    const PlayerList = ({ players }) => {
        return (
            <div className='h-full p-[5%] rounded-[5vh] gap-[10px] overflow-y-auto bg-[rgb(var(--color-grey))]'>
                {/* Map over the players array and render each player */}
                {players.map((player, index) => (
                    <div key={index}>
                        <UserCard _username={player}/>
                    </div>
                ))}
            </div>
        );
    };

    async function fetchData() {
        try {
            console.log("Fetching game information...");
            const data = await getGameInformation(localStorage.getItem('game_code'));
            setGameInfo(data); // Set gameInfo state variable with fetched data
            setDrawingTime(data.draw_time);
            setWritingTime(data.desc_time);
            setPlayers(data.users);
        } catch (error) {
            setErrMsg({ message: error.message, status: 'failed' });
        }
    }

    useEffect(() => {
        fetchData();
    }, []);

    const handleLeaveLobby = () => {
        //ws.send(JSON.stringify({ type: 'leave-lobby', userId: user.id }));
        navigate('/home');
    };

    const handleStartGame = () => {
        navigate('/starting-prompt-round');
    };

    return (
        <div className='game-lobby w-full px-0 pb-20 2xl:px-40 bg-bgColor h-screen overflow-hidden'>
            <TopBar2 />

            <div className='w-full flex gap-2 lg:gap-4 pt-5 pb-10 h-full'>
                {/* LEFT */}
                <div className='hidden w-1/3 lg:w-1/4 h-full md:flex flex-col ml-[2%]'>
                    <span className='colored-subtitle-text ml-1'>Player(s): </span>
                    <PlayerList players={players} />
                </div>

                {/* CENTER */}
                <div className='w-full lg:w-1/2 h-full p-10 2xl:px-20 flex '>
                    <div className='settings w-full flex flex-col gap-2 items-center mb-1 justify-center '>
                        {isHost && (
                            <>
                                <div className='w-full flex gap-2 items-center mb-1 justify-center '>
                                    <span className='colored-subtitle-text'>
                                        Players in Lobby: {players.length}
                                    </span>
                                </div>

                                <div className='w-full flex gap-2 items-center mb-1 justify-center '>
                                    <span className='colored-subtitle-text'>
                                        Length of Drawing Round: {drawingTime}
                                    </span>
                                </div>

                                <div className='w-full flex gap-2 items-center mb-1 justify-center '>
                                    <span className='colored-subtitle-text'>
                                        Length of Prompt Round: {writingTime}
                                    </span>
                                </div>

                                <CustomButton
                                    onClick={handleStartGame}
                                    containerStyles={'colored-button-style'}
                                    title='Start Game' />
                                <CustomButton
                                    onClick={handleLeaveLobby}
                                    containerStyles={'colored-button-style'}
                                    title='Leave Lobby' />
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GameLobby;