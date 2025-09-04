/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback } from 'react';
import { GoogleGenAI, Modality } from "@google/genai";

const SUPPORTED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const IDPhotoGenerator: React.FC = () => {
    // Image states
    const [originalImage, setOriginalImage] = useState<File | null>(null);
    const [originalImageBase64, setOriginalImageBase64] = useState<string | null>(null);
    const [backgroundImage, setBackgroundImage] = useState<File | null>(null);
    const [backgroundImageBase64, setBackgroundImageBase64] = useState<string | null>(null);
    const [broochImage, setBroochImage] = useState<File | null>(null);
    const [broochImageBase64, setBroochImageBase64] = useState<string | null>(null);
    
    // Attire states
    const [suitColor, setSuitColor] = useState<string>('black');
    const [shirtColor, setShirtColor] = useState<string>('white');
    const [hasTie, setHasTie] = useState<boolean>(true);
    const [tieColor, setTieColor] = useState<string>('deep blue');

    // App states
    const [generatedImageBase64, setGeneratedImageBase64] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

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

    const createHandleFileChange = (
        setImage: React.Dispatch<React.SetStateAction<File | null>>,
        setBase64: React.Dispatch<React.SetStateAction<string | null>>,
        fileType: string
    ) => useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
        setError(null);
        const file = event.target.files?.[0];

        if (file) {
            if (!SUPPORTED_MIME_TYPES.includes(file.type)) {
                setError(`Unsupported ${fileType} file type. Please upload a JPEG, PNG, or WEBP image.`);
                setImage(null);
                setBase64(null);
                return;
            }
            setImage(file);
            const base64 = await fileToBase64(file);
            setBase64(base64);
        }
    }, []);

    const handleFileChange = createHandleFileChange(setOriginalImage, setOriginalImageBase64, 'portrait');
    const handleBackgroundFileChange = createHandleFileChange(setBackgroundImage, setBackgroundImageBase64, 'background');
    const handleBroochFileChange = createHandleFileChange(setBroochImage, setBroochImageBase64, 'brooch');

    const handleGenerateClick = async () => {
        if (!originalImage || !originalImageBase64) {
            setError('Please upload a portrait photo first.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setGeneratedImageBase64(null);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            
            const parts: ({ text: string } | { inlineData: { mimeType: string; data: string } })[] = [{
                inlineData: {
                    data: originalImageBase64,
                    mimeType: originalImage.type,
                },
            }];

            let promptText = "Your task is to transform the person in the first image into a highly-detailed, professional ID photo based on the following precise instructions. CRITICAL: You must preserve the person's original facial features, hair, and expression exactly as they appear in the source portrait.\n\n";
            
            // Attire instructions
            promptText += `**Attire Customization:**\n`;
            promptText += `- The person must be dressed in a formal **${suitColor} suit jacket**.\n`;
            promptText += `- Underneath the jacket, they must wear a crisp **${shirtColor} shirt**.\n`;
            if (hasTie) {
                promptText += `- They must wear a **${tieColor} tie**, neatly knotted.\n`;
            } else {
                promptText += `- The shirt should be buttoned to the top, but **without a tie**.\n`;
            }

            // Background instructions
            promptText += `\n**Background Instructions:**\n`;
            if (backgroundImage && backgroundImageBase64) {
                parts.push({
                    inlineData: {
                        data: backgroundImageBase64,
                        mimeType: backgroundImage.type,
                    },
                });
                promptText += `- Extract the person from the first image and place them seamlessly onto the **second image**, which serves as the new background.\n`;
            } else {
                promptText += `- The background must be a solid, pure **white color** (#FFFFFF), suitable for an official ID photo.\n`;
            }
            
            // Brooch instructions
            if (broochImage && broochImageBase64) {
                parts.push({
                    inlineData: {
                        data: broochImageBase64,
                        mimeType: broochImage.type,
                    },
                });
                promptText += `\n**Accessory Instructions (Absolute Priority):**\n- Take the **third image (the brooch)** and add it to the person's suit.\n- **Placement:** The brooch MUST be placed on the **upper part of the suit jacket's lapel**. This is a non-negotiable placement.\n- **Sizing:** The brooch MUST be rendered as a **very small and delicate** accessory. It should be an elegant, subtle detail, not a large, distracting object. Its size should be proportional to the lapel.\n- **Realism:** Ensure the brooch's lighting, shadows, and angle perfectly match the suit jacket to make it look completely realistic and naturally pinned on.\n`;
            }

            promptText += "\nFinal result must be a high-resolution, professional, and realistic ID photograph."
            
            parts.push({ text: promptText });
            
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image-preview',
                contents: { parts },
                config: {
                    responseModalities: [Modality.IMAGE, Modality.TEXT],
                },
            });
            
            const imagePart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);

            if (imagePart?.inlineData) {
                setGeneratedImageBase64(imagePart.inlineData.data);
            } else {
                 setError('The model did not return an image. This might be due to a safety filter or an issue with the input. Please try a different photo.');
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
                <h1>AI Formal ID Photo Generator</h1>
                <p>Upload a portrait and use the advanced controls below to customize your professional ID picture.</p>
            </header>
            
            {error && <div className="error-message" role="alert">{error}</div>}

            <div className="id-photo-options">
                <div className="id-photo-uploads">
                    <h3 className="options-header">Image Uploads</h3>
                    <div className="form-group">
                        <label>1. Portrait (Required)</label>
                        <div className="logo-upload-container">
                            <label htmlFor="id-photo-upload" className="btn">
                                Select Portrait...
                            </label>
                            {originalImage && <span className="file-name">{originalImage.name}</span>}
                        </div>
                         <input id="id-photo-upload" type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} />
                    </div>
                    <div className="form-group">
                        <label>2. Background (Optional)</label>
                        <div className="logo-upload-container">
                             <label htmlFor="background-upload" className="btn btn-secondary">
                                Select Background...
                            </label>
                            {backgroundImage && <span className="file-name">{backgroundImage.name}</span>}
                        </div>
                        <p className="field-description">Default: White background</p>
                        <input id="background-upload" type="file" accept="image/jpeg,image/png,image/webp" onChange={handleBackgroundFileChange} />
                    </div>
                     <div className="form-group">
                        <label>3. Brooch (Optional)</label>
                        <div className="logo-upload-container">
                             <label htmlFor="brooch-upload" className="btn btn-secondary">
                                Select Brooch...
                            </label>
                            {broochImage && <span className="file-name">{broochImage.name}</span>}
                        </div>
                         <p className="field-description">Default: No brooch</p>
                        <input id="brooch-upload" type="file" accept="image/jpeg,image/png,image/webp" onChange={handleBroochFileChange} />
                    </div>
                </div>

                <div className="attire-options">
                    <h3 className="options-header">Formal Attire Customization</h3>
                    <div className="form-group">
                        <label htmlFor="suit-color">Suit Color</label>
                        <input id="suit-color" type="text" value={suitColor} onChange={e => setSuitColor(e.target.value)} className="text-input" />
                    </div>
                    <div className="form-group">
                        <label htmlFor="shirt-color">Shirt Color</label>
                        <input id="shirt-color" type="text" value={shirtColor} onChange={e => setShirtColor(e.target.value)} className="text-input" />
                    </div>
                    <div className="form-group">
                        <label>Include Tie? (Required)</label>
                        <div className="radio-group" role="radiogroup">
                            <button onClick={() => setHasTie(true)} className={hasTie ? 'active' : ''} role="radio" aria-checked={hasTie}>Yes</button>
                            <button onClick={() => setHasTie(false)} className={!hasTie ? 'active' : ''} role="radio" aria-checked={!hasTie}>No</button>
                        </div>
                    </div>
                    {hasTie && (
                        <div className="form-group">
                            <label htmlFor="tie-color">Tie Color</label>
                            <input id="tie-color" type="text" value={tieColor} onChange={e => setTieColor(e.target.value)} className="text-input" />
                        </div>
                    )}
                </div>
            </div>


            <div className="controls">
                <button 
                    onClick={handleGenerateClick} 
                    className="btn" 
                    disabled={!originalImage || isLoading}
                    aria-label={isLoading ? "Generating, please wait" : "Generate ID Photo"}
                >
                    {isLoading ? 'Generating...' : 'Generate ID Photo'}
                </button>
                {generatedImageBase64 && (
                    <a 
                        href={`data:image/png;base64,${generatedImageBase64}`} 
                        download="id_photo.png" 
                        className="btn btn-secondary"
                    >
                        Download Photo
                    </a>
                )}
            </div>

            <section className="image-previews" aria-live="polite">
                <div className="image-container">
                    <h3>Original</h3>
                    {originalImageBase64 ? (
                        <img src={`data:${originalImage?.type};base64,${originalImageBase64}`} alt="Original user upload" />
                    ) : (
                        <p className="placeholder">Upload an image to see it here.</p>
                    )}
                </div>
                <div className="image-container">
                    <h3>Generated</h3>
                    {isLoading ? (
                        <div className="loading-spinner" aria-label="Processing image"></div>
                    ) : generatedImageBase64 ? (
                        <img src={`data:image/png;base64,${generatedImageBase64}`} alt="AI generated formal ID photo" />
                    ) : (
                         <p className="placeholder">Your generated ID photo will appear here.</p>
                    )}
                </div>
            </section>
        </>
    );
};