# 🎨 Saadhyam AI Frontend - Complete Documentation

**Professional React + TypeScript frontend with Tailwind CSS, Instagram automation, and full SaaS features.**

---

## 📖 TABLE OF CONTENTS

1. [Quick Start](#quick-start-5-minutes)
2. [Prerequisites](#prerequisites)
3. [Installation & Setup](#installation--setup)
4. [Running the Frontend](#running-the-frontend)
5. [Project Structure](#project-structure)
6. [Key Components](#key-components)
7. [Features](#features)
8. [API Integration](#api-integration)
9. [Authentication](#authentication)
10. [Instagram Features](#instagram-features)
11. [Building & Deployment](#building--deployment)
12. [Development Tips](#development-tips)
13. [Styling & Theming](#styling--theming)
14. [Troubleshooting](#troubleshooting)
15. [Environment Variables](#environment-variables)

---

## ⚡ QUICK START (5 MINUTES)

### Step 1: Install Dependencies
```bash
cd Frontend
bun install
# Or: npm install / yarn install
```

### Step 2: Start Development Server
```bash
bun run dev
# Or: npm run dev / yarn dev
```

**Frontend running at:** http://localhost:5173

### Step 3: Test Application
1. Open http://localhost:5173 in browser
2. Register a new account
3. Login with your credentials
4. Explore dashboard features

### Step 4: Test Instagram Features (Optional)
1. Configure Instagram credentials (see [Instagram Setup](#instagram-features))
2. Go to Dashboard → Instagram
3. Click "Connect Instagram"
4. Authorize your account
5. Create and schedule posts

---

## 📋 PREREQUISITES

- **Node.js 16+** - [Download](https://nodejs.org/)
- **Bun** (optional, faster) - `npm install -g bun`
- **Backend running** on http://localhost:8000
- **npm, yarn, or bun** package manager

### Verify Installation

```bash
node --version
npm --version
# Or if using bun:
bun --version
```

---

## 🛠️ INSTALLATION & SETUP

### Option A: Using Bun (Recommended - Faster)

#### Step 1: Navigate to Frontend
```bash
cd Frontend
```

#### Step 2: Install Dependencies
```bash
bun install
```

#### Step 3: Configure Environment
```bash
# Create .env file
cat > .env << 'EOF'
VITE_API_URL=http://localhost:8000
EOF
```

#### Step 4: Start Development Server
```bash
bun run dev
```

Access at: http://localhost:5173

---

### Option B: Using npm

#### Step 1: Navigate to Frontend
```bash
cd Frontend
```

#### Step 2: Install Dependencies
```bash
npm install
```

#### Step 3: Configure Environment
```bash
# Create .env file
cat > .env << 'EOF'
VITE_API_URL=http://localhost:8000
EOF
```

#### Step 4: Start Development Server
```bash
npm run dev
```

Access at: http://localhost:5173

---

### Option C: Using Yarn

#### Step 1: Navigate to Frontend
```bash
cd Frontend
```

#### Step 2: Install Dependencies
```bash
yarn install
```

#### Step 3: Configure Environment
```bash
# Create .env file
cat > .env << 'EOF'
VITE_API_URL=http://localhost:8000
EOF
```

#### Step 4: Start Development Server
```bash
yarn dev
```

Access at: http://localhost:5173

---

## ▶️ RUNNING THE FRONTEND

### Development Mode (Hot Reload)
```bash
bun run dev
# or: npm run dev
```

Hot reload enabled - changes reflect immediately in browser.

### Production Build
```bash
bun run build
# or: npm run build
```

Creates optimized production bundle in `dist/` folder.

### Preview Production Build
```bash
bun run preview
# or: npm run preview
```

Test production bundle locally.

### Linting
```bash
bun run lint
# or: npm run lint
```

Check for code quality issues.

---

## 📁 PROJECT STRUCTURE

```
Frontend/
├── src/
│   ├── main.tsx                     # Application entry point
│   ├── router.tsx                   # TanStack Router configuration
│   ├── routeTree.gen.ts            # Auto-generated route tree
│   ├── styles.css                   # Global styles
│   │
│   ├── lib/
│   │   ├── api.ts                   # API client configuration
│   │   ├── AuthContext.tsx          # Authentication context
│   │   └── utils.ts                 # Utility functions
│   │
│   ├── hooks/
│   │   ├── useAuth.ts               # Authentication hook
│   │   └── use-mobile.tsx           # Mobile detection hook
│   │
│   ├── components/
│   │   ├── ui/                      # Shadcn UI components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── textarea.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── alert-dialog.tsx
│   │   │   └── ... (more UI components)
│   │   │
│   │   ├── auth/
│   │   │   └── AuthShell.tsx        # Authentication layout
│   │   │
│   │   ├── brand/
│   │   │   └── Logo.tsx             # Logo component
│   │   │
│   │   ├── dashboard/
│   │   │   ├── TopHeader.tsx        # Top navigation bar
│   │   │   ├── Sidebar.tsx          # Left sidebar navigation
│   │   │   ├── PageHeader.tsx       # Page header component
│   │   │   ├── StatCard.tsx         # Statistics card
│   │   │   ├── ActionCard.tsx       # Action card component
│   │   │   ├── ContentTabs.tsx      # Tabbed content
│   │   │   ├── GrowthChart.tsx      # Chart component
│   │   │   ├── SnapshotCard.tsx     # Dashboard snapshot
│   │   │   └── InsightsPanel.tsx    # Insights panel
│   │   │
│   │   ├── landing/
│   │   │   ├── Navbar.tsx           # Landing page navbar
│   │   │   ├── HeroPreview.tsx      # Hero section
│   │   │   └── Footer.tsx           # Footer component
│   │   │
│   │   └── instagram/
│   │       ├── InstagramAccountManager.tsx    # Account management
│   │       ├── InstagramPostCreator.tsx       # Post creation
│   │       └── ScheduledPostsList.tsx         # Posts list
│   │
│   └── routes/
│       ├── __root.tsx               # Root layout
│       ├── index.tsx                # Landing page
│       ├── login.tsx                # Login page
│       ├── signup.tsx               # Signup page
│       ├── verify.tsx               # Email verification
│       ├── dashboard.tsx            # Dashboard layout
│       ├── dashboard.index.tsx      # Dashboard home
│       ├── dashboard.instagram.tsx  # Instagram page
│       ├── dashboard.content.tsx    # Content creation
│       ├── dashboard.messages.tsx   # Messages
│       ├── dashboard.growth.tsx     # Growth analytics
│       ├── dashboard.insights.tsx   # Business insights
│       ├── dashboard.seo.tsx        # SEO tools
│       ├── dashboard.pricing.tsx    # Pricing info
│       ├── dashboard.settings.tsx   # Settings
│       └── auth.instagram-callback.tsx  # OAuth callback
│
├── public/
│   └── vite.svg                     # Vite logo
│
├── index.html                       # HTML entry point
├── tsconfig.json                    # TypeScript configuration
├── vite.config.ts                   # Vite configuration
├── bunfig.toml                      # Bun configuration
├── tailwind.config.ts               # Tailwind CSS config
├── eslint.config.js                 # ESLint configuration
├── package.json                     # Dependencies & scripts
└── .env                             # Environment variables
```

---

## 🎯 KEY COMPONENTS

### Layout Components

#### TopHeader
- Navigation bar with logo
- User menu with logout
- Profile information

#### Sidebar
- Navigation menu with sections
- Active route highlighting
- Collapsible on mobile

#### PageHeader
- Page title and description
- Breadcrumb navigation
- Action buttons

### Dashboard Components

#### StatCard
- Display key metrics
- Icon and value
- Trend indication

#### ActionCard
- Call-to-action component
- Icon with title and description
- Click handler

#### ContentTabs
- Tab-based content organization
- Multiple content sections
- Smooth transitions

#### GrowthChart
- Data visualization
- Chart.js integration
- Responsive design

#### InsightsPanel
- Key insights display
- Data analytics
- Actionable recommendations

### Authentication Components

#### AuthShell
- Login/signup form wrapper
- Consistent styling
- Error handling

### Instagram Components

#### InstagramAccountManager
```tsx
<InstagramAccountManager
  accounts={accounts}
  onConnect={handleConnect}
  onDisconnect={handleDisconnect}
/>
```
- List connected accounts
- Connect/disconnect buttons
- Account details display

#### InstagramPostCreator
```tsx
<InstagramPostCreator
  selectedAccount={account}
  onPostNow={handlePostNow}
  onSchedule={handleSchedule}
  onGenerateCaption={handleGenerateCaption}
/>
```
- Image URL input with preview
- Caption editor
- AI caption generator
- Schedule date/time picker
- Post now vs schedule toggle

#### ScheduledPostsList
```tsx
<ScheduledPostsList
  posts={posts}
  onRefresh={handleRefresh}
  onEdit={handleEdit}
  onDelete={handleDelete}
  isDeleting={deletingId}
/>
```
- Grid view of posts
- Status badges
- Inline caption editing
- Delete with confirmation
- Post metadata display

---

## ✨ FEATURES

### Authentication
- ✅ User registration with email
- ✅ Email verification
- ✅ Secure login
- ✅ Password security
- ✅ Session management
- ✅ Logout functionality
- ✅ Protected routes
- ✅ Automatic token refresh

### Dashboard
- ✅ Welcome screen
- ✅ Key metrics display
- ✅ Quick action cards
- ✅ Analytics charts
- ✅ Sidebar navigation
- ✅ Responsive design
- ✅ Mobile-friendly layout

### Instagram Automation
- ✅ OAuth connection
- ✅ Multiple account management
- ✅ Immediate posting
- ✅ Scheduled posting
- ✅ Post management (edit/delete)
- ✅ AI caption generation
- ✅ Bulk scheduling
- ✅ Post analytics tracking
- ✅ Status monitoring

### Content Management
- ✅ Create content
- ✅ Schedule posts
- ✅ Manage drafts
- ✅ Publish content
- ✅ Track performance

### Analytics
- ✅ Engagement metrics
- ✅ Growth tracking
- ✅ Performance insights
- ✅ Data visualization
- ✅ Trend analysis

### AI Features
- ✅ AI caption generation
- ✅ Content suggestions
- ✅ Hashtag recommendations
- ✅ Best time to post
- ✅ Performance prediction

---

## 🔌 API INTEGRATION

### API Client Setup

**File:** `src/lib/api.ts`

```typescript
import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;
```

### Making API Calls

```typescript
// Example: Register user
const response = await apiClient.post('/auth/register', {
  email: 'user@example.com',
  password: 'password123',
});

// Example: Get user info
const user = await apiClient.get('/me');

// Example: Create Instagram post
const post = await apiClient.post('/instagram/post', {
  social_account_id: 1,
  image_url: 'https://...',
  caption: 'Check this out!',
});
```

### Error Handling

```typescript
try {
  const response = await apiClient.get('/protected-endpoint');
  console.log(response.data);
} catch (error) {
  if (error.response?.status === 401) {
    // Handle unauthorized
    console.log('Token expired, please login again');
  } else if (error.response?.status === 404) {
    // Handle not found
    console.log('Resource not found');
  } else {
    // Handle other errors
    console.log('An error occurred:', error.message);
  }
}
```

---

## 🔐 AUTHENTICATION

### Authentication Context

**File:** `src/lib/AuthContext.tsx`

Provides:
- `user` - Current user object
- `isAuthenticated` - Boolean flag
- `token` - JWT access token
- `login(email, password)` - Login function
- `register(email, password)` - Register function
- `logout()` - Logout function

### Using Authentication Hook

```typescript
import { useAuth } from '@/hooks/useAuth';

function MyComponent() {
  const { user, isAuthenticated, login, logout } = useAuth();

  return (
    <div>
      {isAuthenticated ? (
        <>
          <p>Welcome, {user?.email}</p>
          <button onClick={logout}>Logout</button>
        </>
      ) : (
        <p>Please login</p>
      )}
    </div>
  );
}
```

### Protected Routes

Routes requiring authentication automatically redirect to login if not authenticated:

```typescript
// Protected routes in dashboard
- /dashboard
- /dashboard/instagram
- /dashboard/content
- /dashboard/messages
- /dashboard/settings
```

---

## 📱 INSTAGRAM FEATURES

### Instagram OAuth Flow

1. User clicks "Connect Instagram"
2. Redirected to Instagram authorization
3. User authorizes the app
4. Redirected to callback route: `/auth/instagram-callback`
5. Access token exchanged and stored
6. Redirected to `/dashboard/instagram`

### Posting Workflow

#### Immediate Post
1. User uploads image URL
2. Enters caption (or generates with AI)
3. Clicks "Post Now"
4. Post created immediately on Instagram
5. Status updated to "posted"

#### Scheduled Post
1. User uploads image URL
2. Enters caption
3. Selects date and time
4. Clicks "Schedule"
5. Post queued for later
6. Automatically posted at scheduled time
7. Status updated to "posted"

#### Bulk Schedule
1. User creates multiple posts
2. Sets different times for each
3. Clicks "Schedule All"
4. All posts queued
5. Processed according to schedule

### AI Caption Generation

```typescript
// Generate caption with topic and tone
const caption = await apiClient.post('/instagram/generate-caption', {
  topic: 'coffee',
  tone: 'casual', // casual, professional, funny, inspirational
});
```

### Analytics

```typescript
// Get post analytics
const analytics = await apiClient.get(`/instagram/analytics/${postId}`);

// Get account analytics
const accountAnalytics = await apiClient.get(
  `/instagram/account-analytics/${accountId}`
);
```

---

## 🏗️ BUILDING & DEPLOYMENT

### Production Build

```bash
bun run build
# or: npm run build
```

Creates optimized `dist/` folder with:
- Minified JavaScript
- Optimized CSS
- Compressed assets
- Sourcemaps (optional)

### Build Output

```
dist/
├── index.html          # HTML entry point
├── assets/
│   ├── index-<hash>.js # Bundled JavaScript
│   └── index-<hash>.css # Bundled CSS
└── vite.svg           # Static assets
```

### Deployment Options

#### Option 1: Vercel (Recommended)
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel
```

1. Connect GitHub repo
2. Configure environment variables
3. Auto-deploy on push

#### Option 2: Netlify
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy
```

1. Connect GitHub
2. Set build command: `bun run build` (or `npm run build`)
3. Set publish directory: `dist`

#### Option 3: AWS Amplify
1. Connect GitHub repo
2. Configure build settings
3. Deploy

#### Option 4: Docker
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package.json bun.lockb ./
RUN npm install

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "preview"]
```

#### Option 5: Static Host
```bash
# Build
bun run build

# Upload dist/ folder to:
# - AWS S3 + CloudFront
# - GitHub Pages
# - Google Cloud Storage
# - Firebase Hosting
```

### Environment Variables for Production

```env
VITE_API_URL=https://your-backend-domain.com
```

---

## 💡 DEVELOPMENT TIPS

### Hot Module Replacement
Changes are instantly reflected in browser without full reload.

### Browser DevTools
- React DevTools extension recommended
- Inspect components and props
- Debug state changes

### Network Tab
- Monitor API requests
- Check request/response
- Debug CORS issues

### Console Logging
```typescript
// Add to debug components
console.log('Component mounted', props);
```

### Component Testing
```typescript
// Use React Testing Library
import { render, screen } from '@testing-library/react';

test('button renders and is clickable', () => {
  render(<Button>Click me</Button>);
  const button = screen.getByText('Click me');
  expect(button).toBeInTheDocument();
});
```

### Performance
- Use React DevTools Profiler
- Check render times
- Optimize heavy components with React.memo

---

## 🎨 STYLING & THEMING

### Tailwind CSS

Uses utility-first CSS framework:

```tsx
<div className="p-4 bg-blue-500 text-white rounded-lg shadow-md">
  Styled with Tailwind CSS
</div>
```

### Shadcn/UI Components

Pre-built accessible components:

```tsx
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export function MyComponent() {
  return (
    <Card>
      <Button>Click me</Button>
    </Card>
  );
}
```

### Custom Styling

**Global styles:** `src/styles.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Custom styles */
.custom-class {
  @apply px-4 py-2 rounded-lg bg-blue-500 text-white;
}
```

### Dark Mode

Tailwind CSS dark mode support:

```tsx
<div className="bg-white dark:bg-gray-900 text-black dark:text-white">
  Responsive to dark mode
</div>
```

---

## 🐛 TROUBLESHOOTING

### Port Already in Use

```bash
# Find process on port 5173
lsof -i :5173

# Kill process
kill -9 <PID>
```

### Dependencies Issues

```bash
# Clear cache and reinstall
rm -rf node_modules bun.lockb
bun install
```

### API Connection Error

**Error: "Cannot connect to backend"**

1. Verify backend is running: http://localhost:8000
2. Check VITE_API_URL in .env
3. Check browser console for CORS errors
4. Verify backend CORS configuration

### Blank Page After Build

```bash
# Clear build cache
rm -rf dist

# Rebuild
bun run build

# Preview
bun run preview
```

### TypeScript Errors

```bash
# Check TypeScript configuration
tsc --noEmit

# Fix errors in source files
```

### Component Not Rendering

1. Check component import path
2. Verify props are passed correctly
3. Check browser console for errors
4. Use React DevTools to inspect

### Styling Not Applied

1. Verify Tailwind CSS is installed
2. Check `tailwind.config.ts` includes template paths
3. Rebuild styles: `bun run build`
4. Clear browser cache

---

## 📊 ENVIRONMENT VARIABLES

### Development (.env)
```env
VITE_API_URL=http://localhost:8000
```

### Production (.env.production)
```env
VITE_API_URL=https://your-backend-domain.com
```

### Available Variables

| Variable | Purpose | Example |
|----------|---------|---------|
| VITE_API_URL | Backend API URL | http://localhost:8000 |
| VITE_APP_NAME | Application name | Saadhyam AI |
| VITE_APP_VERSION | App version | 1.0.0 |

---

## 📚 USEFUL COMMANDS

### Development
```bash
bun run dev          # Start dev server
bun run lint         # Run linter
bun run build        # Production build
bun run preview      # Preview build
```

### Package Management
```bash
bun add [package]    # Add dependency
bun remove [package] # Remove dependency
bun install          # Install dependencies
```

---

## 🎯 NEXT STEPS

1. **Setup**: Follow Quick Start section
2. **Explore**: Try all dashboard features
3. **Test**: Use demo account for testing
4. **Integrate**: Connect with backend
5. **Deploy**: Choose deployment platform

---

## 📝 SUMMARY

Your frontend includes:

✅ **React + TypeScript** - Type-safe development  
✅ **Tailwind CSS** - Utility-first styling  
✅ **Shadcn/UI** - Pre-built components  
✅ **TanStack Router** - File-based routing  
✅ **Authentication** - Secure login/register  
✅ **API Integration** - Backend communication  
✅ **Instagram Automation** - OAuth & posting  
✅ **Responsive Design** - Mobile-friendly  
✅ **Production-ready** - Optimized builds  
✅ **Professional UI** - Modern design  

---

## 🎉 YOU'RE READY!

Start the development server and explore all the features. Your frontend is production-ready!

Happy coding! 🚀
