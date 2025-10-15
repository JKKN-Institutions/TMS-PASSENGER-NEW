# Dark Theme Implementation Guide

## Overview
This document outlines the comprehensive dark theme implementation with neon color accents across the TMS Student (Passenger) application.

## Color Palette

### Neon Colors
```css
--neon-green: #00ff88      /* Primary neon accent */
--neon-yellow: #ffff00     /* Warning/highlight accent */
--neon-blue: #00d4ff       /* Info accent */
--neon-orange: #ff6600     /* Error/danger accent */
```

### Dark Backgrounds
```css
--dark-bg-primary: #0a0f1e     /* Main background */
--dark-bg-secondary: #111827   /* Card backgrounds */
--dark-bg-tertiary: #1a1f35    /* Elevated elements */
--dark-bg-elevated: #1f2937    /* Borders and dividers */
```

### Text Colors
```css
--text-primary: #f1f5f9    /* Main text */
--text-secondary: #94a3b8  /* Secondary text */
--text-tertiary: #64748b   /* Tertiary text */
--text-muted: #475569      /* Muted text */
```

## Components Implementation

### 1. Dashboard Cards / Stat Cards ✅

#### File: `components/enhanced-passenger-dashboard.tsx`
- **StatCard Component**: Updated with full dark theme support
- Features:
  - Neon-colored icon backgrounds with glow effects
  - Dynamic borders that glow on hover
  - Gradient backgrounds for change indicators
  - Smooth transitions and animations

#### Usage Example:
```tsx
<StatCard 
  title="Active Routes" 
  value="12" 
  icon={Bus}
  change={{ value: 15, direction: 'up' }}
/>
```

#### Dark Theme Styles:
- Background: `dark:bg-[var(--dark-bg-secondary)]`
- Border: `dark:border-[var(--dark-bg-elevated)]`
- Hover: Neon green glow effect
- Icon container: Tertiary background with neon glow
- Text: Primary and secondary text colors

---

### 2. Card Component ✅

#### File: `components/ui/card.tsx`
All card sub-components support dark theme:
- `Card`: Base card with neon border on hover
- `CardTitle`: Primary text color
- `CardDescription`: Secondary text color
- `CardHeader`, `CardContent`, `CardFooter`: Inherit from Card

#### Features:
- Automatic dark mode detection
- Neon green glow on hover
- Elevated shadows for depth
- Smooth transitions

---

### 3. Data Tables ✅

#### File: `app/globals.css`
Comprehensive table styling with neon accents.

#### Features:
- **Header**: Gradient background with neon green border
- **Rows**: Hover effects with subtle glow
- **Cells**: Proper spacing and borders
- **Responsive**: Mobile-friendly scrolling

#### Standard Table:
```tsx
<table>
  <thead>
    <tr>
      <th>Column 1</th>
      <th>Column 2</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Data 1</td>
      <td>Data 2</td>
    </tr>
  </tbody>
</table>
```

#### Neon Table Variant:
Add `.neon-table` class for extra neon effects:
```tsx
<table className="neon-table">
  {/* table content */}
</table>
```

---

### 4. Forms ✅

#### File: `app/globals.css`
All form elements fully styled for dark theme.

#### Supported Input Types:
- Text, Email, Password, Number
- Tel, URL, Search
- Date, Time
- Textarea
- Select dropdown
- Checkbox & Radio
- File upload
- Range slider

#### Features:
- **Focus State**: Neon green glow
- **Hover State**: Border color change
- **Error State**: Neon orange with glow
- **Success State**: Neon green with glow
- **Custom dropdown arrow**: Neon green SVG
- **File upload button**: Gradient with hover animation

#### Example:
```tsx
<div className="form-group">
  <label htmlFor="email">Email</label>
  <input 
    type="email" 
    id="email" 
    placeholder="Enter your email"
    className="form-input"
  />
</div>
```

#### Error State:
```tsx
<input 
  type="text" 
  className="input-error"
/>
<p className="error-message">This field is required</p>
```

---

### 5. Modals ✅

#### File: `app/globals.css`
Complete modal system with dark theme.

#### Features:
- **Overlay**: Blurred dark background
- **Content**: Dark background with elevated borders
- **Header**: Gradient background with neon title
- **Close Button**: Neon orange on hover
- **Footer**: Subtle background separation

#### Standard Modal:
```tsx
<div className="modal-overlay">
  <div className="modal-content">
    <div className="modal-header">
      <h2 className="modal-title">Modal Title</h2>
      <button className="modal-close">×</button>
    </div>
    <div className="modal-body">
      {/* Content */}
    </div>
    <div className="modal-footer">
      {/* Actions */}
    </div>
  </div>
</div>
```

#### Neon Modal Variant:
```tsx
<div className="modal-content neon-modal">
  {/* Adds gradient border effect */}
</div>
```

---

### 6. Toast Notifications ✅

#### File: `app/globals.css`
Fully styled toast notifications with neon colors.

#### Supported Types:
1. **Success**: Neon green
2. **Error**: Neon orange
3. **Warning**: Neon yellow
4. **Info**: Neon blue
5. **Loading**: Animated neon blue

#### Features:
- Type-specific colors and glows
- Animated icons with glow effects
- Progress bars with neon colors
- Close button with hover effects
- Smooth animations

#### Usage (with react-hot-toast or sonner):
```tsx
import { toast } from 'react-hot-toast';

// Success
toast.success('Operation completed!');

// Error
toast.error('Something went wrong');

// Warning
toast.warning('Please be careful');

// Info
toast.info('New update available');

// Loading
toast.loading('Processing...');
```

#### Custom Toast Classes:
```tsx
<div className="toast-success">
  <div className="toast-icon">✓</div>
  <p>Success message</p>
</div>
```

---

## Utility Classes

### Neon Effects
```css
.neon-border          /* Animated neon border */
.neon-glow-green      /* Green glow effect */
.neon-text            /* Neon text color */
.gradient-text        /* Gradient text effect */
.icon-glow            /* Icon glow effect */
```

### Containers
```css
.glass-card           /* Glassmorphism effect */
.neon-divider         /* Neon divider line */
.animated-bg          /* Animated gradient background */
.pulse-border         /* Pulsing border animation */
```

### Status Badges
```css
.badge                /* Base badge style */
```

---

## Animations

### Available Animations:
1. **neonPulse**: Pulsing glow effect
2. **gradientShift**: Animated gradient movement
3. **spin**: Loading spinner

### Usage:
```css
.my-element {
  animation: neonPulse 2s ease-in-out infinite;
}
```

---

## Best Practices

### 1. Using Dark Theme Classes
Always use the `dark:` prefix for dark mode styles:
```tsx
className="bg-white dark:bg-[var(--dark-bg-primary)]"
```

### 2. Hover Effects
Combine transitions with neon effects:
```tsx
className="transition-all duration-300 dark:hover:shadow-[0_0_20px_var(--neon-green-glow)]"
```

### 3. Accessibility
- Maintain sufficient contrast ratios
- Use semantic HTML elements
- Provide clear focus indicators (already styled)

### 4. Performance
- Use CSS variables for theme values
- Minimize re-renders with proper component structure
- Leverage Tailwind's JIT compilation

---

## Theme Toggle

### Implementation
The theme is managed by `ThemeProvider` context:

```tsx
import { useTheme } from '@/components/theme-provider';

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  
  return (
    <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
      Toggle Theme
    </button>
  );
}
```

---

## Custom Scrollbars

### File: `app/globals.css`
Styled scrollbars with neon accents in dark mode:
- Track: Dark background
- Thumb: Neon green with glow
- Hover: Brighter glow effect

---

## Charts & Graphs

### Recommended Colors
For chart libraries (Chart.js, Recharts, etc.), use:

```javascript
const chartColors = {
  primary: '#00ff88',    // Neon green
  secondary: '#00d4ff',  // Neon blue
  warning: '#ffff00',    // Neon yellow
  danger: '#ff6600',     // Neon orange
  background: '#111827', // Dark bg secondary
  grid: '#1f2937',       // Dark bg elevated
  text: '#f1f5f9'        // Text primary
};
```

### Example (Recharts):
```tsx
<LineChart>
  <Line 
    stroke="var(--neon-green)" 
    strokeWidth={2}
    dot={{ fill: 'var(--neon-green)' }}
  />
  <Line 
    stroke="var(--neon-blue)" 
    strokeWidth={2}
    dot={{ fill: 'var(--neon-blue)' }}
  />
</LineChart>
```

---

## Browser Support
- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support (with -webkit prefixes)
- Mobile browsers: Full support

---

## Testing Checklist

- [ ] All cards display correctly in dark mode
- [ ] Tables are readable with proper contrast
- [ ] Forms have clear focus states
- [ ] Modals have proper backdrop blur
- [ ] Toast notifications display with correct colors
- [ ] Hover effects work smoothly
- [ ] Text is readable in all components
- [ ] Charts use neon color palette
- [ ] Scrollbars are styled consistently
- [ ] Theme toggle works properly

---

## Troubleshooting

### Issue: Dark theme not applying
**Solution**: Ensure `data-theme="dark"` is set on `documentElement`

### Issue: Neon colors not showing
**Solution**: Check that CSS variables are defined in `:root` or `[data-theme="dark"]`

### Issue: Glows not visible
**Solution**: Verify `box-shadow` and `filter: drop-shadow()` are supported

### Issue: Toast colors not applying
**Solution**: Ensure toast library is configured to use custom classes

---

## Future Enhancements

1. **Theme Customization**: Allow users to customize neon colors
2. **Animation Preferences**: Respect `prefers-reduced-motion`
3. **Contrast Modes**: High contrast variant for accessibility
4. **Color Blind Mode**: Alternative color schemes
5. **Theme Presets**: Multiple neon color combinations

---

## File Structure

```
TMS-PASSENGER/
├── app/
│   ├── globals.css              # Main styles with dark theme
│   └── dashboard/
│       └── layout.tsx           # Dark theme sidebar & layout
├── components/
│   ├── ui/
│   │   └── card.tsx            # Dark theme cards
│   ├── theme-provider.tsx      # Theme management
│   └── enhanced-passenger-dashboard.tsx  # Stat cards
└── DARK_THEME_IMPLEMENTATION_GUIDE.md  # This file
```

---

## Support

For issues or questions:
1. Check this documentation
2. Review component implementation
3. Test in different browsers
4. Check browser console for errors

---

**Last Updated**: October 2025  
**Version**: 1.0.0  
**Status**: ✅ Production Ready


