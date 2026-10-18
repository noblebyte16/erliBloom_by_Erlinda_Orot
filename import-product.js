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
        thumbnail_url: 'https://www.flowerchimp.com.ph/cdn/shop/files/flowerchimp-bouquet-productname-2500x2500-02_a1eb246e-04cf-4279-bc23-9e091b282543_493x.jpg?v=1765947898'
      },
      {
        id: 2,
        product_name: 'Lily Love Flower Bouquet',
        description: 'True elegance never fades, it only grows more beautiful with time.',
        category: 'Flowers Bouquet',
        price: 550.00,
        thumbnail_url: 'https://www.theflowersexpress.com/cdn/shop/files/LilyLove_1024x1024.jpg?v=1725358494'
      },
      {
        id: 3,
        product_name: 'Artificial Dracaena Lemon Lime Head 65cm',
        description: 'Elevate your interior with this lifelike artificial plant.',
        category: 'Artificial Plants',
        price: 300.00,
        thumbnail_url: 'https://garden.qa/cdn/shop/files/1767780085292-p6ri4gdu6gi.jpg?v=1767780854&width=832'
      },
      {
        id: 4,
        product_name: '12 Red roses in a bouquet',
        description: 'With a beautiful classic bouquet of red roses, perfect for any occasion.',
        category: 'Flowers Bouquet',
        price: 500.00,
        thumbnail_url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQKtQKmbKqKDTzGe85e9ruuQYAVB_FV_35FJvr2SWSL4z1tA3-fXHAigL2c&s=10'
      },
      {
        id: 5,
        product_name: 'Artificial Bird of Paradise 120cm',
        description: 'Bring tropical elegance into any space with this stunning plant.',
        category: 'Artificial Plants',
        price: 450.00,
        thumbnail_url: 'https://garden.qa/cdn/shop/files/1767802864527-ctsqv8z12s.jpg?v=1767803268&width=832'
      },

      {
        id: 6,
        product_name: 'Charming Pink - Everlasting Flower Charm Keychain (Real Preserved Roses and Dried Flowers Charm for Bags)',
        description: 'The perfect fashion accessory for your loved one! This one-of-a-kind everlasting preserved flower charm is beautiful to look at, and made of real quality dried roses! Carry a symbol of delight wherever you go today!',
        category: 'Dried Flowers Keychain',
        price: 150.00,
        thumbnail_url: 'https://rainbowly.com/cdn/shop/products/charming-pink-everlasting-flower-charm-keychain-real-preserved-roses-and-dried-flowers-charm-for-bags-440231_800x800_crop_center@2x.jpg?v=1668407136'
      },
      {
        id: 7,
        product_name: 'Lavish Love Flower Bouquet',
        description: 'Celebrate lifes special moments with the Lavish Love Flower Bouquet, a vibrant and heartwarming floral arrangement featuring 10 assorted carnations, 10 assorted gerberas, 1 sunflower, and 1 stargazer lily, elegantly wrapped in premium Chinese burlap wrap.',
        category: 'Flowers Bouquet',
        price: 700.00,
        thumbnail_url: 'https://gloristflowers.com/cdn/shop/files/lavish-love-flower-bouquet-carnation-gerbera-sunflower-stargazer.jpg?v=1781690769&width=493'
      },
       {
        id: 8,
        product_name: 'Ashbury Pressed Flowers Keychain - Yellow Orange',
        description: 'This keychain features enclosed dried flowers. Its so hard to choose which colour is my favourite; I might just have to get all three!',
        category: 'Dried Flowers Keychain',
        price: 180.00,
        thumbnail_url: 'https://plankscanada.com/cdn/shop/files/AshburyPressedFlowersKeychain-YellowOrange.jpg?v=1738356508&width=823'
      },
      {
        id: 9,
        product_name: 'Key Chain with Dried Flowers in Resin',
        description: 'Take a bit of the farm with you wherever you go! We are so excited to introduce our pressed flower resin art in this adorable key chain. Each item is unique and involves an eight month process with all botanicals grown, harvested and pressed at our farm.',
        category: 'Dried Flowers Keychain',
        price: 180.00,
        thumbnail_url: 'https://1818farms.com/cdn/shop/products/ResinKeychainsby1818Farms-Square_499083f2-abb8-44e3-b759-3c8a6331de8d.jpg?v=1675188660&width=713'
      },

       {
        id: 10,
        product_name: 'Mini Keychain Bible Souvenir w/ dried flowers for Baptism, Christening, Wedding free tag',
        description: 'Mini Keychain Bible Assorted Dried Flower Minimum of 10pcs per order',
        category: 'Dried Flowers Keychain',
        price: 100.00,
        thumbnail_url: 'https://down-ph.img.susercontent.com/file/ph-11134207-820le-mngmkaqrgj5x47.webp'
      },



      
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