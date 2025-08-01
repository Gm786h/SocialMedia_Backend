const { Sequelize } = require('sequelize');

const sequelize = new Sequelize {
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
    host: process.env.DB.HOST,
    port: process.env.DB_PORT,
    dialect: 'mysql',
    pool: {
        max: 150,
        min: 0,
        acquire: 30000000,
        idle: 10000
    }
);

// Export a function to connect and sync
const connectDB = async () => {
    try {
        await sequelize.authenticate();
        await sequelize.sync(); // use { force: true } or { alter: true } if needed
        console.log('Database connected and synchronized');
    } catch (error) {
        console.error(' Database connection error:', error);
    }
};

module.exports = { sequelize, connectDB };
