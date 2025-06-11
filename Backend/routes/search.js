const express = require('express');
const router = express.Router();
const { Client } = require('@elastic/elasticsearch');

// Initialize Elasticsearch client
const client = new Client({
  node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200'
});

// GET /search?q=query - Search articles
router.get('/', async (req, res) => {
  try {
    const { q, from = 0, size = 10 } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }

    // Perform search in Elasticsearch
    const result = await client.search({
      index: 'articles',
      body: {
        from: parseInt(from),
        size: parseInt(size),
        query: {
          multi_match: {
            query: q,
            fields: ['title^2', 'description', 'body', 'author'],
            fuzziness: 'AUTO'
          }
        },
        highlight: {
          fields: {
            title: {},
            description: {},
            body: {},
            author: {}
          }
        }
      }
    });

    // Format response
    const articles = result.hits.hits.map(hit => ({
      id: hit._id,
      score: hit._score,
      ...hit._source,
      highlights: hit.highlight
    }));

    res.json({
      success: true,
      total: result.hits.total.value,
      articles,
      pagination: {
        from: parseInt(from),
        size: parseInt(size)
      }
    });

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search articles'
    });
  }
});

// POST /search/advanced - Advanced search with filters
router.post('/advanced', async (req, res) => {
  try {
    const { 
      query, 
      filters = {}, 
      from = 0, 
      size = 10,
      sort = { publication_date: 'desc' }
    } = req.body;

    // Build Elasticsearch query
    const esQuery = {
      bool: {
        must: []
      }
    };

    // Add text search if provided
    if (query) {
      esQuery.bool.must.push({
        multi_match: {
          query,
          fields: ['title^2', 'description', 'body', 'author']
        }
      });
    }

    // Add filters for publication_date
    if (filters.dateFrom || filters.dateTo) {
      const dateRange = { range: { publication_date: {} } };
      if (filters.dateFrom) dateRange.range.publication_date.gte = filters.dateFrom;
      if (filters.dateTo) dateRange.range.publication_date.lte = filters.dateTo;
      esQuery.bool.must.push(dateRange);
    }

    // Add author filter
    if (filters.author) {
      esQuery.bool.must.push({
        match: { author: filters.author }
      });
    }

    const result = await client.search({
      index: 'articles',
      body: {
        from: parseInt(from),
        size: parseInt(size),
        query: esQuery,
        sort: [sort]
      }
    });

    const articles = result.hits.hits.map(hit => ({
      id: hit._id,
      score: hit._score,
      ...hit._source
    }));

    res.json({
      success: true,
      total: result.hits.total.value,
      articles,
      pagination: {
        from: parseInt(from),
        size: parseInt(size)
      }
    });

  } catch (error) {
    console.error('Advanced search error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to perform advanced search'
    });
  }
});

module.exports = router;