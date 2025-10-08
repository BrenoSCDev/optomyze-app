import React, { useState } from 'react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from '../ui/use-toast';
import optomyzeLogo from '../../assets/optomyze.png';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  const { t } = useLanguage();
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
    <div className="w-full max-w-md animate-fade-in">
      {/* Glassmorphism Login Card */}
      <div className="rounded-3xl p-8 lg:p-10 shadow-2xl border border-white/20 backdrop-blur-xl bg-white/10 transition-all duration-300 hover:bg-white/15 hover:shadow-glow">
        {/* Logo */}
        <div className="text-center mb-8">
          <img
            src={optomyzeLogo}
            alt="Optomyze"
            className="h-12 mx-auto mb-6 filter brightness-0 invert"
          />
          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">{t('auth.welcome')}</h1>
          <p className="text-white/80 text-sm lg:text-base">{t('auth.subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-white">
              {t('auth.email')}
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              className="bg-white/10 border-white/30 text-white placeholder:text-white/60 focus:border-purple-400 focus:ring-purple-400/20 h-12 transition-all"
              required
            />
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-white">
              {t('auth.password')}
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="bg-white/10 border-white/30 text-white placeholder:text-white/60 focus:border-purple-400 focus:ring-purple-400/20 pr-10 h-12 transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors"
                disabled={isLoading}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-white text-black hover:bg-white/90 transition-all duration-300 h-12 font-semibold shadow-lg hover:shadow-xl"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('auth.signingin')}
              </>
            ) : (
              t('auth.signin')
            )}
          </Button>

          {/* Forgot Password Link */}
          <div className="text-center">
            <button
              type="button"
              className="text-sm text-white/60 hover:text-white transition-colors"
              disabled={isLoading}
            >
              Forgot your password?
            </button>
          </div>
        </form>
      </div>
    </div>

  );
};

export default LoginForm;