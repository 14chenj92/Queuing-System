import React, { useState } from 'react';
import { useCourt } from './CourtContext';

const words = ["red", "blue", "green", "pink", "dog", "cat", "fox", "rose", "lily", "tulip", "bat", "owl", "violet", "daisy", "beet", "bear", "hawk", "plum"];

export default function RegistrationForm() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const { users, setUsers } = useCourt();

    const generatePassword = () => {
        const newPassword = words[Math.floor(Math.random() * words.length)];
        setUsers({ ...users, [username]: newPassword });
        setPassword(newPassword);

        setTimeout(() => {
            setUsername('');
            setPassword('');
        }, 5000);
    };

    // Function to delete a user
    const deleteUser = (user) => {
        const updatedUsers = { ...users };
        delete updatedUsers[user];
        setUsers(updatedUsers);
    };

    const showUsers = () => {
        return Object.entries(users).map(([user, pass]) => (
            <li key={user}>
                {user}: {pass} 
                <button onClick={() => deleteUser(user)}>Delete</button>
            </li>
        ));
    };

    return (
        <div>
            <h2>Registration</h2>
            <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" />
            <button onClick={generatePassword}>Generate Password</button>
            {password && <p style={{ color: 'green', fontSize: '24px' }}>Generated Password: {password}</p>}
            
            <h3>Stored Usernames and Passwords</h3>
            <ul>
                {showUsers()}
            </ul>
        </div>
    );
}

