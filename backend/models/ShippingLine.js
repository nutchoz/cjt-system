const { DataTypes } = require('sequelize');
const sequelize = require('./sequelize');

const ShippingLine = sequelize.define('ShippingLine', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    code: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true,
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
    },
    // ✅ Stores comma-separated emails: "a@x.com, b@x.com, c@x.com"
    //    TEXT so there's no length cap regardless of how many addresses are added.
    email: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    // ✅ Stores the shipping line type e.g. FCL, LCL, RORO — user-defined free text.
    type: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: '',
    },
    life_state: {
        type: DataTypes.ENUM('Active', 'Inactive'),
        allowNull: false,
        defaultValue: 'Active',
    },
}, {
    tableName: 'shipping_lines',
    timestamps: true,
});

module.exports = ShippingLine;