import React from 'react';
import { useCourt } from './CourtContext';

export default function CourtStatus() {
    const { courts } = useCourt();

    return (
        <div>
            <h2>Court Status</h2>
            {Object.entries(courts).map(([court, details]) => (
                <div key={court}>
                    <h3>{court}</h3>
                    <p>Time Left: {Math.floor(details.timeLeft / 60)}:{String(details.timeLeft % 60).padStart(2, '0')}</p>
                    <p>Current Players: {details.currentPlayers.join(', ') || "None"}</p>
                    {details.queue.map((group, index) => (
                        <p key={index}>Queue {index + 1}: {group.join(', ')}</p>
                    ))}
                    {[...Array(5 - details.queue.length)].map((_, i) => (
                        <p key={`empty-${i}`}>Queue {details.queue.length + i + 1}: Empty</p>
                    ))}
                    <hr />
                </div>
            ))}
        </div>
    );
}
