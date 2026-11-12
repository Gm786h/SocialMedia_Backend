const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const logger = require('morgan');
const path = require('path');

const { corsOrigins, nodeEnv } = require('./config/env');
const routes = require('./routes');
const { notFound, errorHandler } = require('./Middleware/errorHandler');

const app = express();
const allowAll = corsOrigins.includes('*');

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowAll || corsOrigins.includes(origin)) return callback(null, true);
      const err = new Error('Not allowed by CORS');
      err.status = 403;
      return callback(err);
    },
    credentials: true,
  })
);
if (nodeEnv !== 'test') app.use(logger(nodeEnv === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));
app.use('/uploads', express.static(path.join(__dirname, 'Uploads')));

app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
