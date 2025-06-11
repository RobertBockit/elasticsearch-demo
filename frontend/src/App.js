import React, { useState } from 'react';
import ArticleForm from './components/ArticleForm';
import ArticleSearch from './components/ArticleSearch';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min';

const App = () => {
    const [activeTab, setActiveTab] = useState('upload');

    return (
        <div className="bg-light min-vh-100 py-5">
            <div className="container">
                {/* Header */}
                <div className="text-center mb-5">
                    <h1 className="display-5 fw-bold text-primary">📰 Article Manager</h1>
                    <p className="text-muted">Upload and search articles in your Elasticsearch database</p>
                </div>

                {/* Tabs Navigation */}
                <ul className="nav nav-tabs nav-justified shadow-sm rounded bg-white mb-4">
                    <li className="nav-item">
                        <button
                            className={`nav-link ${activeTab === 'upload' ? 'active fw-bold text-primary' : ''}`}
                            onClick={() => setActiveTab('upload')}
                        >
                            <i className="bi bi-upload"></i> Upload Article
                        </button>
                    </li>
                    <li className="nav-item">
                        <button
                            className={`nav-link ${activeTab === 'search' ? 'active fw-bold text-primary' : ''}`}
                            onClick={() => setActiveTab('search')}
                        >
                            <i className="bi bi-search"></i> Search Articles
                        </button>
                    </li>
                </ul>

                {/* Content Card */}
                <div className="card shadow border-0">
                    <div className="card-body">
                        {activeTab === 'upload' && <ArticleForm />}
                        {activeTab === 'search' && <ArticleSearch />}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default App;
