require("dotenv").config();
const pg = require("pg");
const { Sequelize } = require("sequelize");

const database_url = "postgresql://neondb_owner:npg_crmw69TotYzi@ep-autumn-unit-am8aqol9-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
const sequelize = new Sequelize(database_url, {
	dialect: "postgres",
	dialectModule: pg,
	dialectOptions: {
		ssl: {
			require: true,
			rejectUnauthorized: false,
		},
	},
});

module.exports = sequelize;
