const sequelize = require("./sequelize.js");
const { DataTypes } = require("sequelize");

const Driver = sequelize.define(
    "Driver",
    {
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        licenseNumber: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        status: {
            type: DataTypes.ENUM("active", "banned"),
            allowNull: false,
            defaultValue: "active",
        },
        lifeState: {
            type: DataTypes.ENUM("active", "deceased"),
            allowNull: false,
            defaultValue: "active",
        }
    },
    {
        timestamps: true,
    }
);

module.exports = Driver;
