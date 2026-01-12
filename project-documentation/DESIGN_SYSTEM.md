# conclusiv Design System

## Overview

conclusiv uses a dark, cinematic aesthetic with shimmer accents. The design prioritizes clarity, focus, and professional presentation. Mobile-first with haptic feedback and smooth animations.

## Brand Guidelines

- **Name**: Always "conclusiv" (lowercase 'c', never "Conclusiv" or "CONCLUSIV")
- **C. Icon**: Used as favicon, app icon, loading indicator, watermark in presentations
- **Text Logo**: Used in header alongside the C. icon
- **Aspect Ratios**: Never distort logo assets - always preserve proportions

## Colors

### Core Palette (HSL)

```css
/* Background layers */
--background: 0 0% 2%;         /* Deep dark black */
--card: 0 0% 4%;               /* Elevated surfaces */
--popover: 0 0% 4%;            /* Floating elements */

/* Text colors */
--foreground: 0 0% 98%;        /* Primary text */
--muted-foreground: 0 0% 72%;  /* Secondary text */

/* Brand colors - Green/Teal gradient */
--primary: 78 100% 83%;         /* Light yellowish-green (#E2FFC4) */
--primary-foreground: 0 0% 2%;  /* Dark text on light primary */

/* Shimmer gradient - matches logo gradient */
--shimmer-start: 78 100% 83%;  /* Light yellowish-green - start of gradient */
--shimmer-end: 157 35% 28%;     /* Dark teal-green - end of gradient */

/* Accent color */
--accent: 157 35% 28%;          /* Dark teal-green - matches shimmer-end */

/* Semantic colors */
--destructive: 0 72% 51%;      /* Error red */
--success: 142 76% 36%;        /* Success green */
--warning: 45 93% 47%;         /* Warning amber */
```

### Brand Color Details

The conclusiv brand uses a **green-to-teal gradient** that matches the logo:
- **Primary/Shimmer Start**: Light yellowish-green (HSL: 78 100% 83%, Hex: ~#E2FFC4)
- **Shimmer End/Accent**: Dark teal-green (HSL: 157 35% 28%, Hex: ~#35745C)

This gradient creates the signature conclusiv aesthetic seen in the logo and throughout the interface.

### Color Usage

| Use Case | Token |
|----------|-------|
| Page background | `bg-background` |
| Card/container | `bg-card` |
| Primary text | `text-foreground` |
| Secondary text | `text-muted-foreground` |
| Interactive elements | `text-primary` |
| Borders | `border-border` |
| Shimmer effects | `from-shimmer-start to-shimmer-end` |
| Error states | `text-destructive` |
| Success states | `text-success` |

### Color Do's and Don'ts

```tsx
// ✅ Correct - use semantic tokens
className="bg-primary text-primary-foreground"
className="text-muted-foreground"
className="bg-card border-border"

// ❌ Wrong - no hardcoded colors
className="bg-cyan-500 text-black"
className="bg-[#1a1a2e]"
className="text-gray-500"
```

## Typography

### Font Stack

```css
font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
```

### Scale

| Name | Class | Size | Weight | Use |
|------|-------|------|--------|-----|
| Hero | `text-4xl md:text-5xl` | 36-48px | 700 | Page titles |
| Heading | `text-2xl` | 24px | 600 | Section titles |
| Subheading | `text-lg` | 18px | 500 | Card headers |
| Body | `text-base` | 16px | 400 | Content |
| Small | `text-sm` | 14px | 400 | Captions |
| Tiny | `text-xs` | 12px | 400 | Labels |

## Spacing

### Scale (Tailwind)

| Size | Pixels | Use |
|------|--------|-----|
| `1` | 4px | Tight spacing |
| `2` | 8px | Component gaps |
| `4` | 16px | Section padding |
| `6` | 24px | Card padding |
| `8` | 32px | Section gaps |
| `12` | 48px | Page margins |

## Components

### Button Variants

```tsx
// Primary action
<Button variant="shimmer">Build Story</Button>

// Secondary action
<Button variant="outline">Cancel</Button>

// Ghost/subtle
<Button variant="ghost">Back</Button>

// Destructive
<Button variant="destructive">Delete</Button>
```

### Shimmer Border Effect

```tsx
// Applied via shimmer-border class
<div className="shimmer-border p-6 rounded-xl">
  Content with animated gradient border
</div>
```

### Cards

```tsx
<Card className="bg-card/50 border-border/30 backdrop-blur-sm">
  <CardContent>...</CardContent>
</Card>
```

### Inputs

```tsx
<Input 
  className="bg-background border-border focus:border-primary"
  placeholder="Enter text..."
/>
```

## Animation

### Transitions

```css
/* Standard transition */
transition: all 0.2s ease;

/* Smooth spring */
transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
```

### Framer Motion Presets

```tsx
// Fade in from bottom
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}

// Fade in scale
initial={{ opacity: 0, scale: 0.95 }}
animate={{ opacity: 1, scale: 1 }}

// Exit
exit={{ opacity: 0, y: -10 }}

// Spring animation
transition={{ type: "spring", stiffness: 300, damping: 30 }}
```

### Loading Animation

The branded loading experience uses a single, consistent design throughout:
- C logo rotates continuously in the center
- Progress ring surrounds the logo (indeterminate for simple loading, determinate for staged)
- Progress only animates forward (never backwards) for stability
- Subtle glow effects for premium feel

```tsx
// Branded loading - C logo rotates in center of progress ring
<div className="relative flex items-center justify-center">
  {/* Outer glow */}
  <motion.div
    className="absolute w-28 h-28 rounded-full bg-shimmer-start/10 blur-xl"
    animate={{ opacity: [0.3, 0.4, 0.3] }}
  />
  
  {/* Progress ring */}
  <svg className="w-24 h-24" viewBox="0 0 96 96">
    <circle r="42" className="text-muted/20" /> {/* Background */}
    <motion.circle
      stroke="url(#loading-gradient)"
      strokeDasharray="66 264" /* Indeterminate */
      animate={{ rotate: 360 }}
    />
  </svg>
  
  {/* Rotating C logo */}
  <motion.div
    animate={{ rotate: 360 }}
    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
  >
    <img src={criticalImages.conclusivIcon} className="w-10 h-10" />
  </motion.div>
</div>

// Use LoadingOverlay for consistent branded loading
import { LoadingOverlay } from "@/components/ui/loading";

// Simple loading (indeterminate spinner)
<LoadingOverlay message="Processing..." />

// Staged loading with progress (determinate ring)
<LoadingOverlay stage={2} progress={45} inputLength={5000} />
```

**Key Rules:**
- Never show two different loading formats - always use C logo in center
- Progress only moves forward - track previous value and ignore backwards changes
- Use consistent dimensions: 24x24 ring with 10x10 logo (simple) or 32x32 ring with 14x14 logo (staged)
- Glow effect uses shimmer-start color at low opacity

### Mobile Animations (with Haptics)

```tsx
// Import mobile-optimized animations
import { 
  PulseRing, 
  CardStackSwipe, 
  ScrollRevealItem, 
  MagneticButton, 
  RadialProgress 
} from '@/components/mobile/MobileAnimations';

// Pulse Ring - Expands with haptic on interaction
<PulseRing isActive={true} onPulse={() => console.log('Pulsed')}>
  <Icon />
</PulseRing>

// Card Stack Swipe - Interactive card swiping
<CardStackSwipe 
  items={[{ id: '1', content: <Card /> }]}
  onSwipe={(id, direction) => console.log(id, direction)}
/>

// Scroll Reveal - Smooth scroll-triggered reveals
<ScrollRevealItem index={0}>
  <Content />
</ScrollRevealItem>

// Magnetic Button - Pulls toward touch
<MagneticButton onClick={handleClick}>
  Click me
</MagneticButton>

// Radial Progress - Circular progress with milestones
<RadialProgress value={75} milestones={[25, 50, 75, 100]} />
```

### Haptic Feedback

```tsx
import { useHaptics } from '@/hooks/useHaptics';

const haptics = useHaptics();

// Haptic types
haptics.light();      // 10ms - subtle feedback
haptics.medium();     // 25ms - standard interaction
haptics.heavy();      // 50ms - significant action
haptics.success();    // Pattern for success
haptics.error();      // Pattern for error
haptics.selection();  // 5ms - selection change
```

## Icons

### Icon Library
Using Lucide React for consistent iconography.

### Common Icons

| Icon | Use |
|------|-----|
| `Sparkles` | AI/magic actions |
| `Mic` | Voice input |
| `Play` | Present mode |
| `ArrowLeft/Right` | Navigation |
| `Check` | Success state |
| `X` | Close/cancel |
| `Loader2` | Loading spinner |
| `PanelLeftOpen/RightOpen` | Sidebar toggles |
| `Crown` | Executive mode |
| `TrendingUp` | Investors mode |
| `Users` | Clients mode |
| `Target` | Briefing mode |

### Icon Sizing

| Size | Class | Use |
|------|-------|-----|
| Small | `w-4 h-4` | In buttons |
| Medium | `w-5 h-5` | Standalone |
| Large | `w-6 h-6` | Section icons |
| Hero | `w-8 h-8` | Feature icons |

## Layout Patterns

### Centered Content

```tsx
<div className="min-h-screen flex items-center justify-center p-6">
  <div className="w-full max-w-2xl">...</div>
</div>
```

### Split Layout (Preview)

```tsx
<div className="flex h-screen">
  <div className="w-2/3">Main content</div>
  <div className="w-1/3 border-l">Sidebar</div>
</div>
```

### Fullscreen (Present)

```tsx
<div className="fixed inset-0 bg-background">
  <AnimatePresence mode="wait">
    {currentSection}
  </AnimatePresence>
</div>
```

### Mobile Edge Buttons

```tsx
// Always-visible edge buttons for sidebar access
<motion.button
  className="fixed left-0 top-1/2 -translate-y-1/2 z-50"
  initial={{ x: -50, opacity: 0 }}
  animate={{ x: 0, opacity: 1 }}
  transition={{ delay: 0.5 }}
>
  <PanelLeftOpen className="w-5 h-5" />
</motion.button>
```

## Responsive Breakpoints

| Breakpoint | Width | Use |
|------------|-------|-----|
| `sm` | 640px | Mobile landscape |
| `md` | 768px | Tablet |
| `lg` | 1024px | Desktop |
| `xl` | 1280px | Large desktop |

## Accessibility

### Focus States
```css
focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
```

### Color Contrast
- All text meets WCAG AA standards
- Interactive elements have visible focus states
- Error states use both color and icons

### Motion Preferences
```css
@media (prefers-reduced-motion: reduce) {
  * { animation-duration: 0.01ms !important; }
}
```

### Haptic Accessibility
```tsx
// Check for reduced motion before haptics
const haptics = useHaptics();
if (!reducedMotion) {
  haptics.medium();
}
```

## Notification System

```tsx
import { useNotification } from '@/components/ui/InlineNotification';

const { show } = useNotification();

// Success notification
show({ type: 'success', message: 'Narrative built successfully!' });

// Error notification
show({ type: 'error', message: 'Failed to process. Try again.' });

// Info notification
show({ type: 'info', message: 'Processing your request...' });
```

## Z-Index Scale

| Layer | Z-Index | Use |
|-------|---------|-----|
| Background | 0 | Base layer |
| Content | 10 | Main content |
| Elevated | 20 | Cards, panels |
| Sidebar | 50 | Side panels |
| Modal Backdrop | 100 | Modal backgrounds |
| Modal | 101 | Modal content |
| Tooltip | 200 | Tooltips |
| Toast | 300 | Notifications |

---

*Last updated: 2025-01-03*
