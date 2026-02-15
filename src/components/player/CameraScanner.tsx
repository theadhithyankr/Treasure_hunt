import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface CameraScannerProps {
    onScanComplete: (value: string) => void;
    onClose: () => void;
}

export default function CameraScanner({ onScanComplete, onClose }: CameraScannerProps) {
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const [error, setError] = useState('');
    const [scanning, setScanning] = useState(false);

    useEffect(() => {
        const startScanner = async () => {
            try {
                const scanner = new Html5Qrcode('qr-reader');
                scannerRef.current = scanner;

                await scanner.start(
                    { facingMode: 'environment' },
                    {
                        fps: 10,
                        qrbox: { width: 250, height: 250 }
                    },
                    (decodedText) => {
                        // Success callback
                        scanner.stop().then(() => {
                            onScanComplete(decodedText);
                        });
                    },
                    (_errorMessage) => {
                        // Error callback (can be ignored for continuous scanning)
                    }
                );

                setScanning(true);
            } catch (err: any) {
                setError('Failed to access camera. Please check permissions.');
                console.error(err);
            }
        };

        startScanner();

        return () => {
            if (scannerRef.current && scanning) {
                scannerRef.current.stop().catch(console.error);
            }
        };
    }, []);

    const handleClose = async () => {
        if (scannerRef.current && scanning) {
            await scannerRef.current.stop();
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black z-50">
            {/* Scanner viewport */}
            <div className="relative h-full flex flex-col">
                {/* Header */}
                <div className="safe-area-top bg-black/80 p-4 text-white">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold">Scan QR Code or Barcode</h2>
                        <button
                            onClick={handleClose}
                            className="text-2xl w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/20"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* Scanner area */}
                <div className="flex-1 flex items-center justify-center p-4">
                    <div id="qr-reader" className="w-full max-w-md"></div>
                </div>

                {/* Instructions */}
                <div className="safe-area-bottom bg-gradient-to-t from-black to-transparent p-6 text-white">
                    {error ? (
                        <div className="bg-red-600 rounded-lg p-4 mb-4">
                            <p className="text-sm">{error}</p>
                        </div>
                    ) : (
                        <div className="text-center">
                            <p className="text-sm mb-2">Position the code within the frame</p>
                            <p className="text-xs text-gray-300">Scanning will happen automatically</p>
                        </div>
                    )}

                    <button
                        onClick={handleClose}
                        className="w-full py-4 bg-white/20 backdrop-blur rounded-lg font-bold mt-4 hover:bg-white/30 active:bg-white/40 transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}
