const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'chawnah_foods_inc_asset_secret_key_2026';

// Helper: Ensure default IT admin and corporate accounts exist
async function ensureDefaultAdmin() {
  try {
    // 1. Ensure IT Department Admin account
    let itAdmin = await User.findOne({ username: 'it.admin' });
    if (!itAdmin) {
      itAdmin = new User({
        username: 'it.admin',
        password: 'admin123',
        name: 'IT Department Administrator',
        email: 'it.admin@chawnahfoods.com',
        role: 'admin',
        department: 'Information Technology (IT)',
      });
      await itAdmin.save();
      console.log('✅ IT Department admin account created: (username: "it.admin", password: "admin123")');
    }

    // 2. Ensure general system admin account
    let sysAdmin = await User.findOne({ username: 'admin' });
    if (!sysAdmin) {
      sysAdmin = new User({
        username: 'admin',
        password: 'admin123',
        name: 'IT Systems Administrator',
        email: 'admin@chawnahfoods.com',
        role: 'admin',
        department: 'Information Technology (IT)',
      });
      await sysAdmin.save();
      console.log('✅ System admin account created: (username: "admin", password: "admin123")');
    }
  } catch (err) {
    console.error('Error ensuring default admin:', err);
  }
}

// POST /api/auth/login - Authenticate admin credentials
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    let cleanUsername = username.trim().toLowerCase();
    // Allow seamless access whether typed as "itadmin" or "it.admin"
    if (cleanUsername === 'itadmin') {
      cleanUsername = 'it.admin';
    }

    const user = await User.findOne({
      $or: [{ username: cleanUsername }, { email: cleanUsername }],
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    // Update lastLogin
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT
    const token = jwt.sign(
      {
        id: user._id,
        username: user.username,
        role: user.role,
        name: user.name,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        lastLogin: user.lastLogin,
      },
      message: 'Login successful',
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Internal server error during authentication', error: err.message });
  }
});

// GET /api/auth/me - Validate current session token and get user profile
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No authentication token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User account not found' });
    }

    res.json({
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        lastLogin: user.lastLogin,
      },
    });
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token', error: err.message });
  }
});

// GET /api/auth/users - List system accounts (admin only)
router.get('/users', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];
    jwt.verify(token, JWT_SECRET);

    const users = await User.find({}, '-password').sort({ createdAt: 1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving user accounts', error: err.message });
  }
});

// POST /api/auth/users - Create a new user account (for IT or other departments)
router.post('/users', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];
    jwt.verify(token, JWT_SECRET);

    const { username, password, name, email, role, department } = req.body;
    if (!username || !password || !name) {
      return res.status(400).json({ message: 'Username, password, and full name are required' });
    }

    const cleanUsername = username.trim().toLowerCase();
    const existing = await User.findOne({ username: cleanUsername });
    if (existing) {
      return res.status(400).json({ message: 'An account with this username already exists' });
    }

    const newUser = new User({
      username: cleanUsername,
      password,
      name: name.trim(),
      email: (email || '').trim().toLowerCase(),
      role: role || 'admin',
      department: department || 'Information Technology (IT)',
    });

    await newUser.save();

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      user: {
        id: newUser._id,
        username: newUser.username,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        department: newUser.department,
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Error creating account', error: err.message });
  }
});

// PUT /api/auth/change-password - Change password for the current session
router.put('/change-password', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters long' });
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ message: 'User account not found' });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error updating password', error: err.message });
  }
});

// POST /api/auth/logout - Logout endpoint
router.post('/logout', (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

module.exports = router;
module.exports.ensureDefaultAdmin = ensureDefaultAdmin;

