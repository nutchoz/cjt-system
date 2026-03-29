require("dotenv").config();
const pg = require("pg");
const { Sequelize } = require("sequelize");

const database_url = "postgresql://neondb_owner:npg_D3NHw8ilPcKI@ep-damp-thunder-ahvzcgyp-pooler.c-3.us-east-1.aws.neon.tech/cgt?sslmode=require&channel_binding=require"
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
