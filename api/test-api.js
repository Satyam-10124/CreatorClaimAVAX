// test-api.js - API testing script for CreatorClaim Protocol
const fetch = require('node-fetch');
require('dotenv').config();

// API configuration
const API_BASE = 'http://localhost:3003/api';
const API_KEY = process.env.API_KEY;

// Helper function for API requests
async function apiRequest(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY
    }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    console.log(`\n🔄 ${method} ${API_BASE}${endpoint}`);
    if (body) {
      console.log('Request Body:', JSON.stringify(body, null, 2));
    }
    
    const response = await fetch(`${API_BASE}${endpoint}`, options);
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Success:', JSON.stringify(data, null, 2));
    } else {
      console.log('❌ Error:', JSON.stringify(data, null, 2));
    }
    
    return data;
  } catch (error) {
    console.error('❌ Request failed:', error.message);
    return { success: false, error: error.message };
  }
}

// Test all main API endpoints
async function runTests() {
  console.log('\n🚀 STARTING API TESTS\n===========================');
  
  try {
    // Step 1: Register new content
    console.log('\n📝 STEP 1: CONTENT REGISTRATION');
    const contentResult = await apiRequest('/content', 'POST', {
      fingerprint: `test-content-${Date.now()}`,
      metadataURI: 'ipfs://QmTestMetadata'
    });
    
    if (!contentResult.success) {
      console.log('⚠️ Content registration failed, trying to get an existing content...');
    }
    
    // Step 2: Get total content count
    console.log('\n🔢 STEP 2: GET CONTENT COUNT');
    const countResult = await apiRequest('/content/stats/count');
    
    // Step 3: Create licensing terms for the content
    console.log('\n📋 STEP 3: CREATE LICENSING TERMS');
    let contentId = contentResult.success ? contentResult.contentId : '1'; // Use 1 as fallback
    
    const termsResult = await apiRequest('/terms', 'POST', {
      contentId: contentId,
      status: 2, // PAID
      price: '10000000000000000', // 0.01 ETH
      requireAttribution: true,
      allowedUsageTypes: [0, 1, 2] // ALL usage types
    });
    
    // Step 4: Get terms by ID
    console.log('\n📜 STEP 4: GET TERMS BY ID');
    let termsId = termsResult.success ? termsResult.termsId : '1'; // Use 1 as fallback
    
    await apiRequest(`/terms/${termsId}`);
    
    // Step 5: Make a payment
    console.log('\n💰 STEP 5: MAKE PAYMENT');
    const paymentResult = await apiRequest('/payments', 'POST', {
      contentIds: [contentId],
      amounts: ['10000000000000000'], // 0.01 ETH
      notes: ['Test payment for API testing']
    });
    
    // Step 6: Check creator balance
    console.log('\n💼 STEP 6: CHECK CREATOR BALANCE');
    // Use the address that would receive payments (in real scenario, this would be the creator's address)
    const creatorAddress = '0x4F992a229e3eBd64AC36137fa8750c8beA64929E'; // Using a contract address as example
    await apiRequest(`/earnings/${creatorAddress}`);
    
    // Step 7: Report a dispute
    console.log('\n⚖️ STEP 7: REPORT DISPUTE');
    const disputeResult = await apiRequest('/disputes', 'POST', {
      defendant: creatorAddress,
      contentIds: [contentId],
      violationDetails: 'Test dispute for API testing',
      evidenceURI: 'ipfs://QmTestEvidence'
    });
    
    // Step 8: Get dispute details
    console.log('\n📊 STEP 8: GET DISPUTE DETAILS');
    let disputeId = disputeResult.success ? disputeResult.disputeId : '1'; // Use 1 as fallback
    
    await apiRequest(`/disputes/${disputeId}`);
    
    // Step 9: Check if address is an arbiter
    console.log('\n👨‍⚖️ STEP 9: CHECK IF ADDRESS IS ARBITER');
    await apiRequest(`/arbiters/${creatorAddress}`);
    
    console.log('\n✅ API TESTS COMPLETED\n===========================');
  } catch (error) {
    console.error('\n❌ TEST ERROR:', error.message);
  }
}

// Run the tests
runTests();
