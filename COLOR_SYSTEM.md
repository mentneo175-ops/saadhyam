# Saadhyam AI - Unified Color System

## 🎨 Overview
All colors across the application have been standardized to use the **Purple Brand Palette** for consistency.

---

## 🟣 Primary Brand Colors

### Purple Palette
```css
Primary Purple:   #8B5CF6  (Main brand color)
Secondary Purple: #A855F7  (Lighter accent)
Dark Purple:      #7C3AED  (Hover states)
Light Purple:     #C084FC  (Backgrounds)
Pale Purple:      #F3EEFF  (Subtle backgrounds)
```

### Usage
- **Primary Buttons**: Gradient from #8B5CF6 to #A855F7
- **Links & Accents**: #8B5CF6
- **Hover States**: #7C3AED
- **Backgrounds**: #F3EEFF, #E9D5FF
- **Icons**: #8B5CF6

---

## 🎯 Component Color Standards

### Buttons
```tsx
// Primary Button (Gradient)
className="bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] hover:from-[#7C3AED] hover:to-[#9333EA] text-white"

// Secondary Button
className="bg-[#F3EEFF] hover:bg-[#E9D5FF] text-[#8B5CF6] border border-[#E9D5FF]"

// Outline Button
className="border-2 border-[#8B5CF6] text-[#8B5CF6] hover:bg-[#F9F7FF]"

// Using utility classes
className="btn-primary"
className="btn-secondary"
className="btn-outline"
```

### Icons & Badges
```tsx
// Icon Background
className="bg-gradient-to-br from-[#8B5CF6]/10 to-[#A855F7]/10 text-[#8B5CF6]"

// Or use utility class
className="icon-bg-primary"

// Badge
className="bg-[#F3EEFF] text-[#8B5CF6] border border-[#E9D5FF]"

// Or use utility class
className="badge-primary"
```

### Status Colors (Semantic - Keep These)
```css
Success: #10B981 (Green) - For success states
Warning: #F59E0B (Amber) - For warnings
Error:   #EF4444 (Red)   - For errors
Info:    #8B5CF6 (Purple) - For info messages
```

---

## 📦 Utility Classes

### Available Classes
```css
/* Buttons */
.btn-primary
.btn-secondary
.btn-outline

/* Icons */
.icon-bg-primary

/* Badges */
.badge-primary
.badge-success
.badge-warning
.badge-error

/* Backgrounds */
.bg-gradient-primary
.bg-gradient-primary-soft

/* Text */
.text-gradient-primary
.link-primary

/* Effects */
.glow-primary
.glow-primary-strong
.hover-lift
.card-hover-primary

/* Borders */
.border-primary
.border-primary-light

/* Progress */
.progress-primary
.spinner-primary
.skeleton-primary
```

---

## 🔄 Migration Guide

### Before (Inconsistent)
```tsx
// ❌ Old - Multiple colors
className="bg-blue-500"
className="bg-indigo-600"
className="bg-violet-500"
className="text-sky-600"
```

### After (Consistent)
```tsx
// ✅ New - Unified purple
className="bg-[#8B5CF6]"
className="text-[#8B5CF6]"
// Or use utility classes
className="btn-primary"
className="text-gradient-primary"
```

---

## 🎨 Design Tokens

### CSS Variables
```css
/* Primary Colors */
--brand-purple-600: #8B5CF6
--brand-purple-500: #A855F7
--brand-purple-700: #7C3AED

/* Gradients */
--btn-primary-bg: linear-gradient(135deg, #8B5CF6 0%, #A855F7 100%)
--btn-primary-hover: linear-gradient(135deg, #7C3AED 0%, #9333EA 100%)

/* Shadows */
--btn-primary-shadow: 0 4px 14px 0 rgba(139, 92, 246, 0.25)
--btn-primary-hover-shadow: 0 6px 20px 0 rgba(139, 92, 246, 0.35)
```

---

## 📍 Where Colors Are Used

### Login & Signup Pages ✅
- Already using purple (#8B5CF6, #A855F7)
- Consistent with brand

### Dashboard ✅
- All buttons standardized to purple
- Icons use purple backgrounds
- Links and accents use purple

### Components ✅
- Sidebar: Purple active states
- Cards: Purple borders and accents
- Forms: Purple focus rings
- Modals: Purple headers and buttons

---

## 🚫 Colors to Avoid

**Do NOT use these colors** (unless for semantic status):
- Blue (#3B82F6, #60A5FA, #0EA5E9)
- Indigo (#6366F1, #818CF8)
- Cyan (#06B6D4, #22D3EE)
- Sky (#0EA5E9, #38BDF8)
- Teal (#14B8A6, #2DD4BF)

**Exception**: Keep semantic colors for status
- Green for success
- Red for errors
- Amber for warnings

---

## 📝 Quick Reference

### Common Patterns

#### Primary Action Button
```tsx
<button className="px-6 py-3 bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] hover:from-[#7C3AED] hover:to-[#9333EA] text-white rounded-xl shadow-lg shadow-[#8B5CF6]/25 hover:shadow-xl hover:shadow-[#8B5CF6]/30 transition-all">
  Click Me
</button>
```

#### Icon with Background
```tsx
<div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#8B5CF6]/10 to-[#A855F7]/10 flex items-center justify-center">
  <Icon className="w-6 h-6 text-[#8B5CF6]" />
</div>
```

#### Link
```tsx
<a href="#" className="text-[#8B5CF6] hover:text-[#7C3AED] hover:underline font-semibold">
  Learn More
</a>
```

#### Badge
```tsx
<span className="px-3 py-1 rounded-full bg-[#F3EEFF] text-[#8B5CF6] text-sm font-medium border border-[#E9D5FF]">
  New
</span>
```

---

## ✅ Checklist

- [x] Login page uses purple
- [x] Signup page uses purple
- [x] Dashboard buttons use purple
- [x] Sidebar uses purple for active states
- [x] All icons use purple backgrounds
- [x] Links use purple
- [x] Badges use purple
- [x] Focus rings use purple
- [x] Gradients use purple
- [x] Shadows use purple tint
- [x] CSS variables updated
- [x] Utility classes created
- [x] Dark mode uses purple

---

## 🎯 Result

**Before**: 10+ different colors (blue, indigo, violet, cyan, sky, teal, etc.)  
**After**: 1 unified purple palette (#8B5CF6 family)

All interactive elements, buttons, links, and accents now use the same purple color system for a cohesive, professional look.
