// middleware.js (Vercel Server-side Password Protection)

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

// Send login notification
function sendLoginNotification(phone) {
    const url = 'https://script.google.com/macros/s/AKfycbz7JwasPrxOnuEfz7ouNfve2KAoueOpmefuEUYnbCsYLE2TfD2zX5CBzvHdQgSEyQp7-g/exec';
    const params = new URLSearchParams({
        action: 'sendLoginNotification',
        phone: phone
    });

    fetch(`${url}?${params.toString()}`, {
        method: 'POST'
    })
    .then(response => response.text())
    .then(data => {
        if (data === 'success') {
            console.log(`✅ Login notification sent for phone: ${phone}`);
        } else {
            console.error(`❌ Unexpected response from server: ${data}`);
        }
    })
    .catch(error => {
        console.error(`❌ Failed to send login notification: ${error.message}`);
    });
}

// Middleware function
export default function middleware(req, res, next) {
    const authHeader = req.headers.authorization || '';
    const base64Credentials = authHeader.split(' ')[1] || '';
    const credentials = new TextDecoder().decode(Uint8Array.from(atob(base64Credentials), c => c.charCodeAt(0)));
    const [phone, password] = credentials.split(':');

    verifyVIPPhone(phone).then(isVIP => {
        if (isVIP) {
            console.log(`✅ Access granted for phone: ${phone}`);
            sendLoginNotification(phone);
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
}
