CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed data
INSERT INTO products (name, description, price) VALUES
    ('Laptop', 'A powerful laptop for developers', 999.99),
    ('Headphones', 'Noise-cancelling wireless headphones', 199.99);
