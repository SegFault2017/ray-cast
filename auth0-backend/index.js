require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { auth } = require('express-oauth2-jwt-bearer');
const { ManagementClient } = require('auth0');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Auth0 Management API client
const management = new ManagementClient({
  domain: process.env.AUTH0_DOMAIN,
  clientId: process.env.AUTH0_CLIENT_ID,
  clientSecret: process.env.AUTH0_CLIENT_SECRET,
});

// Auth0 JWT validation middleware
const checkJwt = auth({
  audience: process.env.AUTH0_AUDIENCE,
  issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL,
  tokenSigningAlg: 'RS256'
});

// Public endpoint - no authentication required
app.get('/api/public', (req, res) => {
  res.json({
    message: 'This is a public endpoint - no authentication required'
  });
});

// Protected endpoint - requires valid JWT
app.get('/api/private', checkJwt, (req, res) => {
  res.json({
    message: 'This is a private endpoint - you are authenticated!',
    user: req.auth.payload
  });
});

// Protected endpoint with scope check
app.get('/api/private-scoped', checkJwt, (req, res) => {
  const permissions = req.auth.payload.permissions || [];

  if (!permissions.includes('read:messages')) {
    return res.status(403).json({
      error: 'Insufficient permissions',
      required: 'read:messages'
    });
  }

  res.json({
    message: 'This is a private endpoint with scope check',
    permissions: permissions
  });
});

// Get user info from token
app.get('/api/me', checkJwt, (req, res) => {
  res.json({
    sub: req.auth.payload.sub,
    payload: req.auth.payload
  });
});

// ============================================
// Auth0 Management API - User Search Endpoints
// ============================================

// Search users by query (email, name, etc.)
app.get('/api/users/search', async (req, res) => {
  try {
    const { q, page = 0, per_page = 10 } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }

    const users = await management.users.list({
      q: q,
      searchEngine: 'v3',
      page: parseInt(page),
      perPage: parseInt(per_page),
    });

    res.json({
      users: users.data,
      total: users.data.length,
      page: parseInt(page),
      per_page: parseInt(per_page),
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Search users by email
app.get('/api/users/by-email', async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ error: 'Email parameter is required' });
    }

    const users = await management.users.listUsersByEmail({ email });

    res.json({
      users: users.data,
      total: users.data.length,
    });
  } catch (error) {
    console.error('Get users by email error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all users (paginated)
app.get('/api/users', async (req, res) => {
  try {
    const { page = 0, per_page = 10 } = req.query;

    const users = await management.users.list({
      page: parseInt(page),
      perPage: parseInt(per_page),
    });

    res.json({
      users: users.data,
      total: users.data.length,
      page: parseInt(page),
      per_page: parseInt(per_page),
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user by ID
app.get('/api/users/by-id', async (req, res) => {
  try {
    const id = req.query.id;

    if (!id) {
      return res.status(400).json({ error: 'Query parameter "id" is required' });
    }

    const user = await management.users.get(id);
    console.log("🚀 ~ user:", user)
    

    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.message);

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: 'Invalid or missing token',
      details: err.message
    });
  }

  res.status(500).json({
    error: 'Internal server error',
    details: err.message
  });
});

app.listen(PORT, () => {
  console.log(`Auth0 test server running on http://localhost:${PORT}`);
  console.log('\nAvailable endpoints:');
  console.log('  GET /health              - Health check');
  console.log('  GET /api/public          - Public (no auth required)');
  console.log('  GET /api/private         - Protected (requires JWT)');
  console.log('  GET /api/private-scoped  - Protected with scope check');
  console.log('  GET /api/me              - Get user info from token');
  console.log('\nUser Management (Auth0 Management API):');
  console.log('  GET /api/users           - List all users (paginated)');
  console.log('  GET /api/users/search?q= - Search users by query');
  console.log('  GET /api/users/by-email?email= - Search by email');
  console.log('  GET /api/users/by-id?id= - Get user by ID');
});
