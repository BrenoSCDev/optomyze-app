import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle, CheckCircle, Lock, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import Spline from '@splinetool/react-spline';
import api from '../services/api';
import optomyzeLogo from '../assets/optomyze.png';
import '../css/Login.css';

const PasswordReset = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    const emailParam = searchParams.get('email');
    const tokenParam = searchParams.get('token');
    
    if (!emailParam || !tokenParam) {
      setError('Invalid reset link. Please request a new password reset.');
      return;
    }
    
    setEmail(emailParam);
    setToken(tokenParam);
  }, [searchParams]);

  const getPasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, text: '', color: '' };
    
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/\d/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    
    if (score <= 2) return { score, text: 'Weak', color: 'text-red-400' };
    if (score <= 3) return { score, text: 'Fair', color: 'text-yellow-400' };
    if (score <= 4) return { score, text: 'Good', color: 'text-blue-400' };
    return { score, text: 'Strong', color: 'text-green-400' };
  };

  const passwordStrength = getPasswordStrength(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }
    
    if (password !== passwordConfirmation) {
      setError('Passwords do not match');
      return;
    }
    
    try {
      setLoading(true);
      
      await api.post('/api/auth/reset-password', {
        email: email,
        token: token,
        password: password,
        password_confirmation: passwordConfirmation
      });
      
      setSuccess(true);
      
      setTimeout(() => {
        navigate('/login');
      }, 3000);
      
    } catch (err) {
      console.error('Password reset error:', err);
      
      if (err.response?.status === 422) {
        const errors = err.response.data.errors;
        if (errors) {
          const errorMessages = Object.values(errors).flat();
          setError(errorMessages.join(', '));
        } else {
          setError(err.response.data.message || 'Invalid or expired reset token');
        }
      } else if (err.response?.status === 404) {
        setError('Email not found in our system');
      } else {
        setError('Failed to reset password. Please try again or request a new reset link.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Left Half - Spline 3D Animation (Desktop Only) */}
      <div className="left-half">
        <Spline scene="https://prod.spline.design/3Lak4Ex5AvAtpnD5/scene.splinecode" />
      </div>

      {/* Right Half - Password Reset Form */}
      <div className="right-half">
        <div className="w-full max-w-md animate-fade-in">
          <div className="rounded-3xl p-8 lg:p-10 shadow-2xl border border-white/20 backdrop-blur-xl bg-white/10 transition-all duration-300 hover:bg-white/15 hover:shadow-glow">
            
            {success ? (
              <div className="text-center">
                <div className="w-16 h-16 bg-green-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Password Reset Successful!</h2>
                <p className="text-white/80 mb-4">
                  Your password has been reset successfully.
                </p>
                <p className="text-white/60 text-sm">
                  Redirecting to login page in 3 seconds...
                </p>
              </div>
            ) : (
              <>
                {/* Logo */}
                <div className="text-center mb-8">
                  <img
                    src={optomyzeLogo}
                    alt="Optomyze"
                    className="h-12 mx-auto mb-6 filter brightness-0 invert"
                  />
                  <div className="w-12 h-12 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Lock className="w-6 h-6 text-purple-400" />
                  </div>
                  <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">Reset Password</h1>
                  <p className="text-white/80 text-sm lg:text-base">Enter your new password below</p>
                </div>

                {/* Error Display */}
                {error && (
                  <div className="mb-6 p-4 bg-red-600/20 border border-red-600/30 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                      <p className="text-red-400 text-sm">{error}</p>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Email Display */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white">
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      readOnly
                      className="bg-white/5 border-white/20 text-white/60 cursor-not-allowed h-12"
                    />
                  </div>

                  {/* New Password Field */}
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-white">
                      New Password <span className="text-red-400">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your new password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                        className="bg-white/10 border-white/30 text-white placeholder:text-white/60 focus:border-purple-400 focus:ring-purple-400/20 pr-10 h-12 transition-all"
                        required
                        minLength={8}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors"
                        disabled={loading}
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                    
                    {/* Password Strength Indicator */}
                    {password && (
                      <div className="mt-2">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-white/60">Password strength:</span>
                          <span className={`text-xs font-medium ${passwordStrength.color}`}>
                            {passwordStrength.text}
                          </span>
                        </div>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((level) => (
                            <div
                              key={level}
                              className={`h-1 flex-1 rounded-full ${
                                level <= passwordStrength.score 
                                  ? passwordStrength.score <= 2 ? 'bg-red-400' : 
                                    passwordStrength.score <= 3 ? 'bg-yellow-400' : 
                                    passwordStrength.score <= 4 ? 'bg-blue-400' : 'bg-green-400'
                                  : 'bg-white/20'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password Field */}
                  <div className="space-y-2">
                    <Label htmlFor="passwordConfirmation" className="text-white">
                      Confirm New Password <span className="text-red-400">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="passwordConfirmation"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm your new password"
                        value={passwordConfirmation}
                        onChange={(e) => setPasswordConfirmation(e.target.value)}
                        disabled={loading}
                        className={`
                          bg-white/10 text-white placeholder:text-white/60 focus:ring-purple-400/20 pr-10 h-12 transition-all
                          ${passwordConfirmation && password !== passwordConfirmation
                            ? 'border-red-500 focus:border-red-500' 
                            : 'border-white/30 focus:border-purple-400'
                          }
                        `}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors"
                        disabled={loading}
                      >
                        {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                    
                    {/* Password Match Indicator */}
                    {passwordConfirmation && (
                      <div className="mt-2 flex items-center gap-2 text-sm">
                        {password === passwordConfirmation ? (
                          <>
                            <CheckCircle className="w-4 h-4 text-green-400" />
                            <span className="text-green-400">Passwords match</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-4 h-4 text-red-400" />
                            <span className="text-red-400">Passwords do not match</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={loading || !email || !token || password.length < 8 || password !== passwordConfirmation}
                    variant="black"
                    className="w-full transition-all duration-300 h-12 font-semibold"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Resetting Password...
                      </>
                    ) : (
                      'Reset Password'
                    )}
                  </Button>

                  {/* Back to Login Link */}
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => navigate('/login')}
                      className="text-sm text-white/60 hover:text-white transition-colors"
                    >
                      Back to Login
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PasswordReset;
