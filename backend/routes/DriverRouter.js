const express = require('express');
const Driver = require('../models/Driver');

const router = express.Router();

/**
 * GET /drivers/get-all
 * Fetches all driver records ordered by newest first.
 */
router.get('/get-all', async (req, res) => {
    try {
        const drivers = await Driver.findAll({
            order: [['createdAt', 'DESC']]
        });
        res.status(200).json({ success: true, drivers });
    } catch (error) {
        console.error('Error fetching drivers:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch drivers',
            error: error.message
        });
    }
});

/**
 * POST /drivers/create
 * Creates a new driver record with name, license number,
 * activity status (active/banned), and life state (active/deceased).
 */
router.post('/create', async (req, res) => {
    try {
        const { name, licenseNumber, status, lifeState } = req.body;
        const newDriver = await Driver.create({ name, licenseNumber, status, lifeState });
        res.status(201).json({
            success: true,
            message: 'Driver created successfully',
            data: newDriver
        });
    } catch (error) {
        console.error('Error creating driver:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create driver',
            error: error.message
        });
    }
});

/**
 * PUT /drivers/update/:id
 * Updates an existing driver record by ID.
 * Returns 404 if the driver does not exist.
 */
router.put('/update/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, licenseNumber, status, lifeState } = req.body;

        const driver = await Driver.findByPk(id);
        if (!driver) {
            return res.status(404).json({
                success: false,
                message: 'Driver not found'
            });
        }

        await driver.update({ name, licenseNumber, status, lifeState });
        res.status(200).json({
            success: true,
            message: 'Driver updated successfully',
            data: driver
        });
    } catch (error) {
        console.error('Error updating driver:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update driver',
            error: error.message
        });
    }
});

/**
 * DELETE /drivers/delete/:id
 * Permanently deletes a driver record by ID.
 * Returns 404 if the driver does not exist.
 */
router.delete('/delete/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const driver = await Driver.findByPk(id);
        if (!driver) {
            return res.status(404).json({
                success: false,
                message: 'Driver not found'
            });
        }

        await driver.destroy();
        res.status(200).json({
            success: true,
            message: 'Driver deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting driver:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete driver',
            error: error.message
        });
    }
});

module.exports = router;