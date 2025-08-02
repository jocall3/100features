
import React, { useState, useRef } from 'react';
import { PhotoIcon } from '../icons/FeatureIcons.tsx';

export const ImageOptimizer: React.FC = () => {
    const [originalImage, setOriginalImage] = useState<string | null>(null);
    const [originalSize, setOriginalSize] = useState(0);
    const [optimizedImage, setOptimizedImage] = useState<string | null>(null);
    const [optimizedSize, setOptimizedSize] = useState(0);
    const [quality, setQuality] = useState(0.8);
    const [maxWidth, setMaxWidth] = useState(1024);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setOriginalSize(file.size);
            const reader = new FileReader();
            reader.onload = (event) => {
                setOriginalImage(event.target?.result as string);
                setOptimizedImage(null);
                setOptimizedSize(0);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const optimizeImage = () => {
        if (!originalImage) return;

        const img = new Image();
        img.src = originalImage;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const scaleFactor = maxWidth / img.width;
            const newWidth = img.width > maxWidth ? maxWidth : img.width;
            const newHeight = img.width > maxWidth ? img.height * scaleFactor : img.height;
            
            canvas.width = newWidth;
            canvas.height = newHeight;

            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, newWidth, newHeight);

            const dataUrl = canvas.toDataURL('image/jpeg', quality);
            setOptimizedImage(dataUrl);
            setOptimizedSize(dataUrl.length); // Approximation, not exact file size
        };
    };
    
    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8">
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-slate-100 flex items-center">
                    <PhotoIcon />
                    <span className="ml-3">Image Optimizer</span>
                </h1>
                <p className="text-slate-400 mt-1">Resize and compress JPEG images in your browser.</p>
            </header>
            
            {!originalImage && (
                <div className="flex-grow flex items-center justify-center">
                    <button onClick={() => fileInputRef.current?.click()} className="px-8 py-4 bg-cyan-500 text-slate-900 font-bold rounded-lg text-lg">
                        Upload an Image
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                </div>
            )}

            {originalImage && (
                 <div className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
                    <div className="lg:col-span-1 flex flex-col gap-4 bg-slate-800/50 p-6 rounded-lg">
                        <h3 className="text-xl font-bold">Controls</h3>
                        <div>
                            <label htmlFor="maxWidth" className="block text-sm font-medium text-slate-400">Max Width ({maxWidth}px)</label>
                            <input id="maxWidth" type="range" min="128" max="4096" step="128" value={maxWidth} onChange={e => setMaxWidth(Number(e.target.value))} className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer" />
                        </div>
                        <div>
                            <label htmlFor="quality" className="block text-sm font-medium text-slate-400">JPEG Quality ({Math.round(quality*100)}%)</label>
                            <input id="quality" type="range" min="0.1" max="1" step="0.1" value={quality} onChange={e => setQuality(Number(e.target.value))} className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer" />
                        </div>
                        <button onClick={optimizeImage} className="w-full mt-4 px-6 py-3 bg-cyan-500 text-slate-900 font-bold rounded-md">Optimize</button>
                        <button onClick={() => setOriginalImage(null)} className="w-full mt-2 px-6 py-2 bg-slate-700 text-slate-200 font-bold rounded-md">Choose Another Image</button>

                    </div>
                    <div className="lg:col-span-2 grid grid-cols-2 gap-4 min-h-0">
                        <div className="flex flex-col items-center p-4 bg-slate-900 rounded-lg">
                            <h4 className="font-bold">Original ({formatBytes(originalSize)})</h4>
                            <img src={originalImage} className="max-w-full max-h-96 object-contain mt-4" />
                        </div>
                        <div className="flex flex-col items-center p-4 bg-slate-900 rounded-lg">
                            <h4 className="font-bold">Optimized {optimizedSize > 0 && `(~${formatBytes(optimizedSize)})`}</h4>
                            {optimizedImage ? (
                                <>
                                <img src={optimizedImage} className="max-w-full max-h-96 object-contain mt-4" />
                                <a href={optimizedImage} download="optimized-image.jpg" className="mt-4 px-4 py-2 bg-green-500 text-white font-bold rounded-md">Download</a>
                                </>
                            ) : (<div className="flex-grow flex items-center justify-center text-slate-500">Click Optimize</div>)}
                        </div>
                    </div>
                 </div>
            )}
        </div>
    );
};