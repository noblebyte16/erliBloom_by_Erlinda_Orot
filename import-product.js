import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'railway',
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306
};

function mapCategory(apiCategory) {
  const cat = (apiCategory || '').toLowerCase();
  if (cat.includes('flower') || cat.includes('bouquet') || cat.includes('fragrances')) {
    return 'Flowers Bouquet';
  }
  if (cat.includes('plant') || cat.includes('decor') || cat.includes('home')) {
    return 'Artificial Plants';
  }
  return 'Dried Flowers Keychain';
}

async function importProducts() {
  let connection;
  try {
    console.log('Fetching products from DummyJSON API...');
    const response = await fetch('https://dummyjson.com/products?limit=10');

    if (!response.ok) throw new Error(`API error: ${response.statusText}`);

    const data = await response.json();
    const products = data.products;

    connection = await mysql.createConnection(dbConfig);
    await connection.beginTransaction();

    // Create table matching your exact phpMyAdmin structure
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS products (
        id INT PRIMARY KEY,
        product_name VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(100),
        price DECIMAL(10,2),
        discount_percentage DECIMAL(5,2),
        rating DECIMAL(3,2),
        stock INT,
        brand VARCHAR(100),
        thumbnail_url VARCHAR(500)
      );
    `;
    await connection.execute(createTableQuery);

    for (const product of products) {
      const mappedCategory = mapCategory(product.category);

      const productQuery = `
        INSERT INTO products (id, product_name, description, category, price, discount_percentage, rating, stock, brand, thumbnail_url)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          product_name = VALUES(product_name),
          description = VALUES(description),
          category = VALUES(category),
          price = VALUES(price),
          discount_percentage = VALUES(discount_percentage),
          rating = VALUES(rating),
          stock = VALUES(stock),
          brand = VALUES(brand),
          thumbnail_url = VALUES(thumbnail_url);
      `;

      const productValues = [
        product.id,
        product.title,
        product.description,
        mappedCategory,
        product.price,
        product.discountPercentage || null,
        product.rating || null,
        product.stock || null,
        product.brand || null,
        product.thumbnail
      ];

      await connection.execute(productQuery, productValues);
    }

    await connection.commit();
    console.log('Import successful! Products created and mapped into Railway MySQL database.');
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Import failed:', error);
  } finally {
    if (connection) await connection.end();
  }
}

importProducts();