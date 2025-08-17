// api/server.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const contractService = require('./services/contractService');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// API Authentication middleware
const apiAuth = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey || apiKey !== process.env.API_KEY) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
  next();
};

// ==================== CONTENT ENDPOINTS ====================

// Register new content
app.post('/api/content', apiAuth, async (req, res) => {
  try {
    const { fingerprint, metadataURI, creatorAddress } = req.body;
    
    if (!fingerprint || !metadataURI) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required parameters' 
      });
    }
    
    const result = await contractService.registerContent(
      creatorAddress || req.query.creatorAddress,
      fingerprint, 
      metadataURI
    );
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Server error' 
    });
  }
});

// Get content by ID
app.get('/api/content/:id', async (req, res) => {
  try {
    const result = await contractService.getContentById(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get content by fingerprint
app.get('/api/content/fingerprint/:fingerprint', async (req, res) => {
  try {
    const result = await contractService.getContentByFingerprint(req.params.fingerprint);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get creator's content
app.get('/api/creator/:address/content', async (req, res) => {
  try {
    const result = await contractService.getCreatorContentIds(req.params.address);
    
    // If successful and there are IDs, fetch full content details
    if (result.success && result.contentIds && result.contentIds.length > 0) {
      const contentPromises = result.contentIds.map(id => 
        contractService.getContentById(id)
      );
      
      const contentResults = await Promise.all(contentPromises);
      const validContent = contentResults.filter(item => item.success);
      
      return res.json({
        success: true,
        count: validContent.length,
        content: validContent
      });
    }
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get total content count
app.get('/api/content/stats/count', async (req, res) => {
  try {
    const result = await contractService.getTotalContent();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== LICENSING ENDPOINTS ====================

// Create terms for content
app.post('/api/terms', apiAuth, async (req, res) => {
  try {
    const { 
      contentId, 
      status, 
      price, 
      requireAttribution, 
      allowedUsageTypes, 
      customTermsURI 
    } = req.body;
    
    if (!contentId || status === undefined) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required parameters' 
      });
    }
    
    const result = await contractService.createTerms(
      contentId,
      status,
      price || '0',
      !!requireAttribution,
      allowedUsageTypes || [contractService.enums.AIUsageType.ALL],
      customTermsURI
    );
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update existing terms
app.put('/api/terms/:id', apiAuth, async (req, res) => {
  try {
    const { 
      active, 
      status, 
      price, 
      requireAttribution, 
      allowedUsageTypes, 
      customTermsURI 
    } = req.body;
    
    if (active === undefined || status === undefined) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required parameters' 
      });
    }
    
    const result = await contractService.updateTerms(
      req.params.id,
      active,
      status,
      price || '0',
      !!requireAttribution,
      allowedUsageTypes || [contractService.enums.AIUsageType.ALL],
      customTermsURI
    );
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get terms by ID
app.get('/api/terms/:id', async (req, res) => {
  try {
    const result = await contractService.getTermsById(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== PAYMENT ENDPOINTS ====================

// Make a payment
app.post('/api/payments', apiAuth, async (req, res) => {
  try {
    const { contentIds, amounts, notes } = req.body;
    
    if (!contentIds || !amounts || contentIds.length !== amounts.length) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid payment parameters' 
      });
    }
    
    const result = await contractService.createPayment(
      contentIds,
      amounts,
      notes || contentIds.map(() => "")
    );
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get payment details
app.get('/api/payments/:id', async (req, res) => {
  try {
    const result = await contractService.getPaymentById(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Withdraw creator earnings
app.post('/api/earnings/withdraw', apiAuth, async (req, res) => {
  try {
    const result = await contractService.withdrawCreatorEarnings();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get creator balance
app.get('/api/earnings/:address', async (req, res) => {
  try {
    const result = await contractService.getCreatorBalance(req.params.address);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== DISPUTE ENDPOINTS ====================

// Report a dispute
app.post('/api/disputes', apiAuth, async (req, res) => {
  try {
    const { defendant, contentIds, evidenceURI, violationDetails } = req.body;
    
    if (!defendant || !contentIds || !violationDetails) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required parameters' 
      });
    }
    
    const result = await contractService.reportDispute(
      defendant,
      contentIds,
      evidenceURI || "",
      violationDetails
    );
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Vote on a dispute
app.post('/api/disputes/:id/vote', apiAuth, async (req, res) => {
  try {
    const { isValid } = req.body;
    
    if (isValid === undefined) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing vote value' 
      });
    }
    
    const result = await contractService.voteOnDispute(
      req.params.id,
      !!isValid
    );
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get dispute by ID
app.get('/api/disputes/:id', async (req, res) => {
  try {
    const result = await contractService.getDisputeById(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get total disputes count
app.get('/api/disputes/stats/count', async (req, res) => {
  try {
    const result = await contractService.getTotalDisputes();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Check if address is an arbiter
app.get('/api/arbiters/:address', async (req, res) => {
  try {
    const result = await contractService.isArbiter(req.params.address);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add new arbiter (admin only)
app.post('/api/arbiters', apiAuth, async (req, res) => {
  try {
    const { arbiterAddress } = req.body;
    
    if (!arbiterAddress) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing arbiter address' 
      });
    }
    
    const result = await contractService.addArbiter(arbiterAddress);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'CreatorClaim Protocol API',
    version: '1.0.0',
    endpoints: {
      content: '/api/content',
      terms: '/api/terms',
      payments: '/api/payments',
      disputes: '/api/disputes',
      earnings: '/api/earnings',
      arbiters: '/api/arbiters'
    }
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`CreatorClaim Protocol API running on port ${PORT}`);
});
