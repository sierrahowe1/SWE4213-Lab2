const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = 3000;

const AUTH_TOKEN = 'sample-token';


const authCheckHealth = (req, res, next) => {
  if (req.path === '/health') {
    return next();
  }

 
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(401).json({ error: 'Unauthorized - No token provided'});
  }

  const token = authHeader.split(' ')[1];

  if(token !== AUTH_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized - Invalid token'});
  }

  next();
};


app.use(authCheckHealth);

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    error: 'Too many requests, please try again later.',
    message: 'You have exceeded the rate limit of 100 requests per 15 minutes.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.ip || req.connection.remoteAddress;
  },
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many requests, please try again later.',
      message: 'You have exceeded the request limit.',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  }
});


app.use(apiLimiter);


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


app.get('/health', (req, res) => {
  res.json({ status: 'Gateway is running' });
});

app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
});