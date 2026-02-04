const express = require('express');
const { Pool } = require('pg');

const app = express();
app.use(express.json());

const PORT = 3002;

// TODO: Create a PostgreSQL connection pool
// HINT: Look at how user-service/index.js creates its pool
// You need to use the environment variables: DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
// The defaults should match what you configure in docker-compose.yml
const pool = new Pool({
  // YOUR CODE HERE
});

// Wait for database to be ready (provided for you)
const waitForDB = async (retries = 10, delay = 2000) => {
  for (let i = 0; i < retries; i++) {
    try {
      await pool.query('SELECT 1');
      console.log('Connected to database');
      return;
    } catch (err) {
      console.log(`Waiting for database... attempt ${i + 1}/${retries}`);
      await new Promise(res => setTimeout(res, delay));
    }
  }
  throw new Error('Could not connect to database');
};

// TODO: Implement GET /products - List all products
// HINT: Look at the GET /users endpoint in user-service/index.js
// Query: SELECT * FROM products ORDER BY id
app.get('/products', async (req, res) => {
  // YOUR CODE HERE
});

// TODO: Implement POST /products - Create a new product
// HINT: Look at the POST /users endpoint in user-service/index.js
// Required fields: name, description, price
// Query: INSERT INTO products (name, description, price) VALUES ($1, $2, $3) RETURNING *
app.post('/products', async (req, res) => {
  // YOUR CODE HERE
});

// TODO: Implement GET /products/:id - Get product by ID
// HINT: Look at the GET /users/:id endpoint in user-service/index.js
// Query: SELECT * FROM products WHERE id = $1
app.get('/products/:id', async (req, res) => {
  // YOUR CODE HERE
});

// Start server after DB is ready
waitForDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Product Service running on port ${PORT}`);
  });
});
