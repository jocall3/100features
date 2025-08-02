
import React from 'react';
import { EyeIcon } from '../icons/FeatureIcons';

export const HtmlMetaPreview: React.FC = () => {
    const meta = {
        title: 'DevCore 100 - The Ultimate Developer Toolkit',
        description: 'An AI-powered web application designed to showcase 100 developer tool features, built with React and Gemini.',
        image: 'https://storage.googleapis.com/maker-suite-project-files-prod/M_EU_3dffc799_448e_4274_a3fc_0a95f87d2194',
        url: 'devcore.example.com'
    };
    
    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 items-center">
            <header className="mb-6 text-center">
                <h1 className="text-3xl font-bold text-slate-100 flex items-center">
                    <EyeIcon />
                    <span className="ml-3">HTML Meta Preview (Simulation)</span>
                </h1>
                <p className="text-slate-400 mt-1">A simulation of how a link appears when shared on social media.</p>
            </header>
            <div className="w-full max-w-lg bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
                <div className="bg-gray-700 aspect-video flex items-center justify-center">
                     <img src={meta.image} alt="Social share preview" className="object-cover w-full h-full" />
                </div>
                <div className="p-4">
                    <p className="text-sm text-gray-400 uppercase">{meta.url}</p>
                    <h2 className="text-lg font-bold text-white mt-1">{meta.title}</h2>
                    <p className="text-gray-300 mt-1">{meta.description}</p>
                </div>
            </div>
        </div>
    );
};
