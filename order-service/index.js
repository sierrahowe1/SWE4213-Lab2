const express = require('express');
const { Pool } = require('pg');

const app = express();
app.use(express.json());

const PORT = 3003;

// TODO: Create a PostgreSQL connection pool
// HINT: Same pattern as user-service and product-service
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

// Helper: Validate that a user exists by calling the User Service
// HINT: Use fetch() to call http://user-service:3001/users/:id
// Return the user object if found, or null if not
const validateUser = async (userId) => {
  // TODO: Implement inter-service communication
  // YOUR CODE HERE
};

// Helper: Validate that a product exists by calling the Product Service
// HINT: Use fetch() to call http://product-service:3002/products/:id
// Return the product object if found, or null if not
const validateProduct = async (productId) => {
  // TODO: Implement inter-service communication
  // YOUR CODE HERE
};

// TODO: Implement GET /orders - List all orders
// Query: SELECT * FROM orders ORDER BY id
app.get('/orders', async (req, res) => {
  // YOUR CODE HERE
});

// TODO: Implement POST /orders - Create a new order
// This is the most complex endpoint! Steps:
//   1. Extract user_id, product_id, quantity from req.body
//   2. Validate all fields are present
//   3. Call validateUser(user_id) - return 404 if user not found
//   4. Call validateProduct(product_id) - return 404 if product not found
//   5. Calculate total_price = product.price * quantity
//   6. Insert into orders table
// Query: INSERT INTO orders (user_id, product_id, quantity, total_price) VALUES ($1, $2, $3, $4) RETURNING *
app.post('/orders', async (req, res) => {
  // YOUR CODE HERE
});

// TODO: Implement GET /orders/:id - Get order by ID
// Query: SELECT * FROM orders WHERE id = $1
app.get('/orders/:id', async (req, res) => {
  // YOUR CODE HERE
});

// Start server after DB is ready
waitForDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Order Service running on port ${PORT}`);
  });
});
