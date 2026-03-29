const express = require('express');
const ShippingLine = require('../models/ShippingLine');

const router = express.Router();

// Get all shipping lines
router.get('/get-all', async (req, res) => {
    try {
        const shippingLines = await ShippingLine.findAll({
            order: [['createdAt', 'DESC']]
        });
        res.status(200).json({ success: true, shippingLines });
    } catch (error) {
        console.error('Error fetching shipping lines:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch shipping lines', error: error.message });
    }
});

// Create a new shipping line
router.post('/create', async (req, res) => {
    try {
        const { code, name, email, life_state } = req.body;
        const newShippingLine = await ShippingLine.create({
            code,
            name,
            email: email || null,
            life_state,
        });
        res.status(201).json({ success: true, message: 'Shipping line created successfully', data: newShippingLine });
    } catch (error) {
        console.error('Error creating shipping line:', error);
        res.status(500).json({ success: false, message: 'Failed to create shipping line', error: error.message });
    }
});

// Update a shipping line
router.put('/update/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { code, name, email, life_state } = req.body;

        const shippingLine = await ShippingLine.findByPk(id);
        if (!shippingLine) {
            return res.status(404).json({ success: false, message: 'Shipping line not found' });
        }

        await shippingLine.update({
            code,
            name,
            email: email || null,
            life_state,
        });
        res.status(200).json({ success: true, message: 'Shipping line updated successfully', data: shippingLine });
    } catch (error) {
        console.error('Error updating shipping line:', error);
        res.status(500).json({ success: false, message: 'Failed to update shipping line', error: error.message });
    }
});

// Delete a shipping line
router.delete('/delete/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const shippingLine = await ShippingLine.findByPk(id);
        if (!shippingLine) {
            return res.status(404).json({ success: false, message: 'Shipping line not found' });
        }

        await shippingLine.destroy();
        res.status(200).json({ success: true, message: 'Shipping line deleted successfully' });
    } catch (error) {
        console.error('Error deleting shipping line:', error);
        res.status(500).json({ success: false, message: 'Failed to delete shipping line', error: error.message });
    }
});

module.exports = router;