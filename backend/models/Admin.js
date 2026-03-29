const sequelize = require("./sequelize.js");
const { DataTypes } = require("sequelize");

const Admin = sequelize.define(
    "Admin",
    {
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true,
            },
        },
        password_hash: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        role: {
            type: DataTypes.ENUM("admin", "user"),
            allowNull: false,
            defaultValue: "user",
        },
    },
    {
        timestamps: true,
    }
);

module.exports = Admin;