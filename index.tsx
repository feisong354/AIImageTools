/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { IDPhotoGenerator } from './IDPhotoGenerator.js';
import { OutfitChanger } from './OutfitChanger.js';
import { BeautyCamera } from './BeautyCamera.js';
import { PosterGenerator } from './PosterGenerator.js';
import { SocialMediaConverter } from './SocialMediaConverter.js';
import { DoodleEnhancer } from './DoodleEnhancer.js';
import { ToolCard } from './ToolCard.js';

// An icon for the ID Photo Generator tool
const CameraIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
        <circle cx="12" cy="13" r="3" />
    </svg>
);

// An icon for the Outfit Changer tool
const OutfitIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.38 3.46 16 2a4 4 0 0 0-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/>
    </svg>
);

// An icon for the Beauty Camera tool
const BeautyIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2 L14.5 9.5 L22 12 L14.5 14.5 L12 22 L9.5 14.5 L2 12 L9.5 9.5 Z"/>
        <path d="M20 5 L20.5 7 L22 7.5 L20.5 8 L20 10 L19.5 8 L18 7.5 L19.5 7 Z"/>
        <path d="M5 18 L4.5 16 L3 15.5 L4.5 15 L5 13 L5.5 15 L7 15.5 L5.5 16 Z"/>
    </svg>
);

// An icon for the Poster Generator tool
const PosterIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="12" y1="18" x2="12" y2="12"/>
        <line x1="9" y1="15" x2="15" y2="15"/>
    </svg>
);

// An icon for the Social Media Converter tool
const SocialIcon = () => (
     <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
        <circle cx="8.5" cy="8.5" r="1.5"/>
        <path d="M21 15l-5-5L5 21"/>
    </svg>
);

// An icon for the Doodle Enhancer tool
const DoodleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
        <path d="m15 5 4 4"/>
    </svg>
);


const App: React.FC = () => {
    const [selectedTool, setSelectedTool] = useState<string | null>(null);

    const renderTool = () => {
        switch (selectedTool) {
            case 'idPhoto':
                return <IDPhotoGenerator />;
            case 'outfitChanger':
                return <OutfitChanger />;
            case 'beautyCamera':
                return <BeautyCamera />;
            case 'posterGenerator':
                return <PosterGenerator />;
            case 'socialMediaConverter':
                return <SocialMediaConverter />;
            case 'doodleEnhancer':
                return <DoodleEnhancer />;
            default:
                return null;
        }
    };

    const handleBack = () => {
        setSelectedTool(null);
    }

    return (
        <div className="page-container">
            {selectedTool ? (
                <div className="tool-container">
                     <button onClick={handleBack} className="back-button">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>
                        Back to Tools
                    </button>
                    {renderTool()}
                </div>

            ) : (
                <>
                    <header className="header">
                        <h1>AI Tool Collection</h1>
                        <p>A collection of useful and fun AI-powered tools. Select a tool to get started.</p>
                    </header>
                    <main className="tool-grid">
                        <ToolCard 
                            icon={<CameraIcon />}
                            title="AI Formal ID Photo Generator"
                            description="Transform a casual portrait into a professional ID photo with formal attire."
                            onClick={() => setSelectedTool('idPhoto')}
                        />
                         <ToolCard 
                            icon={<OutfitIcon />}
                            title="AI Outfit & Pose Changer"
                            description="Change outfits and poses in your photos. Choose a style and color to see the magic."
                            onClick={() => setSelectedTool('outfitChanger')}
                        />
                        <ToolCard
                            icon={<BeautyIcon />}
                            title="AI Beauty Camera"
                            description="Retouch skin and enhance body shape for a perfect, natural-looking portrait."
                            onClick={() => setSelectedTool('beautyCamera')}
                        />
                         <ToolCard
                            icon={<PosterIcon />}
                            title="AI Poster Generator"
                            description="Create three unique commercial posters by providing a few simple details."
                            onClick={() => setSelectedTool('posterGenerator')}
                        />
                        <ToolCard
                            icon={<SocialIcon />}
                            title="Social Media Style Converter"
                            description="Adapt your images to the unique style of popular social media platforms."
                            onClick={() => setSelectedTool('socialMediaConverter')}
                        />
                        <ToolCard
                            icon={<DoodleIcon />}
                            title="AI Doodle Storyteller"
                            description="Turn a kid's doodle into a multi-panel comic strip story."
                            onClick={() => setSelectedTool('doodleEnhancer')}
                        />
                    </main>
                </>
            )}
        </div>
    );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);