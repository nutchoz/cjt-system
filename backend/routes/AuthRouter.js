const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';
const ALLOWED_ROLES = ['admin', 'user'];


//  Middleware: requireAuth
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


//  Middleware: requireAdmin
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


//  GET /auth/me
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


//  GET /auth/get-all
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


//  POST /auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required' });
        }

        const admin = await Admin.findOne({ where: { email } });
        if (!admin) return res.status(401).json({ success: false, message: 'Invalid email or password' });

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


//  POST /auth/logout
router.post('/logout', (req, res) => {
    res.status(200).json({ success: true });
});


//  POST /auth/create-admin
router.post('/create-admin', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
        }
        if (password.length < 6) {
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
        }

        const existing = await Admin.findOne({ where: { email } });
        if (existing) {
            return res.status(409).json({ success: false, message: 'An account with this email already exists' });
        }

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


//  PUT /auth/update/:id
router.put('/update/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
        const admin = await Admin.findByPk(req.params.id);
        if (!admin) return res.status(404).json({ success: false, message: 'Account not found' });

        const { name, email, role } = req.body;

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


// PUT /auth/reset-password/:id
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


//  DELETE /auth/delete/:id
router.delete('/delete/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
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

module.exports = router;
module.exports.requireAuth = requireAuth;
module.exports.requireAdmin = requireAdmin;