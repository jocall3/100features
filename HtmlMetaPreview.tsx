// Copyright James Burvel Oâ€™Callaghan III
// President Citibank Demo Business Inc.

/**
 * @file HtmlMetaPreview.tsx
 * @description This file provides a comprehensive HTML Meta Tag Previewer component.
 * It allows users to input various meta information (title, description, image URL, canonical URL),
 * and instantly see how their content would appear when shared on different social media platforms
 * (simulated). It includes features like real-time validation, responsive design, accessibility
 * improvements, and a robust structure using React hooks and TypeScript.
 * This component is designed to be production-ready, maintainable, and scalable, adhering to
 * enterprise-grade React best practices.
 */

import React, { useState, useEffect, useCallback, useMemo, createContext, useContext } from 'react';
import { EyeIcon } from '../icons/FeatureIcons';

// --- Component: ErrorBoundary ---
// A generic ErrorBoundary component for robust error handling.
interface ErrorBoundaryProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
    errorInfo: React.ErrorInfo | null;
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

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        // You can also log the error to an error reporting service
        console.error("ErrorBoundary caught an error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    render() {
        if (this.state.hasError) {
            // You can render any custom fallback UI
            return this.props.fallback || (
                <div className="p-4 bg-red-800 text-white rounded-lg flex flex-col items-center justify-center min-h-[150px]">
                    <h2 className="text-xl font-bold mb-2">Something went wrong.</h2>
                    <p className="text-sm">Please try refreshing the page or contact support.</p>
                    {this.state.error && (
                        <details className="mt-4 text-xs bg-red-900 p-2 rounded-md">
                            <summary className="cursor-pointer">Error Details</summary>
                            <pre className="whitespace-pre-wrap break-all mt-2">
                                {this.state.error.toString()}
                                {this.state.errorInfo?.componentStack}
                            </pre>
                        </details>
                    )}
                </div>
            );
        }

        return this.props.children;
    }
}


// --- Types & Interfaces ---

/**
 * @interface MetaTags
 * @description Defines the structure for HTML meta tags relevant for social media previews.
 */
export interface MetaTags {
    title: string;
    description: string;
    image: string; // URL for the preview image
    url: string;   // Canonical URL
    ogType?: string; // e.g., 'website', 'article'
    siteName?: string;
    keywords?: string;
    author?: string;
}

/**
 * @enum PlatformType
 * @description Enumerates supported social media platforms for preview simulation.
 */
export enum PlatformType {
    GENERIC = 'Generic',
    FACEBOOK = 'Facebook',
    TWITTER = 'Twitter (X)',
    LINKEDIN = 'LinkedIn',
}

/**
 * @interface MetaErrors
 * @description Defines the structure for validation errors for MetaTags.
 */
export interface MetaErrors {
    title?: string;
    description?: string;
    image?: string;
    url?: string;
}

// --- Constants ---
const DEFAULT_META_TAGS: MetaTags = {
    title: 'DevCore 100 - The Ultimate Developer Toolkit',
    description: 'An AI-powered web application designed to showcase 100 developer tool features, built with React and Gemini.',
    image: 'https://storage.googleapis.com/maker-suite-project-files-prod/M_EU_3dffc799_448e_4274_a3fc_0a95f87d2194',
    url: 'https://devcore.example.com'
};

const URL_REGEX = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i;

// --- Custom Hook: useMetaPreview ---
/**
 * @function useMetaPreview
 * @description A custom hook for managing meta tag state, validation, and platform selection.
 * @param {MetaTags} initialMeta - Initial meta tags to populate the form.
 * @returns {object} Contains meta tags, errors, platform, and handlers for updates.
 */
export const useMetaPreview = (initialMeta: MetaTags = DEFAULT_META_TAGS) => {
    const [meta, setMeta] = useState<MetaTags>(initialMeta);
    const [errors, setErrors] = useState<MetaErrors>({});
    const [selectedPlatform, setSelectedPlatform] = useState<PlatformType>(PlatformType.GENERIC);
    const [isLoadingImage, setIsLoadingImage] = useState<boolean>(false);

    /**
     * @function validateMeta
     * @description Validates the current meta tag state and updates errors.
     * @param {MetaTags} currentMeta - The meta tags object to validate.
     * @returns {MetaErrors} An object containing validation error messages.
     */
    const validateMeta = useCallback((currentMeta: MetaTags): MetaErrors => {
        const newErrors: MetaErrors = {};
        if (!currentMeta.title || currentMeta.title.length < 5 || currentMeta.title.length > 70) {
            newErrors.title = 'Title must be between 5 and 70 characters.';
        }
        if (!currentMeta.description || currentMeta.description.length < 10 || currentMeta.description.length > 200) {
            newErrors.description = 'Description must be between 10 and 200 characters.';
        }
        if (!currentMeta.url || !URL_REGEX.test(currentMeta.url)) {
            newErrors.url = 'Please enter a valid URL (e.g., https://example.com).';
        }
        if (currentMeta.image && !URL_REGEX.test(currentMeta.image)) {
            newErrors.image = 'Please enter a valid image URL.';
        }
        return newErrors;
    }, []);

    useEffect(() => {
        setErrors(validateMeta(meta));
    }, [meta, validateMeta]);

    /**
     * @function handleInputChange
     * @description Handles changes in meta tag input fields.
     * @param {React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>} e - The change event.
     */
    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setMeta(prev => ({ ...prev, [name]: value }));
    }, []);

    /**
     * @function handlePlatformChange
     * @description Handles changes in the selected social media platform.
     * @param {PlatformType} platform - The new platform type.
     */
    const handlePlatformChange = useCallback((platform: PlatformType) => {
        setSelectedPlatform(platform);
    }, []);

    /**
     * @function handleImageLoadStart
     * @description Sets loading state when image starts loading.
     */
    const handleImageLoadStart = useCallback(() => {
        setIsLoadingImage(true);
    }, []);

    /**
     * @function handleImageLoadEnd
     * @description Clears loading state when image finishes loading (success or error).
     */
    const handleImageLoadEnd = useCallback(() => {
        setIsLoadingImage(false);
    }, []);

    return {
        meta,
        errors,
        selectedPlatform,
        isLoadingImage,
        handleInputChange,
        handlePlatformChange,
        handleImageLoadStart,
        handleImageLoadEnd,
        hasErrors: Object.keys(errors).length > 0,
    };
};

// --- Component: MetaInputForm ---
/**
 * @interface MetaInputFormProps
 * @description Props for the MetaInputForm component.
 */
interface MetaInputFormProps {
    meta: MetaTags;
    errors: MetaErrors;
    onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    isLoadingImage: boolean;
}

/**
 * @function MetaInputForm
 * @description A form component for editing HTML meta tags.
 * @param {MetaInputFormProps} props - The component props.
 * @returns {JSX.Element} The rendered form.
 */
export const MetaInputForm: React.FC<MetaInputFormProps> = React.memo(({ meta, errors, onInputChange, isLoadingImage }) => {
    return (
        <div className="bg-gray-900 p-6 rounded-lg shadow-xl border border-gray-700 w-full max-w-xl">
            <h2 className="text-xl font-semibold text-slate-100 mb-4">Edit Meta Tags</h2>
            <div className="space-y-4">
                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-1">Title (5-70 chars)</label>
                    <input
                        type="text"
                        id="title"
                        name="title"
                        value={meta.title}
                        onChange={onInputChange}
                        className={`w-full p-2 bg-gray-800 text-white rounded-md border ${errors.title ? 'border-red-500' : 'border-gray-700'} focus:ring-blue-500 focus:border-blue-500`}
                        maxLength={70}
                        aria-invalid={!!errors.title}
                        aria-describedby={errors.title ? 'title-error' : undefined}
                    />
                    {errors.title && <p id="title-error" className="mt-1 text-sm text-red-400">{errors.title}</p>}
                </div>
                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">Description (10-200 chars)</label>
                    <textarea
                        id="description"
                        name="description"
                        value={meta.description}
                        onChange={onInputChange}
                        rows={3}
                        className={`w-full p-2 bg-gray-800 text-white rounded-md border ${errors.description ? 'border-red-500' : 'border-gray-700'} focus:ring-blue-500 focus:border-blue-500`}
                        maxLength={200}
                        aria-invalid={!!errors.description}
                        aria-describedby={errors.description ? 'description-error' : undefined}
                    ></textarea>
                    {errors.description && <p id="description-error" className="mt-1 text-sm text-red-400">{errors.description}</p>}
                </div>
                <div>
                    <label htmlFor="image" className="block text-sm font-medium text-gray-300 mb-1">Image URL</label>
                    <input
                        type="url"
                        id="image"
                        name="image"
                        value={meta.image}
                        onChange={onInputChange}
                        className={`w-full p-2 bg-gray-800 text-white rounded-md border ${errors.image ? 'border-red-500' : 'border-gray-700'} focus:ring-blue-500 focus:border-blue-500`}
                        aria-invalid={!!errors.image}
                        aria-describedby={errors.image ? 'image-error' : undefined}
                    />
                    {errors.image && <p id="image-error" className="mt-1 text-sm text-red-400">{errors.image}</p>}
                    {isLoadingImage && <p className="mt-1 text-sm text-blue-400">Loading image...</p>}
                </div>
                <div>
                    <label htmlFor="url" className="block text-sm font-medium text-gray-300 mb-1">Canonical URL</label>
                    <input
                        type="url"
                        id="url"
                        name="url"
                        value={meta.url}
                        onChange={onInputChange}
                        className={`w-full p-2 bg-gray-800 text-white rounded-md border ${errors.url ? 'border-red-500' : 'border-gray-700'} focus:ring-blue-500 focus:border-blue-500`}
                        aria-invalid={!!errors.url}
                        aria-describedby={errors.url ? 'url-error' : undefined}
                    />
                    {errors.url && <p id="url-error" className="mt-1 text-sm text-red-400">{errors.url}</p>}
                </div>
                {/* Optional additional meta fields */}
                <div>
                    <label htmlFor="ogType" className="block text-sm font-medium text-gray-300 mb-1">OG Type (e.g., website, article)</label>
                    <input
                        type="text"
                        id="ogType"
                        name="ogType"
                        value={meta.ogType || ''}
                        onChange={onInputChange}
                        className="w-full p-2 bg-gray-800 text-white rounded-md border border-gray-700 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
                <div>
                    <label htmlFor="siteName" className="block text-sm font-medium text-gray-300 mb-1">Site Name</label>
                    <input
                        type="text"
                        id="siteName"
                        name="siteName"
                        value={meta.siteName || ''}
                        onChange={onInputChange}
                        className="w-full p-2 bg-gray-800 text-white rounded-md border border-gray-700 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
            </div>
        </div>
    );
});


// --- Component: SocialMediaPreviewCard ---
/**
 * @interface SocialMediaPreviewCardProps
 * @description Props for the SocialMediaPreviewCard component.
 */
interface SocialMediaPreviewCardProps {
    meta: MetaTags;
    platform: PlatformType;
    onImageLoadStart: () => void;
    onImageLoadEnd: () => void;
}

/**
 * @function SocialMediaPreviewCard
 * @description Renders a simulated social media preview card based on meta tags and platform.
 * @param {SocialMediaPreviewCardProps} props - The component props.
 * @returns {JSX.Element} The rendered preview card.
 */
export const SocialMediaPreviewCard: React.FC<SocialMediaPreviewCardProps> = React.memo(({ meta, platform, onImageLoadStart, onImageLoadEnd }) => {
    // Determine platform-specific styling
    let cardClasses = "w-full max-w-lg bg-gray-800 border rounded-xl overflow-hidden shadow-lg transition-all duration-200 ease-in-out";
    let titleClasses = "text-lg font-bold mt-1";
    let urlClasses = "text-sm uppercase";
    let descriptionClasses = "mt-1";
    let imageContainerClasses = "bg-gray-700 aspect-video flex items-center justify-center";

    // Simulate platform-specific nuances
    switch (platform) {
        case PlatformType.FACEBOOK:
            cardClasses += " border-blue-600";
            titleClasses += " text-blue-300";
            urlClasses += " text-blue-400";
            descriptionClasses += " text-blue-200";
            break;
        case PlatformType.TWITTER: // X
            cardClasses += " border-gray-600";
            titleClasses += " text-white";
            urlClasses += " text-gray-400";
            descriptionClasses += " text-gray-300";
            break;
        case PlatformType.LINKEDIN:
            cardClasses += " border-blue-700";
            titleClasses += " text-white";
            urlClasses += " text-blue-400";
            descriptionClasses += " text-gray-300";
            break;
        case PlatformType.GENERIC:
        default:
            cardClasses += " border-gray-700";
            titleClasses += " text-white";
            urlClasses += " text-gray-400";
            descriptionClasses += " text-gray-300";
            break;
    }

    const displayedUrl = useMemo(() => {
        try {
            const parsedUrl = new URL(meta.url);
            // Show hostname and path, omit protocol for cleaner display
            return (meta.siteName || parsedUrl.hostname + parsedUrl.pathname).replace(/\/$/, '');
        } catch {
            return meta.url; // Fallback for invalid URLs during input
        }
    }, [meta.url, meta.siteName]);


    return (
        <div className={cardClasses} aria-label={`${platform} social media preview`}>
            <div className={imageContainerClasses}>
                {meta.image ? (
                    <img
                        src={meta.image}
                        alt="Social share preview"
                        className="object-cover w-full h-full"
                        onLoad={onImageLoadEnd}
                        onError={onImageLoadEnd}
                        onLoadStart={onImageLoadStart}
                    />
                ) : (
                    <div className="text-gray-500">No Image Provided</div>
                )}
            </div>
            <div className="p-4">
                <p className={urlClasses}>{displayedUrl}</p>
                <h3 className={titleClasses}>{meta.title}</h3>
                <p className={descriptionClasses}>{meta.description}</p>
            </div>
        </div>
    );
});


// --- Component: HtmlMetaPreview ---
/**
 * @function HtmlMetaPreview
 * @description The main component for previewing HTML meta tags. It orchestrates the input form,
 * platform selection, and the social media preview card.
 * This component is designed to be highly interactive, responsive, and provide a clear
 * representation of how web content appears on social media.
 * @returns {JSX.Element} The complete meta tag preview application.
 */
export const HtmlMetaPreview: React.FC = () => {
    const {
        meta,
        errors,
        selectedPlatform,
        isLoadingImage,
        handleInputChange,
        handlePlatformChange,
        handleImageLoadStart,
        handleImageLoadEnd,
    } = useMetaPreview(DEFAULT_META_TAGS);

    return (
        <ErrorBoundary fallback={<div className="text-red-500 p-4">Failed to render Meta Preview.</div>}>
            <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 items-center bg-gray-950 text-slate-100">
                <header className="mb-8 text-center max-w-2xl">
                    <h1 className="text-4xl font-extrabold text-slate-50 flex items-center justify-center">
                        <EyeIcon className="w-9 h-9 mr-3 text-blue-400" />
                        <span>Advanced HTML Meta Previewer</span>
                    </h1>
                    <p className="text-slate-300 mt-2 text-lg">
                        Simulate how your web content appears when shared on various social media platforms.
                        Edit meta tags below and see the real-time preview.
                    </p>
                </header>

                <div className="flex flex-col lg:flex-row gap-8 w-full max-w-7xl items-start">
                    {/* Meta Input Form Section */}
                    <section className="flex-1 min-w-0">
                        <MetaInputForm
                            meta={meta}
                            errors={errors}
                            onInputChange={handleInputChange}
                            isLoadingImage={isLoadingImage}
                        />
                    </section>

                    {/* Preview Section */}
                    <section className="flex-1 min-w-0 lg:max-w-lg">
                        <h2 className="text-xl font-semibold text-slate-100 mb-4 text-center">Social Media Preview</h2>
                        <div className="flex justify-center mb-6 space-x-2">
                            {Object.values(PlatformType).map(platform => (
                                <button
                                    key={platform}
                                    onClick={() => handlePlatformChange(platform)}
                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200
                                                ${selectedPlatform === platform
                                                    ? 'bg-blue-600 text-white shadow-md'
                                                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
                                                }`}
                                    aria-pressed={selectedPlatform === platform}
                                >
                                    {platform}
                                </button>
                            ))}
                        </div>

                        <SocialMediaPreviewCard
                            meta={meta}
                            platform={selectedPlatform}
                            onImageLoadStart={handleImageLoadStart}
                            onImageLoadEnd={handleImageLoadEnd}
                        />
                    </section>
                </div>

                <footer className="mt-12 text-sm text-gray-500 text-center">
                    <p>Powered by DevCore 100 & React. Simulating common social media sharing behaviors.</p>
                </footer>
            </div>
        </ErrorBoundary>
    );
};