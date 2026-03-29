const express = require('express');
const PlateNumber = require('../models/PlateNumber');

const router = express.Router();

// Get all plate numbers
router.get('/get-all', async (req, res) => {
    try {
        const plateNumbers = await PlateNumber.findAll({
            order: [['createdAt', 'DESC']]
        });
        res.status(200).json({
            success: true,
            plateNumbers
        });
    } catch (error) {
        console.error('Error fetching plate numbers:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch plate numbers',
            error: error.message
        });
    }
});

// Create a new plate number
router.post('/create', async (req, res) => {
    try {
        const { plateNumber, licenseExpiryDate, status, truckCompany } = req.body;
        const newPlateNumber = await PlateNumber.create({ plateNumber, licenseExpiryDate, status, truckCompany });
        res.status(201).json({
            success: true,
            message: 'Plate number created successfully',
            data: newPlateNumber
        });
    } catch (error) {
        console.error('Error creating plate number:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create plate number',
            error: error.message
        });
    }
});

// Update a plate number
router.put('/update/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { plateNumber, licenseExpiryDate, status, truckCompany } = req.body;

        const record = await PlateNumber.findByPk(id);
        if (!record) {
            return res.status(404).json({
                success: false,
                message: 'Plate number not found'
            });
        }

        await record.update({ plateNumber, licenseExpiryDate, status, truckCompany });
        res.status(200).json({
            success: true,
            message: 'Plate number updated successfully',
            data: record
        });
    } catch (error) {
        console.error('Error updating plate number:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update plate number',
            error: error.message
        });
    }
});

// Delete a plate number
router.delete('/delete/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const record = await PlateNumber.findByPk(id);
        if (!record) {
            return res.status(404).json({
                success: false,
                message: 'Plate number not found'
            });
        }

        await record.destroy();
        res.status(200).json({
            success: true,
            message: 'Plate number deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting plate number:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete plate number',
            error: error.message
        });
    }
});

module.exports = router;