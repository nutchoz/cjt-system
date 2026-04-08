const express = require('express');
const ShippingLine = require('../models/ShippingLine');

const router = express.Router();

/**
 * GET /shipping-lines/get-all
 * Fetches all shipping line records ordered by newest first.
 */
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

/**
 * POST /shipping-lines/create
 * Creates a new shipping line. The email field is optional and stored as
 * null when blank — it may contain a comma-separated list of addresses.
 * The type field describes the shipping line type (e.g., FCL, LCL, RORO).
 */
router.post('/create', async (req, res) => {
    try {
        const { code, name, email, type, life_state } = req.body; // ← added type
        const newShippingLine = await ShippingLine.create({
            code,
            name,
            email: email || null,
            type,                // ← added type
            life_state,
        });
        res.status(201).json({ success: true, message: 'Shipping line created successfully', data: newShippingLine });
    } catch (error) {
        console.error('Error creating shipping line:', error);
        res.status(500).json({ success: false, message: 'Failed to create shipping line', error: error.message });
    }
});

/**
 * PUT /shipping-lines/update/:id
 * Updates an existing shipping line by ID.
 * Stores email as null when an empty value is provided.
 * Returns 404 if the record does not exist.
 */
router.put('/update/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { code, name, email, type, life_state } = req.body; // ← added type

        const shippingLine = await ShippingLine.findByPk(id);
        if (!shippingLine) {
            return res.status(404).json({ success: false, message: 'Shipping line not found' });
        }

        await shippingLine.update({
            code,
            name,
            email: email || null,
            type,                // ← added type
            life_state,
        });
        res.status(200).json({ success: true, message: 'Shipping line updated successfully', data: shippingLine });
    } catch (error) {
        console.error('Error updating shipping line:', error);
        res.status(500).json({ success: false, message: 'Failed to update shipping line', error: error.message });
    }
});

/**
 * DELETE /shipping-lines/delete/:id
 * Permanently deletes a shipping line record by ID.
 * Returns 404 if the record does not exist.
 */
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