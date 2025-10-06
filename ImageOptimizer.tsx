// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

// README:
// This is a production-ready, enterprise-grade React application for image optimization.
// It combines all necessary components and logic into a single 'app.tsx' file, adhering
// to best practices for maintainability, scalability, and performance.
//
// Features include:
// - **Core Image Optimization**: Resizing and JPEG quality compression.
// - **TypeScript**: Strong typing for all props, state, and functions.
// - **State Management**: Local component state using React hooks (`useState`, `useRef`, `useCallback`).
// - **Error Handling**: Robust error boundaries to catch UI rendering errors, and specific
//   error states for asynchronous operations (image upload/optimization).
// - **Loading States**: Visual feedback during image processing.
// - **Responsive Design**: Utilizes Tailwind CSS for a fluid layout across devices.
// - **Accessibility (A11y)**: Semantic HTML, ARIA attributes for live regions, and clear labels.
// - **Performance Optimization**: `React.memo` for preventing unnecessary re-renders, `useCallback`
//   for stable function references.
// - **SEO**: Basic SEO metadata using `react-helmet-async`.
// - **Modular Structure (within file)**: Organized with comments for clarity.
//
// To use this file:
// 1. Ensure `react`, `react-dom`, `react-helmet-async`, and `tailwind-css` (or similar utility CSS framework)
//    are installed in your project.
// 2. Place this file as `App.tsx` in your `src` directory.
// 3. Render the exported `App` component in your `index.tsx` (or equivalent entry file).
// 4. The `PhotoIcon` import assumes an icon library. Ensure `../icons/FeatureIcons.tsx` exists
//    and exports `PhotoIcon` or replace it with a standard icon library import.

import React, { useState, useRef, useCallback, memo, ErrorInfo } from 'react';
import { PhotoIcon } from '../icons/FeatureIcons.tsx'; // Keep existing import
import { HelmetProvider, Helmet } from 'react-helmet-async'; // New import for SEO

// --- Utility Functions ---

/**
 * Formats a number of bytes into a human-readable string (e.g., "1.23 MB").
 * @param bytes The number of bytes to format.
 * @returns A formatted string representing the file size.
 */
const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Interface for image optimization options.
 */
interface ImageOptimizationOptions {
    quality: number; // JPEG quality (0.1 to 1.0)
    maxWidth: number; // Maximum width for the optimized image
}

/**
 * Interface for an image processing result.
 */
interface ImageProcessingResult {
    originalDataUrl: string;
    originalSize: number;
    optimizedDataUrl: string | null;
    optimizedSize: number;
    filename: string;
}

// --- Component: ErrorBoundary ---
// A generic Error Boundary component for catching UI rendering errors.
interface ErrorBoundaryProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error, errorInfo: null };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        // You can also log the error to an error reporting service
        console.error("ErrorBoundary caught an error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    render() {
        if (this.state.hasError) {
            // You can render any custom fallback UI
            if (this.props.fallback) {
                return this.props.fallback;
            }
            return (
                <div className="p-8 text-center text-red-500 bg-red-900 bg-opacity-30 rounded-lg m-4">
                    <h2 className="text-xl font-bold mb-2">Something went wrong.</h2>
                    <p className="text-sm">Please try refreshing the page or contact support.</p>
                    {this.state.error && <p className="text-xs mt-2 font-mono">{this.state.error.toString()}</p>}
                    {/* {this.state.errorInfo && (
                        <details className="mt-4 text-xs text-red-300">
                            <summary>Error Details</summary>
                            <pre className="mt-2 text-left whitespace-pre-wrap">{this.state.errorInfo.componentStack}</pre>
                        </details>
                    )} */}
                </div>
            );
        }

        return this.props.children;
    }
}

// --- Component: LoadingSpinner ---
// A simple loading spinner component.
const LoadingSpinner: React.FC = () => (
    <div className="flex justify-center items-center py-4" role="status" aria-live="polite" aria-label="Loading">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
        <span className="ml-3 text-slate-400">Processing image...</span>
    </div>
);


// --- Component: ImageOptimizationFeature ---
// The core component for image upload and optimization.
export const ImageOptimizationFeature: React.FC = memo(() => {
    const [originalImage, setOriginalImage] = useState<string | null>(null);
    const [originalSize, setOriginalSize] = useState<number>(0);
    const [originalFileName, setOriginalFileName] = useState<string>('');
    const [optimizedImage, setOptimizedImage] = useState<string | null>(null);
    const [optimizedSize, setOptimizedSize] = useState<number>(0);
    const [quality, setQuality] = useState<number>(0.8);
    const [maxWidth, setMaxWidth] = useState<number>(1024);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    /**
     * Handles the image file selection and reads it into a data URL.
     * @param e The change event from the file input.
     */
    const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>): void => {
        setError(null);
        const file = e.target.files?.[0];
        if (!file) {
            setError("No file selected.");
            return;
        }

        if (!file.type.startsWith('image/')) {
            setError("Please upload an image file (e.g., JPG, PNG).");
            return;
        }

        setIsLoading(true);
        setOriginalSize(file.size);
        setOriginalFileName(file.name);
        const reader = new FileReader();

        reader.onload = (event) => {
            const result = event.target?.result as string;
            if (result) {
                setOriginalImage(result);
                setOptimizedImage(null);
                setOptimizedSize(0);
                setError(null);
            } else {
                setError("Failed to read image file.");
            }
            setIsLoading(false);
        };

        reader.onerror = () => {
            setError("Error reading the file. Please try again.");
            setIsLoading(false);
        };

        reader.readAsDataURL(file);
    }, []);
    
    /**
     * Optimizes the uploaded image based on current quality and max width settings.
     */
    const optimizeImage = useCallback(async (): Promise<void> => {
        if (!originalImage) {
            setError("No image to optimize. Please upload an image first.");
            return;
        }

        setError(null);
        setIsLoading(true);
        setOptimizedImage(null);
        setOptimizedSize(0);

        try {
            const img = new Image();
            img.src = originalImage;

            await new Promise<void>((resolve, reject) => {
                img.onload = () => resolve();
                img.onerror = () => reject(new Error("Failed to load image for optimization."));
            });

            const canvas = document.createElement('canvas');
            const aspectRatio = img.width / img.height;
            let newWidth = img.width;
            let newHeight = img.height;

            if (newWidth > maxWidth) {
                newWidth = maxWidth;
                newHeight = newWidth / aspectRatio;
            }

            // Also check if the resulting height is too large, maintain aspect ratio
            // (this scenario is less common with maxWidth, but good for robustness)
            if (newHeight > maxWidth * 2) { // Arbitrary max height to prevent extremely tall images
                newHeight = maxWidth * 2;
                newWidth = newHeight * aspectRatio;
            }
            
            canvas.width = newWidth;
            canvas.height = newHeight;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                throw new Error("Could not get 2D context from canvas.");
            }
            ctx.drawImage(img, 0, 0, newWidth, newHeight);

            // Using 'image/webp' or 'image/png' could also be options
            const dataUrl = canvas.toDataURL('image/jpeg', quality);
            setOptimizedImage(dataUrl);
            setOptimizedSize(dataUrl.length); // Approximation, not exact file size
            setError(null);
        } catch (err: any) {
            console.error("Image optimization error:", err);
            setError(`Optimization failed: ${err.message || "An unknown error occurred."}`);
            setOptimizedImage(null);
            setOptimizedSize(0);
        } finally {
            setIsLoading(false);
        }
    }, [originalImage, quality, maxWidth]);
    
    /**
     * Resets the image optimizer to its initial state, allowing a new image to be uploaded.
     */
    const resetOptimizer = useCallback((): void => {
        setOriginalImage(null);
        setOriginalSize(0);
        setOriginalFileName('');
        setOptimizedImage(null);
        setOptimizedSize(0);
        setQuality(0.8);
        setMaxWidth(1024);
        setIsLoading(false);
        setError(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = ''; // Clear file input
        }
    }, []);

    // Memoized component to render when no image is uploaded
    const NoImageUploadPrompt = memo(() => (
        <div className="flex-grow flex flex-col items-center justify-center p-4">
            <PhotoIcon className="w-24 h-24 text-slate-500 mb-6" />
            <h2 className="text-2xl font-semibold text-slate-200 mb-4">Ready to Optimize Your Images?</h2>
            <p className="text-slate-400 text-center mb-6 max-w-md">
                Upload an image to get started. We support common image formats like JPEG, PNG, and GIF.
            </p>
            <button
                onClick={() => fileInputRef.current?.click()}
                className="px-8 py-4 bg-cyan-500 text-slate-900 font-bold rounded-lg text-lg hover:bg-cyan-600 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-900"
                aria-label="Upload an image file"
            >
                Upload an Image
            </button>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/jpeg, image/png, image/webp, image/gif"
                className="hidden"
                aria-label="File uploader for images"
            />
        </div>
    ));

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8">
            <header className="mb-6 border-b border-slate-700 pb-4">
                <h1 className="text-3xl font-bold text-slate-100 flex items-center">
                    <PhotoIcon className="w-8 h-8 text-cyan-500" />
                    <span className="ml-3">Image Optimizer</span>
                </h1>
                <p className="text-slate-400 mt-1">
                    Efficiently resize and compress images directly in your browser.
                </p>
                <div aria-live="polite" className="sr-only">
                    {isLoading ? "Image is being processed." : ""}
                    {error ? `Error: ${error}` : ""}
                </div>
            </header>
            
            {error && (
                <div className="bg-red-900/30 text-red-300 p-3 rounded-md mb-4 flex items-center" role="alert">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{error}</span>
                </div>
            )}

            {isLoading && !error && <LoadingSpinner />}

            {!originalImage && !isLoading && <NoImageUploadPrompt />}

            {originalImage && !isLoading && (
                 <div className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
                    {/* Controls Panel */}
                    <div className="lg:col-span-1 flex flex-col gap-5 bg-slate-800/50 p-6 rounded-lg shadow-md">
                        <h3 className="text-xl font-bold text-slate-200 border-b border-slate-700 pb-3 mb-2">Optimization Settings</h3>
                        
                        <div>
                            <label htmlFor="maxWidth" className="block text-sm font-medium text-slate-400 mb-1">
                                Max Width <span className="font-semibold text-slate-200">({maxWidth}px)</span>
                            </label>
                            <input
                                id="maxWidth"
                                type="range"
                                min="128"
                                max="4096"
                                step="128"
                                value={maxWidth}
                                onChange={e => setMaxWidth(Number(e.target.value))}
                                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                aria-valuenow={maxWidth}
                                aria-valuemin={128}
                                aria-valuemax={4096}
                                aria-label={`Set maximum width for optimized image to ${maxWidth} pixels`}
                            />
                            <span className="text-xs text-slate-500">Larger widths increase file size.</span>
                        </div>
                        
                        <div>
                            <label htmlFor="quality" className="block text-sm font-medium text-slate-400 mb-1">
                                JPEG Quality <span className="font-semibold text-slate-200">({Math.round(quality*100)}%)</span>
                            </label>
                            <input
                                id="quality"
                                type="range"
                                min="0.1"
                                max="1"
                                step="0.05" // More granular steps
                                value={quality}
                                onChange={e => setQuality(Number(e.target.value))}
                                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                aria-valuenow={quality * 100}
                                aria-valuemin={10}
                                aria-valuemax={100}
                                aria-label={`Set JPEG quality to ${Math.round(quality*100)} percent`}
                            />
                            <span className="text-xs text-slate-500">Lower quality significantly reduces file size.</span>
                        </div>

                        <button
                            onClick={optimizeImage}
                            className="w-full mt-4 px-6 py-3 bg-cyan-500 text-slate-900 font-bold rounded-md hover:bg-cyan-600 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-900"
                            aria-label="Click to optimize the uploaded image"
                        >
                            Optimize Image
                        </button>
                        <button
                            onClick={resetOptimizer}
                            className="w-full mt-2 px-6 py-2 bg-slate-700 text-slate-200 font-bold rounded-md hover:bg-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-slate-900"
                            aria-label="Choose another image file"
                        >
                            Choose Another Image
                        </button>

                    </div>
                    
                    {/* Image Comparison Panel */}
                    <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 min-h-0">
                        {/* Original Image Card */}
                        <div className="flex flex-col items-center p-4 bg-slate-900 rounded-lg shadow-md overflow-hidden">
                            <h4 className="font-bold text-slate-200 mb-3">Original ({formatBytes(originalSize)})</h4>
                            <div className="relative w-full h-64 flex items-center justify-center bg-slate-800 rounded-md overflow-hidden">
                                {originalImage ? (
                                    <img
                                        src={originalImage}
                                        alt={`Original: ${originalFileName} (${formatBytes(originalSize)})`}
                                        className="max-w-full max-h-full object-contain"
                                        loading="lazy"
                                    />
                                ) : (
                                    <span className="text-slate-500">No original image selected.</span>
                                )}
                            </div>
                            <span className="text-sm text-slate-500 mt-2 truncate max-w-full" title={originalFileName}>{originalFileName}</span>
                        </div>

                        {/* Optimized Image Card */}
                        <div className="flex flex-col items-center p-4 bg-slate-900 rounded-lg shadow-md overflow-hidden">
                            <h4 className="font-bold text-slate-200 mb-3">Optimized {optimizedSize > 0 && `(~${formatBytes(optimizedSize)})`}</h4>
                            <div className="relative w-full h-64 flex items-center justify-center bg-slate-800 rounded-md overflow-hidden">
                                {optimizedImage ? (
                                    <img
                                        src={optimizedImage}
                                        alt={`Optimized: ${originalFileName} (~${formatBytes(optimizedSize)})`}
                                        className="max-w-full max-h-full object-contain"
                                        loading="lazy"
                                    />
                                ) : (
                                    <div className="flex-grow flex items-center justify-center text-slate-500">
                                        Click 'Optimize Image'
                                    </div>
                                )}
                            </div>
                            {optimizedImage && (
                                <a
                                    href={optimizedImage}
                                    download={`optimized-${originalFileName || 'image.jpg'}`}
                                    className="mt-4 px-4 py-2 bg-green-600 text-white font-bold rounded-md hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-slate-900"
                                    aria-label={`Download optimized image: ${originalFileName}`}
                                >
                                    Download Optimized
                                </a>
                            )}
                            {optimizedSize > 0 && originalSize > 0 && (
                                <p className="text-sm text-green-400 mt-2">
                                    Saved: {formatBytes(originalSize - optimizedSize)} (
                                    {((1 - (optimizedSize / originalSize)) * 100).toFixed(1)}%)
                                </p>
                            )}
                        </div>
                    </div>
                 </div>
            )}
        </div>
    );
});

// --- Root Component: App ---
// This is the main application component, acting as the entry point.
// It sets up global contexts, error boundaries, and integrates the core features.
export const App: React.FC = () => {
    return (
        <HelmetProvider>
            <ErrorBoundary fallback={<div className="p-8 text-center text-red-500">An unexpected application error occurred.</div>}>
                <Helmet>
                    <title>Image Optimizer - Enterprise Edition</title>
                    <meta name="description" content="Advanced online tool for resizing and compressing images (JPEG, PNG, WebP) with quality controls. Production-ready and efficient." />
                    <meta name="keywords" content="image optimizer, image compressor, resize image, optimize jpeg, optimize png, webp, free image optimizer, enterprise react app" />
                    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                    <meta charSet="utf-8" />
                    <link rel="icon" href="/favicon.ico" /> {/* Assumes a favicon is present */}
                </Helmet>
                <div className="min-h-screen bg-slate-900 text-slate-100 font-sans antialiased flex flex-col">
                    <ImageOptimizationFeature />
                </div>
            </ErrorBoundary>
        </HelmetProvider>
    );
};