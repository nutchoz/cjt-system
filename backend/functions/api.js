const express = require("express");
const cors = require("cors");
const serverless = require("serverless-http");
const path = require("path");
const { sequelize, GateEntry } = require("../models/models.js");
const bodyParser = require("body-parser");
const sendEmail = require('../utils/sendEmail.js');
const session = require('express-session');

const app = express();
const router = express.Router();

// ─── CORS CONFIGURATION ───────────────────────────────────────────────────────
// In development mode, restrict CORS to a specific origin with credentials.
// In production, allow all origins (Netlify handles access control).
const DEVELOPMENT = false;
if (DEVELOPMENT) {
    app.use(
        cors({
            origin: "",           // Set to the dev frontend URL when needed
            credentials: true,
            optionSuccessStatus: 200,
        })
    );
} else {
    app.use(cors());
}

// ─── UTILITY / DEBUG ROUTES ───────────────────────────────────────────────────

/**
 * GET /test
 * Simple health-check endpoint to verify the API is reachable.
 */
router.get("/test", async (req, res) => {
    res.status(200).json("This is a test endpoint.");
});

/**
 * GET /reset
 * Drops and recreates all database tables via Sequelize sync.
 * WARNING: Destructive — for development/testing use only.
 */
router.get("/reset", async (req, res) => {
    await sequelize.sync({ force: true });
    res.send("Database reset successful.");
});

/**
 * GET /test-shipping
 * Creates a temporary ShippingLine record to verify the model and DB connection.
 * For development/debugging use only.
 */
router.get("/test-shipping", async (req, res) => {
    try {
        const ShippingLine = require('../models/ShippingLine');
        const result = await ShippingLine.create({
            code: 'TEST',
            name: 'Test Line',
            life_state: 'Active'
        });
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ error: error.message, stack: error.stack });
    }
});

/**
 * GET /test-email
 * Sends a test email to a hardcoded list of addresses to verify
 * that the email transport (sendEmail utility) is configured correctly.
 * All send failures are non-blocking and logged individually.
 */
router.get('/test-email', async (req, res) => {
    try {
        const subject = 'Test Email – Shipping Management System';
        const text = 'This is a test email from the Shipping Management System.';
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 8px;">
                <h2 style="color: #1e3a5f; margin-bottom: 4px;">Test Email</h2>
                <p style="color: #6b7280; margin-top: 0;">If you're seeing this, your email configuration is working correctly.</p>
                <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
                    <tr style="background-color: #f9fafb;">
                        <td style="padding: 10px 14px; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb;">Sent To</td>
                        <td style="padding: 10px 14px; color: #111827; border-bottom: 1px solid #e5e7eb;">${process.env.EMAIL_USER}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 14px; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb;">Sent At</td>
                        <td style="padding: 10px 14px; color: #111827; border-bottom: 1px solid #e5e7eb;">${new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</td>
                    </tr>
                    <tr style="background-color: #f9fafb;">
                        <td style="padding: 10px 14px; font-weight: 600; color: #374151;">Status</td>
                        <td style="padding: 10px 14px; color: #16a34a; font-weight: 600;">✅ Success</td>
                    </tr>
                </table>
                <p style="margin-top: 24px; font-size: 12px; color: #9ca3af;">This is an automated test from the Shipping Management System.</p>
            </div>
        `;

        // Hardcoded test recipient list — replace or move to env vars as needed
        const emailList = [
            "jdmaster888@gmail.com",
            "enegue4444@gmail.com",
            "nohjpega100@gmail.com"
        ];

        // Fire all sends concurrently; individual failures don't abort the others
        await Promise.all(
            emailList.map((address, i) =>
                sendEmail(address, subject, text, html)
                    .catch(err => {
                        console.error(`Email ${i + 1} send failed (non-blocking) [${address}]:`, err);
                    })
            )
        );

        res.status(200).json({ success: true, message: `Test email sent.` });
    } catch (error) {
        console.error('Test email failed:', error);
        res.status(500).json({ success: false, message: 'Failed to send test email', error: error.message });
    }
});

// ─── ROUTE REGISTRATION ───────────────────────────────────────────────────────
// Debug log to confirm GateEntryRoutes loaded correctly before mounting
console.log("GateEntryRoutes type:", typeof require("../routes/GateEntryRoutes.js"));

router.use("/gate-entry",           require("../routes/GateEntryRoutes.js"));
router.use('/shipping-lines',       require('../routes/ShippingLineRouter.js'));
router.use('/drivers',              require('../routes/DriverRouter.js'));
router.use('/plate-numbers',        require('../routes/PlateNumberRouter.js'));
router.use("/transport-companies",  require("../routes/TransportCompanyRouter.js"));
router.use('/auth',                 require('../routes/AuthRouter.js'));

// ─── SESSION CONFIGURATION ────────────────────────────────────────────────────
// Session lifetime is 8 hours, matching the JWT expiry in AuthRouter.
// Note: secure: false is intentional for HTTP environments (e.g. local / Netlify dev).
app.use(session({
    secret: 'your-secret-key',      // TODO: move to an environment variable
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 1000 * 60 * 60 * 8 },
}));

// ─── APP-LEVEL MIDDLEWARE ─────────────────────────────────────────────────────
app.use(bodyParser.json());
app.use(express.json());
// Serve the compiled React frontend from the client/build directory
app.use(express.static(path.join(__dirname, "../client/build")));

// ─── MOUNT ROUTER & EXPORT HANDLER ───────────────────────────────────────────
// All API routes are namespaced under the Netlify Functions path
app.use("/.netlify/functions/api", router);

// Wrap the Express app for deployment as a Netlify serverless function
module.exports.handler = serverless(app);