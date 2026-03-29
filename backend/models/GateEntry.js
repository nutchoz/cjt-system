const sequelize = require("./sequelize.js");
const { DataTypes } = require("sequelize");

const GateEntry = sequelize.define(
    "GateEntry",
    {
        gate_in: { type: DataTypes.DATE, allowNull: false, comment: "Gate entry timestamp" },
        gate_out: { type: DataTypes.DATE, allowNull: true, comment: "Gate exit timestamp" },
        block_location: { type: DataTypes.STRING(10), allowNull: false, comment: "Yard block location" },
        row_location: { type: DataTypes.INTEGER, allowNull: false, comment: "Yard row location" },
        col_location: { type: DataTypes.INTEGER, allowNull: false, comment: "Yard col location" },
        tier_location: { type: DataTypes.INTEGER, allowNull: true, comment: "Yard tier location" },
        container_no: { type: DataTypes.STRING(50), allowNull: false, unique: true, comment: "Container number" },
        transaction_nbr: { type: DataTypes.STRING(50), allowNull: false, comment: "Transaction number" },
        shipping_line: { type: DataTypes.STRING(100), allowNull: false, comment: "Shipping line name" },
          life_state: {
            type: DataTypes.ENUM('active', 'inactive'),
            allowNull: false,
            defaultValue: 'active',
            comment: "Shipping line life state: active or inactive"
        },
        booking_no: { type: DataTypes.STRING(50), allowNull: false, comment: "Booking number" },
        iso_code: { type: DataTypes.STRING(10), allowNull: false, comment: "ISO container code" },
        category: { type: DataTypes.STRING(50), allowNull: false, comment: "Container category" },
        reefer_reqt: { type: DataTypes.STRING(10), defaultValue: "NO", comment: "Reefer requirement" },
        seal_no: { type: DataTypes.STRING(50), allowNull: true, comment: "Seal number" },
        move_type: { type: DataTypes.STRING(50), allowNull: false, comment: "Type of movement" },
        transport_company: { type: DataTypes.STRING(200), allowNull: false, comment: "Transport company name" },
        drivers_name: { type: DataTypes.STRING(200), allowNull: false, comment: "Driver full name" },
        driver_licence: { type: DataTypes.STRING(50), allowNull: true, comment: "Driver license number" },
        plate_no: { type: DataTypes.STRING(20), allowNull: false, comment: "Vehicle plate number" },
        gross_weight: { type: DataTypes.DECIMAL(10, 2), allowNull: false, comment: "Gross weight in kg" },
        tare_weight: { type: DataTypes.DECIMAL(10, 2), allowNull: false, comment: "Tare weight in kg" },
        net_weight: { type: DataTypes.DECIMAL(10, 2), allowNull: false, comment: "Net weight in kg" },
        vgm_weight: { type: DataTypes.DECIMAL(10, 2), allowNull: true, comment: "VGM weight in kg" },
        entry_lane: { type: DataTypes.STRING(20), allowNull: true, comment: "Entry lane number" },
        exit_lane: { type: DataTypes.STRING(20), allowNull: true, comment: "Exit lane number" },
        mnr_status: { type: DataTypes.STRING(50), defaultValue: "OK", comment: "Maintenance and repair status" },
        damage_code: { type: DataTypes.STRING(100), allowNull: true, comment: "Damage codes (comma-separated)" },
        inspection_notes: { type: DataTypes.TEXT, allowNull: true, comment: "Inspection notes and remarks" },
        gate_inspector: { type: DataTypes.STRING(200), allowNull: true, comment: "Gate inspector name" },
        trans_creator: { type: DataTypes.STRING(100), defaultValue: "SYSTEM", comment: "Transaction creator" },
        person_incharge: { type: DataTypes.STRING(200), allowNull: true, comment: "Person who created the gate entry" },

        // PAYMENT FIELDS

        gate_in_payment_status: {
            type: DataTypes.ENUM('unpaid', 'paid'),
            allowNull: false,
            defaultValue: 'unpaid',
        },
        gate_in_payment_amount: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: true,
        },
        gate_in_payment_method: {
            type: DataTypes.STRING(50),
            allowNull: true,
        },
        gate_in_payment_date: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        },
        gate_in_payment_reference: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        gate_in_payment_need: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: true,
        },

        payment_status: { type: DataTypes.STRING(20), defaultValue: "unpaid", comment: "Payment status" },
        payment_need: { type: DataTypes.DECIMAL(10, 2), allowNull: true, comment: "Payment need amount" },
        payment_amount: { type: DataTypes.DECIMAL(10, 2), allowNull: true, comment: "Payment amount" },
        payment_method: { type: DataTypes.STRING(50), allowNull: true, comment: "Payment method" },
        payment_date: { type: DataTypes.DATEONLY, allowNull: true, comment: "Payment date" },
        payment_reference: { type: DataTypes.STRING(100), allowNull: true, comment: "Payment reference number" },

        // ─── NEW BACKUP FIELD ───
        backup: { type: DataTypes.JSONB, allowNull: true, comment: "JSON backup of previous record state" },

        days_in_yard: {
            type: DataTypes.VIRTUAL,
            get() {
                const gateIn = this.getDataValue("gate_in");
                const gateOut = this.getDataValue("gate_out");
                if (!gateIn) return 0;
                const endDate = gateOut ? new Date(gateOut) : new Date();
                return Math.ceil(Math.abs(endDate - new Date(gateIn)) / (1000 * 60 * 60 * 24));
            }
        }
    },
    {
        timestamps: true
    }
);


module.exports = GateEntry;
