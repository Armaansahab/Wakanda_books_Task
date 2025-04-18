import { getDatabase } from '../database';
import NetworkService from './NetworkService';

export const API_BASE_URL = 'http://localhost:5000/api';
export const DATABASE_NAME = 'business_db';

interface BusinessDoc {
  _id: string;
  name: string;
}

interface ArticleDoc {
  _id: string;
  name: string;
  qty: number;
  selling_price: number;
  business_id: string;
}

class ReplicationService {
  isReplicating = false;
  
  constructor() {
    NetworkService.addListener(this.handleNetworkChange.bind(this));
    setTimeout(() => {
      console.log('Attempting initial sync...');
      this.startReplication();
    }, 2000);
  }
  
  async testConnection() {
    try {
      console.log(`Testing connection to backend...`);
      const response = await fetch(`${API_BASE_URL}/businesses`);
      if (!response.ok) {
        console.log('Backend connection failed with status:', response.status);
        return false;
      }
      console.log('Connection test successful');
      return true;
    } catch (error) {
      console.log('Connection test failed:', error);
      return false;
    }
  }
  
  
  async syncBusinesses() {
    try {
      const db = await getDatabase();
      const businesses = await db.businesses.find().exec();
      
      const unsynced = businesses.filter(b => !(b as any).isSynced);
      console.log(`Found ${unsynced.length} unsynced businesses`);
      
      if (unsynced.length === 0) return true;

      for (const business of unsynced) {
        try {
          const response = await fetch(`${API_BASE_URL}/businesses/${business.id}`);
          const exists = response.ok;
          
          if (exists) {
            await fetch(`${API_BASE_URL}/businesses/${business.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                _id: business.id,
                name: business.name
              })
            });
          } else {
            await fetch(`${API_BASE_URL}/businesses`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                _id: business.id,
                name: business.name
              })
            });
          }

          await business.update({
            $set: { isSynced: true }
          });
          console.log(`Synced business ${business.id} to server`);
        } catch (error) {
          console.log(`Failed to sync business ${business.id}:`, error);
        }
      }
      return true;
    } catch (error) {
      console.log('Failed to sync businesses:', error);
      return false;
    }
  }
  
  async syncArticles() {
    try {
      const db = await getDatabase();
      const articles = await db.articles.find().exec();
      const unsynced = articles.filter(a => !(a as any).isSynced);
      
      if (unsynced.length === 0) return true;

      for (const article of unsynced) {
        try {
          const response = await fetch(`${API_BASE_URL}/articles/${article.id}`);
          const exists = response.ok;
          
          if (exists) {
            await fetch(`${API_BASE_URL}/articles/${article.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                _id: article.id,
                name: article.name,
                qty: article.qty,
                selling_price: article.sellingPrice,
                business_id: article.businessId  
              })
            });
          } else {
            await fetch(`${API_BASE_URL}/articles`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                _id: article.id,
                name: article.name,
                qty: article.qty,
                selling_price: article.sellingPrice,
                business_id: article.businessId
              })
            });
          }

          await article.update({
            $set: { isSynced: true }
          });
          console.log(`Synced article ${article.id} to server`);
        } catch (error) {
          console.log(`Failed to sync article ${article.id}:`, error);
        }
      }
      return true;
    } catch (error) {
      console.log('Failed to sync articles:', error);
      return false;
    }
  }

  async fetchBusinessesFromServer() {
    try {
      const response = await fetch(`${API_BASE_URL}/businesses`);
      if (!response.ok) {
        console.log('Failed to fetch businesses from server');
        return false;
      }

      const businesses = await response.json();
      const db = await getDatabase();
      
      for (const business of businesses) {
        const existing = await db.businesses.findOne(business._id).exec();
        if (existing) {
          await existing.update({
            $set: {
              name: business.name,
              _synced: true
            }
          });
        } else {
          await db.businesses.insert({
            id: business._id,
            name: business.name,
            isSynced: true
          });
        }
      }
      return true;
    } catch (error) {
      console.log('Error fetching businesses:', error);
      return false;
    }
  }
  
  async fetchArticlesFromServer() {
    try {
      const response = await fetch(`${API_BASE_URL}/articles`);
      if (!response.ok) {
        console.log('Failed to fetch articles from server');
        return false;
      }

      const articles = await response.json();
      const db = await getDatabase();
      
      for (const article of articles) {
        const existing = await db.articles.findOne(article._id).exec();
        if (existing) {
          await existing.update({
            $set: {
              name: article.name,
              qty: article.qty,
              selling_price: article.selling_price,
              business_id: article.business_id,
              _synced: true
            }
          });
        } else {
          await db.articles.insert({
            id: article._id,
            name: article.name,
            qty: article.qty,
            sellingPrice: article.selling_price,
            businessId: article.business_id,
            isSynced: true
          });
        }
      }
      return true;
    } catch (error) {
      console.log('Error fetching articles:', error);
      return false;
    }
  }

  
  async startReplication() {
    if (this.isReplicating) {
      console.log('Clearing previous sync lock');
      this.isReplicating = false;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    this.isReplicating = true;
    console.log('Starting manual sync process...');

    try {
      const connected = await this.testConnection();
      if (!connected) {
        console.log('Connection test failed, aborting sync');
        this.isReplicating = false;
        return;
      }

      await this.fetchBusinessesFromServer();
      await this.fetchArticlesFromServer();
      
      await this.syncBusinesses();
      await this.syncArticles();
      console.log('Manual sync completed');
    } catch (error) {
      console.error('Sync error:', error);
    } finally {
      this.isReplicating = false;
    }
  }

  async createBusiness(businessData: { id: string, name: string }) {
    try {
      const db = await getDatabase();
      
      await db.businesses.insert({
        id: businessData.id,
        name: businessData.name,
        _synced: false
      });
      
      if (NetworkService.isOnline()) {
        await this.syncBusinesses();
      }
      
      return { success: true };
    } catch (error) {
      console.error('Failed to create business:', error);
      return { success: false, error };
    }
  }

  async updateBusiness(businessData: { id: string, name: string }) {
    try {
      const db = await getDatabase();

      let serverUpdateSuccess = false;
      if (NetworkService.isOnline()) {
        try {
          const response = await fetch(`${API_BASE_URL}/businesses/${businessData.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              _id: businessData.id,
              name: businessData.name
            })
          });
          serverUpdateSuccess = response.ok;
        } catch (error) {
          console.log('Server update failed, updating locally only:', error);
        }
      }

      const latestBusiness = await db.businesses.findOne(businessData.id).exec();
      if (!latestBusiness) {
        throw new Error('Business not found');
      }

      await latestBusiness.update({
        $set: {
          name: businessData.name,
          isSynced: serverUpdateSuccess
        }
      });

      return { success: true };
    } catch (error) {
      console.error('Failed to update business:', error);
      return { success: false, error };
    }
  }
  
  async deleteBusiness(businessId: string) {
    try {
      const db = await getDatabase();
      
      const articles = await db.articles.find().where('businessId').eq(businessId).exec();
      for (const article of articles) {
        await article.remove();
      }

      const business = await db.businesses.findOne(businessId).exec();
      if (business) {
        await business.remove();
      }

      return true;
    } catch (error) {
      console.error('Failed to delete business:', error);
      return false;
    }
  }

  async createArticle(articleData: {
    id: string,
    name: string,
    qty: number,
    selling_price: number,
    business_id: string
  }) {
    try {
      const db = await getDatabase();
      
      await db.articles.insert({
        id: articleData.id,
        name: articleData.name,
        qty: articleData.qty,
        sellingPrice: articleData.selling_price,
        businessId: articleData.business_id,
        isSynced: false
      });
      
      if (NetworkService.isOnline()) {
        await this.syncArticles();
      }
      
      return { success: true };
    } catch (error) {
      console.error('Failed to create article:', error);
      return { success: false, error };
    }
  }
  
  async updateArticle(articleData: {
    id: string,
    name: string,
    qty: number,
    selling_price: number,
    business_id: string
  }) {
    try {
      const db = await getDatabase();
      
      const existingArticle = await db.articles.findOne(articleData.id).exec();
      if (existingArticle) {
        await existingArticle.update({
          $set: {
            name: articleData.name,
            qty: articleData.qty,
            selling_price: articleData.selling_price,
            business_id: articleData.business_id,
            _synced: false
          }
        });
      }
      
      if (NetworkService.isOnline()) {
        await this.syncArticles();
      }
      
      return { success: true };
    } catch (error) {
      console.error('Failed to update article:', error);
      return { success: false, error };
    }
  }
  
  async deleteArticle(articleId: string) {
    try {
      const db = await getDatabase();
      
      const article = await db.articles.findOne(articleId).exec();
      if (article) {
        await article.remove();
      }
      
      if (NetworkService.isOnline()) {
        try {
          await fetch(`${API_BASE_URL}/action/deleteOne`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Request-Headers': '*',
            },
            body: JSON.stringify({
              dataSource: 'Cluster0',
              database: DATABASE_NAME,
              collection: 'articles',
              filter: { _id: articleId }
            })
          });
        } catch (error) {
          console.log('Server delete failed:', error);
        }
      }
  
      return { success: true };
    } catch (error) {
      console.error('Failed to delete article:', error);
      return { success: false, error };
    }
  }
  
  handleNetworkChange(isOnline: boolean) {
    console.log(`Network status changed: ${isOnline ? 'Online' : 'Offline'}`);
    if (isOnline) {
      console.log('Network is available, starting sync');
      this.startReplication();
    } else {
      console.log('Network unavailable, working offline');
    }
  }
}   

export default new ReplicationService();