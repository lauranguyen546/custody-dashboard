// Test Google Vision API integration
// Run: node test-vision.js

const fs = require('fs');
const path = require('path');

// Read .env.local directly
const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');

// Parse the API key
const keyMatch = envContent.match(/GOOGLE_VISION_API_KEY=(.+)/);
const API_KEY = keyMatch ? keyMatch[1].trim() : null;

if (!API_KEY || API_KEY === 'your-vision-api-key-here') {
  console.error('❌ Error: GOOGLE_VISION_API_KEY not set in .env.local');
  console.error('Current value:', API_KEY);
  console.error('Please add your real API key to .env.local');
  process.exit(1);
}

console.log('✅ API key found:', API_KEY.substring(0, 15) + '...');

// Create a simple test image (1x1 pixel red PNG)
const TEST_IMAGE_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';

async function testVisionAPI() {
  try {
    console.log('\n🧪 Testing Google Vision API...\n');
    
    const response = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Referer': 'https://custody-dashboard.vercel.app'
        },
        body: JSON.stringify({
          requests: [{
            image: { content: TEST_IMAGE_BASE64 },
            features: [
              { type: 'LABEL_DETECTION', maxResults: 5 }
            ]
          }]
        })
      }
    );
    
    if (!response.ok) {
      const error = await response.json();
      console.error('❌ Vision API Error:', error.error?.message || JSON.stringify(error, null, 2));
      
      if (error.error?.message?.includes('referer')) {
        console.log('\n💡 Tip: Your API key has referrer restrictions.');
        console.log('Go to https://console.cloud.google.com/apis/credentials');
        console.log('Edit your API key and add these HTTP referrers:');
        console.log('  - localhost:3000/*');
        console.log('  - custody-dashboard.vercel.app/*');
      }
      
      process.exit(1);
    }
    
    const data = await response.json();
    
    console.log('✅ Vision API Response:\n');
    console.log(JSON.stringify(data, null, 2));
    
    // Check if we got results
    const result = data.responses?.[0];
    if (result) {
      console.log('\n📊 Analysis Results:');
      console.log('- Labels detected:', result.labelAnnotations?.length || 0);
      if (result.labelAnnotations?.length > 0) {
        console.log('- Top label:', result.labelAnnotations[0].description);
      }
    }
    
    console.log('\n✅ Vision API integration is working!');
    console.log('\n📝 Next: Test with a real image through the dashboard');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testVisionAPI();
