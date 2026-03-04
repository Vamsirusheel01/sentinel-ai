/**
 * Auth Storage Utility
 * Manages user data in localStorage
 */

const STORAGE_KEY = 'sentinel_users'

/**
 * Get all users from localStorage
 * @returns {Array} Array of user objects with username, password, role
 */
export function getUsers() {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : []
  } catch (error) {
    console.error('Error reading users from storage:', error)
    return []
  }
}

/**
 * Save users array to localStorage
 * @param {Array} users - Array of user objects to save
 * @returns {boolean} True if successful, false otherwise
 */
export function saveUsers(users) {
  try {
    if (!Array.isArray(users)) {
      throw new Error('Users must be an array')
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users))
    return true
  } catch (error) {
    console.error('Error saving users to storage:', error)
    return false
  }
}

/**
 * Add a new user to localStorage
 * @param {string} username - Username of the new user
 * @param {string} password - Password of the new user
 * @returns {Object|null} The newly created user object, or null if failed
 */
export function addUser(username, password) {
  try {
    // Validate inputs
    if (!username || !password) {
      throw new Error('Username and password are required')
    }

    if (username.length < 3) {
      throw new Error('Username must be at least 3 characters')
    }

    if (password.length < 4) {
      throw new Error('Password must be at least 4 characters')
    }

    // Get existing users
    const users = getUsers()

    // Check if username already exists
    if (users.some(u => u.username === username)) {
      throw new Error('Username already exists')
    }

    // Create new user
    const newUser = {
      username,
      password,
      role: 'user',
      createdAt: new Date().toISOString()
    }

    // Add to users array
    users.push(newUser)

    // Save to localStorage
    if (saveUsers(users)) {
      return newUser
    }

    return null
  } catch (error) {
    console.error('Error adding user:', error)
    throw error
  }
}

/**
 * Find a user by username and password
 * @param {string} username - Username to search for
 * @param {string} password - Password to verify
 * @returns {Object|null} The user object if found, null otherwise
 */
export function findUser(username, password) {
  try {
    const users = getUsers()
    return users.find(u => u.username === username && u.password === password) || null
  } catch (error) {
    console.error('Error finding user:', error)
    return null
  }
}

/**
 * Check if username exists
 * @param {string} username - Username to check
 * @returns {boolean} True if username exists, false otherwise
 */
export function userExists(username) {
  try {
    const users = getUsers()
    return users.some(u => u.username === username)
  } catch (error) {
    console.error('Error checking user existence:', error)
    return false
  }
}

/**
 * Delete a user by username
 * @param {string} username - Username to delete
 * @returns {boolean} True if successful, false otherwise
 */
export function deleteUser(username) {
  try {
    const users = getUsers()
    const filtered = users.filter(u => u.username !== username)

    if (filtered.length === users.length) {
      throw new Error('User not found')
    }

    return saveUsers(filtered)
  } catch (error) {
    console.error('Error deleting user:', error)
    return false
  }
}

/**
 * Clear all users from storage
 * @returns {boolean} True if successful, false otherwise
 */
export function clearAllUsers() {
  try {
    localStorage.removeItem(STORAGE_KEY)
    return true
  } catch (error) {
    console.error('Error clearing users:', error)
    return false
  }
}

/**
 * Get user count
 * @returns {number} Number of users in storage
 */
export function getUserCount() {
  try {
    return getUsers().length
  } catch (error) {
    console.error('Error getting user count:', error)
    return 0
  }
}

/**
 * Update user password
 * @param {string} username - Username to update
 * @param {string} newPassword - New password
 * @returns {Object|null} Updated user object, or null if failed
 */
export function updateUserPassword(username, newPassword) {
  try {
    if (!newPassword || newPassword.length < 4) {
      throw new Error('Password must be at least 4 characters')
    }

    const users = getUsers()
    const userIndex = users.findIndex(u => u.username === username)

    if (userIndex === -1) {
      throw new Error('User not found')
    }

    users[userIndex].password = newPassword
    users[userIndex].updatedAt = new Date().toISOString()

    if (saveUsers(users)) {
      return users[userIndex]
    }

    return null
  } catch (error) {
    console.error('Error updating user password:', error)
    throw error
  }
}
