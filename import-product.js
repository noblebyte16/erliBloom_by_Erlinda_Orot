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

async function importLocalProducts() {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    await connection.beginTransaction();

    // 1. Create table matching your exact phpMyAdmin structure
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

    // 2. Exact local products with real image CDN URLs
    const localProducts = [
      {
        id: 1,
        product_name: 'Pure Elegance Rose Bouquet',
        description: 'The Lily Love Flower Bouquet is an enchanting arrangement designed to captivate.',
        category: 'Flowers Bouquet',
        price: 650.00,
        thumbnail_url: 'https://www.flowerchimp.com.ph/cdn/shop/files/flowerchimp-ph-pure-elegance.jpg'
      },
      {
        id: 2,
        product_name: 'Lily Love Flower Bouquet',
        description: 'True elegance never fades, it only grows more beautiful with time.',
        category: 'Flowers Bouquet',
        price: 550.00,
        thumbnail_url: 'https://www.theflowerexpress.com/cdn/shop/files/Lily_Love_Flower_Bouquet.jpg'
      },
      {
        id: 3,
        product_name: 'Artificial Dracaena Lemon Lime Head 65cm',
        description: 'Elevate your interior with this lifelike artificial plant.',
        category: 'Artificial Plants',
        price: 300.00,
        thumbnail_url: 'https://garden.qa/cdn/shop/files/1767780085292-p6t.jpg'
      },
      {
        id: 4,
        product_name: '12 Red roses in a bouquet',
        description: 'With a beautiful classic bouquet of red roses, perfect for any occasion.',
        category: 'Flowers Bouquet',
        price: 500.00,
        thumbnail_url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR'
      },
      {
        id: 5,
        product_name: 'Artificial Bird of Paradise 120cm',
        description: 'Bring tropical elegance into any space with this stunning plant.',
        category: 'Artificial Plants',
        price: 450.00,
        thumbnail_url: 'https://garden.qa/cdn/shop/files/1767802864527-cts.jpg'
      }
    ];

    for (const p of localProducts) {
      const query = `
        INSERT INTO products (id, product_name, description, category, price, thumbnail_url)
        VALUES (?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          product_name = VALUES(product_name),
          description = VALUES(description),
          category = VALUES(category),
          price = VALUES(price),
          thumbnail_url = VALUES(thumbnail_url);
      `;
      await connection.execute(query, [p.id, p.product_name, p.description, p.category, p.price, p.thumbnail_url]);
    }

    await connection.commit();
    console.log('Real local products with thumbnail URLs successfully updated in Railway!');
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Import failed:', error);
  } finally {
    if (connection) await connection.end();
  }
}

importLocalProducts();