// const express = require('express');
// const { sequelize, GateEntry, ShippingLine } = require('../models/models');
// const { Op } = require('sequelize');
// const sendEmail = require('../utils/sendEmail.js');

// class GateEntryRouter {
//     constructor() {
//         this.router = express.Router();
//         this.getRoutes();
//         this.postRoutes();
//         this.putRoutes();
//         this.patchRoutes();
//         this.deleteRoutes();
//     }

//     // ───────────────── GET ─────────────────
//     getRoutes() {
//         this.router.get('/get-all', async (req, res) => {
//             try {
//                 const gateEntries = await GateEntry.findAll({
//                     order: [['createdAt', 'DESC']]
//                 });
//                 res.status(200).json({ success: true, gateEntries });
//             } catch (error) {
//                 console.error('Error fetching gate entries:', error);
//                 res.status(500).json({ error: 'Internal Server Error' });
//             }
//         });

//         this.router.get('/get-all-location', async (req, res) => {
//             try {
//                 const gateEntries = await GateEntry.findAll({
//                     attributes: ['block_location', 'row_location', 'col_location', 'tier_location'],
//                     where: { gate_out: null },
//                     order: [['createdAt', 'DESC']]
//                 });

//                 const highestMap = {};
//                 gateEntries.forEach(entry => {
//                     const key = `${entry.block_location}-${entry.row_location}-${entry.col_location}`;
//                     if (!highestMap[key] || (entry.tier_location || 0) > (highestMap[key].tier_location || 0)) {
//                         highestMap[key] = entry;
//                     }
//                 });

//                 const gateEntriesLocation = Object.values(highestMap).map(entry => ({
//                     location: `${entry.block_location}-${entry.row_location}-${entry.col_location}-${entry.tier_location || 0}`
//                 }));

//                 res.status(200).json({ success: true, data: gateEntriesLocation });
//             } catch (error) {
//                 console.error('Error fetching gate entry locations:', error);
//                 res.status(500).json({ error: 'Internal Server Error' });
//             }
//         });

//         // ✅ /analytics must be BEFORE /:id — otherwise /:id swallows it
//         this.router.get('/analytics', async (req, res) => {
//             try {
//                 const today = new Date();
//                 const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
//                 const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

//                 const dailyCustomers = await GateEntry.count({
//                     where: { gate_in: { [Op.gte]: startOfDay } }
//                 });

//                 const monthlyCustomers = await GateEntry.count({
//                     where: { gate_in: { [Op.gte]: startOfMonth } }
//                 });

//                 res.status(200).json({ success: true, dailyCustomers, monthlyCustomers });
//             } catch (error) {
//                 console.error('Error fetching analytics data:', error);
//                 res.status(500).json({ success: false, message: 'Failed to fetch analytics data', error: error.message });
//             }
//         });

//         // ✅ /:id is LAST — wildcard, must never be registered before specific paths
//         this.router.get('/:id', async (req, res) => {
//             try {
//                 const entry = await GateEntry.findByPk(req.params.id);
//                 if (!entry) return res.status(404).json({ error: 'GateEntry not found' });
//                 res.status(200).json(entry);
//             } catch (error) {
//                 console.error('Error fetching gate entry:', error);
//                 res.status(500).json({ error: 'Internal Server Error' });
//             }
//         });
//     }

//     // ───────────────── CREATE ─────────────────
//     postRoutes() {
//         this.router.post('/create', async (req, res) => {
//             try {
//                 const gateEntry = await GateEntry.create(req.body);

//                 // Look up shipping line by name to get emails
//                 const shippingLine = await ShippingLine.findOne({
//                     where: { name: req.body.shipping_line }
//                 });

//                 if (shippingLine?.email) {
//                     const {
//                         gate_in,
//                         block_location, row_location, col_location, tier_location,
//                         container_no, transaction_nbr, booking_no, iso_code,
//                         category, reefer_reqt, seal_no, move_type,
//                         transport_company, drivers_name, driver_licence, plate_no, trans_creator,
//                         gross_weight, tare_weight, net_weight, vgm_weight,
//                         entry_lane, exit_lane,
//                         mnr_status, damage_code, inspection_notes, gate_inspector,
//                     } = req.body;

//                     const fmt = (val) => (val != null && val !== '') ? val : 'N/A';
//                     const fmtDate = (val) => val
//                         ? new Date(val).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
//                         : 'N/A';
//                     const fmtKg = (val) => (val != null && val !== '') ? `${val} kg` : 'N/A';
//                     const location = `${fmt(block_location)}-${fmt(row_location)}-${fmt(col_location)}-${fmt(tier_location)}`;

//                     const row = (label, value, shade) =>
//                         `<tr style="background-color:${shade ? '#f9fafb' : '#ffffff'};">
//                             <td style="padding:10px 14px;font-weight:600;color:#374151;border-bottom:1px solid #e5e7eb;width:38%;">${label}</td>
//                             <td style="padding:10px 14px;color:#111827;border-bottom:1px solid #e5e7eb;">${value}</td>
//                         </tr>`;

//                     const sectionHeader = (title) =>
//                         `<tr><td colspan="2" style="padding:14px 14px 6px;font-size:12px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.07em;background:#fff;border-bottom:2px solid #e5e7eb;">${title}</td></tr>`;

//                     const html = `
//                     <div style="font-family:Arial,sans-serif;max-width:660px;margin:0 auto;padding:28px;border:1px solid #e5e7eb;border-radius:10px;background:#fff;">
//                         <div style="margin-bottom:20px;">
//                             <h2 style="color:#1e3a5f;margin:0 0 4px;">Gate Entry Created</h2>
//                             <p style="color:#6b7280;margin:0;font-size:14px;">A new gate entry has been recorded for <strong>${shippingLine.name}</strong>.</p>
//                         </div>
//                         <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
//                             ${sectionHeader('Container & Transaction')}
//                             ${row('Container No', `<span style="font-family:monospace;font-weight:700;">${fmt(container_no)}</span>`, true)}
//                             ${row('Transaction NBR', fmt(transaction_nbr), false)}
//                             ${row('Booking No', fmt(booking_no), true)}
//                             ${row('ISO Code', fmt(iso_code), false)}
//                             ${row('Category', fmt(category), true)}
//                             ${row('Move Type', fmt(move_type), false)}
//                             ${row('Reefer REQT', fmt(reefer_reqt), true)}
//                             ${row('Seal No', fmt(seal_no), false)}
//                             ${sectionHeader('Location & Timing')}
//                             ${row('Gate In', fmtDate(gate_in), true)}
//                             ${row('Yard Location', `<span style="font-family:monospace;">${location}</span>`, false)}
//                             ${row('Entry Lane', fmt(entry_lane), true)}
//                             ${row('Exit Lane', fmt(exit_lane), false)}
//                             ${sectionHeader('Transport')}
//                             ${row('Transport Company', fmt(transport_company), true)}
//                             ${row("Driver's Name", fmt(drivers_name), false)}
//                             ${row('Driver Licence', fmt(driver_licence), true)}
//                             ${row('Plate No', fmt(plate_no), false)}
//                             ${row('Trans Creator', fmt(trans_creator), true)}
//                             ${sectionHeader('Weight')}
//                             ${row('Gross Weight', fmtKg(gross_weight), true)}
//                             ${row('Tare Weight', fmtKg(tare_weight), false)}
//                             ${row('Net Weight', fmtKg(net_weight), true)}
//                             ${row('VGM Weight', fmtKg(vgm_weight), false)}
//                             ${sectionHeader('Inspection')}
//                             ${row('MNR Status', fmt(mnr_status), true)}
//                             ${row('Damage Code', fmt(damage_code), false)}
//                             ${row('Gate Inspector', fmt(gate_inspector), true)}
//                             ${row('Inspection Notes', fmt(inspection_notes), false)}
//                         </table>
//                         <p style="margin-top:20px;font-size:11px;color:#9ca3af;">This is an automated notification from the Shipping Management System.</p>
//                     </div>`;

//                     const text =
//                         `Gate Entry Created – ${shippingLine.name}\n\n` +
//                         `Container No: ${fmt(container_no)}\nTransaction NBR: ${fmt(transaction_nbr)}\n` +
//                         `Booking No: ${fmt(booking_no)}\nISO Code: ${fmt(iso_code)}\n` +
//                         `Category: ${fmt(category)}\nMove Type: ${fmt(move_type)}\n` +
//                         `Reefer REQT: ${fmt(reefer_reqt)}\nSeal No: ${fmt(seal_no)}\n\n` +
//                         `Gate In: ${fmtDate(gate_in)}\nYard Location: ${location}\n` +
//                         `Entry Lane: ${fmt(entry_lane)}\nExit Lane: ${fmt(exit_lane)}\n\n` +
//                         `Transport Company: ${fmt(transport_company)}\nDriver: ${fmt(drivers_name)}\n` +
//                         `Licence: ${fmt(driver_licence)}\nPlate No: ${fmt(plate_no)}\nTrans Creator: ${fmt(trans_creator)}\n\n` +
//                         `Gross Weight: ${fmtKg(gross_weight)}\nTare Weight: ${fmtKg(tare_weight)}\n` +
//                         `Net Weight: ${fmtKg(net_weight)}\nVGM Weight: ${fmtKg(vgm_weight)}\n\n` +
//                         `MNR Status: ${fmt(mnr_status)}\nDamage Code: ${fmt(damage_code)}\n` +
//                         `Gate Inspector: ${fmt(gate_inspector)}\nInspection Notes: ${fmt(inspection_notes)}`;

//                     const subject = `Gate Entry Created – Container ${container_no}`;

//                     // ✅ email is now a comma-separated string — split and fire to every address
//                     const emailList = shippingLine.email
//                         .split(',')
//                         .map(e => e.trim())
//                         .filter(Boolean);

//                         await Promise.all(
//                             emailList.map((address, i) =>
//                                 sendEmail(address, subject, text, html)
//                                     .catch(err => {
//                                         console.error(`Email ${i + 1} send failed (non-blocking) [${address}]:`, err);
//                                     })
//                             )
//                         );
//                 }

//                 res.status(201).json({ success: true, message: 'GateEntry created successfully', data: gateEntry });
//             } catch (error) {
//                 console.error('Error creating gate entry:', error);
//                 if (error.name === 'SequelizeValidationError') return res.status(400).json({ error: error.errors });
//                 res.status(500).json({ error: 'Internal Server Error' });
//             }
//         });

//         this.router.post('/gate-out', async (req, res) => {
//             const t = await sequelize.transaction();
//             try {
//                 const { id, gate_out, exit_lane } = req.body;

//                 if (!id || !gate_out) return res.status(400).json({ success: false, message: 'id and gate_out are required' });

//                 const gateEntry = await GateEntry.findByPk(id, { transaction: t });
//                 if (!gateEntry) {
//                     await t.rollback();
//                     return res.status(404).json({ success: false, message: 'GateEntry not found' });
//                 }

//                 if (gateEntry.gate_out) {
//                     await t.rollback();
//                     return res.status(400).json({ success: false, message: 'GateEntry already gated out' });
//                 }


//                 const isLaden = gateEntry.move_type?.toLowerCase() === 'laden';

//                 // ✅ Gate in payment must be paid first (skip for Laden)
//                 if (!isLaden && gateEntry.gate_in_payment_status !== 'paid') {
//                     await t.rollback();
//                     return res.status(400).json({ success: false, message: 'Gate in payment not completed. Please pay gate in fee first.' });
//                 }

//                 // ✅ Gate out payment must also be paid (skip for Laden)
//                 if (!isLaden && gateEntry.payment_status !== 'paid') {
//                     await t.rollback();
//                     return res.status(400).json({ success: false, message: 'Gate out payment not completed. Cannot gate out.' });
//                 }


//                 gateEntry.backup = { ...gateEntry._previousDataValues };

//                 const { block_location, row_location, col_location, tier_location } = gateEntry;

//                 await GateEntry.update({
//                     gate_out,
//                     exit_lane: exit_lane || gateEntry.exit_lane,
//                     tier_location: null
//                 }, { where: { id: gateEntry.id }, transaction: t });

//                 await GateEntry.update(
//                     { tier_location: sequelize.literal('tier_location - 1') },
//                     {
//                         where: {
//                             block_location, row_location, col_location,
//                             tier_location: { [Op.gt]: tier_location },
//                             gate_out: null
//                         },
//                         transaction: t
//                     }
//                 );

//                 await t.commit();
//                 res.status(200).json({ success: true, message: 'Gate out successful and tiers updated', data: gateEntry });

//             } catch (error) {
//                 await t.rollback();
//                 console.error('Error gating out:', error);
//                 res.status(500).json({ success: false, message: 'Internal Server Error' });
//             }
//         });
//     }

//     // ───────────────── UPDATE ─────────────────
//     putRoutes() {
//         this.router.put('/update/:id', async (req, res) => {
//             try {
//                 const { id } = req.params;
//                 const gateEntry = await GateEntry.findByPk(id);
//                 if (!gateEntry) return res.status(404).json({ error: 'GateEntry not found' });

//                 // ─── BACKUP BEFORE UPDATE ───
//                 gateEntry.backup = { ...gateEntry._previousDataValues };

//                 await GateEntry.update({ backup: gateEntry.backup }, { where: { id: gateEntry.id } });
//                 await GateEntry.update(req.body, { where: { id: gateEntry.id } });
//                 res.status(200).json({ message: 'GateEntry updated successfully', data: gateEntry });
//             } catch (error) {
//                 console.error('Error updating gate entry:', error);
//                 if (error.name === 'SequelizeValidationError') return res.status(400).json({ error: error.errors });
//                 res.status(500).json({ error: 'Internal Server Error' });
//             }
//         });
//     }

//     // ───────────────── PATCH ─────────────────
//     patchRoutes() {
//         // ✅ Gate out payment — admin sets payment_need + payment details at payment time
//         this.router.patch('/:id/payment', async (req, res) => {
//             try {
//                 const { id } = req.params;
//                 const {
//                     payment_status,
//                     payment_need,
//                     payment_amount,
//                     payment_method,
//                     payment_date,
//                     payment_reference,
//                 } = req.body;

//                 const gateEntry = await GateEntry.findByPk(id);
//                 if (!gateEntry) return res.status(404).json({ success: false, message: 'Record not found' });

//                 if (gateEntry.payment_status === 'paid') {
//                     return res.status(400).json({ success: false, message: 'Gate out payment already recorded.' });
//                 }

//                 gateEntry.backup = { ...gateEntry._previousDataValues };
//                 await gateEntry.update({
//                     payment_status,
//                     payment_need,
//                     payment_amount,
//                     payment_method,
//                     payment_date,
//                     payment_reference,
//                 });

//                 return res.status(200).json({ success: true, message: 'Payment updated successfully', gateEntry });
//             } catch (error) {
//                 console.error('Error updating payment:', error);
//                 return res.status(500).json({ success: false, message: 'Failed to update payment status', error: error.message });
//             }
//         });

//         // ✅ Gate in payment
//         this.router.patch('/:id/gate-in-payment', async (req, res) => {
//             try {
//                 const { id } = req.params;
//                 const {
//                     gate_in_payment_status,
//                     gate_in_payment_amount,
//                     gate_in_payment_method,
//                     gate_in_payment_date,
//                     gate_in_payment_reference,
//                 } = req.body;

//                 const gateEntry = await GateEntry.findByPk(id);
//                 if (!gateEntry) return res.status(404).json({ success: false, message: 'Record not found' });

//                 if (gateEntry.gate_in_payment_status === 'paid') {
//                     return res.status(400).json({ success: false, message: 'Gate in payment already recorded.' });
//                 }

//                 await gateEntry.update({
//                     gate_in_payment_status,
//                     gate_in_payment_amount,
//                     gate_in_payment_method,
//                     gate_in_payment_date,
//                     gate_in_payment_reference,
//                 });

//                 return res.status(200).json({ success: true, message: 'Gate in payment recorded successfully.', gateEntry });
//             } catch (error) {
//                 console.error('Error updating gate in payment:', error);
//                 return res.status(500).json({ success: false, message: 'Failed to update gate in payment.', error: error.message });
//             }
//         });
//     }

//     // ───────────────── DELETE ─────────────────
//     deleteRoutes() {
//         this.router.delete('/delete/:id', async (req, res) => {
//             try {
//                 const { id } = req.params;
//                 const gateEntry = await GateEntry.findByPk(id);
//                 if (!gateEntry) return res.status(404).json({ error: 'GateEntry not found' });

//                 gateEntry.backup = { ...gateEntry._previousDataValues };
//                 await gateEntry.save();

//                 await gateEntry.destroy();
//                 res.status(200).json({ message: 'GateEntry deleted successfully' });
//             } catch (error) {
//                 console.error('Error deleting gate entry:', error);
//                 res.status(500).json({ error: 'Internal Server Error' });
//             }
//         });
//     }
// }

// module.exports = new GateEntryRouter().router;


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

                const shippingLine = await ShippingLine.findOne({
                    where: { name: req.body.shipping_line }
                });

                if (shippingLine?.email) {
                    const {
                        gate_in,
                        block_location, row_location, col_location, tier_location,
                        container_no, transaction_nbr, booking_no, iso_code,
                        category, reefer_reqt, seal_no, move_type,
                        transport_company, drivers_name, driver_licence, plate_no, trans_creator,
                        gross_weight, tare_weight, net_weight, vgm_weight,
                        entry_lane, exit_lane,
                        mnr_status, damage_code, inspection_notes, gate_inspector,
                    } = req.body;

                    const fmt = (val) => (val != null && val !== '') ? val : 'N/A';
                    const fmtDate = (val) => val
                        ? new Date(val).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
                        : 'N/A';
                    const fmtKg = (val) => (val != null && val !== '') ? `${val} kg` : 'N/A';
                    const location = `${fmt(block_location)}-${fmt(row_location)}-${fmt(col_location)}-${fmt(tier_location)}`;

                    const row = (label, value, shade) =>
                        `<tr style="background-color:${shade ? '#f9fafb' : '#ffffff'};">
                            <td style="padding:10px 14px;font-weight:600;color:#374151;border-bottom:1px solid #e5e7eb;width:38%;">${label}</td>
                            <td style="padding:10px 14px;color:#111827;border-bottom:1px solid #e5e7eb;">${value}</td>
                        </tr>`;

                    const sectionHeader = (title) =>
                        `<tr><td colspan="2" style="padding:14px 14px 6px;font-size:12px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.07em;background:#fff;border-bottom:2px solid #e5e7eb;">${title}</td></tr>`;

                    const html = `
                    <div style="font-family:Arial,sans-serif;max-width:660px;margin:0 auto;padding:28px;border:1px solid #e5e7eb;border-radius:10px;background:#fff;">
                        <div style="margin-bottom:20px;">
                            <h2 style="color:#1e3a5f;margin:0 0 4px;">Gate Entry Created</h2>
                            <p style="color:#6b7280;margin:0;font-size:14px;">A new gate entry has been recorded for <strong>${shippingLine.name}</strong>.</p>
                        </div>
                        <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
                            ${sectionHeader('Container & Transaction')}
                            ${row('Container No', `<span style="font-family:monospace;font-weight:700;">${fmt(container_no)}</span>`, true)}
                            ${row('Transaction NBR', fmt(transaction_nbr), false)}
                            ${row('Booking No', fmt(booking_no), true)}
                            ${row('ISO Code', fmt(iso_code), false)}
                            ${row('Category', fmt(category), true)}
                            ${row('Move Type', fmt(move_type), false)}
                            ${row('Reefer REQT', fmt(reefer_reqt), true)}
                            ${row('Seal No', fmt(seal_no), false)}
                            ${sectionHeader('Location & Timing')}
                            ${row('Gate In', fmtDate(gate_in), true)}
                            ${row('Yard Location', `<span style="font-family:monospace;">${location}</span>`, false)}
                            ${row('Entry Lane', fmt(entry_lane), true)}
                            ${row('Exit Lane', fmt(exit_lane), false)}
                            ${sectionHeader('Transport')}
                            ${row('Transport Company', fmt(transport_company), true)}
                            ${row("Driver's Name", fmt(drivers_name), false)}
                            ${row('Driver Licence', fmt(driver_licence), true)}
                            ${row('Plate No', fmt(plate_no), false)}
                            ${row('Trans Creator', fmt(trans_creator), true)}
                            ${sectionHeader('Weight')}
                            ${row('Gross Weight', fmtKg(gross_weight), true)}
                            ${row('Tare Weight', fmtKg(tare_weight), false)}
                            ${row('Net Weight', fmtKg(net_weight), true)}
                            ${row('VGM Weight', fmtKg(vgm_weight), false)}
                            ${sectionHeader('Inspection')}
                            ${row('MNR Status', fmt(mnr_status), true)}
                            ${row('Damage Code', fmt(damage_code), false)}
                            ${row('Gate Inspector', fmt(gate_inspector), true)}
                            ${row('Inspection Notes', fmt(inspection_notes), false)}
                        </table>
                        <p style="margin-top:20px;font-size:11px;color:#9ca3af;">This is an automated notification from the Shipping Management System.</p>
                    </div>`;

                    const text =
                        `Gate Entry Created – ${shippingLine.name}\n\n` +
                        `Container No: ${fmt(container_no)}\nTransaction NBR: ${fmt(transaction_nbr)}\n` +
                        `Booking No: ${fmt(booking_no)}\nISO Code: ${fmt(iso_code)}\n` +
                        `Category: ${fmt(category)}\nMove Type: ${fmt(move_type)}\n` +
                        `Reefer REQT: ${fmt(reefer_reqt)}\nSeal No: ${fmt(seal_no)}\n\n` +
                        `Gate In: ${fmtDate(gate_in)}\nYard Location: ${location}\n` +
                        `Entry Lane: ${fmt(entry_lane)}\nExit Lane: ${fmt(exit_lane)}\n\n` +
                        `Transport Company: ${fmt(transport_company)}\nDriver: ${fmt(drivers_name)}\n` +
                        `Licence: ${fmt(driver_licence)}\nPlate No: ${fmt(plate_no)}\nTrans Creator: ${fmt(trans_creator)}\n\n` +
                        `Gross Weight: ${fmtKg(gross_weight)}\nTare Weight: ${fmtKg(tare_weight)}\n` +
                        `Net Weight: ${fmtKg(net_weight)}\nVGM Weight: ${fmtKg(vgm_weight)}\n\n` +
                        `MNR Status: ${fmt(mnr_status)}\nDamage Code: ${fmt(damage_code)}\n` +
                        `Gate Inspector: ${fmt(gate_inspector)}\nInspection Notes: ${fmt(inspection_notes)}`;

                    const subject = `Gate Entry Created – Container ${container_no}`;

                    const emailList = shippingLine.email
                        .split(',')
                        .map(e => e.trim())
                        .filter(Boolean);

                    await Promise.all(
                        emailList.map((address, i) =>
                            sendEmail(address, subject, text, html)
                                .catch(err => {
                                    console.error(`Email ${i + 1} send failed (non-blocking) [${address}]:`, err);
                                })
                        )
                    );
                }

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

                // ─── GATE OUT EMAIL NOTIFICATION ───────────────────────────────────
                try {
                    const shippingLine = await ShippingLine.findOne({
                        where: { name: gateEntry.shipping_line }
                    });

                    if (shippingLine?.email) {
                        const fmt = (val) => (val != null && val !== '') ? val : 'N/A';
                        const fmtDate = (val) => val
                            ? new Date(val).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
                            : 'N/A';
                        const fmtKg = (val) => (val != null && val !== '') ? `${val} kg` : 'N/A';
                        const fmtMoney = (val) => (val != null && val !== '') ? `₱${Number(val).toLocaleString('en-PH', { minimumFractionDigits: 2 })}` : 'N/A';

                        const row = (label, value, shade) =>
                            `<tr style="background-color:${shade ? '#f9fafb' : '#ffffff'};">
                                <td style="padding:10px 14px;font-weight:600;color:#374151;border-bottom:1px solid #e5e7eb;width:38%;">${label}</td>
                                <td style="padding:10px 14px;color:#111827;border-bottom:1px solid #e5e7eb;">${value}</td>
                            </tr>`;

                        const sectionHeader = (title) =>
                            `<tr><td colspan="2" style="padding:14px 14px 6px;font-size:12px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.07em;background:#fff;border-bottom:2px solid #e5e7eb;">${title}</td></tr>`;

                        const html = `
                        <div style="font-family:Arial,sans-serif;max-width:660px;margin:0 auto;padding:28px;border:1px solid #e5e7eb;border-radius:10px;background:#fff;">
                            <div style="margin-bottom:20px;">
                                <div style="display:inline-block;background:#10b981;color:#fff;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;padding:4px 12px;border-radius:20px;margin-bottom:10px;">Gate Out</div>
                                <h2 style="color:#1e3a5f;margin:0 0 4px;">Container Released</h2>
                                <p style="color:#6b7280;margin:0;font-size:14px;">Container <strong>${fmt(gateEntry.container_no)}</strong> has been gated out for <strong>${shippingLine.name}</strong>.</p>
                            </div>
                            <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
                                ${sectionHeader('Container & Transaction')}
                                ${row('Container No', `<span style="font-family:monospace;font-weight:700;">${fmt(gateEntry.container_no)}</span>`, true)}
                                ${row('Transaction NBR', fmt(gateEntry.transaction_nbr), false)}
                                ${row('Booking No', fmt(gateEntry.booking_no), true)}
                                ${row('ISO Code', fmt(gateEntry.iso_code), false)}
                                ${row('Category', fmt(gateEntry.category), true)}
                                ${row('Move Type', fmt(gateEntry.move_type), false)}
                                ${row('Seal No', fmt(gateEntry.seal_no), true)}
                                ${sectionHeader('Timing')}
                                ${row('Gate In', fmtDate(gateEntry.gate_in), true)}
                                ${row('Gate Out', fmtDate(gate_out), false)}
                                ${row('Days in Yard', gateEntry.days_in_yard != null ? `${gateEntry.days_in_yard} day(s)` : 'N/A', true)}
                                ${row('Exit Lane', fmt(exit_lane || gateEntry.exit_lane), false)}
                                ${sectionHeader('Transport')}
                                ${row('Transport Company', fmt(gateEntry.transport_company), true)}
                                ${row("Driver's Name", fmt(gateEntry.drivers_name), false)}
                                ${row('Driver Licence', fmt(gateEntry.driver_licence), true)}
                                ${row('Plate No', fmt(gateEntry.plate_no), false)}
                                ${sectionHeader('Payment Summary')}
                                ${row('Gate-In Payment', fmtMoney(gateEntry.gate_in_payment_amount), true)}
                                ${row('Gate-In Method', fmt(gateEntry.gate_in_payment_method), false)}
                                ${row('Gate-Out Payment', fmtMoney(gateEntry.payment_amount), true)}
                                ${row('Gate-Out Method', fmt(gateEntry.payment_method), false)}
                                ${row('Total Collected', `<strong style="color:#10b981;">${fmtMoney((Number(gateEntry.gate_in_payment_amount) || 0) + (Number(gateEntry.payment_amount) || 0))}</strong>`, true)}
                                ${sectionHeader('Inspection')}
                                ${row('MNR Status', fmt(gateEntry.mnr_status), true)}
                                ${row('Damage Code', fmt(gateEntry.damage_code), false)}
                                ${row('Gate Inspector', fmt(gateEntry.gate_inspector), true)}
                                ${row('Inspection Notes', fmt(gateEntry.inspection_notes), false)}
                            </table>
                            <p style="margin-top:20px;font-size:11px;color:#9ca3af;">This is an automated notification from the Shipping Management System.</p>
                        </div>`;

                        const text =
                            `Gate Out – Container Released\n\n` +
                            `Container No: ${fmt(gateEntry.container_no)}\n` +
                            `Transaction NBR: ${fmt(gateEntry.transaction_nbr)}\n` +
                            `Booking No: ${fmt(gateEntry.booking_no)}\n` +
                            `Move Type: ${fmt(gateEntry.move_type)}\n\n` +
                            `Gate In: ${fmtDate(gateEntry.gate_in)}\n` +
                            `Gate Out: ${fmtDate(gate_out)}\n` +
                            `Days in Yard: ${gateEntry.days_in_yard ?? 'N/A'}\n` +
                            `Exit Lane: ${fmt(exit_lane || gateEntry.exit_lane)}\n\n` +
                            `Transport Company: ${fmt(gateEntry.transport_company)}\n` +
                            `Driver: ${fmt(gateEntry.drivers_name)}\n` +
                            `Plate No: ${fmt(gateEntry.plate_no)}\n\n` +
                            `Gate-In Payment: ${fmtMoney(gateEntry.gate_in_payment_amount)}\n` +
                            `Gate-Out Payment: ${fmtMoney(gateEntry.payment_amount)}\n` +
                            `Total Collected: ${fmtMoney((Number(gateEntry.gate_in_payment_amount) || 0) + (Number(gateEntry.payment_amount) || 0))}\n\n` +
                            `MNR Status: ${fmt(gateEntry.mnr_status)}\n` +
                            `Damage Code: ${fmt(gateEntry.damage_code)}\n` +
                            `Gate Inspector: ${fmt(gateEntry.gate_inspector)}\n` +
                            `Inspection Notes: ${fmt(gateEntry.inspection_notes)}`;

                        const subject = `Gate Out – Container ${gateEntry.container_no} Released`;

                        const emailList = shippingLine.email
                            .split(',')
                            .map(e => e.trim())
                            .filter(Boolean);

                        await Promise.all(
                            emailList.map((address, i) =>
                                sendEmail(address, subject, text, html)
                                    .catch(err => {
                                        console.error(`Gate-out email ${i + 1} failed (non-blocking) [${address}]:`, err);
                                    })
                            )
                        );
                    }
                } catch (emailErr) {
                    // Non-blocking — gate out already committed, just log the email failure
                    console.error('Gate-out email notification failed (non-blocking):', emailErr);
                }
                // ──────────────────────────────────────────────────────────────────

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