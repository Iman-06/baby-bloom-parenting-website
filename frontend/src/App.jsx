import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import LogActivity from './pages/LogActivity';
import Chat from './pages/Chat';
import Navbar from './components/Navbar';

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard"    element={<Dashboard />}    />
          <Route path="/profile"      element={<Profile />}      />
          <Route path="/log-activity" element={<LogActivity />}  />
          <Route path="/chat"         element={<Chat />}         />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;