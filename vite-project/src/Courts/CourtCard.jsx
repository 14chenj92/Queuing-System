import React, { useEffect } from 'react';

function CourtCard({ courtName, timeLeft, isActive, onStartTimer, onDecrementTimer }) {
    useEffect(() => {
        if (isActive && timeLeft > 0) {
            const interval = setInterval(() => {
                onDecrementTimer(courtName); // Decrease the timer every second
            }, 1000);

            return () => clearInterval(interval); // Cleanup the interval when the component unmounts or when the timer stops
        }
    }, [isActive, timeLeft, courtName, onDecrementTimer]);

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
    };

    return (
        <div
            style={{
                border: '1px solid #ccc',
                padding: '20px',
                margin: '10px',
                cursor: 'pointer',
                textAlign: 'center',
                backgroundColor: '#f5f5f5',
                borderRadius: '8px',
                transition: '0.3s',
            }}
            onClick={() => onStartTimer(courtName)} // Start timer when card is clicked
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e0e0e0'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
        >
            <h3>{courtName}</h3>
            <p>Click to book this court</p>
            <div>Timer: {formatTime(timeLeft)}</div>
        </div>
    );
}

export default CourtCard;




