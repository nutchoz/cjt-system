// module.exports = sendEmail;
const nodemailer = require("nodemailer");
require("dotenv").config();

let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "cgt.adm2018@gmail.com",
        pass: "ycww xuxm rfmm glnh",  // App Password with spaces stripped
    },
});

/**
 * Send an email with nodemailer
 * @param {string|string[]} to - Recipient(s)
 * @param {string} subject - Email subject
 * @param {string} text - Plain text body
 * @param {string} html - HTML body
 * @returns {Promise<object>} info - Nodemailer response
 */
async function sendEmail(to, subject, text, html) {
    try {
        const mailOptions = {
            from: "jaysonnazareno71@gmail.com",  // must match transporter user
            to,
            subject,
            text,
            html,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log("Email sent:", info.response);
        return info;
    } catch (error) {
        console.error("Error sending email:", error);
        throw error;
    }
}

module.exports = sendEmail;