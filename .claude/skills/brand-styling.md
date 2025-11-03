# Brand Styling Skill

A comprehensive skill for systematically updating brand styling across the entire TMS (Transport Management System) application. This skill edits existing styles page by page and component by component in a single, organized workflow.

## Purpose

This skill enables complete brand transformation of the TMS application by:
- Systematically analyzing and updating all pages
- Modifying all components with consistent styling
- Applying brand colors, typography, spacing, and visual elements
- Maintaining design consistency across the entire application
- Processing the entire application in a single execution

## When to Use

Use this skill when you need to:
- Apply new brand guidelines to the entire application
- Change color schemes across all pages and components
- Update typography system-wide
- Modify spacing, shadows, borders, or other design tokens
- Ensure visual consistency across the application
- Rebrand or refresh the application's look and feel

## Brand Styling Workflow

### Phase 1: Analysis and Planning

1. **Inventory All Files**
   ```
   Find all pages in: app/*/page.tsx
   Find all components in: components/**/*.tsx
   Find all layouts in: app/*/layout.tsx
   Find global styles: app/globals.css, tailwind.config.ts
   ```

2. **Categorize by Type**
   - Pages (dashboard, schedules, bookings, etc.)
   - Shared components (buttons, cards, modals, etc.)
   - Layout components (headers, sidebars, navigation)
   - Global styles and configuration

3. **Create Modification Plan**
   - List all files to modify
   - Group by dependencies (global → components → pages)
   - Estimate scope and complexity

### Phase 2: Define Brand Style System

Before starting modifications, define the complete brand style system:

**Colors:**
```typescript
const brandColors = {
  primary: {
    50: '#...',   // Lightest
    100: '#...',
    200: '#...',
    300: '#...',
    400: '#...',
    500: '#...',  // Main brand color
    600: '#...',
    700: '#...',
    800: '#...',
    900: '#...',  // Darkest
  },
  secondary: { /* ... */ },
  accent: { /* ... */ },
  neutral: { /* ... */ },
  semantic: {
    success: '#...',
    warning: '#...',
    error: '#...',
    info: '#...',
  }
}
```

**Typography:**
```typescript
const typography = {
  fontFamily: {
    sans: ['Inter', 'system-ui', 'sans-serif'],
    display: ['Poppins', 'sans-serif'],
  },
  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem',  // 36px
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  }
}
```

**Spacing & Layout:**
```typescript
const spacing = {
  unit: 4, // Base unit in pixels
  scale: [0, 4, 8, 12, 16, 24, 32, 48, 64, 96, 128], // Spacing scale
  containerMaxWidth: '1280px',
  borderRadius: {
    sm: '0.25rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    '2xl': '1.5rem',
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  }
}
```

**Component Patterns:**
```typescript
const componentPatterns = {
  button: {
    base: 'rounded-lg font-medium transition-colors',
    primary: 'bg-primary-600 text-white hover:bg-primary-700',
    secondary: 'bg-secondary-100 text-secondary-900 hover:bg-secondary-200',
    sizes: {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg',
    }
  },
  card: {
    base: 'bg-white rounded-xl shadow-md border border-gray-200',
    hover: 'hover:shadow-lg transition-shadow',
    padding: 'p-6',
  },
  input: {
    base: 'w-full rounded-lg border border-gray-300 px-4 py-2',
    focus: 'focus:ring-2 focus:ring-primary-500 focus:border-transparent',
  }
}
```

### Phase 3: Systematic File Modification

**Order of Modification:**

1. **Global Configuration (First)**
   - `tailwind.config.ts` - Update theme configuration
   - `app/globals.css` - Update CSS variables and base styles
   - Create/update design token files

2. **Shared Components (Second)**
   - UI components (buttons, inputs, cards)
   - Layout components (headers, sidebars)
   - Utility components (modals, tooltips, alerts)

3. **Page Components (Third)**
   - Dashboard pages
   - Feature pages (schedules, bookings, routes, etc.)
   - Authentication pages (login, register)
   - Error pages (404, 500)

4. **Specialized Components (Last)**
   - Charts and data visualizations
   - Maps and location components
   - Complex interactive components

### Phase 4: Modification Process per File

For each file, follow this process:

**1. Read and Analyze:**
```typescript
// Read the file
const content = await readFile(filePath);

// Identify styling patterns
const patterns = {
  colors: extractColorClasses(content),
  spacing: extractSpacingClasses(content),
  typography: extractTypographyClasses(content),
  components: extractComponentPatterns(content),
};
```

**2. Create Modification Plan:**
```typescript
const modifications = {
  colors: {
    'bg-blue-600': 'bg-primary-600',
    'text-blue-600': 'text-primary-600',
    'border-blue-500': 'border-primary-500',
  },
  spacing: {
    'p-4': 'p-6',  // Increase padding
    'm-2': 'm-4',  // Increase margin
  },
  typography: {
    'font-sans': 'font-display',
    'text-base': 'text-lg',
  },
  components: {
    button: applyButtonPattern,
    card: applyCardPattern,
    input: applyInputPattern,
  }
};
```

**3. Apply Modifications:**
```typescript
let updatedContent = content;

// Replace color classes
for (const [old, new] of Object.entries(modifications.colors)) {
  updatedContent = updatedContent.replaceAll(old, new);
}

// Apply component patterns
updatedContent = applyComponentPatterns(updatedContent, componentPatterns);

// Ensure consistency
updatedContent = ensureConsistency(updatedContent);
```

**4. Verify and Save:**
```typescript
// Verify valid JSX/TSX
verifyReactSyntax(updatedContent);

// Save modified file
await writeFile(filePath, updatedContent);

// Log changes
console.log(`✅ Updated: ${filePath}`);
console.log(`   - ${Object.keys(modifications).length} modification types applied`);
```

### Phase 5: Pattern-Based Replacements

**Color Patterns:**
```typescript
const colorReplacements = {
  // Primary colors
  'bg-blue-50': 'bg-primary-50',
  'bg-blue-100': 'bg-primary-100',
  'bg-blue-500': 'bg-primary-500',
  'bg-blue-600': 'bg-primary-600',
  'text-blue-600': 'text-primary-600',
  'border-blue-500': 'border-primary-500',
  'hover:bg-blue-700': 'hover:bg-primary-700',
  'focus:ring-blue-500': 'focus:ring-primary-500',

  // Secondary colors
  'bg-purple-600': 'bg-secondary-600',
  'text-purple-600': 'text-secondary-600',

  // Semantic colors
  'bg-green-50': 'bg-success-50',
  'bg-green-600': 'bg-success-600',
  'bg-red-50': 'bg-error-50',
  'bg-red-600': 'bg-error-600',
  'bg-yellow-50': 'bg-warning-50',
  'bg-yellow-600': 'bg-warning-600',
};
```

**Typography Patterns:**
```typescript
const typographyReplacements = {
  // Font families
  'font-sans': 'font-primary',

  // Font sizes - promote for better readability
  'text-xs': 'text-sm',
  'text-sm': 'text-base',
  'text-base': 'text-lg',

  // Font weights
  'font-medium': 'font-semibold',
  'font-semibold': 'font-bold',
};
```

**Spacing Patterns:**
```typescript
const spacingReplacements = {
  // Increase spacing for breathing room
  'p-2': 'p-3',
  'p-4': 'p-6',
  'p-6': 'p-8',
  'm-2': 'm-3',
  'm-4': 'm-6',
  'gap-2': 'gap-3',
  'gap-4': 'gap-6',
  'space-y-4': 'space-y-6',
};
```

**Border & Shadow Patterns:**
```typescript
const visualReplacements = {
  // Rounded corners
  'rounded': 'rounded-lg',
  'rounded-md': 'rounded-lg',
  'rounded-lg': 'rounded-xl',

  // Shadows - softer, more subtle
  'shadow-sm': 'shadow-md',
  'shadow': 'shadow-lg',
  'shadow-md': 'shadow-lg',
  'shadow-lg': 'shadow-xl',

  // Borders
  'border': 'border border-gray-200',
  'border-gray-300': 'border-gray-200',
};
```

### Phase 6: Component-Specific Patterns

**Button Components:**
```typescript
const buttonPattern = {
  // Find: <button className="..."
  // Apply: Consistent button styling

  primary: {
    base: 'px-6 py-3 rounded-lg font-semibold',
    colors: 'bg-primary-600 text-white',
    hover: 'hover:bg-primary-700',
    focus: 'focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
    transition: 'transition-colors duration-200',
  },

  secondary: {
    base: 'px-6 py-3 rounded-lg font-semibold',
    colors: 'bg-white text-primary-600 border-2 border-primary-600',
    hover: 'hover:bg-primary-50',
    focus: 'focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
    transition: 'transition-colors duration-200',
  },
};
```

**Card Components:**
```typescript
const cardPattern = {
  base: 'bg-white rounded-xl shadow-md border border-gray-100',
  hover: 'hover:shadow-lg transition-shadow duration-200',
  padding: 'p-6',
  spacing: 'space-y-4',
};
```

**Input Components:**
```typescript
const inputPattern = {
  base: 'w-full rounded-lg border border-gray-300 px-4 py-3',
  text: 'text-base text-gray-900 placeholder:text-gray-400',
  focus: 'focus:ring-2 focus:ring-primary-500 focus:border-transparent',
  transition: 'transition-all duration-200',
  disabled: 'disabled:bg-gray-100 disabled:cursor-not-allowed',
};
```

### Phase 7: Execution Strategy

**Step 1: Prepare Environment**
```bash
# Create backup
git add -A
git commit -m "Backup before brand styling update"
git branch backup-before-styling

# Create working branch
git checkout -b brand-styling-update
```

**Step 2: Execute in Batches**

Process files in batches to monitor progress:

**Batch 1: Configuration (5-10 files)**
- tailwind.config.ts
- app/globals.css
- Design token files
- Theme provider files

**Batch 2: Core Components (20-30 files)**
- components/ui/* (buttons, inputs, cards)
- components/layout/* (header, sidebar, nav)
- Shared utility components

**Batch 3: Dashboard Pages (10-15 files)**
- app/dashboard/page.tsx
- app/dashboard/*/page.tsx
- Dashboard-specific components

**Batch 4: Feature Pages (30-50 files)**
- Schedules module
- Bookings module
- Routes module
- Drivers module
- Students module
- Staff module

**Batch 5: Auth & Special Pages (5-10 files)**
- Login/register pages
- Error pages
- Loading states

**Step 3: Validation After Each Batch**
```bash
# Check TypeScript
npx tsc --noEmit

# Run development server
npm run dev

# Visual inspection
# Navigate through all modified pages
```

### Phase 8: Automated Batch Processing

Create a script to process all files:

```typescript
interface BrandStyle {
  name: string;
  colors: Record<string, string>;
  typography: Record<string, string>;
  spacing: Record<string, string>;
  components: Record<string, any>;
}

interface FileToProcess {
  path: string;
  type: 'config' | 'component' | 'page' | 'layout';
  priority: number;
}

async function applyBrandStyling(brandStyle: BrandStyle) {
  console.log('🎨 Starting Brand Styling Application');
  console.log('=====================================\n');

  // Step 1: Discover all files
  const files = await discoverFiles();
  console.log(`📋 Found ${files.length} files to process\n`);

  // Step 2: Sort by priority
  const sortedFiles = files.sort((a, b) => a.priority - b.priority);

  // Step 3: Process each file
  for (const file of sortedFiles) {
    try {
      console.log(`\n📝 Processing: ${file.path}`);

      // Read file
      const content = await readFile(file.path);

      // Apply transformations
      let updated = content;
      updated = applyColorPatterns(updated, brandStyle.colors);
      updated = applyTypographyPatterns(updated, brandStyle.typography);
      updated = applySpacingPatterns(updated, brandStyle.spacing);
      updated = applyComponentPatterns(updated, brandStyle.components);

      // Save file
      await writeFile(file.path, updated);

      console.log(`✅ Completed: ${file.path}`);
      console.log(`   Changes applied: ${countChanges(content, updated)}`);

    } catch (error) {
      console.error(`❌ Error processing ${file.path}:`, error);
    }
  }

  console.log('\n\n🎉 Brand Styling Application Complete!');
  console.log(`📊 Total files processed: ${files.length}`);
}
```

### Phase 9: Quality Assurance

After completing modifications:

**1. TypeScript Validation:**
```bash
npx tsc --noEmit
```

**2. Build Validation:**
```bash
npm run build
```

**3. Visual Testing Checklist:**
- [ ] All pages load without errors
- [ ] Color scheme is consistent
- [ ] Typography is readable and consistent
- [ ] Spacing feels balanced
- [ ] Interactive elements work (buttons, inputs)
- [ ] Hover states are visible
- [ ] Focus states are accessible
- [ ] Mobile responsive layouts work
- [ ] Dark mode (if applicable) works
- [ ] Animations and transitions are smooth

**4. Accessibility Check:**
- [ ] Color contrast ratios meet WCAG AA (4.5:1)
- [ ] Interactive elements have visible focus states
- [ ] Text is readable (min 16px for body)
- [ ] Touch targets are at least 44x44px

### Phase 10: Documentation

Create documentation of changes:

```markdown
# Brand Styling Update - [Date]

## Summary
- Files modified: X
- Components updated: Y
- Pages updated: Z

## Color System
- Primary: #... (was: #...)
- Secondary: #... (was: #...)
- Success: #... (was: #...)
- Warning: #... (was: #...)
- Error: #... (was: #...)

## Typography
- Font family: Inter (was: System)
- Base size: 16px (was: 14px)
- Scale: Updated to use 1.25 ratio

## Spacing
- Base unit: 4px
- Increased padding/margins by 50% for breathing room

## Component Changes
### Buttons
- Increased padding: px-6 py-3 (was: px-4 py-2)
- Added focus rings
- Improved hover states

### Cards
- Increased border radius: rounded-xl (was: rounded-lg)
- Softer shadows
- More padding

### Inputs
- Larger text: text-base (was: text-sm)
- Better focus states
- Improved accessibility
```

## Usage Examples

### Example 1: Apply New Brand Colors

```
User: "Update the entire application with our new brand colors:
       Primary: #2563eb, Secondary: #7c3aed, Success: #10b981"

Response:
I'll systematically update all colors across the entire application.

1. First, updating Tailwind config with new color palette
2. Updating global CSS variables
3. Processing all components (buttons, cards, inputs...)
4. Processing all pages (dashboard, schedules, bookings...)
5. Verifying TypeScript compilation
6. Testing visual consistency

[Processes all files]

✅ Complete! Updated 127 files with new brand colors:
- 45 components updated
- 67 pages updated
- 15 layout files updated
All color references now use: primary-*, secondary-*, success-*
```

### Example 2: Increase Spacing Throughout App

```
User: "The app feels cramped. Increase all spacing by 50%"

Response:
I'll systematically increase spacing across the entire application.

[Analyzes current spacing]
Found spacing classes: p-2, p-4, m-2, m-4, gap-2, gap-4

[Creates mapping]
p-2 → p-3
p-4 → p-6
m-2 → m-3
m-4 → m-6
gap-2 → gap-3
gap-4 → gap-6

[Processes all files]
✅ Complete! Updated spacing in 134 files
Application now has 50% more breathing room
```

### Example 3: Update Typography System

```
User: "Switch to Inter font and increase base font size to 16px"

Response:
I'll update the typography system across the entire application.

1. Installing Inter font
2. Updating Tailwind config
3. Updating font-family references
4. Promoting font sizes (text-sm → text-base)
5. Processing all components and pages

✅ Complete! Typography updated in 156 files
- Font: Inter (system fallback)
- Base size: 16px (was 14px)
- All text is now more readable
```

## Best Practices

1. **Always create a backup branch first**
2. **Process files in order of dependency** (config → components → pages)
3. **Validate after each batch** to catch errors early
4. **Use consistent pattern replacements** for maintainability
5. **Test thoroughly** - visual inspection is crucial
6. **Document all changes** for team awareness
7. **Check accessibility** after color changes
8. **Consider mobile** - test responsive layouts
9. **Verify build** - ensure production build works
10. **Use semantic naming** - use `primary` not `blue`

## Common Pitfalls to Avoid

1. ❌ **Don't** modify files without reading them first
2. ❌ **Don't** use string replace on colors like `blue` (too generic)
3. ❌ **Don't** forget to update hover/focus states
4. ❌ **Don't** skip TypeScript validation
5. ❌ **Don't** change too many things at once
6. ❌ **Don't** ignore accessibility requirements
7. ❌ **Don't** forget mobile responsive styles
8. ❌ **Don't** use hardcoded colors - use theme tokens
9. ❌ **Don't** skip documentation
10. ❌ **Don't** forget to test the build

## Success Criteria

A successful brand styling update means:

✅ All files compile without TypeScript errors
✅ All pages load without runtime errors
✅ Visual consistency across all pages
✅ Accessible color contrast ratios
✅ Responsive layouts still work
✅ Interactive elements function correctly
✅ Build succeeds without warnings
✅ Performance is not degraded
✅ Team is aware of changes via documentation

## Conclusion

This skill enables comprehensive, systematic brand styling updates across the entire TMS application. By processing files in logical batches with consistent patterns, we can ensure visual consistency while maintaining code quality and functionality.
