const express = require('express');
const router = express.Router();

// Import all route modules
const uploadRoute = require('./upload');
const searchRoute = require('./search');
const deleteRoute = require('./delete');
const findRoute = require('./find');
const rootRoute = require('./root');

// Mount routes
router.use('/upload', uploadRoute);
router.use('/search', searchRoute);
router.use('/delete', deleteRoute);
router.use('/find', findRoute);
router.use('/', rootRoute);

module.exports = router;