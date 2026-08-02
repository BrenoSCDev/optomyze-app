import React, { useState } from 'react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from '../../hooks/use-toast';
import api from '../../services/api';
import optomyzeLogo from '../../assets/optomyze.png';
import optomyzeLogoLight from '../../assets/optomyze-light.png';
import { useTheme } from '../../contexts/ThemeContext';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [isSendingReset, setIsSendingReset] = useState(false);
  
  const { login } = useAuth();
  const { t } = useLanguage();
  const { mode } = useTheme();
  // optomyze.png is the white mark for dark surfaces; -light is the dark mark.
  const logo = mode === 'dark' ? optomyzeLogo : optomyzeLogoLight;
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all fields',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    
    try {
      await login(email, password);
      toast({
        title: 'Welcome back!',
        description: 'You have been successfully logged in.',
      });
      navigate(from, { replace: true });
    } catch (error) {
      let errorMessage = 'An error occurred. Please try again.';
      
      if (error.response?.status === 401) {
        errorMessage = 'Invalid email or password';
      } else if (error.code === 'NETWORK_ERROR') {
        errorMessage = 'Connection failed. Please try again';
      } else if (error.response?.status >= 500) {
        errorMessage = 'Server error. Please try again later';
      }
      
      toast({
        title: 'Login Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* Header. No card wrapper — the panel itself is the surface. */}
      <div className="mb-8">
        <img src={logo} alt="Optomyze" className="mb-8 h-8" />
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {t('auth.welcome')}
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">{t('auth.subtitle')}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email">{t('auth.email')}</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder={t('auth.email-placeholder')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            className="h-11"
            required
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">{t('auth.password')}</Label>
            <button
              type="button"
              onClick={() => setShowForgotPassword(true)}
              className="text-xs font-medium text-primary transition-colors duration-fast hover:underline"
              disabled={isLoading}
            >
              {t('auth.forgot-password')}
            </button>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder={t('auth.password-placeholder')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              className="h-11 pr-10"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors duration-fast hover:text-foreground"
              disabled={isLoading}
              aria-label={showPassword ? t('auth.hide-password') : t('auth.show-password')}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <Button type="submit" disabled={isLoading} className="h-11 w-full">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t('auth.signingin')}
            </>
          ) : (
            t('auth.signin')
          )}
        </Button>
      </form>

      {/* Self-service entry point: the CRM is sold directly now, so someone
          landing here without an account needs a way forward. */}
      <p className="mt-8 border-t border-border pt-6 text-center text-sm text-muted-foreground">
        {t('auth.no-account')}{' '}
        <a
          href="https://www.optomyze.io/solutions/crm"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-primary transition-colors duration-fast hover:underline"
        >
          {t('auth.get-started')}
        </a>
      </p>

      {/* Forgot Password Modal */}
      <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('auth.forgot-password-title')}</DialogTitle>
            <DialogDescription>
              {t('auth.forgot-password-description')}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={async (e) => {
            e.preventDefault();
            if (!forgotEmail) {
              toast({
                title: t('auth.validation-error'),
                description: t('auth.email-required'),
                variant: 'destructive',
              });
              return;
            }

            setIsSendingReset(true);
            try {
              await api.post('/api/auth/forgot-pwd', { email: forgotEmail });
              toast({
                title: t('auth.reset-email-sent'),
                description: t('auth.reset-email-sent-description'),
              });
              setShowForgotPassword(false);
              setForgotEmail('');
            } catch (error) {
              toast({
                title: t('auth.reset-failed'),
                description: error.response?.data?.message || t('auth.reset-failed-description'),
                variant: 'destructive',
              });
            } finally {
              setIsSendingReset(false);
            }
          }} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="forgot-email">{t('auth.email')}</Label>
              <Input
                id="forgot-email"
                type="email"
                placeholder={t('auth.email-placeholder')}
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                disabled={isSendingReset}
                required
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowForgotPassword(false);
                  setForgotEmail('');
                }}
                disabled={isSendingReset}
              >
                {t('auth.cancel')}
              </Button>
              <Button type="submit" disabled={isSendingReset}>
                {isSendingReset ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('auth.sending')}
                  </>
                ) : (
                  t('auth.send-reset-link')
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>

  );
};

export default LoginForm;