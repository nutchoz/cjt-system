const express = require("express");
const cors = require("cors");
const serverless = require("serverless-http");
const path = require("path");
const { sequelize, GateEntry } = require("../models/models.js");
const bodyParser = require("body-parser");
const sendEmail = require('../utils/sendEmail.js'); // adjust p
const session = require('express-session');
//ath as needed

const app = express();
const router = express.Router();

// CORS CONFIGURATION
const DEVELOPMENT = false;
if (DEVELOPMENT) {
	app.use(
		cors({
			origin: "",
			credentials: true,
			optionSuccessStatus: 200,
		})
	);
} else {
	app.use(cors());
}

// ALL ROUTES
router.get("/test", async (req, res) => {
	res.status(200).json("This is a test endpoint.");
});
router.get("/reset", async (req, res) => {
	await sequelize.sync({ force: true });
	res.send("Database reset successful.");
});
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

        const emailList = [
            "jdmaster888@gmail.com",
            "enegue4444@gmail.com",
            "nohjpega100@gmail.com"
        ];
        
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



// Add this BEFORE your router.use() lines
console.log("GateEntryRoutes type:", typeof require("../routes/GateEntryRoutes.js"));
// console.log("ShippingLineRouter type:", typeof require("../routes/ShippingLineRouter.js"));

router.use("/gate-entry", require("../routes/GateEntryRoutes.js"));
router.use('/shipping-lines', require('../routes/ShippingLineRouter.js'));
router.use('/drivers', require('../routes/DriverRouter.js'));
router.use('/plate-numbers', require('../routes/PlateNumberRouter.js'));
router.use("/transport-companies", require("../routes/TransportCompanyRouter.js"));
const authRouter = require('../routes/AuthRouter.js');
router.use('/auth', authRouter);

app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 1000 * 60 * 60 * 8 },
}));


// APP MIDDLEWARE
app.use(bodyParser.json());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../client/build")));

// Set base path for serverless functions
app.use("/.netlify/functions/api", router);
module.exports.handler = serverless(app);
