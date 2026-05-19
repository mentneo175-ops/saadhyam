# 🎨 Saadhyam AI - Professional Color Palette

## Primary Colors (From Login/Signup Pages)

### Purple Gradient (Main Brand)
```css
Primary Purple: #8B5CF6
Secondary Purple: #A855F7  
Dark Purple: #7C3AED
Darker Purple: #5D2F8F
Light Purple: #9333EA
```

### Background Colors
```css
Light Purple BG: #F3EEFF
Lighter Purple BG: #F9F7FF
Pale Purple BG: #EDE9F6
Purple Tint: #F8F7FC
```

### Gradient Combinations
```css
Main Gradient: from-[#8B5CF6] to-[#A855F7]
Dark Gradient: from-[#5D2F8F] to-[#A855F7]
Hover Gradient: from-[#7C3AED] to-[#9333EA]
Light Gradient: from-purple-50 via-pink-50 to-blue-50
```

---

## Application Across Dashboard

### 1. **Sidebar**
- Active item: `bg-gradient-to-r from-[#8B5CF6] to-[#A855F7]` with white text
- Hover: `hover:bg-[#F9F7FF]` with purple text
- Icons: Purple `#8B5CF6` when active
- Border: `border-purple-200`

### 2. **Top Header**
- Background: `bg-white` with `border-purple-200`
- Buttons: `border-purple-200 hover:bg-purple-50`
- Icons: `text-purple-600`
- Profile badge: `bg-gradient-to-br from-[#5D2F8F] to-[#A855F7]`

### 3. **Cards & Panels**
- Border: `border-purple-200` or `border-border/60`
- Header gradient: `bg-gradient-to-r from-purple-50 via-pink-50 to-blue-50`
- Accent: `bg-[#F3EEFF]` or `bg-[#F9F7FF]`
- Shadow: `shadow-purple-100`

### 4. **Buttons**
- Primary: `bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] text-white`
- Primary Hover: `hover:from-[#7C3AED] hover:to-[#9333EA]`
- Secondary: `border-2 border-purple-200 text-purple-700 hover:bg-purple-50`
- Icon color: `text-purple-600`

### 5. **Form Elements**
- Input border: `border-2 border-gray-200 focus:border-[#8B5CF6]`
- Input focus ring: `focus:ring-2 focus:ring-[#8B5CF6]/20`
- Labels: `text-gray-700 font-semibold`
- Placeholder: `text-gray-400`

### 6. **Status & Badges**
- Success: Keep green `bg-emerald-100 text-emerald-700`
- Warning: Keep amber `bg-amber-100 text-amber-700`
- Info: `bg-purple-100 text-purple-700`
- Error: Keep red `bg-red-100 text-red-700`

### 7. **Charts & Graphs**
- Primary line: `#8B5CF6`
- Secondary line: `#A855F7`
- Gradient fill: `from-[#8B5CF6]/20 to-transparent`
- Grid lines: `#E9D5FF` (light purple)

### 8. **Icons**
- Active/Primary: `text-purple-600` (#8B5CF6)
- Inactive: `text-gray-400`
- Hover: `text-purple-700`
- Background: `bg-purple-100` for icon containers

### 9. **Links**
- Default: `text-purple-600 hover:text-purple-700`
- Underline: `hover:underline`
- Visited: `text-purple-700`

### 10. **Modals & Overlays**
- Backdrop: `bg-black/20` or `bg-purple-900/10`
- Modal border: `border-purple-200`
- Modal shadow: `shadow-2xl shadow-purple-500/10`

---

## Component-Specific Colors

### Dashboard Cards
```tsx
className="bg-card rounded-2xl border border-purple-200/60 shadow-soft"
```

### Section Headers
```tsx
className="bg-gradient-to-r from-purple-50 via-pink-50 to-blue-50 px-6 py-4 border-b border-purple-200/60"
```

### Action Buttons
```tsx
className="bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] hover:from-[#7C3AED] hover:to-[#9333EA] text-white shadow-lg hover:shadow-xl"
```

### Icon Containers
```tsx
className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#8B5CF6]/10 to-[#A855F7]/10 flex items-center justify-center"
```

### Stats/Metrics
```tsx
className="text-3xl font-bold bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] bg-clip-text text-transparent"
```

---

## DO NOT USE (Avoid These Colors)

❌ Random blues (unless for specific status)
❌ Random greens (unless for success states)
❌ Random oranges (unless for warnings)
❌ Bright neon colors
❌ Multiple competing gradients on same page

---

## Professional Business Look

### Key Principles:
1. **Consistency**: Use purple gradient everywhere for primary actions
2. **Hierarchy**: Darker purples for important elements, lighter for backgrounds
3. **Contrast**: Ensure text is readable (white on purple, dark gray on light backgrounds)
4. **Spacing**: Use generous padding and margins
5. **Shadows**: Subtle purple-tinted shadows for depth
6. **Borders**: Light purple borders instead of gray where possible

### Typography Colors:
- Headings: `text-gray-900` (dark, professional)
- Body text: `text-gray-600` or `text-gray-700`
- Muted text: `text-gray-500`
- Links: `text-purple-600`
- Labels: `text-gray-700 font-semibold`

---

## Quick Reference

```css
/* Primary Actions */
bg-gradient-to-r from-[#8B5CF6] to-[#A855F7]

/* Hover States */
hover:from-[#7C3AED] hover:to-[#9333EA]

/* Backgrounds */
bg-[#F9F7FF] /* Light purple tint */
bg-[#F3EEFF] /* Slightly darker purple tint */

/* Borders */
border-purple-200

/* Text */
text-purple-600 /* Icons, links */
text-purple-700 /* Hover states */

/* Shadows */
shadow-lg shadow-purple-500/20
```

---

**Last Updated:** May 17, 2026
**Status:** ✅ APPROVED - Apply to all dashboard pages
