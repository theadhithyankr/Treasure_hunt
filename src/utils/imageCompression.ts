import imageCompression from 'browser-image-compression';

export async function compressImage(file: File): Promise<File> {
    const options = {
        maxSizeMB: 0.4,          // 400 KB — enough for review, much faster upload
        maxWidthOrHeight: 1280,  // no need for 1920 in a treasure hunt
        useWebWorker: true,
        initialQuality: 0.8,
    };

    try {
        const compressedFile = await imageCompression(file, options);
        return compressedFile;
    } catch (error) {
        console.error('Error compressing image:', error);
        return file; // Return original if compression fails
    }
}
