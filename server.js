const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { Client } = require('@elastic/elasticsearch');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Import routes
const routes = require('./Backend/routes');

// Mount routes
app.use('/api', routes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({
    success: false,
    error: 'Something went wrong!'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Initialize Elasticsearch client
const esClient = new Client({
  node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200'
});

// Check Elasticsearch connection on startup
async function checkElasticsearch() {
  try {
    const health = await esClient.cluster.health();
    console.log('✅ Elasticsearch connected:', health.cluster_name);
    
    // Ensure index exists
    const indexExists = await esClient.indices.exists({ index: 'articles' });
    if (!indexExists) {
      console.log('Creating articles index...');
      await esClient.indices.create({
        index: 'articles',
        body: {
          mappings: {
            properties: {
              title: { type: 'text', fields: { keyword: { type: 'keyword' } } },
              description: { type: 'text' },
              body: { type: 'text' },
              author: { type: 'text', fields: { keyword: { type: 'keyword' } } },
              publication_date: { type: 'date' },
              timestamp: { type: 'date' }
            }
          }
        }
      });
      console.log('✅ Articles index created');
    }
  } catch (error) {
    console.error('❌ Elasticsearch connection failed:', error.message);
    console.log('Make sure Elasticsearch is running on', process.env.ELASTICSEARCH_URL || 'http://localhost:9200');
  }
}

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  checkElasticsearch();
});