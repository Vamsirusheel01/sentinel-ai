# Authentication Guide - AuthContext

This guide explains how to use the authentication system in Sentinel AI frontend.

## Overview

The `AuthContext` manages user authentication state across the entire application. It provides:
- User login, logout, and registration
- Authentication state management
- Role-based access control
- Token-based session management

## Quick Start

### 1. Using the useAuth Hook

```jsx
import { useAuth } from '../context/AuthContext'

export default function MyComponent() {
  const { user, role, isAuthenticated, login, logout } = useAuth()

  return (
    <div>
      {isAuthenticated ? (
        <>
          <p>Welcome {user}!</p>
          <button onClick={() => logout()}>Logout</button>
        </>
      ) : (
        <p>Please log in</p>
      )}
    </div>
  )
}
```

### 2. Authentication State

```jsx
const {
  // State
  user,              // Currently logged-in username (string)
  role,              // User role: 'admin' or 'user'
  isAuthenticated,   // Boolean: true if logged in
  isLoading,         // Boolean: true while auth is loading
  error,             // String: error message if any

  // Methods
  login,             // Function: login(username, password)
  logout,            // Function: logout()
  register,          // Function: register(username, password)

  // Helpers
  isAdmin,           // Function: isAdmin() -> boolean
  hasRole,           // Function: hasRole(role) -> boolean
  clearError         // Function: clearError()
} = useAuth()
```

## Features & Flow

### Login Process

```jsx
try {
  const result = await login('myusername', 'mypassword')
  console.log(result) // { success: true, user: 'myusername', role: 'user' }
} catch (error) {
  console.error(error.message) // 'Invalid username or password'
}
```

**Login Logic:**
1. Checks admin credentials first (admin/admin)
2. Falls back to checking localStorage users
3. Stores JWT token in localStorage
4. Updates authentication state

### Register Process

```jsx
try {
  const result = await register('newuser', 'mypassword')
  console.log(result) // { success: true, user: 'newuser', role: 'user' }
  // User is automatically logged in after registration
} catch (error) {
  console.error(error.message) // e.g., 'Username must be at least 3 characters'
}
```

**Register Logic:**
1. Validates username (min 3 chars)
2. Validates password (min 4 chars)
3. Checks for duplicate username
4. Saves user to localStorage (not admin account)
5. Automatically logs in new user
6. New users have role: 'user'

### Logout Process

```jsx
await logout()
// User is logged out, redirected to /login
```

## Authentication Data Storage

### Admin Account
```javascript
// Hardcoded in AuthContext.jsx:
ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'admin',
  role: 'admin'
}
```

### User Accounts
```javascript
// Stored in localStorage under "sentinel_users"
localStorage.getItem('sentinel_users')
// Returns: [
//   { username: 'user1', password: 'pass1', role: 'user', createdAt: '...' },
//   { username: 'user2', password: 'pass2', role: 'user', createdAt: '...' }
// ]
```

### Session Token
```javascript
// Stored in localStorage under "sentinel_token"
localStorage.getItem('sentinel_token')
// Returns: JWT-like token "header.payload.signature"
// Token contains: { username, role, iat }
```

## Protected Routes

Protect routes that require authentication using `ProtectedRoute`:

```jsx
import ProtectedRoute from './components/ProtectedRoute'

<Routes>
  <Route path="/login" element={<Login />} />
  
  <Route
    element={
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    }
  >
    <Route path="/" element={<Home />} />
    <Route path="/admin" element={<Admin />} />
  </Route>
</Routes>
```

If user is not authenticated, they'll be redirected to `/login`.

## Role-Based Access Control

### Using isAdmin()

```jsx
import { useAuth } from '../context/AuthContext'

export default function AdminPanel() {
  const { isAdmin, user } = useAuth()

  if (!isAdmin()) {
    return <div>Access Denied</div>
  }

  return <div>Welcome Admin {user}!</div>
}
```

### Using hasRole()

```jsx
const { hasRole } = useAuth()

if (hasRole('admin')) {
  // Show admin features
}

if (hasRole('user')) {
  // Show user features
}
```

### Conditional Rendering

```jsx
const { role } = useAuth()

return (
  <>
    {role === 'admin' && <AdminSection />}
    {role === 'user' && <UserSection />}
  </>
)
```

## Error Handling

Each auth function can throw an error. Handle them properly:

```jsx
const { login, error, clearError } = useAuth()
const [localError, setLocalError] = useState('')

const handleLogin = async (username, password) => {
  clearError() // Clear previous errors
  setLocalError('')

  try {
    await login(username, password)
    navigate('/')
  } catch (err) {
    setLocalError(err.message)
    // Or use: error state from context
  }
}

return (
  <>
    {error && <div className="error">{error}</div>}
    <button onClick={() => handleLogin('user', 'pass')}>Login</button>
  </>
)
```

## Usage Examples

### Login Page

```jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const { login, error } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await login(username, password)
      navigate('/')
    } catch (err) {
      console.error('Login failed:', err.message)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error">{error}</div>}
      <input
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Username"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />
      <button type="submit">Login</button>
    </form>
  )
}
```

### User Profile Component

```jsx
export default function UserProfile() {
  const { user, role, isAdmin, isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return <p>Not logged in</p>
  }

  return (
    <div>
      <h2>{user}</h2>
      <p>Role: {role}</p>
      {isAdmin() && <p>✓ Administrator Access</p>}
    </div>
  )
}
```

### Logout Button

```jsx
export default function LogoutButton() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return <button onClick={handleLogout}>Logout</button>
}
```

## Validation Rules

### Username Validation
- ✓ Minimum 3 characters
- ✓ Cannot be "admin"
- ✓ Must be unique

### Password Validation
- ✓ Minimum 4 characters
- ✗ No special requirements (for demo purposes)

## Token Science

The auth system uses JWT-like tokens (simplified for demo):

```javascript
// Token structure: header.payload.signature

header = {
  alg: 'HS256',
  typ: 'JWT'
}

payload = {
  username: 'john',
  role: 'user',
  iat: 1234567890
}

signature = 'sentinel-secret'

// Final token: eyJhbGc...base64...base64
```

**Note:** This is a simplified JWT for demo purposes. For production, use proper JWT libraries like `jsonwebtoken`.

## Local Storage Schema

```javascript
// Key: 'sentinel_users'
// Value: JSON array of user objects
[
  {
    username: 'john',
    password: 'pass123',    // ⚠️ WARNING: Passwords stored unencrypted
    role: 'user',
    createdAt: '2026-03-04T10:30:00Z'
  },
  {
    username: 'jane',
    password: 'pass456',
    role: 'user',
    createdAt: '2026-03-04T11:45:00Z'
  }
]

// Key: 'sentinel_token'
// Value: JWT-like token string
'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
```

## Security Considerations ⚠️

This authentication system is designed for **demo/development purposes only**.

### For Production, Implement:
1. **Secure Password Storage** - Hash passwords with bcrypt or similar
2. **HTTPS Only** - Always use HTTPS
3. **Secure Tokens** - Use proper JWT with RSA signing
4. **Backend Validation** - Never trust frontend validation
5. **CSRF Protection** - Implement CSRF tokens
6. **Rate Limiting** - Limit login attempts
7. **Session Expiry** - Add token expiration
8. **Secure Cookie Storage** - Store tokens in HttpOnly cookies
9. **Password Requirements** - Enforce strong passwords
10. **2FA** - Implement two-factor authentication

### Current Limitations:
- ❌ Passwords stored in plaintext
- ❌ No password hashing
- ❌ No token expiration
- ❌ No rate limiting
- ❌ Client-side only (no backend validation)
- ❌ Simplified JWT

## Testing Auth

### Test Admin Login
```javascript
// Credentials: admin / admin
const result = await login('admin', 'admin')
// role should be 'admin'
```

### Test User Registration
```javascript
const result = await register('testuser', 'pass123')
// role should be 'user'
```

### Test Invalid Login
```javascript
try {
  await login('invalid', 'wrong')
} catch (err) {
  // error.message === 'Invalid username or password'
}
```

## Migration from Old Auth System

If you have an existing auth system, migrate like this:

```jsx
// Old state
const [user, setUser] = useState(null)
const [role, setRole] = useState(null)

// New code
const { user, role } = useAuth()

// Replace old login calls
// OLD: setUser(resp.user); setRole(resp.role)
// NEW: await login(username, password)

// Replace old logout calls
// OLD: setUser(null); setRole(null)
// NEW: await logout()
```

## Troubleshooting

### "useAuth must be used within AuthProvider"
✓ Make sure AuthProvider wraps your app in `main.jsx`

### Token not persisting
✓ Check if localStorage is enabled in browser
✓ Verify token key is 'sentinel_token'

### Users not found after registration
✓ Check browser localStorage for 'sentinel_users'
✓ Verify user was saved correctly

### Role not updating
✓ Ensure refresh after login/logout
✓ Check setRole is being called

## Default Credentials

For testing and demo purposes:

| Username | Password | Role  |
|----------|----------|-------|
| admin    | admin    | admin |

You can create additional users through registration.
