const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = 3000;

const AUTH_TOKEN = 'sample-token';

const authCheckHealth = (req, res, next) => {
  if (req.path === '/health') {
    return next();
  }


const authHeaderCheck = req.headers['authorization'];

if (!authHeaderCheck || authHeaderCheck !== `Bearer ${AUTH_TOKEN}`) {
  return res.status(401).json({ error: 'Unauthorized'});
}

const token = authHeaderCheck.split(' ')[1];

if(token !== AUTH_TOKEN) {
  return res.status(401).json({ error: 'Invalid token'});
}

next();

};

app.use(authCheckHealth);


// Proxy routes to microservices
app.use('/api/users', createProxyMiddleware({
  target: 'http://user-service:3001',
  changeOrigin: true,
  pathRewrite: { '^/api/users': '/users' },
}));

app.use('/api/products', createProxyMiddleware({
  target: 'http://product-service:3002',
  changeOrigin: true,
  pathRewrite: { '^/api/products': '/products' },
}));

app.use('/api/orders', createProxyMiddleware({
  target: 'http://order-service:3003',
  changeOrigin: true,
  pathRewrite: { '^/api/orders': '/orders' },
}));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'Gateway is running' });
});

app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
});
