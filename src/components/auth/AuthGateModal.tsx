/**
 * AuthGateModal
 * 
 * Value-before-signup gating modal. Shows after the first free build when user tries to:
 * - Share their narrative
 * - Build another narrative
 * - Access pro features
 * 
 * Implements "Model A: Hard Gate" from the auth audit plan.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { X, Sparkles, Lock, Mail, User, Eye, EyeOff, Loader2, CheckCircle } from 'lucide-react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const emailSchema = z.string().trim().email('Please enter a valid email address');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');

type GateTrigger = 'share' | 'build_limit' | 'export' | 'pro_feature';

interface AuthGateModalProps {
  isOpen: boolean;
  onClose: () => void;
  trigger: GateTrigger;
  onSuccess?: () => void;
}

const triggerMessages: Record<GateTrigger, { title: string; description: string }> = {
  share: {
    title: 'Save & share your narrative',
    description: 'Create a free account to share your narrative with a link and save it for later.',
  },
  build_limit: {
    title: 'Keep building great narratives',
    description: "You've used your free build. Create an account to continue building unlimited narratives.",
  },
  export: {
    title: 'Export your narrative',
    description: 'Create a free account to export your narrative as PDF or PowerPoint.',
  },
  pro_feature: {
    title: 'Unlock this feature',
    description: 'Create a free account to access this feature and save your work.',
  },
};

export const AuthGateModal = ({ isOpen, onClose, trigger, onSuccess }: AuthGateModalProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [mode, setMode] = useState<'signup' | 'signin'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const message = triggerMessages[trigger];

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

    try {
      emailSchema.parse(email);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.email = e.errors[0]?.message;
      }
    }

    try {
      passwordSchema.parse(password);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.password = e.errors[0]?.message;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              display_name: displayName || email.split('@')[0],
            },
          },
        });

        if (error) {
          if (error.message.includes('already registered')) {
            toast({
              title: 'Account exists',
              description: 'An account with this email already exists. Try signing in.',
              variant: 'destructive',
            });
            setMode('signin');
          } else {
            toast({
              title: 'Sign up failed',
              description: error.message,
              variant: 'destructive',
            });
          }
          return;
        }

        toast({
          title: 'Account created!',
          description: 'Your narrative has been saved.',
        });
        onSuccess?.();
        onClose();
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          toast({
            title: 'Sign in failed',
            description: error.message.includes('Invalid login credentials')
              ? 'Please check your email and password'
              : error.message,
            variant: 'destructive',
          });
          return;
        }

        toast({
          title: 'Welcome back!',
          description: 'You are now signed in.',
        });
        onSuccess?.();
        onClose();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    onClose();
    navigate('/auth?mode=reset');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 p-4"
          >
            <div className="relative bg-card rounded-2xl border border-border shadow-2xl overflow-hidden">
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute right-4 top-4 p-2 rounded-full hover:bg-muted transition-colors z-10"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>

              {/* Header */}
              <div className="p-6 pb-4 text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  {trigger === 'share' && <Sparkles className="w-8 h-8 text-primary" />}
                  {trigger === 'build_limit' && <Lock className="w-8 h-8 text-primary" />}
                  {trigger === 'export' && <Sparkles className="w-8 h-8 text-primary" />}
                  {trigger === 'pro_feature' && <Sparkles className="w-8 h-8 text-primary" />}
                </div>
                <h2 className="text-xl font-semibold text-foreground">{message.title}</h2>
                <p className="text-sm text-muted-foreground mt-2">{message.description}</p>
              </div>

              {/* Benefits */}
              <div className="px-6 py-4 bg-muted/30 border-y border-border/50">
                <div className="grid grid-cols-1 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                    <span>Save and access your narratives anywhere</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                    <span>Create shareable links</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                    <span>Free forever, upgrade when you need more</span>
                  </div>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {mode === 'signup' && (
                  <div className="space-y-2">
                    <Label htmlFor="displayName" className="text-sm">
                      Name <span className="text-muted-foreground">(optional)</span>
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="displayName"
                        type="text"
                        placeholder="Your name"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setErrors((prev) => ({ ...prev, email: undefined }));
                      }}
                      className={`pl-10 ${errors.email ? 'border-destructive' : ''}`}
                    />
                  </div>
                  {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setErrors((prev) => ({ ...prev, password: undefined }));
                      }}
                      className={`pl-10 pr-10 ${errors.password ? 'border-destructive' : ''}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                </div>

                <Button type="submit" variant="shimmer" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : mode === 'signup' ? (
                    'Create account'
                  ) : (
                    'Sign in'
                  )}
                </Button>

                {/* Mode switcher */}
                <div className="text-center text-sm">
                  {mode === 'signup' ? (
                    <p className="text-muted-foreground">
                      Already have an account?{' '}
                      <button
                        type="button"
                        onClick={() => setMode('signin')}
                        className="text-primary hover:underline"
                      >
                        Sign in
                      </button>
                    </p>
                  ) : (
                    <>
                      <p className="text-muted-foreground">
                        Don't have an account?{' '}
                        <button
                          type="button"
                          onClick={() => setMode('signup')}
                          className="text-primary hover:underline"
                        >
                          Sign up
                        </button>
                      </p>
                      <button
                        type="button"
                        onClick={handleForgotPassword}
                        className="text-muted-foreground hover:text-foreground text-xs mt-2"
                      >
                        Forgot password?
                      </button>
                    </>
                  )}
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

/**
 * Hook to manage auth gate state
 */
export const useAuthGate = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [trigger, setTrigger] = useState<GateTrigger>('share');
  const [onSuccessCallback, setOnSuccessCallback] = useState<(() => void) | undefined>();

  const showGate = (gateTrigger: GateTrigger, onSuccess?: () => void) => {
    setTrigger(gateTrigger);
    setOnSuccessCallback(() => onSuccess);
    setIsOpen(true);
  };

  const hideGate = () => {
    setIsOpen(false);
  };

  return {
    isOpen,
    trigger,
    onSuccess: onSuccessCallback,
    showGate,
    hideGate,
  };
};

