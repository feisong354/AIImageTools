/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback } from 'react';
import { GoogleGenAI, Modality } from "@google/genai";

const ART_STYLES = [
    'Byzantine', 'Gothic', 'Renaissance', 'Baroque', 'Rococo', 'Neoclassicism',
    'Romanticism', 'Realism', 'Impressionism', 'Post-Impressionism', 'Fauvism',
    'Cubism', 'Expressionism', 'Surrealism', 'Abstract Expressionism', 'Pop Art',
    'Art Nouveau', 'Ukiyo-e', 'Street Art', 'Minimalism', 'Psychedelic', 'De Stijl', 'Futurism'
];
const SUPPORTED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const DoodleEnhancer: React.FC = () => {
    const [originalImage, setOriginalImage] = useState<File | null>(null);
    const [originalImageBase64, setOriginalImageBase64] = useState<string | null>(null);
    const [generatedImageBase64, setGeneratedImageBase64] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [artStyle, setArtStyle] = useState<string>('Pop Art');
    const [panelCount, setPanelCount] = useState<number>(3);

    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                const result = reader.result as string;
                resolve(result.split(',')[1]);
            };
            reader.onerror = (error) => reject(error);
        });
    };

    const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
        setError(null);
        setGeneratedImageBase64(null);
        const file = event.target.files?.[0];

        if (file) {
            if (!SUPPORTED_MIME_TYPES.includes(file.type)) {
                setError('Unsupported file type. Please upload a JPEG, PNG, or WEBP image.');
                setOriginalImage(null);
                setOriginalImageBase64(null);
                return;
            }
            setOriginalImage(file);
            const base64 = await fileToBase64(file);
            setOriginalImageBase64(base64);
        }
    }, []);

    const handlePanelCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = parseInt(e.target.value, 10);
        if (isNaN(value)) {
            value = 1;
        }
        if (value > 9) {
            value = 9;
        }
        if (value < 1) {
            value = 1;
        }
        setPanelCount(value);
    };

    const buildPrompt = (): string => {
        return `You are an expert storyteller and comic artist. Your task is to take this child's doodle and turn it into a multi-panel comic strip story.

**Instructions:**
1.  **First Panel:** The provided doodle is the very first panel of the story. It sets the scene and introduces the main character or subject.
2.  **Story Generation:** Based on the doodle, invent a creative, coherent, and imaginative story that unfolds over a total of **${panelCount}** panels. The plot should become more detailed and engaging as the number of panels increases. If the user requests many panels (e.g., 6-9), the story should have a clear beginning, middle, and end.
3.  **Art Style:** The entire comic strip, including all characters, backgrounds, and panel borders, must be rendered in the **${artStyle}** art style.
4.  **Final Output:** Your final output must be a **single image** that contains all ${panelCount} panels arranged in a logical grid format (e.g., left-to-right, top-to-bottom), telling the complete story from start to finish. Do not output separate images for each panel.`;
    };

    const handleGenerateClick = async () => {
        if (!originalImage || !originalImageBase64) {
            setError('Please upload a doodle first.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setGeneratedImageBase64(null);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const prompt = buildPrompt();
            
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image-preview',
                contents: {
                    parts: [
                        {
                            inlineData: {
                                data: originalImageBase64,
                                mimeType: originalImage.type,
                            },
                        },
                        { text: prompt },
                    ],
                },
                config: {
                    responseModalities: [Modality.IMAGE, Modality.TEXT],
                },
            });
            
            const imagePart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);

            if (imagePart?.inlineData) {
                setGeneratedImageBase64(imagePart.inlineData.data);
            } else {
                 setError('The model did not return an image. This might be due to a safety filter or an issue with the input. Please try a different doodle.');
            }

        } catch (err) {
            console.error(err);
            setError(`An error occurred while generating the image: ${err instanceof Error ? err.message : String(err)}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <header className="header">
                <h1>AI Doodle Storyteller</h1>
                <p>Turn a doodle into a comic strip. Upload a drawing, choose an art style, and select the number of panels.</p>
            </header>
            
            {error && <div className="error-message" role="alert">{error}</div>}

            <div className="options-container doodle-enhancer-options">
                <div className="form-group">
                    <label htmlFor="art-style-select">1. Select Art Style</label>
                    <select 
                        id="art-style-select" 
                        value={artStyle} 
                        onChange={(e) => setArtStyle(e.target.value)} 
                        className="filter-select"
                    >
                        {ART_STYLES.map(style => (
                            <option key={style} value={style}>{style}</option>
                        ))}
                    </select>
                </div>
                <div className="form-group">
                    <label htmlFor="panel-count">2. Number of Comic Panels (1-9)</label>
                    <input
                        type="number"
                        id="panel-count"
                        className="number-input"
                        value={panelCount}
                        onChange={handlePanelCountChange}
                        min="1"
                        max="9"
                    />
                </div>
            </div>

            <div className="controls">
                <label htmlFor="doodle-upload" className="btn">
                    Upload Doodle
                </label>
                <input id="doodle-upload" type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} />
                <button 
                    onClick={handleGenerateClick} 
                    className="btn" 
                    disabled={!originalImage || isLoading}
                    aria-label={isLoading ? "Generating story, please wait" : "Generate Story"}
                >
                    {isLoading ? 'Generating Story...' : 'Generate Story'}
                </button>
                {generatedImageBase64 && (
                    <a 
                        href={`data:image/png;base64,${generatedImageBase64}`} 
                        download={`doodle_story_in_${artStyle.toLowerCase()}.png`} 
                        className="btn btn-secondary"
                    >
                        Download Story
                    </a>
                )}
            </div>

            <section className="image-previews" aria-live="polite">
                <div className="image-container">
                    <h3>Original Doodle</h3>
                    {originalImageBase64 ? (
                        <img src={`data:${originalImage?.type};base64,${originalImageBase64}`} alt="Original user doodle" />
                    ) : (
                        <p className="placeholder">Upload a doodle to see it here.</p>
                    )}
                </div>
                <div className="image-container">
                    <h3>Generated Comic Strip</h3>
                    {isLoading ? (
                        <div className="loading-spinner" aria-label="Processing image"></div>
                    ) : generatedImageBase64 ? (
                        <img src={`data:image/png;base64,${generatedImageBase64}`} alt={`AI generated comic strip in ${artStyle} style`} />
                    ) : (
                         <p className="placeholder">Your generated comic strip will appear here.</p>
                    )}
                </div>
            </section>
        </>
    );
};