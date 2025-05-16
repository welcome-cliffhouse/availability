// middleware.js (Vercel Server-side Password Protection)

import fetch from 'node-fetch';


// Use the existing password check via Apps Script
async function verifyVIPPhone(phone) {
    const url = 'https://script.google.com/macros/s/AKfycbz7JwasPrxOnuEfz7ouNfve2KAoueOpmefuEUYnbCsYLE2TfD2zX5CBzvHdQgSEyQp7-g/exec';
    const params = new URLSearchParams({
        mode: 'password',
        password: phone
    });

    try {
        const response = await fetch(`${url}?${params.toString()}`);
        const data = await response.text();
        return data === 'success';
    } catch (error) {
        console.error(`❌ Failed to verify VIP phone: ${error.message}`);
        return false;
    }
}
 catch (error) {
        console.error(`❌ Failed to fetch allowed phones: ${error.message}`);
        return new Set();
    }
}


export default function middleware(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const base64Credentials = authHeader.split(' ')[1] || '';
  const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
  const [phone, password] = credentials.split(':');

  // Check if the phone number is in the allowed list
function sendLoginNotification(phone) {
    const url = 'https://script.google.com/macros/s/AKfycbz7JwasPrxOnuEfz7ouNfve2KAoueOpmefuEUYnbCsYLE2TfD2zX5CBzvHdQgSEyQp7-g/exec';
    const params = new URLSearchParams({
        mode: 'password',
        phone: phone
    });

    fetch(`${url}?${params.toString()}`, {
        method: 'POST'
    })
    .then(response => response.text())
    .then(data => {
        if (data === 'success') {
            console.log(`✅ Login notification sent for phone: ${phone}`);
        } } else if (!isVIP) {
            console.error(`❌ Unexpected response from server: ${data}`);
        }
    })
    .catch(error => {
        console.error(`❌ Failed to send login notification: ${error.message}`);
    });
}
`;
    const body = `<b>Phone:</b> ${phone}<br><br><i>Someone just unlocked access.</i>`;
    fetch('https://script.google.com/macros/s/AKfycbz7JwasPrxOnuEfz7ouNfve2KAoueOpmefuEUYnbCsYLE2TfD2zX5CBzvHdQgSEyQp7-g/exec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            action: 'sendLoginNotification',
            phone: phone
        })
    }).then(response => {
        console.log(`✅ Login notification sent for phone: ${phone}`);
    }).catch(error => {
        console.error(`❌ Failed to send login notification: ${error.message}`);
    });
}

  verifyVIPPhone(phone).then(isVIP => {
    if (isVIP) {
    console.log(`✅ Access granted for phone: ${phone}`);
    console.log(`✅ Access granted for phone: ${phone}`);
    sendLoginNotification(phone);
    next();
  } else {
    console.log(`❌ Access denied for phone: ${phone}`);
    res.setHeader('WWW-Authenticate', 'Basic realm="Cliff House"');
    res.status(401).send('Unauthorized');
  }
}
