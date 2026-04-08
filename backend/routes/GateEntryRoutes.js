const express = require('express');
const { sequelize, GateEntry, ShippingLine } = require('../models/models');
const { Op } = require('sequelize');
const sendEmail = require('../utils/sendEmail.js');

class GateEntryRouter {
    constructor() {
        this.router = express.Router();
        this.getRoutes();
        this.postRoutes();
        this.putRoutes();
        this.patchRoutes();
        this.deleteRoutes();
    }

    // ───────────────── GET ─────────────────
    getRoutes() {
        this.router.get('/get-all', async (req, res) => {
            try {
                const gateEntries = await GateEntry.findAll({
                    order: [['createdAt', 'DESC']]
                });
                res.status(200).json({ success: true, gateEntries });
            } catch (error) {
                console.error('Error fetching gate entries:', error);
                res.status(500).json({ error: 'Internal Server Error' });
            }
        });

        this.router.get('/get-all-location', async (req, res) => {
            try {
                const gateEntries = await GateEntry.findAll({
                    attributes: ['block_location', 'row_location', 'col_location', 'tier_location'],
                    where: { gate_out: null },
                    order: [['createdAt', 'DESC']]
                });

                const highestMap = {};
                gateEntries.forEach(entry => {
                    const key = `${entry.block_location}-${entry.row_location}-${entry.col_location}`;
                    if (!highestMap[key] || (entry.tier_location || 0) > (highestMap[key].tier_location || 0)) {
                        highestMap[key] = entry;
                    }
                });

                const gateEntriesLocation = Object.values(highestMap).map(entry => ({
                    location: `${entry.block_location}-${entry.row_location}-${entry.col_location}-${entry.tier_location || 0}`
                }));

                res.status(200).json({ success: true, data: gateEntriesLocation });
            } catch (error) {
                console.error('Error fetching gate entry locations:', error);
                res.status(500).json({ error: 'Internal Server Error' });
            }
        });

        this.router.get('/analytics', async (req, res) => {
            try {
                const today = new Date();
                const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

                const dailyCustomers = await GateEntry.count({
                    where: { gate_in: { [Op.gte]: startOfDay } }
                });

                const monthlyCustomers = await GateEntry.count({
                    where: { gate_in: { [Op.gte]: startOfMonth } }
                });

                res.status(200).json({ success: true, dailyCustomers, monthlyCustomers });
            } catch (error) {
                console.error('Error fetching analytics data:', error);
                res.status(500).json({ success: false, message: 'Failed to fetch analytics data', error: error.message });
            }
        });

        this.router.get('/:id', async (req, res) => {
            try {
                const entry = await GateEntry.findByPk(req.params.id);
                if (!entry) return res.status(404).json({ error: 'GateEntry not found' });
                res.status(200).json(entry);
            } catch (error) {
                console.error('Error fetching gate entry:', error);
                res.status(500).json({ error: 'Internal Server Error' });
            }
        });
    }

    // ───────────────── CREATE ─────────────────
    postRoutes() {
        this.router.post('/create', async (req, res) => {
            try {
                const gateEntry = await GateEntry.create(req.body);

                // ─── GATE IN HTML EMAIL (commented out — replaced by CODECO below) ───
                // const shippingLine = await ShippingLine.findOne({
                //     where: { name: req.body.shipping_line }
                // });
                // if (shippingLine?.email) {
                //     const { ... } = req.body;
                //     const fmt = ...
                //     const html = ...
                //     const text = ...
                //     const subject = ...
                //     const emailList = ...
                //     await Promise.all(emailList.map(...));
                // }
                // ─────────────────────────────────────────────────────────────────────

                // ─── GATE IN CODECO EMAIL NOTIFICATION ───────────────────────────────
                try {
                    const shippingLine = await ShippingLine.findOne({
                        where: { name: req.body.shipping_line }
                    });

                    if (shippingLine?.email) {
                        const shippingType = shippingLine.type || 'MAEU'; // ← use type from shipping line, fallback to MAEU

                        const {
                            gate_in,
                            block_location, row_location, col_location, tier_location,
                            container_no, transaction_nbr, booking_no, iso_code,
                            move_type, seal_no, mnr_status, damage_code,
                            entry_lane,
                        } = req.body;

                        const fmt = (val) => (val != null && val !== '') ? val : '';

                        // Format datetime as YYYYMMDDHHII (EDIFACT DTM format)
                        const fmtEdifact = (val) => {
                            if (!val) return '';
                            const d = new Date(val);
                            const pad = (n) => String(n).padStart(2, '0');
                            return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}`;
                        };

                        // Interchange control reference — use transaction_nbr or fallback to timestamp
                        const interchangeRef = fmt(transaction_nbr) || Date.now().toString().slice(-7);

                        // BGM+36 = Gate In (CODECO message type 36)
                        const codeco =
                            `UNB+UNOA:2+PHCAMLG+${shippingType}+${fmtEdifact(gate_in).slice(0,8)}+${interchangeRef}'\n` +
                            `UNH+6169+CODECO:D:95B:UN:SMDG21'\n` +
                            `BGM+36++9'\n` +
                            `TDT+1+++:172'\n` +
                            `LOC+9+:139:6'\n` +
                            `NAD+CF+PHCAMLG:72:87'\n` +
                            `EQD+CN+${fmt(container_no)}+${fmt(iso_code)}:102:5+++4'\n` +
                            `RFF+BN:${fmt(booking_no)}'\n` +
                            `TMD+2'\n` +
                            `DTM+7:${fmtEdifact(gate_in).slice(0,8)}:203'\n` +
                            `SEL+REPO+SH+1'\n` +
                            `CNT+16:1'\n` +
                            `UNT+000012+6169'\n` +
                            `UNZ+1+${interchangeRef}'`;

                        const subject = `CODECO GATE IN – ${fmt(container_no)}`;

                        const emailList = shippingLine.email
                            .split(',')
                            .map(e => e.trim())
                            .filter(Boolean);

                        await Promise.all(
                            emailList.map((address, i) =>
                                sendEmail(address, subject, codeco, `<pre>${codeco}</pre>`)
                                    .catch(err => {
                                        console.error(`Gate-in CODECO email ${i + 1} failed (non-blocking) [${address}]:`, err);
                                    })
                            )
                        );
                    }
                } catch (emailErr) {
                    // Non-blocking — gate entry already created, just log the email failure
                    console.error('Gate-in CODECO email notification failed (non-blocking):', emailErr);
                }
                // ─────────────────────────────────────────────────────────────────────

                res.status(201).json({ success: true, message: 'GateEntry created successfully', data: gateEntry });
            } catch (error) {
                console.error('Error creating gate entry:', error);
                if (error.name === 'SequelizeValidationError') return res.status(400).json({ error: error.errors });
                res.status(500).json({ error: 'Internal Server Error' });
            }
        });

        this.router.post('/gate-out', async (req, res) => {
            const t = await sequelize.transaction();
            try {
                const { id, gate_out, exit_lane } = req.body;

                if (!id || !gate_out) return res.status(400).json({ success: false, message: 'id and gate_out are required' });

                const gateEntry = await GateEntry.findByPk(id, { transaction: t });
                if (!gateEntry) {
                    await t.rollback();
                    return res.status(404).json({ success: false, message: 'GateEntry not found' });
                }

                if (gateEntry.gate_out) {
                    await t.rollback();
                    return res.status(400).json({ success: false, message: 'GateEntry already gated out' });
                }

                const isLaden = gateEntry.move_type?.toLowerCase() === 'laden';

                if (!isLaden && gateEntry.gate_in_payment_status !== 'paid') {
                    await t.rollback();
                    return res.status(400).json({ success: false, message: 'Gate in payment not completed. Please pay gate in fee first.' });
                }

                if (!isLaden && gateEntry.payment_status !== 'paid') {
                    await t.rollback();
                    return res.status(400).json({ success: false, message: 'Gate out payment not completed. Cannot gate out.' });
                }

                gateEntry.backup = { ...gateEntry._previousDataValues };

                const { block_location, row_location, col_location, tier_location } = gateEntry;

                await GateEntry.update({
                    gate_out,
                    exit_lane: exit_lane || gateEntry.exit_lane,
                    tier_location: null
                }, { where: { id: gateEntry.id }, transaction: t });

                await GateEntry.update(
                    { tier_location: sequelize.literal('tier_location - 1') },
                    {
                        where: {
                            block_location, row_location, col_location,
                            tier_location: { [Op.gt]: tier_location },
                            gate_out: null
                        },
                        transaction: t
                    }
                );

                await t.commit();

                // ─── GATE OUT HTML EMAIL (commented out — replaced by CODECO below) ───
                // try {
                //     const shippingLine = await ShippingLine.findOne({ ... });
                //     if (shippingLine?.email) {
                //         const fmt = ...
                //         const html = ...
                //         const text = ...
                //         const subject = ...
                //         await Promise.all(emailList.map(...));
                //     }
                // } catch (emailErr) {
                //     console.error('Gate-out email notification failed (non-blocking):', emailErr);
                // }
                // ──────────────────────────────────────────────────────────────────────

                // ─── GATE OUT CODECO EMAIL NOTIFICATION ──────────────────────────────
                try {
                    const shippingLine = await ShippingLine.findOne({
                        where: { name: gateEntry.shipping_line }
                    });

                    if (shippingLine?.email) {
                        const shippingType = shippingLine.type || 'MAEU'; // ← use type from shipping line, fallback to MAEU

                        const fmt = (val) => (val != null && val !== '') ? val : '';

                        // Format datetime as YYYYMMDDHHII (EDIFACT DTM format)
                        const fmtEdifact = (val) => {
                            if (!val) return '';
                            const d = new Date(val);
                            const pad = (n) => String(n).padStart(2, '0');
                            return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}`;
                        };

                        // Interchange control reference — use transaction_nbr or fallback to timestamp
                        const interchangeRef = fmt(gateEntry.transaction_nbr) || Date.now().toString().slice(-7);

                        // BGM+34 = Gate Out (CODECO message type 34)
                        const codeco =
                            `UNB+UNOA:2+PHCAMLG+${shippingType}+${fmtEdifact(gate_out).slice(0,8)}+${interchangeRef}'\n` +
                            `UNH+6169+CODECO:D:95B:UN:SMDG21'\n` +
                            `BGM+34++9'\n` +
                            `TDT+1+++:172'\n` +
                            `LOC+9+:139:6'\n` +
                            `NAD+CF+PHCAMLG:72:87'\n` +
                            `EQD+CN+${fmt(gateEntry.container_no)}+${fmt(gateEntry.iso_code)}:102:5+++4'\n` +
                            `RFF+BN:${fmt(gateEntry.booking_no)}'\n` +
                            `TMD+2'\n` +
                            `DTM+7:${fmtEdifact(gate_out).slice(0,8)}:203'\n` +
                            `SEL+REPO+SH+1'\n` +
                            `CNT+16:1'\n` +
                            `UNT+000012+6169'\n` +
                            `UNZ+1+${interchangeRef}'`;

                        const subject = `CODECO GATE OUT – ${fmt(gateEntry.container_no)}`;

                        const emailList = shippingLine.email
                            .split(',')
                            .map(e => e.trim())
                            .filter(Boolean);

                        await Promise.all(
                            emailList.map((address, i) =>
                                sendEmail(address, subject, codeco, `<pre>${codeco}</pre>`)
                                    .catch(err => {
                                        console.error(`Gate-out CODECO email ${i + 1} failed (non-blocking) [${address}]:`, err);
                                    })
                            )
                        );
                    }
                } catch (emailErr) {
                    // Non-blocking — gate out already committed, just log the email failure
                    console.error('Gate-out CODECO email notification failed (non-blocking):', emailErr);
                }
                // ─────────────────────────────────────────────────────────────────────

                res.status(200).json({ success: true, message: 'Gate out successful and tiers updated', data: gateEntry });

            } catch (error) {
                await t.rollback();
                console.error('Error gating out:', error);
                res.status(500).json({ success: false, message: 'Internal Server Error' });
            }
        });
    }

    // ───────────────── UPDATE ─────────────────
    putRoutes() {
        this.router.put('/update/:id', async (req, res) => {
            try {
                const { id } = req.params;
                const gateEntry = await GateEntry.findByPk(id);
                if (!gateEntry) return res.status(404).json({ error: 'GateEntry not found' });

                gateEntry.backup = { ...gateEntry._previousDataValues };

                await GateEntry.update({ backup: gateEntry.backup }, { where: { id: gateEntry.id } });
                await GateEntry.update(req.body, { where: { id: gateEntry.id } });
                res.status(200).json({ message: 'GateEntry updated successfully', data: gateEntry });
            } catch (error) {
                console.error('Error updating gate entry:', error);
                if (error.name === 'SequelizeValidationError') return res.status(400).json({ error: error.errors });
                res.status(500).json({ error: 'Internal Server Error' });
            }
        });
    }

    // ───────────────── PATCH ─────────────────
    patchRoutes() {
        this.router.patch('/:id/payment', async (req, res) => {
            try {
                const { id } = req.params;
                const {
                    payment_status,
                    payment_need,
                    payment_amount,
                    payment_method,
                    payment_date,
                    payment_reference,
                } = req.body;

                const gateEntry = await GateEntry.findByPk(id);
                if (!gateEntry) return res.status(404).json({ success: false, message: 'Record not found' });

                if (gateEntry.payment_status === 'paid') {
                    return res.status(400).json({ success: false, message: 'Gate out payment already recorded.' });
                }

                gateEntry.backup = { ...gateEntry._previousDataValues };
                await gateEntry.update({
                    payment_status,
                    payment_need,
                    payment_amount,
                    payment_method,
                    payment_date,
                    payment_reference,
                });

                return res.status(200).json({ success: true, message: 'Payment updated successfully', gateEntry });
            } catch (error) {
                console.error('Error updating payment:', error);
                return res.status(500).json({ success: false, message: 'Failed to update payment status', error: error.message });
            }
        });

        this.router.patch('/:id/gate-in-payment', async (req, res) => {
            try {
                const { id } = req.params;
                const {
                    gate_in_payment_status,
                    gate_in_payment_amount,
                    gate_in_payment_method,
                    gate_in_payment_date,
                    gate_in_payment_reference,
                } = req.body;

                const gateEntry = await GateEntry.findByPk(id);
                if (!gateEntry) return res.status(404).json({ success: false, message: 'Record not found' });

                if (gateEntry.gate_in_payment_status === 'paid') {
                    return res.status(400).json({ success: false, message: 'Gate in payment already recorded.' });
                }

                await gateEntry.update({
                    gate_in_payment_status,
                    gate_in_payment_amount,
                    gate_in_payment_method,
                    gate_in_payment_date,
                    gate_in_payment_reference,
                });

                return res.status(200).json({ success: true, message: 'Gate in payment recorded successfully.', gateEntry });
            } catch (error) {
                console.error('Error updating gate in payment:', error);
                return res.status(500).json({ success: false, message: 'Failed to update gate in payment.', error: error.message });
            }
        });
    }

    // ───────────────── DELETE ─────────────────
    deleteRoutes() {
        this.router.delete('/delete/:id', async (req, res) => {
            try {
                const { id } = req.params;
                const gateEntry = await GateEntry.findByPk(id);
                if (!gateEntry) return res.status(404).json({ error: 'GateEntry not found' });

                gateEntry.backup = { ...gateEntry._previousDataValues };
                await gateEntry.save();

                await gateEntry.destroy();
                res.status(200).json({ message: 'GateEntry deleted successfully' });
            } catch (error) {
                console.error('Error deleting gate entry:', error);
                res.status(500).json({ error: 'Internal Server Error' });
            }
        });
    }
}

module.exports = new GateEntryRouter().router;