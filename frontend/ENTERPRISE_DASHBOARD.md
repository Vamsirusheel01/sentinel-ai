# Sentinel AI - Enterprise Dashboard

A professional, enterprise-grade dashboard for Sentinel AI security monitoring system with dark theme and responsive design.

## Overview

The Sentinel AI frontend has been completely refactored to provide a modern, professional enterprise dashboard with the following features:

- **Responsive Layout**: Sidebar + Topbar + Main content area
- **Dark Enterprise Theme**: Based on Slate (#0f172a) with Cyan accent colors
- **Enterprise Components**: Professional-looking cards, buttons, and navigation
- **Real-time Monitoring**: Live protection status and threat detection
- **Multi-page Dashboard**: Multiple sections for different security functions

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   └── Layout/              # Enterprise layout components
│   │       ├── Layout.jsx       # Main layout wrapper
│   │       ├── Sidebar.jsx      # Navigation sidebar
│   │       └── Topbar.jsx       # User info & actions topbar
│   ├── pages/                   # Page components
│   │   ├── ProtectionCenter.jsx # Main dashboard
│   │   ├── LiveActivity.jsx     # Activity monitoring
│   │   ├── ThreatHistory.jsx    # Threat analysis
│   │   ├── Logs.jsx             # System logs (Admin)
│   │   ├── Settings.jsx         # Preferences
│   │   └── Support.jsx          # Help & support
│   ├── context/
│   │   └── SecurityContext.jsx  # Security state management
│   ├── layouts/
│   │   └── MainLayout.jsx       # Main layout entry point
│   ├── App.jsx                  # App router
│   ├── main.jsx                 # App entry point
│   └── index.css               # Global styles & animations
├── package.json
├── tailwind.config.js
├── vite.config.js
└── index.html
```

## Components

### Layout/Sidebar.jsx
- **Dark Background**: #0f172a with gradient
- **Logo**: "Sentinel AI" with icon
- **Navigation Items**:
  - Home
  - Protection Center
  - Live Activity
  - Threat History
  - Logs (Admin)
  - Settings
  - Support
- **Features**: 
  - Collapsible/expandable
  - Active state indicators
  - Smooth transitions
  - SVG icons

### Layout/Topbar.jsx
- **User Information**: Display username and role
- **Role Badge**: Admin/User with color-coded badges
- **Notifications**: Bell icon with indicator
- **User Dropdown Menu**:
  - Profile
  - Settings
  - Logout
- **Features**:
  - Logout functionality
  - User profile management
  - Responsive design

### Layout/Layout.jsx
- **Main Layout Structure**: Sidebar + Topbar + Content
- **Content Area**: Scrollable with max-width constraint
- **Responsive**: Fixed sidebar on desktop, adaptable for mobile
- **Gradient Background**: Professional gradient from slate-950

### Pages

#### ProtectionCenter.jsx
- Real-time protection status
- Trust score visualization
- System health indicators
- Recent threat information

#### LiveActivity.jsx
- Real-time activity stream
- Event monitoring
- Process tracking
- Network monitoring

#### ThreatHistory.jsx
- Searchable threat log
- Filtering by severity, status, source
- Export capabilities
- Detailed threat information

#### Logs.jsx
- System event logging
- Admin-only access warning
- Multiple log levels (ERROR, WARNING, INFO, DEBUG)
- Component-based filtering
- Export functionality

#### Settings.jsx
- Protection settings (Real-time, Auto-quarantine, Updates)
- Notification preferences (Email alerts, Critical only)
- Security settings (2FA, Session timeout, Log level)
- Save/Reset functionality

#### Support.jsx
- FAQ help center with search
- Support ticket submission
- Contact information
- SLA response times

## Styling & Design

### Color Scheme
- **Primary Dark**: `#0f172a` (Slate 900)
- **Secondary Dark**: `#1e293b` (Slate 800)
- **Accent**: `#06b6d4` (Cyan 400)
- **Text Primary**: `#f1f5f9` (Slate 100)
- **Text Secondary**: `#94a3b8` (Slate 400)

### TailwindCSS Configuration
- **Dark Mode**: Enabled via `dark` class
- **Custom Colors**: Sentinel theme colors
- **Animations**: FadeIn, SlideIn, PulseSoft
- **Shadows**: Custom glow effects

### Utility Classes (in index.css)
- `.card`: Base card styling
- `.card-hover`: Interactive cards
- `.badge-success`, `.badge-warning`, `.badge-danger`, `.badge-info`: Status badges
- `.btn-primary`, `.btn-secondary`, `.btn-ghost`: Button variants
- `.animate-fadeIn`, `.animate-slideInLeft`: Animations

## Installation & Setup

### Prerequisites
- Node.js 16+
- npm or yarn

### Installation

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install
```

### Development

```bash
# Start development server
npm run dev

# The app will be available at http://localhost:5173
```

### Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## Features

### Responsive Design
- Desktop-first design
- Sidebar collapses on mobile
- Touch-friendly interactions
- Flexible grid layouts

### Enterprise Features
- Two-factor authentication
- Session timeout management
- Admin role separation
- Comprehensive logging
- User audit trails

### Accessibility
- Semantic HTML
- ARIA labels
- Keyboard navigation
- Color contrast compliance

### Performance
- Lazy loading pages
- Optimized re-renders
- CSS animations (GPU accelerated)
- Efficient state management

## Authentication Flow

The dashboard expects user context with:
- Username
- Role (Admin/User)
- Session token for API calls

User data is managed via the SecurityContext and stored in the Topbar component.

## API Integration

The frontend communicates with the backend at:
- Development: `http://localhost:5000` (configurable via `VITE_API_BASE_URL`)
- Production: API URL from environment variables

### Key Endpoints
- `GET /api/system-status` - System protection status
- `POST /api/logout` - User logout
- `GET /api/threats` - Threat history
- `GET /api/logs` - System logs
- `POST /api/settings` - Save user settings

## Customization

### Adding New Pages

1. Create a new JSX component in `src/pages/`
2. Import it in `App.jsx`
3. Add a route in the main Routes component
4. Add navigation item in `Sidebar.jsx`

### Updating Styles

- **Global Styles**: Edit `src/index.css`
- **Tailwind Config**: `tailwind.config.js`
- **Component Styles**: Inline Tailwind classes

### Changing Colors

Update Tailwind config with new color scheme:

```javascript
theme: {
  extend: {
    colors: {
      sentinel: {
        dark: '#your-color',
        // ...
      }
    }
  }
}
```

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## Troubleshooting

### Sidebar Not Appearing
- Check if dark mode class is applied to HTML element
- Verify TailwindCSS is compiled

### Styles Not Loading
- Clear browser cache
- Rebuild Tailwind: `npm run build`
- Check PostCSS configuration

### API Connection Issues
- Verify `VITE_API_BASE_URL` environment variable
- Check CORS settings on backend
- Ensure backend is running on expected port

## Future Enhancements

- [ ] Dark/Light theme toggle
- [ ] Mobile app view optimization
- [ ] Advanced threat analytics
- [ ] Custom dashboard widgets
- [ ] Integration with more data sources
- [ ] Machine learning threat prediction

## Team

Developed for Sentinel AI Enterprise Security Platform

---

For issues, feature requests, or contributions, please contact the development team.
