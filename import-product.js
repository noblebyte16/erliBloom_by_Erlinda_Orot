import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'db',
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306
};


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

        for (const product of products) {
            const mappedCategory = mapCategory(product.category);

            // Essential columns needed for storefront display
            const productQuery = `
                INSERT INTO products (id, title, description, category, price, thumbnail_url)
                VALUES (?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    title = VALUES(title),
                    description = VALUES(description),
                    category = VALUES(category),
                    price = VALUES(price),
                    thumbnail_url = VALUES(thumbnail_url);
            `;

            const productValues = [
                product.id,
                product.title,
                product.description,
                mappedCategory,
                product.price,
                product.thumbnail
            ];

            await connection.execute(productQuery, productValues);
        }

        await connection.commit();
        console.log('Import successful! Categories mapped to Flowers Bouquet, Artificial Plants, and Dried Flowers Keychain.');
    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Import failed:', error);
    } finally {
        if (connection) await connection.end();
    }
}

importProducts();