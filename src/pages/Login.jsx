import React from 'react';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import LoginForm from '../components/auth/LoginForm';
import CompanyPicker from '../components/auth/CompanyPicker';
import AuthLayout from '../components/auth/AuthLayout';

const Login = () => {
  const { isAuthenticated, isLoading, pendingSelection } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Credentials were accepted but the person belongs to several companies;
  // the session only begins once they pick one.
  return (
    <AuthLayout>
      {pendingSelection ? <CompanyPicker /> : <LoginForm />}
    </AuthLayout>
  );
};

export default Login;
