import { useMemo, useState } from 'react';
import { knowledgeBaseArticles, knowledgeBaseCategories } from '../data/knowledgeBaseArticles';

export default function KnowledgeBasePage({ onBack }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedArticle, setSelectedArticle] = useState(null);

  const filteredArticles = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return knowledgeBaseArticles.filter((article) => {
      const categoryMatch = selectedCategory === 'All' || article.category === selectedCategory;
      const searchMatch =
        !query ||
        article.title.toLowerCase().includes(query) ||
        article.summary.toLowerCase().includes(query) ||
        article.category.toLowerCase().includes(query) ||
        article.tags.some((tag) => tag.toLowerCase().includes(query));
      return categoryMatch && searchMatch;
    });
  }, [searchTerm, selectedCategory]);

  if (selectedArticle) {
    return (
      <section className="knowledge-base-page">
        <button type="button" className="back-button" onClick={() => setSelectedArticle(null)}>
          Back to Knowledge Base
        </button>
        <article className="knowledge-detail network-section">
          <span className="feature-eyebrow">{selectedArticle.category}</span>
          <h2>{selectedArticle.title}</h2>
          <p className="knowledge-summary">{selectedArticle.summary}</p>
          <div>
            <h3>Explanation</h3>
            <p>{selectedArticle.explanation}</p>
          </div>
          <div className="knowledge-detail-grid">
            <section>
              <h3>Key Takeaways</h3>
              <ul>
                {selectedArticle.takeaways.map((takeaway) => (
                  <li key={takeaway}>{takeaway}</li>
                ))}
              </ul>
            </section>
            <section>
              <h3>Related Topics</h3>
              <div className="tag-row">
                {selectedArticle.relatedTopics.map((topic) => (
                  <span className="tag" key={topic}>
                    {topic}
                  </span>
                ))}
              </div>
            </section>
          </div>
        </article>
      </section>
    );
  }

  return (
    <section className="knowledge-base-page">
      <button type="button" className="back-button" onClick={onBack}>
        Back to Home
      </button>

      <div className="networking-header">
        <div>
          <span className="feature-eyebrow">Recruiting encyclopedia</span>
          <h2>Knowledge Base</h2>
          <p>Learn investment banking groups, recruiting strategy, technical concepts, and market terminology.</p>
        </div>
      </div>

      <section className="network-section">
        <label>
          Search articles
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search groups, valuation, recruiting strategy..."
          />
        </label>
        <div className="chips" aria-label="Knowledge Base categories">
          {knowledgeBaseCategories.map((category) => (
            <button
              type="button"
              className={selectedCategory === category ? 'chip selected' : 'chip'}
              key={category}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
        <p className="muted">Showing {filteredArticles.length} articles.</p>
      </section>

      <div className="knowledge-grid">
        {filteredArticles.length ? (
          filteredArticles.map((article) => (
            <button type="button" className="knowledge-card" key={article.id} onClick={() => setSelectedArticle(article)}>
              <span className="feature-eyebrow">{article.category}</span>
              <strong>{article.title}</strong>
              <span>{article.summary}</span>
              <div className="tag-row">
                {article.relatedTopics.slice(0, 3).map((topic) => (
                  <span className="tag" key={topic}>
                    {topic}
                  </span>
                ))}
              </div>
            </button>
          ))
        ) : (
          <section className="network-section">
            <p className="muted">No articles match your search.</p>
          </section>
        )}
      </div>
    </section>
  );
}
