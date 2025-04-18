export const articleSchema = {
  title: 'article',
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: {
      type: 'string',
      maxLength: 100
    },
    name: {
      type: 'string',
      maxLength: 100
    },
    qty: {
      type: 'number',
      minimum: 0
    },
    sellingPrice: { 
      type: 'number',
      minimum: 0
    },
    businessId: {   
      type: 'string',
      ref: 'business',
      maxLength: 100
    },
    isSynced: {     
      type: 'boolean',
      default: false
    }
  },
  required: ['id', 'name', 'qty', 'sellingPrice', 'businessId'],
  indexes: ['businessId', 'name']
};

export type Article = {
  id: string;
  name: string;
  qty: number;
  sellingPrice: number;
  businessId: string;  
  isSynced?: boolean;  
};