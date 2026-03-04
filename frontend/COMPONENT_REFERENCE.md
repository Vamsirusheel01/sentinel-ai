# Enterprise Dashboard - Component Reference

This document provides a detailed reference for the new enterprise dashboard layout components and how to use them.

## Architecture Overview

```
┌─────────────────────────────────────────────┐
│            App.jsx (Router)                  │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│         MainLayout (Entry Point)             │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│      Layout.jsx (Main Container)            │
├─────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────────────────┐   │
│  │ Sidebar  │  │     Topbar           │   │
│  └──────────┘  └──────────────────────┘   │
│  ┌────────────────────────────────────┐   │
│  │                                    │   │
│  │    Page Content (Outlet)           │   │
│  │                                    │   │
│  └────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

##1. Layout.jsx - Main Container

**Purpose**: Wraps all pages with the enterprise layout structure.

### Structure
```jsx
<div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
  <Sidebar />      {/* Left navigation */}
  <Topbar />       {/* Top user info */}
  <main>           {/* Content area - scrollable */}
    <Outlet />     {/* Page content */}
  </main>
</div>
```

### Features
- Fixed sidebar on the left
- Fixed topbar at the top
- Scrollable main content area
- Responsive margin/padding based on sidebar width
- Professional gradient background

### Margin/Padding Structure
```
Main content has:
- ml-64 (left margin for fixed sidebar)
- mt-28 (top margin for fixed topbar)
- p-8 (internal padding)
- max-w-7xl (constraint for large screens)
```

### Customization
```jsx
// Change background gradient
className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950"

// Adjust main content margins
className="ml-64 mt-28 p-8"
```

---

## 2. Sidebar.jsx - Navigation

**Purpose**: Provides main navigation for the application with collapsible functionality.

### Visual Structure
```
┌──────────────────┐
│  Logo Section    │  ← Header with logo/branding
├──────────────────┤
│  Navigation      │
│  - Home          │
│  - Protection    │
│  - Activity      │
│  - Threats       │
│  - Logs (Admin)  │
│  - Settings      │
│  - Support       │  ← Nav items with active state
├──────────────────┤
│  Toggle Button   │  ← Collapse/expand sidebar
└──────────────────┘
```

### Key Features

#### Navigation Items
Each navigation item includes:
- **Icon**: SVG icon
- **Text label**: Navigation item name
- **Active state**: Highlighted when current route
- **Hover state**: Background change on hover

#### Navigation Configuration
Edit navigation items in the `navigation` array:

```jsx
const navigation = [
  { name: 'Home', path: '/', icon: 'M3 12a9 9 0 1 0 18 0...' },
  { name: 'Protection Center', path: '/protection', icon: '...' },
  // ... more items
]
```

#### Styling States

**Active State** (Current Page):
- Background: Cyan gradient with opacity
- Text: Cyan 300
- Border: Cyan 500/30
- Shadow: Cyan glow

**Hover State** (Non-Active):
- Background: Slate 800/50
- Text: Slate 100
- Smooth transition

**Collapsed State**:
- Width: 80px (w-20)
- Only icons visible
- Tooltips on hover (title attribute)

#### Color Palette
```
Background: Gradient from slate-900 via slate-950 to slate-900
Border: slate-700/50
Active: cyan-500, cyan-300, cyan-400
Text: slate-300, slate-100, slate-400
```

### Usage
```jsx
// The Sidebar is automatically included in Layout.jsx
// No direct usage needed in pages

// To navigate, use Link component
import { Link } from 'react-router-dom'

<Link to="/protection">Go to Protection Center</Link>
```

### Customization Examples

#### Add New Navigation Item
```jsx
const navigation = [
  // ... existing items
  { 
    name: 'Reports', 
    path: '/reports', 
    icon: 'M9 12l2 2 4-4m6 2a9...' 
  },
]
```

#### Change Colors
```jsx
// Edit className on nav items
className={`flex items-center space-x-3 px-4 py-3 rounded-lg 
  ${isActive(item.path)
    ? 'bg-YOUR-COLOR text-YOUR-TEXT-COLOR'
    : 'text-slate-300 hover:bg-slate-800'
  }`}
```

#### Adjust Sidebar Width
```jsx
// Change w-64 (expanded) and w-20 (collapsed)
className={`${isOpen ? 'w-72' : 'w-24'} ...rest`}
```

---

## 3. Topbar.jsx - User & Actions

**Purpose**: Displays user information, role, and system actions.

### Visual Structure
```
┌────────────────────────────────────────────────┐
│ Dashboard | 🔔 | User Dropdown                │
│          Welcome back                         │
└────────────────────────────────────────────────┘
```

### Components

#### Left Section
- Page heading: "Dashboard"
- Subheading: "Welcome back"

#### Right Section
- **Notification Bell**: With pulsing indicator
- **User Dropdown**: 
  - User avatar
  - Username
  - Role badge
  - Dropdown menu

#### Dropdown Menu Items
```
┌─────────────────────┐
│ User Info           │
├─────────────────────┤
│ Profile             │
│ Settings            │
├─────────────────────┤
│ Logout              │
└─────────────────────┘
```

### User Object Structure
```jsx
const [user, setUser] = useState({
  name: 'Admin User',      // Display name
  role: 'Admin',           // User role (Admin/User)
  avatar: 'AU'            // Avatar initials
})
```

### Role Styling
```jsx
Admin: {
  Badge: 'bg-red-500/20 text-red-300 border-red-500/30'
}

User: {
  Badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30'
}
```

### Logout Functionality
```jsx
const handleLogout = async () => {
  // 1. Call backend logout (optional)
  await axios.post(`${API_BASE_URL}/api/logout`, {}, {
    withCredentials: true
  })
  
  // 2. Clear local session
  localStorage.removeItem('token')
  sessionStorage.clear()
  
  // 3. Redirect to login
  window.location.href = '/login'
}
```

### Customization

#### Change User Data
```jsx
// Update user state with data from context/backend
useEffect(() => {
  // Fetch user info from backend
  const fetchUser = async () => {
    const response = await axios.get('/api/user/profile')
    setUser(response.data)
  }
  fetchUser()
}, [])
```

#### Add More Dropdown Items
```jsx
<button className="w-full px-4 py-2 text-left text-sm text-slate-300...">
  <svg className="w-4 h-4" {...} />
  <span>New Item</span>
</button>
```

#### Change Notification Indicator
```jsx
// Update the badge color
<span className="absolute top-1 right-1 w-2 h-2 bg-YOUR-COLOR rounded-full"></span>
```

---

## 4. Page Components

### Page Template Structure
```jsx
export default function PageName() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-100">Page Title</h1>
        <p className="text-slate-400 mt-2">Description</p>
      </div>

      {/* Filters/Controls */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Filter inputs */}
      </div>

      {/* Content */}
      <div className="card">
        {/* Main content */}
      </div>
    </div>
  )
}
```

### Page Routing
Pages are registered in `App.jsx`:
```jsx
<Route path="/protection" element={<ProtectionCenter />} />
<Route path="/activity" element={<LiveActivity />} />
<Route path="/threats" element={<ThreatHistory />} />
<Route path="/logs" element={<Logs />} />
<Route path="/settings" element={<Settings />} />
<Route path="/support" element={<Support />} />
```

---

## Color & Style System

### Primary Colors

| Use | Color | CSS Class |
|-----|-------|-----------|
| Background | #0f172a | bg-slate-950 |
| Surface | #1e293b | bg-slate-800 |
| Border | #334155 | border-slate-700 |
| Text Primary | #f1f5f9 | text-slate-100 |
| Text Secondary | #94a3b8 | text-slate-400 |
| Accent | #06b6d4 | text-cyan-400 |

### Status Colors

| Status | Colors | CSS |
|--------|--------|-----|
| Success | bg-emerald-500/20, text-emerald-300 | badge-success |
| Warning | bg-yellow-500/20, text-yellow-300 | badge-warning |
| Error | bg-red-500/20, text-red-300 | badge-danger |
| Info | bg-blue-500/20, text-blue-300 | badge-info |

### Spacing Scale
- `space-1`: 0.25rem
- `space-2`: 0.5rem
- `space-4`: 1rem
- `space-6`: 1.5rem
- `space-8`: 2rem

---

## Typography

### Heading Hierarchy
```
h1: text-3xl font-bold text-slate-100
h2: text-xl font-semibold text-slate-100
h3: text-lg font-semibold text-slate-100
p:  text-sm text-slate-300 / text-slate-400
```

### Font Families
- System fonts: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto
- Line height: 1.5 (default)

---

## Button Styles

### Button Classes (in index.css)

```css
.btn-primary {
  @apply bg-gradient-to-r from-cyan-500 to-cyan-600 
         text-white px-4 py-2 rounded-lg font-medium 
         transition-all duration-200 
         hover:shadow-lg hover:shadow-cyan-500/30;
}

.btn-secondary {
  @apply bg-slate-700 text-slate-100 px-4 py-2 rounded-lg 
         font-medium transition-all duration-200 
         hover:bg-slate-600;
}

.btn-ghost {
  @apply text-slate-300 px-4 py-2 rounded-lg font-medium 
         transition-all duration-200 
         hover:bg-slate-700/50 hover:text-slate-100;
}
```

### Button Variants
```jsx
// Primary (Action buttons)
<button className="btn-primary">Submit</button>

// Secondary (Alternative actions)
<button className="btn-secondary">Cancel</button>

// Ghost (Low priority)
<button className="btn-ghost">Learn More</button>
```

---

## Card Components

### Card Style (in index.css)
```css
.card {
  @apply bg-slate-800 border border-slate-700 rounded-lg shadow-lg;
}

.card-hover {
  @apply card transition-all duration-200 
         hover:border-slate-600 hover:shadow-xl 
         hover:shadow-slate-900/50;
}
```

### Card Usage
```jsx
<div className="card p-6 space-y-4">
  <h3 className="font-semibold text-slate-100">Title</h3>
  <p className="text-slate-300">Content</p>
</div>

<div className="card-hover p-6">
  {/* Interactive card */}
</div>
```

---

## Animations

### Available Animations (in index.css)

| Animation | Class | Duration | Effect |
|-----------|-------|----------|--------|
| Fade In | animate-fadeIn | 300ms | Opacity + Y translate |
| Slide Left | animate-slideInLeft | 300ms | X translate left |
| Slide Right | animate-slideInRight | 300ms | X translate right |
| Pulse Soft | animate-pulse-soft | 2s | Opacity pulse |

### Usage
```jsx
<div className="animate-fadeIn">
  {/* Page content fades in */}
</div>

<div className="animate-slideInLeft">
  {/* Content slides in from left */}
</div>
```

---

## Responsive Design

### Breakpoints
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

### Responsive Classes
```jsx
// Shows different content on mobile vs desktop
<div className="block md:hidden">Mobile only</div>
<div className="hidden md:block">Desktop only</div>

// Responsive grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
```

---

## Code Examples

### Adding a New Page

1. **Create the page file** (`src/pages/NewPage.jsx`):
```jsx
export default function NewPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-100">New Page</h1>
      </div>
      <div className="card p-6">
        <p className="text-slate-300">Page content here</p>
      </div>
    </div>
  )
}
```

2. **Add to router** (`App.jsx`):
```jsx
import NewPage from './pages/NewPage'

// In the routes:
<Route path="/newpage" element={<NewPage />} />
```

3. **Add to navigation** (`Sidebar.jsx`):
```jsx
const navigation = [
  // ... existing items
  { name: 'New Page', path: '/newpage', icon: '...' },
]
```

### Creating a Modal/Dialog

```jsx
const [isOpen, setIsOpen] = useState(false)

return (
  <>
    <button onClick={() => setIsOpen(true)} className="btn-primary">
      Open Modal
    </button>

    {isOpen && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="card p-6 max-w-md">
          <h2 className="text-xl font-semibold text-slate-100">Modal Title</h2>
          <button 
            onClick={() => setIsOpen(false)}
            className="btn-secondary mt-6"
          >
            Close
          </button>
        </div>
      </div>
    )}
  </>
)
```

### Using Tabs

```jsx
const [activeTab, setActiveTab] = useState('tab1')

return (
  <>
    <div className="flex space-x-1 border-b border-slate-700">
      <button
        onClick={() => setActiveTab('tab1')}
        className={`px-4 py-3 font-medium border-b-2 ${
          activeTab === 'tab1'
            ? 'border-cyan-500 text-cyan-400'
            : 'border-transparent text-slate-400'
        }`}
      >
        Tab 1
      </button>
      <button
        onClick={() => setActiveTab('tab2')}
        className={`px-4 py-3 font-medium border-b-2 ${
          activeTab === 'tab2'
            ? 'border-cyan-500 text-cyan-400'
            : 'border-transparent text-slate-400'
        }`}
      >
        Tab 2
      </button>
    </div>

    {activeTab === 'tab1' && <div>Tab 1 Content</div>}
    {activeTab === 'tab2' && <div>Tab 2 Content</div>}
  </>
)
```

---

## Best Practices

1. **Keep Components DRY**: Reuse layout components
2. **Use Semantic HTML**: For accessibility
3. **Consistent Spacing**: Use TailwindCSS space utilities
4. **Color Consistency**: Use defined color palette
5. **Responsive First**: Design mobile-first
6. **Performance**: Use React.memo for heavy components
7. **Accessibility**: Include alt text, ARIA labels
8. **Error Handling**: Provide user feedback
9. **Loading States**: Show progress indicators
10. **Type Safety**: Use PropTypes or TypeScript

---

## Troubleshooting

### Sidebar Not Showing
- ✅ Ensure `dark` class is on `<html>` element
- ✅ Check TailwindCSS compilation

### Colors Not Applying
- ✅ Verify TailwindCSS config includes color definitions
- ✅ Clear browser cache and rebuild

### Layout Broken on Mobile
- ✅ Check responsive classes (md:, lg:)
- ✅ Test viewport width

### Navigation Not Working
- ✅ Verify routes are defined in App.jsx
- ✅ Check path spelling in Sidebar navigation

---

For more information, see [ENTERPRISE_DASHBOARD.md](./ENTERPRISE_DASHBOARD.md)
