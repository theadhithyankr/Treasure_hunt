const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string;

const UPLOAD_TIMEOUT_MS = 25_000; // 25 s before we give up
const MAX_RETRIES = 2;

export interface CloudinaryUploadResult {
    url: string;
    publicId: string;
}

/** Fetch wrapper that rejects after `ms` milliseconds */
function fetchWithTimeout(url: string, init: RequestInit, ms: number): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ms);
    return fetch(url, { ...init, signal: controller.signal }).finally(() =>
        clearTimeout(timer)
    );
}

/**
 * Uploads a file to Cloudinary using an unsigned upload preset.
 * Retries up to MAX_RETRIES times on network/timeout errors.
 * Returns the secure URL and public ID of the uploaded image.
 */
export async function uploadToCloudinary(file: File): Promise<CloudinaryUploadResult> {
    if (!CLOUD_NAME || !UPLOAD_PRESET) {
        throw new Error(
            'Cloudinary is not configured. Set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET in your .env file.'
        );
    }

    let lastError: unknown;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', UPLOAD_PRESET);

            const response = await fetchWithTimeout(
                `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
                { method: 'POST', body: formData },
                UPLOAD_TIMEOUT_MS
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(
                    errorData?.error?.message ?? `Cloudinary upload failed (${response.status})`
                );
            }

            const data = await response.json();
            return { url: data.secure_url as string, publicId: data.public_id as string };
        } catch (err) {
            lastError = err;
            if (attempt < MAX_RETRIES) {
                // brief back-off: 1 s, then 2 s
                await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
            }
        }
    }
    throw lastError;
}

/**
 * Deletes an image from Cloudinary via the Netlify serverless function.
 * Fails silently if the function is unavailable (e.g. local dev without netlify dev).
 */
export async function deleteFromCloudinary(publicId: string): Promise<void> {
    try {
        await fetch('/.netlify/functions/delete-cloudinary-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ publicId }),
        });
    } catch (err) {
        console.warn('Cloudinary delete skipped (function unavailable):', err);
    }
}
