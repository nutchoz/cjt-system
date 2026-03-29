const sequelize = require("./sequelize.js");
const { DataTypes } = require("sequelize");

const TransportCompany = sequelize.define(
    "TransportCompany",
    {
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        code: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        status: {
            type: DataTypes.ENUM("active", "banned"),
            allowNull: false,
            defaultValue: "active",
        }
    },
    {
        timestamps: true,
    }
);

module.exports = TransportCompany;
