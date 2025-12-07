// Quick test script to check the completed internships endpoint
import fetch from 'node-fetch';

const API_URL = 'http://localhost:5000';

async function testEndpoint() {
  try {
    // You'll need to replace this with a valid token
    const token = 'YOUR_TOKEN_HERE';
    
    const response = await fetch(`${API_URL}/api/students/internships/completed?page=1&limit=20`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testEndpoint();
