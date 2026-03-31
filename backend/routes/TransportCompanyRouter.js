const express = require('express');
const TransportCompany = require('../models/TransportCompany');

const router = express.Router();

/**
 * GET /transport-companies/get-all
 * Fetches all transport company records ordered by newest first.
 */
router.get('/get-all', async (req, res) => {
    try {
        const transportCompanies = await TransportCompany.findAll({
            order: [['createdAt', 'DESC']]
        });
        res.status(200).json({ success: true, transportCompanies });
    } catch (error) {
        console.error('Error fetching transport companies:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch transport companies',
            error: error.message
        });
    }
});

/**
 * POST /transport-companies/create
 * Creates a new transport company record from the request body.
 */
router.post('/create', async (req, res) => {
    try {
        const { name, code, status } = req.body;
        const newTransportCompany = await TransportCompany.create({ name, code, status });
        res.status(201).json({
            success: true,
            message: 'Transport company created successfully',
            data: newTransportCompany
        });
    } catch (error) {
        console.error('Error creating transport company:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create transport company',
            error: error.message
        });
    }
});

/**
 * PUT /transport-companies/update/:id
 * Updates the name, code, and status of an existing transport company by ID.
 * Returns 404 if the record does not exist.
 */
router.put('/update/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, code, status } = req.body;

        const record = await TransportCompany.findByPk(id);
        if (!record) {
            return res.status(404).json({
                success: false,
                message: 'Transport company not found'
            });
        }

        await record.update({ name, code, status });
        res.status(200).json({
            success: true,
            message: 'Transport company updated successfully',
            data: record
        });
    } catch (error) {
        console.error('Error updating transport company:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update transport company',
            error: error.message
        });
    }
});

/**
 * DELETE /transport-companies/delete/:id
 * Permanently deletes a transport company record by ID.
 * Returns 404 if the record does not exist.
 */
router.delete('/delete/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const record = await TransportCompany.findByPk(id);
        if (!record) {
            return res.status(404).json({
                success: false,
                message: 'Transport company not found'
            });
        }

        await record.destroy();
        res.status(200).json({
            success: true,
            message: 'Transport company deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting transport company:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete transport company',
            error: error.message
        });
    }
});

module.exports = router;