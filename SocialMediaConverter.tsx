/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback } from 'react';
import { GoogleGenAI, Modality } from "@google/genai";

type SocialPlatform = 'Xiaohongshu' | 'Instagram' | 'Facebook' | 'LinkedIn';
const SOCIAL_PLATFORMS: SocialPlatform[] = ['Xiaohongshu', 'Instagram', 'Facebook', 'LinkedIn'];
const SUPPORTED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const SocialMediaConverter: React.FC = () => {
    const [originalImage, setOriginalImage] = useState<File | null>(null);
    const [originalImageBase64, setOriginalImageBase64] = useState<string | null>(null);
    const [generatedImageBase64, setGeneratedImageBase64] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [platform, setPlatform] = useState<SocialPlatform>('Instagram');

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
        switch (platform) {
            case 'Xiaohongshu':
                return 'Recreate this image with a "Xiaohongshu" (Little Red Book) aesthetic. The style should be bright, clean, and visually pleasing with a soft, airy feel. Apply an aesthetic filter that enhances the colors to be slightly desaturated but warm. The overall mood should be aspirational, high-quality, and feel like a lifestyle blogger\'s post. If it makes sense, add a subtle, clean border.';
            case 'Instagram':
                return 'Transform this image to have a trendy and eye-catching "Instagram" style. Boost the vibrancy and contrast to make the colors pop. Sharpen the details for a high-quality look. The final image should be polished, engaging, and designed to stand out on a feed. Apply a modern, popular filter that gives it a professional but authentic look.';
            case 'Facebook':
                return 'Adapt this image for "Facebook". The style should be clean, natural, and well-lit. Enhance the colors to be warm and inviting, but avoid overly dramatic filters. The goal is an approachable, authentic image that looks clear and shareable for a general audience. The focus is on clarity and a friendly, community-oriented feel.';
            case 'LinkedIn':
                return 'Convert this image to a professional style suitable for "LinkedIn". The aesthetic must be clean, sharp, and polished. Use a more muted, corporate color palette (e.g., emphasizing blues and neutrals). If there is a person, ensure they look competent and trustworthy. The background should be clean and non-distracting. The overall tone must be professional and serious.';
        }
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
                <h1>Social Media Style Converter</h1>
                <p>Upload a photo, choose a platform, and let AI adapt it to the perfect style.</p>
            </header>
            
            {error && <div className="error-message" role="alert">{error}</div>}

            <div className="options-container">
                <div className="form-group">
                    <label>1. Select Target Platform</label>
                    <div className="style-selector" role="radiogroup">
                        {SOCIAL_PLATFORMS.map(p => (
                            <button 
                                key={p}
                                onClick={() => setPlatform(p)}
                                className={platform === p ? 'active' : ''}
                                role="radio"
                                aria-checked={platform === p}
                            >
                                {p}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="controls">
                <label htmlFor="social-media-upload" className="btn">
                    Upload Photo
                </label>
                <input id="social-media-upload" type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} />
                <button 
                    onClick={handleGenerateClick} 
                    className="btn" 
                    disabled={!originalImage || isLoading}
                    aria-label={isLoading ? "Converting, please wait" : "Convert Style"}
                >
                    {isLoading ? 'Converting...' : 'Convert Style'}
                </button>
                {generatedImageBase64 && (
                    <a 
                        href={`data:image/png;base64,${generatedImageBase64}`} 
                        download={`${platform.toLowerCase()}_style.png`} 
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
                    <h3>{platform} Style</h3>
                    {isLoading ? (
                        <div className="loading-spinner" aria-label="Processing image"></div>
                    ) : generatedImageBase64 ? (
                        <img src={`data:image/png;base64,${generatedImageBase64}`} alt={`AI generated image in ${platform} style`} />
                    ) : (
                         <p className="placeholder">Your converted image will appear here.</p>
                    )}
                </div>
            </section>
        </>
    );
};