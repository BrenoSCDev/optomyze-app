import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoginForm from '../components/auth/LoginForm';
import Spline from '@splinetool/react-spline';

const Login = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen flex overflow-hidden">
      {/* Left Half - Spline 3D Animation (Desktop Only) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
        <Spline scene="https://prod.spline.design/3Lak4Ex5AvAtpnD5/scene.splinecode" />
      </div>
      
      {/* Right Half - Login Form */}
      <div className="w-full lg:w-1/2 min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-900 via-black to-gray-800">
        <LoginForm />
      </div>
    </div>
  );
};

export default Login;