// middleware.js (Vercel Server-side Password Protection)

// Use the existing password check via Apps Script
async function verifyVIPPhone(phone) {
    const url = 'https://script.google.com/macros/s/AKfycbz7JwasPrxOnuEfz7ouNfve2KAoueOpmefuEUYnbCsYLE2TfD2zX5CBzvHdQgSEyQp7-g/exec';
    const params = new URLSearchParams({
      mode: 'password',
      password: phone
    }).toString();
  
    try {
      console.log(`🔄 Fetching URL: ${url}?${params}`);
      const response = await fetch(`${url}?${params}`, {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Accept': 'text/plain',
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
  
      console.log(`📝 Response Status: ${response.status}`);
      const data = await response.text();
      console.log(`🔐 Password verification response: ${data}`);
      return data.trim() === 'success';
    } catch (error) {
      console.error(`❌ Failed to verify VIP phone: ${error.message}`);
      return false;
    }
  }
  
  // Middleware function
  export default function middleware(req, res, next) {
    try {
      const authHeader = req.headers.authorization || '';
      const base64Credentials = authHeader.split(' ')[1] || '';
      const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
      const [phone] = credentials.split(':');
  
      console.log(`🛂 Attempting to verify phone: ${phone}`);
  
      verifyVIPPhone(phone).then(isVIP => {
        if (isVIP) {
          console.log(`✅ Access granted for phone: ${phone}`);
          next();
        } else {
          console.log(`❌ Access denied for phone: ${phone}`);
          res.setHeader('WWW-Authenticate', 'Basic realm="Cliff House"');
          res.status(401).send('🚫 Unauthorized - Please enter a valid phone number.');
        }
      }).catch(error => {
        console.error(`❌ Middleware error: ${error.message}`);
        res.status(500).send('🚫 Internal Server Error');
      });
    } catch (error) {
      console.error(`❌ Middleware processing error: ${error.message}`);
      res.status(500).send('🚫 Internal Server Error');
    }
  }
  
  export const config = {
    matcher: [
      // protect everything except check.html and your API routes
      '/((?!check\\.html|api).*)'
    ]
  };
  