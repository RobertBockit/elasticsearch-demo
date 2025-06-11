const express = require('express');
const router = express.Router();
const { Client } = require('@elastic/elasticsearch');

// Initialize Elasticsearch client
const client = new Client({
  node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200'
});

// GET /find/:id - Find article by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Article ID is required'
      });
    }

    // Get article from Elasticsearch
    const result = await client.get({
      index: 'articles',
      id: id
    });

    res.json({
      success: true,
      article: {
        id: result._id,
        ...result._source
      }
    });

  } catch (error) {
    if (error.meta && error.meta.statusCode === 404) {
      return res.status(404).json({
        success: false,
        error: 'Article not found'
      });
    }

    console.error('Find error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to find article'
    });
  }
});

// GET /find - Find all articles with pagination (Retrieve all)
router.get('/', async (req, res) => {
  try {
    const { from = 0, size = 10, sort = 'publication_date:desc' } = req.query;

    // Parse sort parameter
    const [sortField, sortOrder] = sort.split(':');

    const result = await client.search({
      index: 'articles',
      body: {
        from: parseInt(from),
        size: parseInt(size),
        query: {
          match_all: {}
        },
        sort: [
          { [sortField]: sortOrder || 'desc' }
        ]
      }
    });

    const articles = result.hits.hits.map(hit => ({
      id: hit._id,
      ...hit._source
    }));

    res.json({
      success: true,
      total: result.hits.total.value,
      articles,
      pagination: {
        from: parseInt(from),
        size: parseInt(size),
        hasMore: result.hits.total.value > parseInt(from) + parseInt(size)
      }
    });

  } catch (error) {
    console.error('Find all error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve articles'
    });
  }
});

// POST /find/batch - Find multiple articles by IDs
router.post('/batch', async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Array of article IDs is required'
      });
    }

    // Use multi-get to fetch multiple documents
    const result = await client.mget({
      index: 'articles',
      body: {
        ids: ids
      }
    });

    const articles = [];
    const notFound = [];

    result.docs.forEach(doc => {
      if (doc.found) {
        articles.push({
          id: doc._id,
          ...doc._source
        });
      } else {
        notFound.push(doc._id);
      }
    });

    res.json({
      success: true,
      articles,
      notFound
    });

  } catch (error) {
    console.error('Batch find error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to find articles'
    });
  }
});

module.exports = router;