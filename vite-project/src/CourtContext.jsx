import React, { createContext, useState, useContext } from 'react';

const CourtContext = createContext();

const initialCourts = {
    "Court 1": { timeLeft: 120, currentPlayers: [], queue: [] },
    "Court 2": { timeLeft: 120, currentPlayers: [], queue: [] },
    "Court 3": { timeLeft: 120, currentPlayers: [], queue: [] }
};

export const CourtProvider = ({ children }) => {
    const [users, setUsers] = useState({});
    const [courts, setCourts] = useState(initialCourts);

    return (
        <CourtContext.Provider value={{ users, setUsers, courts, setCourts }}>
            {children}
        </CourtContext.Provider>
    );
};

export const useCourt = () => useContext(CourtContext);
