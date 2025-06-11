import React, { useState } from 'react';
import axios from 'axios';

const ArticleForm = () => {
    const [form, setForm] = useState({ title: '', description: '', body: '' });
    const [status, setStatus] = useState(null);

    const handleChange = e => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async e => {
        e.preventDefault();
        try {
            const res = await axios.post('http://localhost:4000/articles', form);
            setStatus({ success: true, message: res.data.message });
            setForm({ title: '', description: '', body: '' });
        } catch (error) {
            setStatus({ success: false, message: error.response?.data?.error || 'Error' });
        }
    };

    return (
        <form onSubmit={handleSubmit} className="max-w-xl mx-auto p-4">
            <h2 className="text-2xl mb-4">Submit Article</h2>
            <input
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="Title"
                className="w-full mb-2 p-2 border"
            />
            <input
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Description"
                className="w-full mb-2 p-2 border"
            />
            <textarea
                name="body"
                value={form.body}
                onChange={handleChange}
                placeholder="Full Article"
                className="w-full mb-2 p-2 border h-40"
            />
            <button type="submit" className="bg-blue-500 text-white px-4 py-2">
                Submit
            </button>
            {status && (
                <p className={`mt-2 ${status.success ? 'text-green-600' : 'text-red-600'}`}>
                    {status.message}
                </p>
            )}
        </form>
    );
};

export default ArticleForm;
