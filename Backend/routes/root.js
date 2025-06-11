const express = require('express');
const router = express.Router();
const { Client } = require('@elastic/elasticsearch');

// Initialize Elasticsearch client
const client = new Client({
  node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200'
});

// GET / - API health check and info
router.get('/', async (req, res) => {
  try {
    // Check Elasticsearch connection
    const esHealth = await client.cluster.health();
    
    // Get articles count
    const countResult = await client.count({
      index: 'articles'
    });

    res.json({
      success: true,
      message: 'Article Manager API',
      version: '1.0.0',
      status: 'healthy',
      elasticsearch: {
        status: esHealth.status,
        cluster: esHealth.cluster_name,
        nodes: esHealth.number_of_nodes
      },
      statistics: {
        totalArticles: countResult.count
      },
      endpoints: {
        upload: {
          POST: '/upload - Upload a new article'
        },
        search: {
          GET: '/search?q=query - Search articles',
          POST: '/search/advanced - Advanced search with filters'
        },
        find: {
          GET: '/find/:id - Find article by ID',
          GET_ALL: '/find - Get all articles with pagination',
          POST: '/find/batch - Find multiple articles by IDs'
        },
        delete: {
          DELETE: '/delete/:id - Delete article by ID',
          POST: '/delete/bulk - Delete multiple articles'
        }
      }
    });

  } catch (error) {
    console.error('Health check error:', error);
    res.status(503).json({
      success: false,
      message: 'Article Manager API',
      status: 'unhealthy',
      error: 'Failed to connect to Elasticsearch'
    });
  }
});

// GET /stats - Get detailed statistics
router.get('/stats', async (req, res) => {
  try {
    // Get index stats
    const stats = await client.indices.stats({
      index: 'articles'
    });

    // Get aggregations
    const aggregations = await client.search({
      index: 'articles',
      body: {
        size: 0,
        aggs: {
          articles_over_time: {
            date_histogram: {
              field: 'publication_date',
              calendar_interval: 'day'
            }
          },
          top_authors: {
            terms: {
              field: 'author.keyword',
              size: 10
            }
          }
        }
      }
    });

    res.json({
      success: true,
      stats: {
        index: {
          size: stats._all.primaries.store.size_in_bytes,
          documentCount: stats._all.primaries.docs.count,
          deletedDocs: stats._all.primaries.docs.deleted
        },
        aggregations: {
          articlesOverTime: aggregations.aggregations.articles_over_time.buckets,
          topAuthors: aggregations.aggregations.top_authors?.buckets || []
        }
      }
    });

  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve statistics'
    });
  }
});

// POST /init - Initialize Elasticsearch index
router.post('/init', async (req, res) => {
  try {
    // Check if index exists
    const indexExists = await client.indices.exists({
      index: 'articles'
    });

    if (indexExists) {
      return res.json({
        success: true,
        message: 'Index already exists'
      });
    }

    // Create index with mapping
    await client.indices.create({
      index: 'articles',
      body: {
        mappings: {
          properties: {
            title: {
              type: 'text',
              fields: {
                keyword: {
                  type: 'keyword'
                }
              }
            },
            description: {
              type: 'text'
            },
            body: {
              type: 'text'
            },
            author: {
              type: 'text',
              fields: {
                keyword: {
                  type: 'keyword'
                }
              }
            },
            publication_date: {
              type: 'date'
            },
            timestamp: {
              type: 'date'
            }
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Index created successfully'
    });

  } catch (error) {
    console.error('Init error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to initialize index'
    });
  }
});

module.exports = router;