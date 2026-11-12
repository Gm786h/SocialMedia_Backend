// Creates any missing tables from the Sequelize models. Existing tables are left untouched.
// Usage: npm run db:sync            (create missing tables)
//        npm run db:sync -- --alter (also alter existing tables to match the models)
const { sequelize } = require('../config/db');
require('../Model');

(async () => {
  const alter = process.argv.includes('--alter');
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter });
    console.log(`Database synchronized${alter ? ' (alter)' : ''}`);
    await sequelize.close();
  } catch (err) {
    console.error('Database sync failed:', err.message);
    process.exit(1);
  }
})();
