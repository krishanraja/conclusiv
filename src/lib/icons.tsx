import { 
  Lightbulb, TrendingUp, ShieldAlert, GitBranch, Target,
  BookOpen, Sparkles, CheckCircle, ArrowRight, Map,
  Users, Trophy, Search, Layout, MinusCircle, PlusCircle,
  Scale, CheckSquare, Box, Circle, Triangle, Star, Flag,
  LucideIcon,
} from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  "lightbulb": Lightbulb,
  "trending-up": TrendingUp,
  "shield-alert": ShieldAlert,
  "git-branch": GitBranch,
  "target": Target,
  "book-open": BookOpen,
  "sparkles": Sparkles,
  "check-circle": CheckCircle,
  "arrow-right": ArrowRight,
  "map": Map,
  "users": Users,
  "trophy": Trophy,
  "search": Search,
  "layout": Layout,
  "minus-circle": MinusCircle,
  "plus-circle": PlusCircle,
  "scale": Scale,
  "check-square": CheckSquare,
  "box": Box,
  "circle": Circle,
  "triangle": Triangle,
  "star": Star,
  "flag": Flag,
  "chess": Target, // fallback
};

export const getIcon = (iconName: string): LucideIcon => {
  return iconMap[iconName] || Circle;
};

export const availableIcons = Object.keys(iconMap);
