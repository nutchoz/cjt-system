const sequelize = require("./sequelize.js");
const { DataTypes } = require("sequelize");

const PlateNumber = sequelize.define(
    "PlateNumber",
    {
        plateNumber: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        licenseExpiryDate: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        status: {
            type: DataTypes.ENUM("active", "banned"),
            allowNull: false,
            defaultValue: "active",
        },
        truckCompany: {
            type: DataTypes.STRING,
            allowNull: false,
        }
    },
    {
        timestamps: true,
    }
);

module.exports = PlateNumber;
