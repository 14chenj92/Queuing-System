import React, { useState } from 'react';

function BookingForm({ court, onBookCourt }) {
    const [players, setPlayers] = useState({
        player1: { username: '', password: '' },
        player2: { username: '', password: '' },
        player3: { username: '', password: '' },
        player4: { username: '', password: '' },
    });

    const handlePlayerChange = (player, field, value) => {
        setPlayers((prev) => ({
            ...prev,
            [player]: {
                ...prev[player],
                [field]: value,
            },
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onBookCourt(court, players);
        setPlayers({
            player1: { username: '', password: '' },
            player2: { username: '', password: '' },
            player3: { username: '', password: '' },
            player4: { username: '', password: '' },
        });
    };

    return (
        <div>
            <h2>Booking Form for {court}</h2>
            {['player1', 'player2', 'player3', 'player4'].map((player, index) => (
                <div key={player}>
                    <label>{`Player ${index + 1}:`}</label>
                    <input
                        type="text"
                        placeholder="Username"
                        value={players[player].username}
                        onChange={(e) => handlePlayerChange(player, 'username', e.target.value)}
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={players[player].password}
                        onChange={(e) => handlePlayerChange(player, 'password', e.target.value)}
                    />
                </div>
            ))}
            <button onClick={handleSubmit}>Confirm Booking</button>
        </div>
    );
}

export default BookingForm;
