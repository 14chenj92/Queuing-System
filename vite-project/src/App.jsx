import React from 'react';
import RegistrationForm from './RegistrationForm';
import BookingForm from './BookingForm';
import CourtStatus from './CourtStatus';
import CourtList from './Courts/CourtList';
import { CourtProvider } from './CourtContext';

function App() {
    return (
        <CourtProvider>
            <div>
                <h1>Badminton Registration & Booking System</h1>
                <RegistrationForm />
                <BookingForm />
                <CourtList/>
                <CourtStatus />
            </div>
        </CourtProvider>
    );
}

export default App;
