import { 
  Lightbulb, TrendingUp, ShieldAlert, GitBranch, Target,
  BookOpen, Sparkles, CheckCircle, ArrowRight, Map,
  Users, Trophy, Search, Layout, MinusCircle, PlusCircle,
  Scale, CheckSquare, Box, Circle, Triangle, Star, Flag,
  LucideIcon,
} from "lucide-react";

export const iconMap: Record<string, LucideIcon> = {
  "Lightbulb": Lightbulb,
  "lightbulb": Lightbulb,
  "TrendingUp": TrendingUp,
  "trending-up": TrendingUp,
  "Target": Target,
  "target": Target,
  "Shield": ShieldAlert,
  "shield-alert": ShieldAlert,
  "AlertTriangle": ShieldAlert,
  "CheckCircle": CheckCircle,
  "check-circle": CheckCircle,
  "BarChart3": TrendingUp,
  "Users": Users,
  "users": Users,
  "Zap": Sparkles,
  "sparkles": Sparkles,
  "Globe": Map,
  "map": Map,
  "Star": Star,
  "star": Star,
  "Award": Trophy,
  "trophy": Trophy,
  "Clock": Circle,
  "DollarSign": Target,
  "git-branch": GitBranch,
  "book-open": BookOpen,
  "arrow-right": ArrowRight,
  "search": Search,
  "layout": Layout,
  "minus-circle": MinusCircle,
  "plus-circle": PlusCircle,
  "scale": Scale,
  "check-square": CheckSquare,
  "box": Box,
  "circle": Circle,
  "triangle": Triangle,
  "flag": Flag,
};

export const getIcon = (iconName: string): LucideIcon => {
  return iconMap[iconName] || Circle;
};

export const availableIcons = Object.keys(iconMap);
