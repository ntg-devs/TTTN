import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import KolRegistrationForm from './KolRegistrationForm';
import KolApplicationStatus from './KolApplicationStatus';
import KolDashboard from './KolDashboard';

/**
 * KOL Routes Component
 * Defines routes for KOL-related pages
 */
const KolRoutes = () => {
    // Check if user is logged in
    const isLoggedIn = () => {
        const userData = localStorage.getItem('userData');
        return !!userData;
    };
    
    // Protected route component
    const ProtectedRoute = ({ children }) => {
        if (!isLoggedIn()) {
            return <Navigate to="/login" />;
        }
        return children;
    };
    
    return (
        <Routes>
            <Route 
                path="/user/kol/register" 
                element={
                    <ProtectedRoute>
                        <KolRegistrationForm />
                    </ProtectedRoute>
                } 
            />
            <Route 
                path="/user/kol/status/:userId" 
                element={
                    <ProtectedRoute>
                        <KolApplicationStatus />
                    </ProtectedRoute>
                } 
            />
            <Route 
                path="/user/kol/dashboard" 
                element={
                    <ProtectedRoute>
                        <KolDashboard />
                    </ProtectedRoute>
                } 
            />
        </Routes>
    );
};

export default KolRoutes;