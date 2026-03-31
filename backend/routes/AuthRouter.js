const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';
// Roles allowed to be assigned to accounts
const ALLOWED_ROLES = ['admin', 'user'];

/**
 * Middleware: requireAuth
 * Validates the Bearer JWT from the Authorization header.
 * Attaches the decoded admin ID to req.adminId on success.
 * Returns 401 if the token is missing, malformed, or expired.
 */
const requireAuth = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        req.adminId = decoded.id;
        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
};

/**
 * Middleware: requireAdmin
 * Checks that the authenticated user has the 'admin' role.
 * Must be used after requireAuth (depends on req.adminId).
 * Returns 403 if the user is not an admin.
 */
const requireAdmin = async (req, res, next) => {
    try {
        const admin = await Admin.findByPk(req.adminId, { attributes: ['role'] });
        if (!admin || admin.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Forbidden: admin access required' });
        }
        next();
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

/**
 * GET /auth/me
 * Returns the profile of the currently authenticated user.
 * Requires a valid auth token.
 */
router.get('/me', requireAuth, async (req, res) => {
    try {
        const admin = await Admin.findByPk(req.adminId, {
            attributes: ['id', 'name', 'email', 'role'],
        });
        if (!admin) return res.status(401).json({ success: false, message: 'User not found' });
        res.status(200).json({ success: true, admin });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

/**
 * GET /auth/get-all
 * Returns all admin/user accounts ordered by newest first.
 * Restricted to authenticated admins only.
 */
router.get('/get-all', requireAuth, requireAdmin, async (req, res) => {
    try {
        const admins = await Admin.findAll({
            attributes: ['id', 'name', 'email', 'role', 'createdAt'],
            order: [['createdAt', 'DESC']],
        });
        res.status(200).json({ success: true, admins });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch accounts', error: error.message });
    }
});

/**
 * POST /auth/login
 * Authenticates a user with email and password.
 * Returns a signed JWT (8h expiry) and the user's profile on success.
 * Returns 401 for invalid credentials.
 */
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required' });
        }

        const admin = await Admin.findOne({ where: { email } });
        if (!admin) return res.status(401).json({ success: false, message: 'Invalid email or password' });

        // Compare the plain-text password against the stored bcrypt hash
        const isMatch = await bcrypt.compare(password, admin.password_hash);
        if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid email or password' });

        const token = jwt.sign({ id: admin.id }, JWT_SECRET, { expiresIn: '8h' });

        res.status(200).json({
            success: true,
            message: 'Login successful',
            token,
            admin: { id: admin.id, name: admin.name, email: admin.email, role: admin.role },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Login failed', error: error.message });
    }
});

/**
 * POST /auth/logout
 * Stateless logout — the client is responsible for discarding the token.
 * Always returns success since JWTs are invalidated client-side.
 */
router.post('/logout', (req, res) => {
    res.status(200).json({ success: true });
});

/**
 * POST /auth/create-admin
 * Creates a new user or admin account.
 * Requires name, email, and a password of at least 6 characters.
 * Role defaults to 'user' if an unrecognised role is supplied.
 * Restricted to authenticated admins only.
 */
router.post('/create-admin', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
        }
        if (password.length < 6) {
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
        }

        // Prevent duplicate email registrations
        const existing = await Admin.findOne({ where: { email } });
        if (existing) {
            return res.status(409).json({ success: false, message: 'An account with this email already exists' });
        }

        // Silently fall back to 'user' for any unrecognised role value
        const assignedRole = ALLOWED_ROLES.includes(role) ? role : 'user';
        const password_hash = await bcrypt.hash(password, 12);
        const newAdmin = await Admin.create({ name, email, password_hash, role: assignedRole });

        res.status(201).json({
            success: true,
            message: 'Account created successfully',
            admin: { id: newAdmin.id, name: newAdmin.name, email: newAdmin.email, role: newAdmin.role },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to create account', error: error.message });
    }
});

/**
 * PUT /auth/update/:id
 * Updates the name, email, and/or role of an existing account.
 * Checks for email uniqueness before applying changes.
 * Ignores unrecognised role values, keeping the existing role instead.
 * Restricted to authenticated admins only.
 */
router.put('/update/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
        const admin = await Admin.findByPk(req.params.id);
        if (!admin) return res.status(404).json({ success: false, message: 'Account not found' });

        const { name, email, role } = req.body;

        // Prevent changing to an email that is already taken by another account
        if (email && email !== admin.email) {
            const existing = await Admin.findOne({ where: { email } });
            if (existing) return res.status(409).json({ success: false, message: 'Email already in use' });
        }

        await admin.update({
            name: name ?? admin.name,
            email: email ?? admin.email,
            role: ALLOWED_ROLES.includes(role) ? role : admin.role,
        });

        res.status(200).json({
            success: true,
            message: 'Account updated',
            admin: { id: admin.id, name: admin.name, email: admin.email, role: admin.role },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update account', error: error.message });
    }
});

/**
 * PUT /auth/reset-password/:id
 * Replaces the password hash for a given account.
 * Requires the new password to be at least 6 characters long.
 * Restricted to authenticated admins only.
 */
router.put('/reset-password/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
        const admin = await Admin.findByPk(req.params.id);
        if (!admin) return res.status(404).json({ success: false, message: 'Account not found' });

        const { password } = req.body;
        if (!password || password.length < 6) {
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
        }

        const password_hash = await bcrypt.hash(password, 12);
        await admin.update({ password_hash });

        res.status(200).json({ success: true, message: 'Password reset successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to reset password', error: error.message });
    }
});

/**
 * DELETE /auth/delete/:id
 * Permanently deletes an account by ID.
 * Prevents an admin from deleting their own account.
 * Restricted to authenticated admins only.
 */
router.delete('/delete/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
        // Guard: an admin cannot delete the account they are currently logged in as
        if (parseInt(req.params.id) === req.adminId) {
            return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
        }

        const admin = await Admin.findByPk(req.params.id);
        if (!admin) return res.status(404).json({ success: false, message: 'Account not found' });

        await admin.destroy();
        res.status(200).json({ success: true, message: 'Account deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to delete account', error: error.message });
    }
});

// Export the router and middlewares for use in other route files
module.exports = router;
module.exports.requireAuth = requireAuth;
module.exports.requireAdmin = requireAdmin;