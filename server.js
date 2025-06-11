const express = require('express');
const { Client } = require('@elastic/elasticsearch');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const client = new Client({ node: 'http://localhost:9200' });

app.post('/articles', async (req, res) => {
    const { title, description, body } = req.body;

    try {
        const response = await client.index({
            index: 'articles',
            document: {
                title,
                description,
                body,
                createdAt: new Date(),
            },
        });

        res.status(201).json({ message: 'Article indexed', id: response._id });
    } catch (error) {
        console.error('Indexing error:', error);
        res.status(500).json({ error: 'Failed to index article' });
    }
});

app.get('/search', async (req, res) => {
    const { q } = req.query;
    if (!q || q.trim() === '') return res.json({ results: [] });

    try {
        const { hits } = await client.search({
            index: 'articles',
            query: {
                multi_match: {
                    query: q,
                    fields: ['title^3', 'description^2', 'body'],
                    fuzziness: 'AUTO',
                },
            },
            size: 10,  // Limit results
        });

        const results = hits.hits.map(hit => ({
            id: hit._id,
            ...hit._source,
        }));

        res.json({ results });
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ error: 'Search failed' });
    }
});




app.listen(4000, () => console.log('Server running on http://localhost:4000'));
