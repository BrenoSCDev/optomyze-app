import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoginForm from '../components/auth/LoginForm';
import Spline from '@splinetool/react-spline';
import '../css/Login.css'

const Login = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="login-container">
      {/* Left Half - Spline 3D Animation (Desktop Only) */}
      <div className="left-half">
        <Spline scene="https://prod.spline.design/3Lak4Ex5AvAtpnD5/scene.splinecode" />
      </div>

      {/* Right Half - Login Form */}
      <div className="right-half">
        <LoginForm />
      </div>
    </div>
  );
};

export default Login;
