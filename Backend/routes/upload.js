const express = require('express');
const router = express.Router();
const multer = require('multer');
const { Client } = require('@elastic/elasticsearch');

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Initialize Elasticsearch client
const client = new Client({
  node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200'
});

// POST /upload - Upload article to Elasticsearch
router.post('/', upload.single('article'), async (req, res) => {
  try {
    const { title, description, body, author, publication_date } = req.body;
    
    // Validate required fields
    if (!title || !description || !body || !author) {
      return res.status(400).json({
        success: false,
        error: 'Title, description, body, and author are required'
      });
    }

    // Create document for Elasticsearch with auto-generated ID
    const document = {
      title,
      description,
      body,
      author,
      publication_date: publication_date || new Date(),
      timestamp: new Date()
    };

    // Index document in Elasticsearch (ID will be auto-generated)
    const result = await client.index({
      index: 'articles',
      body: document
    });

    // Refresh index to make document immediately searchable
    await client.indices.refresh({ index: 'articles' });

    res.status(201).json({
      success: true,
      message: 'Article uploaded successfully',
      id: result._id,
      article: {
        id: result._id,
        ...document
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload article'
    });
  }
});

module.exports = router;