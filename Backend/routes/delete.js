const express = require('express');
const router = express.Router();
const { Client } = require('@elastic/elasticsearch');

// Initialize Elasticsearch client
const client = new Client({
  node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200'
});

// DELETE /delete/:id - Delete article by ID
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Article ID is required'
      });
    }

    // Check if article exists
    const exists = await client.exists({
      index: 'articles',
      id: id
    });

    if (!exists) {
      return res.status(404).json({
        success: false,
        error: 'Article not found'
      });
    }

    // Delete the article
    await client.delete({
      index: 'articles',
      id: id
    });

    // Refresh index
    await client.indices.refresh({ index: 'articles' });

    res.json({
      success: true,
      message: 'Article deleted successfully',
      id: id
    });

  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete article'
    });
  }
});

// POST /delete/bulk - Delete multiple articles
router.post('/bulk', async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Array of article IDs is required'
      });
    }

    // Prepare bulk delete operations
    const operations = ids.flatMap(id => [
      { delete: { _index: 'articles', _id: id } }
    ]);

    // Perform bulk delete
    const result = await client.bulk({
      body: operations
    });

    // Refresh index
    await client.indices.refresh({ index: 'articles' });

    // Process results
    const deleted = [];
    const failed = [];

    result.items.forEach(item => {
      if (item.delete.status === 200) {
        deleted.push(item.delete._id);
      } else {
        failed.push({
          id: item.delete._id,
          error: item.delete.error
        });
      }
    });

    res.json({
      success: true,
      message: `Deleted ${deleted.length} articles`,
      deleted,
      failed
    });

  } catch (error) {
    console.error('Bulk delete error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete articles'
    });
  }
});

module.exports = router;