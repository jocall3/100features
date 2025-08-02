import React, { useState, useEffect } from 'react';
import { EyeIcon } from '../icons/FeatureIcons.tsx';

const popularFonts = [
    'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Oswald', 'Source Sans Pro', 'Raleway', 'Poppins', 'Nunito', 'Merriweather'
];

export const FontPairingTool: React.FC = () => {
    const [headingFont, setHeadingFont] = useState('Oswald');
    const [bodyFont, setBodyFont] = useState('Roboto');

    useEffect(() => {
        const fontsToLoad = [headingFont, bodyFont].filter(f => f).join('|');
        if (fontsToLoad) {
            const link = document.createElement('link');
            link.href = `https://fonts.googleapis.com/css?family=${fontsToLoad.replace(/ /g, '+')}:400,700&display=swap`;
            link.rel = 'stylesheet';
            document.head.appendChild(link);
            return () => {
                document.head.removeChild(link);
            };
        }
    }, [headingFont, bodyFont]);
    
    const FontSelector: React.FC<{ label: string, value: string, onChange: (font: string) => void }> = ({ label, value, onChange }) => (
        <div>
            <label className="block text-sm font-medium text-slate-400">{label}</label>
            <select value={value} onChange={e => onChange(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-md bg-slate-800 border border-slate-700">
                {popularFonts.map(font => <option key={font} value={font}>{font}</option>)}
            </select>
        </div>
    );

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8">
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-slate-100 flex items-center">
                    <EyeIcon />
                    <span className="ml-3">Font Pairing Tool</span>
                </h1>
                <p className="text-slate-400 mt-1">Preview Google Font combinations for your projects.</p>
            </header>
            <div className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
                <div className="lg:col-span-1 flex flex-col gap-4 bg-slate-800/50 p-6 rounded-lg">
                    <h3 className="text-xl font-bold">Controls</h3>
                    <FontSelector label="Heading Font" value={headingFont} onChange={setHeadingFont} />
                    <FontSelector label="Body Font" value={bodyFont} onChange={setBodyFont} />
                </div>
                <div className="lg:col-span-2 bg-slate-900 rounded-lg p-8 overflow-y-auto">
                    <h2 className="text-4xl font-bold mb-4" style={{ fontFamily: headingFont }}>
                        The Quick Brown Fox Jumps Over the Lazy Dog
                    </h2>
                    <p className="text-lg" style={{ fontFamily: bodyFont }}>
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus. Suspendisse lectus tortor, dignissim sit amet, adipiscing nec, ultricies sed, dolor. Cras elementum ultrices diam. Maecenas ligula massa, varius a, semper congue, euismod non, mi. Proin porttitor, orci nec nonummy molestie, enim est eleifend mi, non fermentum diam nisl sit amet erat.
                    </p>
                </div>
            </div>
        </div>
    );
};