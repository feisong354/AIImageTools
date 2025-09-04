/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback } from 'react';
import { GoogleGenAI, Modality } from "@google/genai";

type ClothingStyle = 'Sportswear' | 'Evening Gown' | 'Business Suit' | 'Casual Wear';
const CLOTHING_STYLES: ClothingStyle[] = ['Sportswear', 'Evening Gown', 'Business Suit', 'Casual Wear'];
const SUPPORTED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const OutfitChanger: React.FC = () => {
    const [originalImage, setOriginalImage] = useState<File | null>(null);
    const [originalImageBase64, setOriginalImageBase64] = useState<string | null>(null);
    const [generatedImageBase64, setGeneratedImageBase64] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [clothingStyle, setClothingStyle] = useState<ClothingStyle>('Casual Wear');
    const [clothingColor, setClothingColor] = useState<string>('blue');

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

    const buildPrompt = (): string => {
        let poseDescription = '';
        switch (clothingStyle) {
            case 'Sportswear':
                poseDescription = 'The pose should be active and dynamic, as if they are ready for movement.';
                break;
            case 'Evening Gown':
                poseDescription = 'The pose should be elegant, graceful, and formal, suitable for a black-tie event.';
                break;
            case 'Business Suit':
                poseDescription = 'The pose should be professional and confident, like a corporate headshot.';
                break;
            case 'Casual Wear':
                poseDescription = 'The pose should be relaxed, natural, and comfortable.';
                break;
        }
        return `Take the person in this image and change their outfit to a ${clothingColor} ${clothingStyle}. Also, adjust their pose to be more suitable for this new outfit. ${poseDescription} It is crucial to maintain the person's original facial features, expression, and identity. The background should remain similar to the original image but can be adjusted slightly for realism.`;
    };

    const handleGenerateClick = async () => {
        if (!originalImage || !originalImageBase64) {
            setError('Please upload an image first.');
            return;
        }
        if (!clothingColor.trim()) {
            setError('Please enter a color for the clothing.');
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
                <h1>AI Outfit & Pose Changer</h1>
                <p>Upload a photo, choose an outfit style and color, and let AI transform it.</p>
            </header>
            
            {error && <div className="error-message" role="alert">{error}</div>}

            <div className="options-container">
                <div className="form-group">
                    <label>1. Select Clothing Style</label>
                    <div className="style-selector" role="radiogroup">
                        {CLOTHING_STYLES.map(style => (
                            <button 
                                key={style}
                                onClick={() => setClothingStyle(style)}
                                className={clothingStyle === style ? 'active' : ''}
                                role="radio"
                                aria-checked={clothingStyle === style}
                            >
                                {style}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="form-group">
                    <label htmlFor="color-input">2. Enter Clothing Color</label>
                    <input 
                        id="color-input"
                        type="text"
                        value={clothingColor}
                        onChange={(e) => setClothingColor(e.target.value)}
                        className="color-input"
                        placeholder="e.g., 'red' or '#FF0000'"
                    />
                </div>
            </div>

            <div className="controls">
                <label htmlFor="outfit-changer-upload" className="btn">
                    Upload Photo
                </label>
                <input id="outfit-changer-upload" type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} />
                <button 
                    onClick={handleGenerateClick} 
                    className="btn" 
                    disabled={!originalImage || isLoading}
                    aria-label={isLoading ? "Generating, please wait" : "Generate New Outfit"}
                >
                    {isLoading ? 'Generating...' : 'Generate New Outfit'}
                </button>
                {generatedImageBase64 && (
                    <a 
                        href={`data:image/png;base64,${generatedImageBase64}`} 
                        download="outfit_change.png" 
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
                        <img src={`data:image/png;base64,${generatedImageBase64}`} alt="AI generated image with new outfit and pose" />
                    ) : (
                         <p className="placeholder">Your generated image will appear here.</p>
                    )}
                </div>
            </section>
        </>
    );
};