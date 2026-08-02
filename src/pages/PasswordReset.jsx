import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle, CheckCircle, Lock, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import api from '../services/api';
import optomyzeLogo from '../assets/optomyze.png';
import optomyzeLogoLight from '../assets/optomyze-light.png';
import AuthLayout from '../components/auth/AuthLayout';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';

const PasswordReset = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useLanguage();
  const { mode } = useTheme();
  const logo = mode === 'dark' ? optomyzeLogo : optomyzeLogoLight;
  
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
    <AuthLayout>
      {success ? (
        <div className="text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-success/10">
            <CheckCircle className="h-7 w-7 text-success" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {t('auth.reset-success-title')}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{t('auth.reset-success-desc')}</p>
          <p className="mt-6 text-xs text-muted-foreground">{t('auth.redirecting')}</p>
        </div>
      ) : (
        <>
          <div className="mb-8">
            <img src={logo} alt="Optomyze" className="mb-8 h-8" />
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {t('auth.reset-title')}
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">{t('auth.reset-subtitle')}</p>
          </div>

          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">{t('auth.email')}</Label>
              {/* Read-only: the address is fixed by the reset token. */}
              <Input id="email" type="email" value={email} readOnly className="h-11 bg-muted text-muted-foreground" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t('auth.new-password')}</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder={t('auth.create-password-placeholder')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="h-11 pr-10"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors duration-fast hover:text-foreground"
                  disabled={loading}
                  aria-label={showPassword ? t('auth.hide-password') : t('auth.show-password')}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="passwordConfirmation">{t('auth.confirm-password')}</Label>
              <div className="relative">
                <Input
                  id="passwordConfirmation"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder={t('auth.confirm-password-placeholder')}
                  value={passwordConfirmation}
                  onChange={(e) => setPasswordConfirmation(e.target.value)}
                  disabled={loading}
                  className={`h-11 pr-10 ${
                    passwordConfirmation && password !== passwordConfirmation ? 'border-destructive' : ''
                  }`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors duration-fast hover:text-foreground"
                  disabled={loading}
                  aria-label={showConfirmPassword ? t('auth.hide-password') : t('auth.show-password')}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {passwordConfirmation && (
                <div className="flex items-center gap-1.5 pt-0.5 text-xs">
                  {password === passwordConfirmation ? (
                    <><CheckCircle className="h-3.5 w-3.5 text-success" /><span className="text-success">{t('auth.passwords-match')}</span></>
                  ) : (
                    <><AlertCircle className="h-3.5 w-3.5 text-destructive" /><span className="text-destructive">{t('auth.passwords-differ')}</span></>
                  )}
                </div>
              )}
            </div>

            <Button
              type="submit"
              disabled={loading || !email || !token || password.length < 8 || password !== passwordConfirmation}
              className="h-11 w-full"
            >
              {loading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('auth.resetting')}</>
              ) : (
                t('auth.reset-cta')
              )}
            </Button>
          </form>

          <p className="mt-8 border-t border-border pt-6 text-center text-sm">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="font-medium text-primary transition-colors duration-fast hover:underline"
            >
              {t('auth.back-to-login')}
            </button>
          </p>
        </>
      )}
    </AuthLayout>
  );
};

export default PasswordReset;
