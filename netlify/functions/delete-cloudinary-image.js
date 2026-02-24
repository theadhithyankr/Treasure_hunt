import crypto from 'crypto';

/**
 * Netlify serverless function — deletes an image from Cloudinary.
 * The API secret lives only here (server-side), never in the browser bundle.
 *
 * POST /.netlify/functions/delete-cloudinary-image
 * Body: { "publicId": "folder/image_id" }
 */
export const handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    let publicId;
    try {
        ({ publicId } = JSON.parse(event.body || '{}'));
    } catch {
        return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON body' }) };
    }

    if (!publicId) {
        return { statusCode: 400, body: JSON.stringify({ error: 'publicId is required' }) };
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Cloudinary server credentials are not configured' }),
        };
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const signature = crypto
        .createHash('sha1')
        .update(`public_id=${publicId}&timestamp=${timestamp}${apiSecret}`)
        .digest('hex');

    const formData = new URLSearchParams({
        public_id: publicId,
        api_key: apiKey,
        timestamp: String(timestamp),
        signature,
    });

    const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData.toString(),
        }
    );

    const data = await response.json();
    return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    };
};
