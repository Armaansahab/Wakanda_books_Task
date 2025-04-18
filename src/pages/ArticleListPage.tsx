import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../database';
import { RxDocument } from 'rxdb';
import { Article } from '../database/models/articleSchema';
import NetworkStatus from '../components/NetworkStatus';
import NetworkService from '../services/NetworkService';

type ArticleDocument = RxDocument<Article>;

const ArticleListPage: React.FC = () => {
  const { businessId } = useParams<{ businessId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const businessName = location.state?.businessName || 'Business';
  
  const [articles, setArticles] = useState<ArticleDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [newArticle, setNewArticle] = useState({ name: '', qty: '', selling_price: '' });
  const [showForm, setShowForm] = useState(false);
  const [isOnline, setIsOnline] = useState(NetworkService.isOnline());

  useEffect(() => {
    if (!businessId) {
      navigate('/');
      return;
    }
    
    loadArticles();
    
    const unsubscribe = NetworkService.addListener((status) => {
      setIsOnline(status);
    });
    
    return unsubscribe;
  }, [businessId, navigate]);

  const loadArticles = async () => {
    if (!businessId) return;
    
    try {
      const db = await getDatabase();
      const results = await db.articles.find({
        selector: {
          businessId: businessId
        }
      }).exec();
      setArticles(results);
      setLoading(false);
    } catch (error) {
      console.error('Error loading articles:', error);
      setLoading(false);
    }
  };

  const handleAddArticle = async () => {
    if (!businessId) return;
    
    if (!newArticle.name.trim() || !newArticle.qty || !newArticle.selling_price) {
      alert('All fields are required');
      return;
    }
    
    try {
      const db = await getDatabase();
      const articleId = uuidv4();
      
      const newArticleDoc = await db.articles.insert({
        id: articleId,
        name: newArticle.name.trim(),
        qty: parseInt(newArticle.qty, 10),
        sellingPrice: parseFloat(newArticle.selling_price),
        businessId: businessId,
        isSynced: false
      });

      setNewArticle({ name: '', qty: '', selling_price: '' });
      setShowForm(false);
      loadArticles();
    } catch (error) {
      console.error('Error adding article:', error);
      alert('Failed to add article');
    }
  };

  const handleDeleteArticle = async (article: ArticleDocument) => {
    try {
      await article.remove();
      loadArticles();
    } catch (error) {
      console.error('Error deleting article:', error);
      alert('Failed to delete article');
    }
  };

  return (
    <div className="container">
      <div className="header">
        <button className="back-button" onClick={() => navigate('/')}>
          Back
        </button>
        <h1>{businessName} Articles</h1>
        <NetworkStatus />
      </div>
      
      {showForm && (
        <div className="form-container">
          <input
            className="input"
            value={newArticle.name}
            onChange={(e) => setNewArticle({ ...newArticle, name: e.target.value })}
            placeholder="Article name"
          />
          <input
            className="input"
            value={newArticle.qty}
            onChange={(e) => setNewArticle({ ...newArticle, qty: e.target.value })}
            placeholder="Quantity"
            type="number"
          />
          <input
            className="input"
            value={newArticle.selling_price}
            onChange={(e) => setNewArticle({ ...newArticle, selling_price: e.target.value })}
            placeholder="Selling price"
            type="number"
            step="0.01"
          />
          <div className="button-group">
            <button
              className="button primary"
              onClick={handleAddArticle}
            >
              Add
            </button>
            <button
              className="button secondary"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="loading">Loading...</div>
      ) : (
        <div className="article-list">
          {articles.length === 0 ? (
            <div className="empty-message">No articles found. Add one to get started!</div>
          ) : (
            articles.map(article => (
              <div key={article.id} className="article-item">
                <div className="article-info">
                  <div className="article-name">{article.name}</div>
                  <div className="article-details">
                    Qty: {article.qty} | Price: ${article.sellingPrice}
                  </div>
                </div>
                <button 
                  className="icon-button delete"
                  onClick={() => handleDeleteArticle(article)}
                >
                  Delete
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {!showForm && (
        <button 
          className="floating-button"
          onClick={() => setShowForm(true)}
        >
          +
        </button>
      )}
    </div>
  );
};

export default ArticleListPage;