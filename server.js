import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import https from 'https'; // Native module to control TLS connections
import mysql from 'mysql2/promise'; // Promise-based mysql2
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

// Fix for __dirname when using ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const MAYA_PUBLIC_KEY = process.env.MAYA_PUBLIC_KEY;
const PORT = process.env.PORT || 3000;

// 1. RE-ROUTE THE NETWORK AGENT
// This forces Node to completely ignore local SSL certificate hijacks/WP-Engine injection mismatches
const safeAgent = new https.Agent({
    rejectUnauthorized: false // Bypasses local router DNS hostname injection errors in local dev
});

const getAuthToken = (key) => {
    if (!key) {
        console.error("❌ CRITICAL: process.env.MAYA_PUBLIC_KEY is missing! Check your .env file.");
        return "";
    }
    return Buffer.from(`${key}:`).toString('base64');
};

// Default Route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'home.html'));
});

// 2. Establish a MySQL Connection Pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'erli_bloom',
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Mock database
let items = [
    { id: 1, name: 'Item One' },
    { id: 2, name: 'Item Two' }
];

// GET: Fetch all items
app.get('/api/items', (req, res) => {
    res.json(items);
});

// GET: Fetch a single item by ID
app.get('/api/items/:id', (req, res) => {
    const item = items.find(i => i.id === parseInt(req.params.id));
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.status(200).json(item);
});

// POST: Create a new item
app.post('/api/items', (req, res) => {
    if (!req.body.name) {
        return res.status(400).json({ message: 'Name is required' });
    }
    const newItem = {
        id: items.length + 1,
        name: req.body.name
    };
    items.push(newItem);
    res.status(201).json(newItem);
});

// PUT: Update an existing item
app.put('/api/items/:id', (req, res) => {
    const item = items.find(i => i.id === parseInt(req.params.id));
    if (!item) return res.status(404).json({ message: 'Item not found' });

    item.name = req.body.name || item.name;
    res.status(200).json(item);
});

// DELETE: Remove an item
app.delete('/api/items/:id', (req, res) => {
    const itemIndex = items.findIndex(i => i.id === parseInt(req.params.id));
    if (itemIndex === -1) return res.status(404).json({ message: 'Item not found' });

    items.splice(itemIndex, 1);
    res.status(200).json({ message: 'Item deleted successfully' });
});

app.get('/api/products', async (req, res) => {
    try {
        const { category, brand } = req.query;

        let query = 'SELECT * FROM products WHERE 1=1';
        const queryParams = [];

        if (category) {
            // TRIM and ignore extra spaces or line breaks during comparison
            query += ' AND TRIM(REPLACE(REPLACE(category, "\r", ""), "\n", "")) = ?';
            queryParams.push(category.trim());
        }
        if (brand) {
            query += ' AND TRIM(REPLACE(REPLACE(brand, "\r", ""), "\n", "")) = ?';
            queryParams.push(brand.trim());
        }

        const [rows] = await pool.query(query, queryParams);
        res.status(200).json(rows);
    } catch (error) {
        console.error('MySQL Error:', error.message);
        res.status(500).json({ error: 'Failed to retrieve products from database.' });
    }
});

// MAYA CHECKOUT ENDPOINT
app.post('/api/maya/checkout', async (req, res) => {
  try {
    const { items, totalAmount } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: "Missing request items/amount." });
    }

 const mayaItems = items.map(item => {
  // Extract numeric price safely from any field name
  const rawPrice = item.price ?? item.totalAmount?.value ?? item.amount ?? 0;
  const unitPrice = typeof rawPrice === 'number' 
    ? rawPrice 
    : parseFloat(String(rawPrice).replace(/[^0-9.]/g, '')) || 0;

  const qty = Number(item.quantity) || 1;
  const itemTotal = unitPrice * qty;

  return {
    name: String(item.name || item.product_name || 'Product'),
    quantity: String(qty),
    iconUrl: item.thumbnail_url || item.image_url || item.image || undefined,
    totalAmount: { 
      value: Number(itemTotal.toFixed(2)) 
    },
    singleItemAmount: { 
      value: Number(unitPrice.toFixed(2)) 
    }
  };
});

    const payload = {
      totalAmount: {
        value: Number(Number(totalAmount).toFixed(2)),
        currency: 'PHP'
      },
      items: mayaItems,
      redirectUrl: {
        success: 'http://localhost:3000/home.html?status=success',
        failure: 'http://localhost:3000/home.html?status=failure',
        cancel: 'http://localhost:3000/home.html?status=cancel'
      },
      requestReferenceNumber: `REQ-${Date.now()}`
    };

    // Send payload to Maya Sandbox API
    const mayaResponse = await fetch('https://pg-sandbox.paymaya.com/checkout/v1/checkouts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(process.env.MAYA_PUBLIC_KEY + ':').toString('base64')}`
      },
      body: JSON.stringify(payload)
    });

    const data = await mayaResponse.json();

    if (mayaResponse.ok && data.redirectUrl) {
      return res.json({ success: true, redirectUrl: data.redirectUrl });
    } else {
      return res.status(400).json({ success: false, error: data });
    }
  } catch (error) {
    console.error('Server Checkout Error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Start the server
app.listen(PORT, () => {
    console.log(`🚀 Server fully operational at http://localhost:${PORT}`);
});