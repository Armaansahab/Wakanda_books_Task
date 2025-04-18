import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../database';
import { RxDocument } from 'rxdb';
import { Business } from '../database/models/BusinessSchema';
import NetworkStatus from '../components/NetworkStatus';
import NetworkService from '../services/Network';

type BusinessDocument = RxDocument<Business>;

const BusinessListPage: React.FC = () => {
  const [businesses, setBusinesses] = useState<BusinessDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [newBusinessName, setNewBusinessName] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState<BusinessDocument | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadBusinesses();
  }, []);

  const loadBusinesses = async () => {
    try {
      const db = await getDatabase();
      if (!db || !db.businesses) {
        console.log('Database or businesses collection not available');
        setLoading(false);
        return;
      }
      const results = await db.businesses.find().exec();
      setBusinesses(results);
      setLoading(false);
    } catch (error) {
      console.error('Error loading businesses:', error);
      setLoading(false);
      alert('Failed to load businesses. Please refresh the page.');
    }
  };

  const handleAddBusiness = async () => {
    if (!newBusinessName.trim()) {
      alert('Business name cannot be empty');
      return;
    }
    
    try {
      const db = await getDatabase();
      if (!db || !db.businesses) {
        alert('Database not ready. Please try again.');
        return;
      }
  
      const businessId = uuidv4();
      
      const newBusiness = await db.businesses.insert({
        id: businessId,
        name: newBusinessName.trim()
      });
  
      setBusinesses(prev => [...prev, newBusiness]);
      setNewBusinessName('');
      setShowForm(false);
    } catch (error) {
      console.error('Error adding business:', error);
      alert('Failed to add business. Please try again.');
    }
  };

  const handleDeleteBusiness = async (business: BusinessDocument) => {
    try {
      const db = await getDatabase();
      
      const articles = await db.articles.find().where('business_id').eq(business.id).exec();
      for (const article of articles) {
        await article.remove();
      }
  
      await business.remove();
      await loadBusinesses();
    } catch (error) {
      console.error('Error deleting business:', error);
      alert('Failed to delete business');
    }
  };
  
  const handleUpdateBusiness = async () => {
    if (!editingBusiness || !newBusinessName.trim()) {
      alert('Business name cannot be empty');
      return;
    }
    
    try {
      await editingBusiness.update({
        $set: { name: newBusinessName.trim() }
      });
      
      setNewBusinessName('');
      setEditingBusiness(null);
      setShowForm(false);
      loadBusinesses();
    } catch (error) {
      console.error('Error updating business:', error);
      alert('Failed to update business');
    }
  };

  const handleBusinessPress = (business: BusinessDocument) => {
    navigate(`/articles/${business.id}`, { 
      state: { businessName: business.name } 
    });
  };

  return (
    <div className="container">
      <div className="header">
        <h1>Businesses</h1>
        <NetworkStatus />
      </div>
      
      {showForm && (
        <div className="form-container">
          <input
            className="input"
            value={newBusinessName}
            onChange={(e) => setNewBusinessName(e.target.value)}
            placeholder="Enter business name"
          />
          <div className="button-group">
            <button 
              className="button primary"
              onClick={editingBusiness ? handleUpdateBusiness : handleAddBusiness}
            >
              {editingBusiness ? 'Update' : 'Add'}
            </button>
            <button 
              className="button secondary"
              onClick={() => {
                setShowForm(false);
                setEditingBusiness(null);
                setNewBusinessName('');
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="loading">Loading...</div>
      ) : (
        <div className="business-list">
          {businesses.length === 0 ? (
            <div className="empty-message">No businesses found. Add one to get started!</div>
          ) : (
            businesses.map(business => (
              <div key={business.id} className="business-item">
                <div 
                  className="business-name"
                  onClick={() => handleBusinessPress(business)}
                >
                  {business.name}
                </div>
                <div className="business-actions">
                  <button 
                    className="icon-button edit"
                    onClick={() => {
                      setEditingBusiness(business);
                      setNewBusinessName(business.name);
                      setShowForm(true);
                    }}
                  >
                    Edit
                  </button>
                  <button 
                    className="icon-button delete"
                    onClick={() => handleDeleteBusiness(business)}
                  >
                    Delete
                  </button>
                </div>
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

export default BusinessListPage;