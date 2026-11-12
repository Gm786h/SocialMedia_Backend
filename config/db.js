const { Sequelize } = require('sequelize');
require('./env');

const logging = process.env.DB_LOGGING === 'true' ? console.log : false;

const mysqlOptions = {
  dialect: 'mysql',
  logging,
  pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
};

let sequelize;
const url = process.env.DATABASE_URL;

if (url && url.startsWith('sqlite:')) {
  // Used by the test suite: sqlite::memory: or sqlite:path/to/file.db
  sequelize = new Sequelize({ dialect: 'sqlite', storage: url.replace(/^sqlite:/, '') || ':memory:', logging });
} else if (url) {
  sequelize = new Sequelize(url, mysqlOptions);
} else {
  sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
    ...mysqlOptions,
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
  });
}

module.exports = { sequelize };
