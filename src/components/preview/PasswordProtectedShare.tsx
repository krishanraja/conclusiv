import { useState } from "react";
import { motion } from "framer-motion";
import { Lock, Eye, EyeOff, Copy, Check, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";


interface PasswordProtectedShareProps {
  shareUrl: string;
  onPasswordSet: (password: string | null) => void;
  currentPassword: string | null;
}

export const PasswordProtectedShare = ({
  shareUrl,
  onPasswordSet,
  currentPassword,
}: PasswordProtectedShareProps) => {
  const [isEnabled, setIsEnabled] = useState(!!currentPassword);
  const [password, setPassword] = useState(currentPassword || "");
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleToggle = (enabled: boolean) => {
    setIsEnabled(enabled);
    if (!enabled) {
      setPassword("");
      onPasswordSet(null);
    }
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (value.length >= 4) {
      onPasswordSet(value);
    }
  };

  const copyToClipboard = async () => {
    const textToCopy = isEnabled && password
      ? `${shareUrl}\n\nPassword: ${password}`
      : shareUrl;
    
    await navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    // Button shows checkmark - no toast needed
  };

  const generatePassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(result);
    onPasswordSet(result);
  };

  return (
    <div className="space-y-4">
      {/* URL Display */}
      <div className="flex gap-2">
        <Input value={shareUrl} readOnly className="flex-1 text-sm" />
        <Button onClick={copyToClipboard} variant="outline" size="icon">
          {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
        </Button>
      </div>

      {/* Password Protection Toggle */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-accent/30 border border-border">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-primary/10">
            <Shield className="w-4 h-4 text-primary" />
          </div>
          <div>
            <Label htmlFor="password-toggle" className="text-sm font-medium cursor-pointer">
              Password protection
            </Label>
            <p className="text-xs text-muted-foreground">
              Require a password to view
            </p>
          </div>
        </div>
        <Switch
          id="password-toggle"
          checked={isEnabled}
          onCheckedChange={handleToggle}
        />
      </div>

      {/* Password Input */}
      {isEnabled && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="space-y-2"
        >
          <Label htmlFor="share-password" className="text-sm">Password</Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                id="share-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                placeholder="Enter password (min 4 chars)"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={generatePassword}
              className="shrink-0"
            >
              Generate
            </Button>
          </div>
          {password.length > 0 && password.length < 4 && (
            <p className="text-xs text-amber-500">Password must be at least 4 characters</p>
          )}
        </motion.div>
      )}

      {/* Info */}
      <p className="text-xs text-muted-foreground">
        {isEnabled && password.length >= 4 ? (
          <span className="flex items-center gap-1">
            <Lock className="w-3 h-3" />
            Link is password protected. Share the password separately for security.
          </span>
        ) : (
          "Anyone with this link can view your narrative."
        )}
      </p>
    </div>
  );
};
