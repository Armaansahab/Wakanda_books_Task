import { createRxDatabase, addRxPlugin, RxCollection, RxDatabase } from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { RxDBQueryBuilderPlugin } from 'rxdb/plugins/query-builder';
import { RxDBDevModePlugin } from 'rxdb/plugins/dev-mode';
import { RxDBUpdatePlugin } from 'rxdb/plugins/update';
import { wrappedValidateAjvStorage } from 'rxdb/plugins/validate-ajv';
import { v4 as uuidv4 } from 'uuid';
import { businessSchema, Business } from './models/BusinessSchema';
import { articleSchema, Article } from './models/articleSchema';
import ReplicationService from '../services/ReplicationService';
import NetworkService from '../services/NetworkService';

addRxPlugin(RxDBQueryBuilderPlugin);
addRxPlugin(RxDBDevModePlugin);
addRxPlugin(RxDBUpdatePlugin);

function customHashFunction(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Promise.resolve(hash.toString());
}

export type BusinessRecordDatabase = {
  businesses: RxCollection<Business>;
  articles: RxCollection<Article>;
};

let dbPromise: Promise<RxDatabase<BusinessRecordDatabase>> | null = null;

async function setupPersistence(db: RxDatabase<BusinessRecordDatabase>) {
  db.businesses.$.subscribe(async () => {
    try {
      const allBusinesses = await db.businesses.find().exec();
      const businessData = allBusinesses.map(b => ({
        id: b.id,
        name: b.name
      }));
      localStorage.setItem('businesses', JSON.stringify(businessData));
      console.log('Businesses saved to localStorage');
    } catch (error) {
      console.error('Error saving businesses:', error);
    }
  });
  
  db.articles.$.subscribe(async () => {
    try {
      const allArticles = await db.articles.find().exec();
      const articleData = allArticles.map(a => ({
        id: a.id,
        name: a.name,
        qty: a.qty,
        sellingPrice: a.sellingPrice, 
        businessId: a.businessId
      }));
      localStorage.setItem('articles', JSON.stringify(articleData));
      console.log('Articles saved to localStorage');
    } catch (error) {
      console.error('Error saving articles:', error);
    }
  });
}

async function loadPersistedData(db: RxDatabase<BusinessRecordDatabase>) {
  try {
    const businessesJSON = localStorage.getItem('businesses');
    if (businessesJSON) {
      const businesses = JSON.parse(businessesJSON);
      console.log(`Loading ${businesses.length} businesses from storage`);
      
      for (const business of businesses) {
        try {
          await db.businesses.upsert(business);
        } catch (err) {
          console.log('Error inserting business:', err);
        }
      }
    }
    
    const articlesJSON = localStorage.getItem('articles');
    if (articlesJSON) {
      const articles = JSON.parse(articlesJSON);
      console.log(`Loading ${articles.length} articles from storage`);
      
      for (const article of articles) {
        try {
          await db.articles.upsert(article);
        } catch (err) {
          console.log('Error inserting article:', err);
        }
      }
    }
    
    console.log('Persisted data loaded successfully');
  } catch (error) {
    console.error('Error loading persisted data:', error);
  }
}

export const getDatabase = async () => {
  if (dbPromise) return dbPromise;

  try {
    console.log("Creating database...");
    dbPromise = createRxDatabase<BusinessRecordDatabase>({
      name: 'businessrecordkeeperdb',
      storage: wrappedValidateAjvStorage({
        storage: getRxStorageDexie()
      }),
      ignoreDuplicate: true,
      hashFunction: customHashFunction
    });

    const db = await dbPromise;
    
    console.log("Adding collections...");
    await db.addCollections({
      businesses: {
        schema: businessSchema
      },
      articles: {
        schema: articleSchema
      }
    });
    
    setupPersistence(db);
    await loadPersistedData(db);
    
    if (NetworkService.isOnline()) {
      ReplicationService.startReplication();
    }
    
    NetworkService.addListener(async (isOnline: boolean) => {
      if (isOnline) {
        await ReplicationService.startReplication();
      }
    });
    
    console.log("Database setup complete");
    return db;
  } catch (error) {
    console.error("Database initialization error:", error);
    dbPromise = null;
    throw error;
  }
};

export const generateId = () => uuidv4();