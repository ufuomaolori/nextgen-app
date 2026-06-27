const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Pull variables safely from the onsite environment wrapper (.env)
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/nexgen_db';

// 1. Strict Local Database Connection Strategy
mongoose.connect(MONGO_URI)
  .then(() => console.log('Successfully connected to secure local MongoDB instance.'))
  .catch(err => console.error('Database connection roadblock:', err));

// Define a sample Order Schema for their inventory database logic
const OrderSchema = new mongoose.Schema({
  product: String,
  amount: Number,
  paymentStatus: { type: String, default: 'Pending' },
  createdAt: { type: Date, default: Date.now }
});
const Order = mongoose.model('Order', OrderSchema);

// 2. Core REST API Endpoints
// Check system status
app.get('/api/status', (req, res) => {
  res.json({
    status: "Healthy",
    runtime: "Node.js v20.x LTS",
    database: mongoose.connection.readyState === 1 ? "Connected" : "Disconnected"
  });
});

// Fetch active orders from database
app.get('/api/orders', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 }).limit(10);
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve order logs.' });
  }
});

// Mock Paystack Payment Hook & Inventory Entry Generation
app.post('/api/orders/paystack-webhook', async (req, res) => {
  const { product, amount } = req.body;
  try {
    const newOrder = new Order({
      product: product || "Enterprise Cloud Token",
      amount: amount || 25000,
      paymentStatus: "Success (Via Paystack webhook verification)"
    });
    await newOrder.save();
    res.status(201).json({ message: 'Order verified and written to MongoDB.', order: newOrder });
  } catch (error) {
    res.status(500).json({ error: 'Database tracking failed.' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend API listening on environment port: ${PORT}`);
});