/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback } from 'react';
import { GoogleGenAI, Modality } from "@google/genai";

const BEAUTY_LEVELS = ['Natural', 'Clear Skin', 'Makeup', 'Enhanced', 'Glamour', 'Subtle'];
const FILTERS = ['None', 'Fresh', 'Vintage', 'Black & White', 'Cinematic', 'Retro', 'Cool Tone'];
const SUPPORTED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const BeautyCamera: React.FC = () => {
    const [originalImage, setOriginalImage] = useState<File | null>(null);
    const [originalImageBase64, setOriginalImageBase64] = useState<string | null>(null);
    const [generatedImageBase64, setGeneratedImageBase64] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // State for advanced options
    const [beautyLevel, setBeautyLevel] = useState<string>('Natural');
    const [faceReshape, setFaceReshape] = useState<number>(15);
    const [bodySlimming, setBodySlimming] = useState<number>(20);
    const [chestEnhancement, setChestEnhancement] = useState<number>(10);
    const [legExtension, setLegExtension] = useState<number>(20);
    const [filter, setFilter] = useState<string>('None');

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
        let prompt = `Please perform a professional-grade beautification on the person or people in this portrait, following these specific instructions. It is critical that all changes appear natural and realistic, and that the person's core identity and facial features are preserved. Handle both single and multiple faces if present. Ensure the background remains completely free of distortion.

1.  **Skin Enhancement (Beauty Level: ${beautyLevel})**:
    *   **Goal**: Achieve a ${beautyLevel.toLowerCase()} look.
    *   **Action**: Smooth the skin to remove blemishes, acne, and oiliness, but you **must** preserve natural skin texture to avoid a "plastic" look.
    *   **Details**: Balance the skin tone, reduce the appearance of wrinkles and dark circles under the eyes, and remove fine facial hair for a clean finish.

2.  **Eye Enhancement**:
    *   **Action**: Make the eyes appear brighter and more vibrant. Remove any red-eye effect.
    *   **Makeup**: If applicable based on the beauty level, naturally enhance eye makeup, including eyeliner, eyeshadow, and eyebrows, ensuring it blends perfectly.

3.  **Face Reshaping (Intensity: ${faceReshape}%)**:
    *   **Action**: Subtly slim the face and refine the jawline by approximately ${faceReshape}%. The effect should be gentle and enhance the natural bone structure.
    *   **Nose**: Add subtle contouring (highlights and shadows) to the nose to give it a more defined and three-dimensional appearance.

4.  **Body & Leg Sculpting**:
    *   **Body**: Slim the waist and torso by approximately ${bodySlimming}%.
    *   **Chest**: Enhance the bust to be fuller by approximately ${chestEnhancement}%, ensuring the result is natural and proportional to the body frame.
    *   **Legs**: Elongate the legs by approximately ${legExtension}% to create a taller, more slender silhouette.
    *   **Constraint**: All body modifications must be proportional and realistic, without warping the background.

5.  **Virtual Makeup & Filter**:
    *   **Makeup**: Apply natural-looking virtual makeup, including lipstick, blush, and contouring that complements the person's skin tone. The opacity and color should be subtle and well-blended.
    *   **Filter**: Apply a '${filter}' photographic filter to the final image. If 'None' is selected, do not apply any filter.`;

        return prompt;
    };


    const handleGenerateClick = async () => {
        if (!originalImage || !originalImageBase64) {
            setError('Please upload an image first.');
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
                <h1>AI Beauty Camera</h1>
                <p>Upload a portrait and use the advanced controls below to create the perfect look.</p>
            </header>
            
            {error && <div className="error-message" role="alert">{error}</div>}

            <div className="beauty-options">
                 <div className="form-group">
                    <label>1. Beauty Level</label>
                    <div className="style-selector" role="radiogroup">
                        {BEAUTY_LEVELS.map(level => (
                            <button 
                                key={level}
                                onClick={() => setBeautyLevel(level)}
                                className={beautyLevel === level ? 'active' : ''}
                                role="radio"
                                aria-checked={beautyLevel === level}
                            >
                                {level}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="form-group slider-group">
                    <label htmlFor="face-reshape">2. Face Reshape: <strong>{faceReshape}%</strong></label>
                    <input 
                        type="range" 
                        id="face-reshape" 
                        min="0" max="50" 
                        value={faceReshape} 
                        onChange={(e) => setFaceReshape(Number(e.target.value))} 
                        aria-valuemin={0}
                        aria-valuemax={50}
                        aria-valuenow={faceReshape}
                    />
                </div>
                 <div className="form-group slider-group">
                    <label htmlFor="body-slimming">3. Body Slimming: <strong>{bodySlimming}%</strong></label>
                    <input 
                        type="range" 
                        id="body-slimming" 
                        min="0" max="50" 
                        value={bodySlimming} 
                        onChange={(e) => setBodySlimming(Number(e.target.value))} 
                        aria-valuemin={0}
                        aria-valuemax={50}
                        aria-valuenow={bodySlimming}
                    />
                </div>
                 <div className="form-group slider-group">
                    <label htmlFor="chest-enhancement">4. Chest Enhancement: <strong>{chestEnhancement}%</strong></label>
                    <input 
                        type="range" 
                        id="chest-enhancement" 
                        min="0" max="50" 
                        value={chestEnhancement} 
                        onChange={(e) => setChestEnhancement(Number(e.target.value))} 
                        aria-valuemin={0}
                        aria-valuemax={50}
                        aria-valuenow={chestEnhancement}
                    />
                </div>
                <div className="form-group slider-group">
                    <label htmlFor="leg-extension">5. Leg Extension: <strong>{legExtension}%</strong></label>
                    <input 
                        type="range" 
                        id="leg-extension" 
                        min="0" max="50" 
                        value={legExtension} 
                        onChange={(e) => setLegExtension(Number(e.target.value))} 
                        aria-valuemin={0}
                        aria-valuemax={50}
                        aria-valuenow={legExtension}
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="filter-select">6. Filter Style</label>
                    <select 
                        id="filter-select" 
                        value={filter} 
                        onChange={(e) => setFilter(e.target.value)} 
                        className="filter-select"
                    >
                        {FILTERS.map(f => (
                            <option key={f} value={f}>{f}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="controls">
                <label htmlFor="beauty-camera-upload" className="btn">
                    Upload Photo
                </label>
                <input id="beauty-camera-upload" type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} />
                <button 
                    onClick={handleGenerateClick} 
                    className="btn" 
                    disabled={!originalImage || isLoading}
                    aria-label={isLoading ? "Beautifying, please wait" : "Beautify Photo"}
                >
                    {isLoading ? 'Beautifying...' : 'Beautify Photo'}
                </button>
                {generatedImageBase64 && (
                    <a 
                        href={`data:image/png;base64,${generatedImageBase64}`} 
                        download="beautified_photo.png" 
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
                        <img src={`data:image/png;base64,${generatedImageBase64}`} alt="AI beautified portrait" />
                    ) : (
                         <p className="placeholder">Your beautified photo will appear here.</p>
                    )}
                </div>
            </section>
        </>
    );
};