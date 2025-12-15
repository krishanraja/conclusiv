import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  User, 
  LogOut, 
  Sparkles, 
  CreditCard, 
  Loader2, 
  Trash2, 
  ExternalLink, 
  Copy,
  Check,
  ArrowLeft,
  Calendar,
  FileText
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { useNarrativeStore } from '@/store/narrativeStore';
import { useIsMobile } from '@/hooks/use-mobile';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import type { NarrativeSchema } from '@/lib/types';

interface Narrative {
  id: string;
  title: string | null;
  share_id: string | null;
  created_at: string | null;
  narrative_data: NarrativeSchema;
  is_public: boolean | null;
}

export default function Profile() {
  const navigate = useNavigate();
  const { user, signOut, isLoading: authLoading } = useAuth();
  const { isPro, isTrial, trialDaysRemaining, usage, limits } = useSubscription();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { setNarrative, setCurrentStep } = useNarrativeStore();

  const [narratives, setNarratives] = useState<Narrative[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isUpgrading, setIsUpgrading] = useState(false);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, navigate, authLoading]);

  // Fetch user narratives
  useEffect(() => {
    if (!user) return;

    const fetchNarratives = async () => {
      try {
        const { data, error } = await supabase
          .from('narratives')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setNarratives(data || []);
      } catch (err) {
        console.error('Error fetching narratives:', err);
        toast({
          title: 'Error',
          description: 'Failed to load your saved demos',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchNarratives();
  }, [user, toast]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleDelete = async (narrativeId: string) => {
    if (!confirm('Are you sure you want to delete this demo?')) return;

    setIsDeleting(narrativeId);
    try {
      const { error } = await supabase
        .from('narratives')
        .delete()
        .eq('id', narrativeId);

      if (error) throw error;

      setNarratives(prev => prev.filter(n => n.id !== narrativeId));
      toast({
        title: 'Deleted',
        description: 'Demo deleted successfully',
      });
    } catch (err) {
      console.error('Error deleting narrative:', err);
      toast({
        title: 'Error',
        description: 'Failed to delete demo',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(null);
    }
  };

  const handleView = async (narrative: Narrative) => {
    try {
      setNarrative(narrative.narrative_data);
      setCurrentStep('preview');
      navigate('/');
    } catch (err) {
      console.error('Error loading narrative:', err);
      toast({
        title: 'Error',
        description: 'Failed to load demo',
        variant: 'destructive',
      });
    }
  };

  const handleShare = (shareId: string | null) => {
    if (!shareId) {
      toast({
        title: 'No share link',
        description: 'This demo does not have a share link',
        variant: 'destructive',
      });
      return;
    }

    const url = `${window.location.origin}/share/${shareId}`;
    navigator.clipboard.writeText(url);
    toast({
      title: 'Copied',
      description: 'Share link copied to clipboard',
    });
  };

  const handleCopyShareId = (shareId: string | null, narrativeId: string) => {
    if (!shareId) {
      toast({
        title: 'No share link',
        description: 'This demo does not have a share link',
        variant: 'destructive',
      });
      return;
    }

    const url = `${window.location.origin}/share/${shareId}`;
    navigator.clipboard.writeText(url);
    setCopiedId(narrativeId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleUpgrade = async () => {
    setIsUpgrading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout');
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error('Failed to create checkout:', err);
      toast({
        title: 'Error',
        description: 'Failed to start checkout process',
        variant: 'destructive',
      });
      setIsUpgrading(false);
    }
  };

  const handleManageBilling = async () => {
    setIsUpgrading(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error('Failed to open billing portal:', err);
      toast({
        title: 'Error',
        description: 'Failed to open billing portal',
        variant: 'destructive',
      });
      setIsUpgrading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const displayName = user.user_metadata?.display_name || user.email?.split('@')[0] || 'User';
  const buildsRemaining = isPro ? '∞' : Math.max(0, limits.buildsPerWeek - usage.buildsThisWeek);
  const formattedDate = (date: string | null) => {
    if (!date) return 'Unknown';
    return new Date(date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 sm:px-6 py-8 sm:py-12 max-w-4xl">
        {/* Back button */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to app
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* User Profile Section */}
          <div className="glass-strong rounded-xl p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                <User className="w-8 h-8 text-primary" />
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-semibold text-foreground">{displayName}</h1>
                <p className="text-sm text-muted-foreground mt-1">{user.email}</p>
              </div>
            </div>

            {/* Account Status */}
            <div className="border-t border-border/30 pt-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Account Status</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-muted/30 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Plan</p>
                  <div className="flex items-center gap-2">
                    {isPro ? (
                      <span className="px-3 py-1 rounded-full bg-primary/20 text-primary font-medium text-sm">
                        {isTrial ? `Trial (${trialDaysRemaining}d left)` : 'Pro Plan'}
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full bg-muted text-muted-foreground font-medium text-sm">
                        Free Plan
                      </span>
                    )}
                  </div>
                </div>
                <div className="p-4 bg-muted/30 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Builds Remaining</p>
                  <p className="text-lg font-semibold text-foreground">
                    {buildsRemaining === '∞' ? 'Unlimited' : buildsRemaining}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Saved Demos Section */}
          <div className="glass-strong rounded-xl p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Saved Demos</h2>
            
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : narratives.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No saved demos yet</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Create and share your first demo to see it here
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {narratives.map((narrative) => (
                  <div
                    key={narrative.id}
                    className="p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-foreground truncate">
                          {narrative.title || 'Untitled Demo'}
                        </h3>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4" />
                            {formattedDate(narrative.created_at)}
                          </div>
                          {narrative.share_id && (
                            <div className="flex items-center gap-1.5">
                              <ExternalLink className="w-4 h-4" />
                              Shared
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleView(narrative)}
                          className="h-8"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                        {narrative.share_id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyShareId(narrative.share_id, narrative.id)}
                            className="h-8"
                          >
                            {copiedId === narrative.id ? (
                              <Check className="w-4 h-4 text-primary" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(narrative.id)}
                          disabled={isDeleting === narrative.id}
                          className="h-8 text-destructive hover:text-destructive"
                        >
                          {isDeleting === narrative.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upgrade Section */}
          {!isPro && (
            <div className="glass-strong rounded-xl p-6 border border-primary/20">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-foreground mb-2">Upgrade to Pro</h2>
                  <p className="text-sm text-muted-foreground">
                    Unlock unlimited builds and premium features
                  </p>
                </div>
              </div>

              {/* Feature Comparison */}
              <div className="mb-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    'Unlimited builds',
                    'All templates',
                    'PDF & PPTX export',
                    'No watermark',
                    'Custom icons & themes',
                    'Section reordering',
                    'Full presentation mode',
                  ].map((feature) => (
                    <div key={feature} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-primary flex-shrink-0" />
                      <span className="text-foreground">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleUpgrade}
                disabled={isUpgrading}
                variant="shimmer"
                className="w-full"
              >
                {isUpgrading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Upgrade to Pro
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Manage Billing (Pro users) */}
          {isPro && (
            <div className="glass-strong rounded-xl p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Billing</h2>
              <Button
                onClick={handleManageBilling}
                disabled={isUpgrading}
                variant="outline"
                className="w-full sm:w-auto"
              >
                {isUpgrading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Loading...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Manage Billing
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Sign Out */}
          <div className="glass-strong rounded-xl p-6">
            <Button
              onClick={handleSignOut}
              variant="outline"
              className="w-full sm:w-auto text-destructive hover:text-destructive border-destructive/20 hover:border-destructive/40"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}

