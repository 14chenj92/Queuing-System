import React, { useState } from 'react';
import CourtCard from './CourtCard';

function CourtList() {
    const courts = ['Court 1', 'Court 2', 'Court 3', 'Court 4', 'Court 5', 'Court 6', 'Court 7', 'Court 8', 'Court 9', 'Court 10'];

    // Initialize the state for courts, each with timeLeft (13:00) and isActive flag
    const [courtsState, setCourtsState] = useState(
        courts.reduce((acc, court) => {
            acc[court] = { timeLeft: 780, isActive: false }; // Start with 13:00 (780 seconds)
            return acc;
        }, {})
    );

    // Function to handle starting the timer for a specific court
    const startTimer = (courtName) => {
        setCourtsState(prevState => ({
            ...prevState,
            [courtName]: { ...prevState[courtName], isActive: true }
        }));
    };

    // Function to decrement the timer for a specific court
    const decrementTimer = (courtName) => {
        setCourtsState(prevState => {
            const updatedCourt = { ...prevState[courtName] };
            if (updatedCourt.isActive && updatedCourt.timeLeft > 0) {
                updatedCourt.timeLeft -= 1;
            }
            return { ...prevState, [courtName]: updatedCourt };
        });
    };

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px', justifyItems: 'center' }}>
            {courts.map((court) => (
                <CourtCard 
                    key={court} 
                    courtName={court} 
                    timeLeft={courtsState[court].timeLeft} 
                    isActive={courtsState[court].isActive}
                    onStartTimer={startTimer} 
                    onDecrementTimer={decrementTimer} 
                />
            ))}
        </div>
    );
}

export default CourtList;

