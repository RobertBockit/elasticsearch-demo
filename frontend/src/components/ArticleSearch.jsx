import React, { useState } from 'react';
import axios from 'axios';

const ArticleSearch = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSearch = async e => {
        e.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        setError(null);

        try {
            const res = await axios.get('http://localhost:4000/search', { params: { q: query } });
            setResults(res.data.results);
        } catch (err) {
            setError('Search failed. Try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-xl mx-auto p-4">
            <form onSubmit={handleSearch} className="mb-4">
                <input
                    type="text"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Search articles"
                    className="w-full p-2 border rounded"
                />
                <button type="submit" className="mt-2 px-4 py-2 bg-blue-600 text-white rounded">
                    Search
                </button>
            </form>

            {loading && <p>Loading...</p>}
            {error && <p className="text-red-600">{error}</p>}

            <ul>
                {results.map(article => (
                    <li key={article.id} className="border-b py-2">
                        <h3 className="font-semibold">{article.title}</h3>
                        <p>{article.description}</p>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default ArticleSearch;
