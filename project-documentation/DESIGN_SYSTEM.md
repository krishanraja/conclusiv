# conclusiv Design System

## Overview

conclusiv uses a dark, cinematic aesthetic with shimmer accents. The design prioritizes clarity, focus, and professional presentation.

## Brand Guidelines

- **Name**: Always "conclusiv" (lowercase 's', never "Conclusiv" or "CONCLUSIV")
- **C. Icon**: Used as favicon, app icon, watermark in presentations
- **Text Logo**: Used in header alongside the C. icon
- **Aspect Ratios**: Never distort logo assets - always preserve proportions

## Colors

### Core Palette (HSL)

```css
/* Background layers */
--background: 222 47% 5%;      /* Deep dark blue */
--card: 222 47% 8%;            /* Elevated surfaces */
--popover: 222 47% 8%;         /* Floating elements */

/* Text colors */
--foreground: 0 0% 95%;        /* Primary text */
--muted-foreground: 215 20% 55%; /* Secondary text */

/* Brand colors */
--primary: 199 89% 48%;        /* Cyan accent */
--primary-foreground: 222 47% 5%;

/* Shimmer gradient */
--shimmer-start: 199 89% 58%;  /* Light cyan */
--shimmer-end: 262 83% 58%;    /* Purple */

/* Semantic colors */
--destructive: 0 72% 51%;      /* Error red */
--success: 142 76% 36%;        /* Success green */
```

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
```

### Loading Animation

```tsx
// Spinner rotation
animate={{ rotate: 360 }}
transition={{ duration: 2, repeat: Infinity, ease: "linear" }}

// Pulse effect
animate={{ scale: [1, 1.1, 1] }}
transition={{ duration: 2, repeat: Infinity }}
```

### Mobile Animations (with Haptics)

```tsx
// Import mobile-optimized animations
import { PulseRing, CardStackSwipe, ScrollRevealItem, MagneticButton, RadialProgress } from '@/components/mobile/MobileAnimations';

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
