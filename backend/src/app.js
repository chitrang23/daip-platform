const express = require('express');
const { enforceTenantContext } = require('./middleware/auth');
const { rateLimitTier } = require('./middleware/rateLimiter');

const scanRoutes = require('./routes/scans');
const repoRoutes = require('./routes/repos');
const contributorRoutes = require('./routes/contributors');

const app = express();
app.use(express.json());

// Globally bind multi-tenancy context containment and protection layers
app.use(enforceTenantContext);
app.use(rateLimitTier);

// Mount core endpoint controllers
app.use('/api/v1/scans', scanRoutes);
app.use('/api/v1/repos', repoRoutes);
app.use('/api/v1/contributors', contributorRoutes);

// Catch-all centralized pipeline error boundary handler
app.use((err, req, res, next) => {
  res.status(500).json({ error: 'Core Architecture Pipeline Failure', details: err.message });
});

module.exports = app;