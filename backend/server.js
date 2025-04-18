const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect('mongodb+srv://asyedarmaan345:phoenix123@cluster0.qlvamvd.mongodb.net/business_db?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

const businessSchema = new mongoose.Schema({
  _id: String,
  name: String
});

const articleSchema = new mongoose.Schema({
  _id: String,
  name: String,
  qty: Number,
  selling_price: Number,
  business_id: String
});

const Business = mongoose.model('Business', businessSchema);
const Article = mongoose.model('Article', articleSchema);

app.get('/api/businesses', async (req, res) => {
  try {
    const businesses = await Business.find();
    res.json(businesses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/businesses', async (req, res) => {
  try {
    const business = new Business(req.body);
    await business.save();
    res.status(201).json(business);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/businesses/:id', async (req, res) => {
  try {
    const business = await Business.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(business);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/businesses/:id', async (req, res) => {
  try {
    await Business.findByIdAndDelete(req.params.id);
    await Article.deleteMany({ business_id: req.params.id });
    res.json({ message: 'Business and related articles deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/articles', async (req, res) => {
  try {
    const articles = await Article.find();
    res.json(articles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/articles/business/:businessId', async (req, res) => {
  try {
    const articles = await Article.find({ business_id: req.params.businessId });
    res.json(articles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/articles', async (req, res) => {
  try {
    const article = new Article(req.body);
    await article.save();
    res.status(201).json(article);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/articles/:id', async (req, res) => {
  try {
    const article = await Article.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(article);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/articles/:id', async (req, res) => {
  try {
    await Article.findByIdAndDelete(req.params.id);
    res.json({ message: 'Article deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});