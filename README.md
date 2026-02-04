# Lab 2: Docker & Docker Compose - Microservices E-Commerce Application

## Learning Objectives

By the end of this lab, you will be able to:

- Write Dockerfiles to containerize Node.js applications
- Use Docker Compose to orchestrate multi-container applications
- Understand microservice architecture patterns (API Gateway, service-per-database)
- Configure inter-service communication within a Docker network
- Use Docker volumes, networks, environment variables, and dependency management

## Prerequisites

Verify your Docker installation:

```bash
docker --version
docker compose version
```

## Architecture Overview

```
                         ┌──────────────┐
                         │   Gateway    │
                         │  (port 3000) │
                         └──────┬───────┘
                                │
              ┌─────────────────┼─────────────────┐
              │                 │                 │
     ┌────────▼──────┐ ┌───────▼───────┐ ┌───────▼───────┐
     │ User Service  │ │Product Service│ │ Order Service │
     │  (port 3001)  │ │  (port 3002)  │ │  (port 3003)  │
     └────────┬──────┘ └───────┬───────┘ └───────┬───────┘
              │                │                 │
     ┌────────▼──────┐ ┌───────▼───────┐ ┌───────▼───────┐
     │   user-db     │ │  product-db   │ │   order-db    │
     │ (PostgreSQL)  │ │ (PostgreSQL)  │ │ (PostgreSQL)  │
     └───────────────┘ └───────────────┘ └───────────────┘
```

Each service has its own database (the **database-per-service** pattern). The **API Gateway** routes external requests to the appropriate service. The **Order Service** communicates with both the User Service and Product Service to validate data before creating orders.

**What's provided:**
- Gateway (complete)
- User Service + user-db (complete) -- use this as your **reference implementation**

**What you'll build:**
- Product Service + product-db
- Order Service + order-db
- Complete the `docker-compose.yml`

---

## Part 1: Understanding the Provided Code

Before writing any code, read through the reference implementation to understand the patterns you'll follow.

### 1.1 The Gateway (`gateway/index.js`)

Open `gateway/index.js`. The gateway uses `http-proxy-middleware` to route requests:

| Incoming Request     | Routed To                              |
|----------------------|----------------------------------------|
| `GET /api/users`     | `http://user-service:3001/users`       |
| `GET /api/products`  | `http://product-service:3002/products` |
| `GET /api/orders`    | `http://order-service:3003/orders`     |

Notice that the gateway refers to services by their **container name** (e.g., `user-service`), not `localhost`. This is because Docker Compose creates a shared network where containers can reach each other by service name.

### 1.2 The User Service (`user-service/index.js`)

This is your **reference implementation**. Study it carefully -- you'll follow the same patterns for the Product and Order services.

Key things to note:

1. **Database connection** using `pg.Pool` with environment variables:
   ```javascript
   const pool = new Pool({
     host: process.env.DB_HOST || 'user-db',
     port: parseInt(process.env.DB_PORT || '5432'),
     database: process.env.DB_NAME || 'userdb',
     user: process.env.DB_USER || 'postgres',
     password: process.env.DB_PASSWORD || 'postgres',
   });
   ```

2. **Wait for database** -- the `waitForDB` function retries the connection because the database container may take a few seconds to start.

3. **Three REST endpoints**: `GET /users`, `POST /users`, `GET /users/:id`

### 1.3 The Database Init Script (`user-service/init.sql`)

PostgreSQL runs any `.sql` files placed in `/docker-entrypoint-initdb.d/` when the container starts for the first time. This creates the table and inserts seed data.

---

## Part 2: Understanding the Dockerfile

Open `user-service/Dockerfile`:

```dockerfile
FROM node:18-alpine          # Base image: Node.js 18 on Alpine Linux (small)

WORKDIR /app                 # Set working directory inside container

COPY package*.json ./        # Copy dependency files first (for layer caching)

RUN npm install              # Install dependencies

COPY . .                     # Copy application code

EXPOSE 3001                  # Document which port the app uses

CMD ["npm", "start"]         # Command to run when container starts
```

The Dockerfiles for the Product and Order services are already provided and follow the same pattern (with different `EXPOSE` ports).

---

## Part 3: Understanding Docker Compose

Open `docker-compose.yml` and study the provided entries for `gateway`, `user-service`, and `user-db`.

Key Docker Compose concepts demonstrated:

| Concept          | Example                                           | Purpose                                                |
|------------------|---------------------------------------------------|--------------------------------------------------------|
| `build`          | `build: ./user-service`                           | Build image from a Dockerfile in the specified directory |
| `ports`          | `"3001:3001"`                                     | Map host port to container port                         |
| `environment`    | `DB_HOST: user-db`                                | Set environment variables inside the container          |
| `depends_on`     | `depends_on: - user-db`                           | Start dependencies first (does not wait for readiness)  |
| `volumes`        | `user-data:/var/lib/postgresql/data`              | Persist database data across container restarts         |
| `volumes` (bind) | `./user-service/init.sql:/docker-entrypoint-...`  | Mount a file from host into the container               |
| `networks`       | `networks: - app-network`                         | Place containers on a shared network                    |

---

## Part 4: Build the Product Service

Now it's your turn! Open `product-service/index.js`. You'll see skeleton code with `// YOUR CODE HERE` markers.

### 4.1 Database Connection Pool

Fill in the `Pool` configuration. Use the same pattern as `user-service/index.js`, but with defaults appropriate for the product database:
- Default host: `product-db`
- Default database name: `productdb`

### 4.2 GET /products

Implement the handler to return all products:

```
Query: SELECT * FROM products ORDER BY id
```

Follow the same try/catch pattern as `GET /users` in the user service.

### 4.3 POST /products

Implement the handler to create a new product. Required fields: `name`, `description`, `price`.

```
Query: INSERT INTO products (name, description, price) VALUES ($1, $2, $3) RETURNING *
```

Remember to:
- Validate that required fields are present (return 400 if missing)
- Return 201 status on success

### 4.4 GET /products/:id

Implement the handler to get a product by ID:

```
Query: SELECT * FROM products WHERE id = $1
```

Remember to return 404 if the product is not found.

---

## Part 5: Build the Order Service

Open `order-service/index.js`. This service is more complex because it communicates with other services.

### 5.1 Database Connection Pool

Same pattern as before, but with defaults for the order database:
- Default host: `order-db`
- Default database name: `orderdb`

### 5.2 Inter-Service Communication

Implement `validateUser` and `validateProduct`. These functions call the other services over the Docker network:

```javascript
const validateUser = async (userId) => {
  try {
    const response = await fetch(`http://user-service:3001/users/${userId}`);
    if (!response.ok) return null;
    return await response.json();
  } catch (err) {
    console.error('Error validating user:', err);
    return null;
  }
};
```

Follow the same pattern for `validateProduct`, calling `http://product-service:3002/products/${productId}`.

### 5.3 GET /orders and GET /orders/:id

Same patterns as the other services.

### 5.4 POST /orders

This is the most complex endpoint. Steps:

1. Extract `user_id`, `product_id`, `quantity` from `req.body`
2. Validate all required fields are present (return 400 if missing)
3. Call `validateUser(user_id)` -- return 404 with message `"User not found"` if null
4. Call `validateProduct(product_id)` -- return 404 with message `"Product not found"` if null
5. Calculate `total_price = product.price * quantity`
6. Insert into the database and return the created order with status 201

---

## Part 6: Complete docker-compose.yml

Add the missing service entries to `docker-compose.yml`. You need to add:

1. **product-service** -- follow the `user-service` pattern
2. **product-db** -- follow the `user-db` pattern
3. **order-service** -- similar pattern, but `depends_on` should include `order-db`, `user-service`, and `product-service`
4. **order-db** -- follow the `user-db` pattern
5. Add `product-data` and `order-data` to the `volumes` section at the bottom

The hints in the compose file give you all the details you need.

---

## Part 7: Build and Test

### 7.1 Build and Start

```bash
docker compose up --build
```

Watch the logs. You should see all services start and connect to their databases. If a service fails to connect, it will retry automatically.

### 7.2 Test with curl

Open a new terminal and run these commands:

**Test the Gateway health check:**
```bash
curl http://localhost:3000/health
```

**Test User Service (provided -- should work immediately):**
```bash
# List users (should return seed data)
curl http://localhost:3000/api/users

# Create a user
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name": "Charlie", "email": "charlie@example.com"}'

# Get user by ID
curl http://localhost:3000/api/users/1
```

**Test Product Service (your code):**
```bash
# List products (should return seed data)
curl http://localhost:3000/api/products

# Create a product
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{"name": "Keyboard", "description": "Mechanical keyboard", "price": 149.99}'

# Get product by ID
curl http://localhost:3000/api/products/1
```

**Test Order Service (your code):**
```bash
# Create an order (should validate user and product exist)
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{"user_id": 1, "product_id": 1, "quantity": 2}'

# List orders
curl http://localhost:3000/api/orders

# Get order by ID
curl http://localhost:3000/api/orders/1

# Test validation - should return 404 "User not found"
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{"user_id": 999, "product_id": 1, "quantity": 1}'
```

### 7.3 Useful Docker Commands

```bash
# Stop all services
docker compose down

# Stop and remove volumes (reset databases)
docker compose down -v

# View logs for a specific service
docker compose logs product-service

# Rebuild a single service
docker compose up --build product-service

# List running containers
docker compose ps
```

---

## Bonus Challenges
1. **Add a health check endpoint** (`GET /health`) to each service and configure Docker Compose `healthcheck` so that `depends_on` waits for services to be truly ready
2. **Add error handling** for when a dependent service is down (e.g., Order Service should return 503 if it can't reach User Service)
3. Getting people to host this might be a good thing. 
4. Adding authentication to gateway 
5. Adding rate limiting to gateway 
6. Add Bruno tests

---

## Submission

TODO --> Update this 