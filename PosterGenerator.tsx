/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback } from 'react';
import { GoogleGenAI, Modality } from "@google/genai";

const SUPPORTED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const PosterGenerator: React.FC = () => {
    const [industry, setIndustry] = useState<string>('Technology');
    const [elements, setElements] = useState<string>('A glowing brain, circuit patterns, people collaborating');
    const [slogan, setSlogan] = useState<string>('Innovate the Future');
    const [style, setStyle] = useState<string>('Modern and minimalist');
    
    const [logoImage, setLogoImage] = useState<File | null>(null);
    const [logoImageBase64, setLogoImageBase64] = useState<string | null>(null);

    const [generatedImages, setGeneratedImages] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [loadingMessage, setLoadingMessage] = useState<string>('');
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
    
    const handleLogoChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
        setError(null);
        const file = event.target.files?.[0];

        if (file) {
             if (!SUPPORTED_MIME_TYPES.includes(file.type)) {
                setError('Unsupported logo file type. Please upload a JPEG, PNG, or WEBP image.');
                setLogoImage(null);
                setLogoImageBase64(null);
                return;
            }
            setLogoImage(file);
            const base64 = await fileToBase64(file);
            setLogoImageBase64(base64);
        }
    }, []);

    const buildPrompt = (): string => {
        return `Create a high-impact commercial poster for the ${industry} industry.

**Critical Rules for Slogan Rendering (Absolute Priority):**
1.  **Language Identification:** Before any design work, you MUST first identify the specific language of the slogan provided: "${slogan}".
2.  **No Translation:** Under NO circumstances should you translate the slogan. It must be rendered in its original language.
3.  **High-Fidelity Character Rendering:** This is the most important rule. You must render the slogan onto the poster with perfect accuracy. For languages with complex characters, such as **Chinese, Japanese, or Korean**, it is absolutely critical that every character is rendered with its correct strokes, structure, and form. Do not substitute or misrepresent any character.
4.  **Aesthetic & Appropriate Typography:** Choose a font and layout for the slogan that is aesthetically pleasing and culturally appropriate for the identified language. For **Chinese characters**, consider a clean Heiti (sans-serif) or an elegant Songti (serif) style that harmonizes with the poster's overall design.

**Poster Design Brief:**
-   **Key Visual Elements:** The poster must prominently feature: ${elements}.
-   **Style:** The overall aesthetic should be: ${style}.
-   **Objective:** The poster must be visually compelling, professional, and suitable for a commercial advertising campaign. Do not include any other text besides the required slogan.`;
    };

    const addLogoToPoster = async (posterBase64: string, ai: GoogleGenAI): Promise<string> => {
        if (!logoImageBase64 || !logoImage) {
            return posterBase64;
        }

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: {
                parts: [
                    { inlineData: { data: posterBase64, mimeType: 'image/png' } },
                    { inlineData: { data: logoImageBase64, mimeType: logoImage.type } },
                    { text: "Take this poster (the first image) and seamlessly integrate this logo (the second image) into it. Place the logo in a natural, professional-looking position where it is visible but not obstructing key elements, such as a corner or an area with clear space. Ensure the logo's size is appropriate for the poster's design and it looks like it was part of the original design." }
                ]
            },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            }
        });

        const imagePart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
        if (imagePart?.inlineData) {
            return imagePart.inlineData.data;
        }
        // If logo addition fails for one image, return the original poster
        return posterBase64;
    };


    const handleGenerateClick = async () => {
        if (!industry || !elements || !slogan || !style) {
            setError('Please fill out all fields.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setGeneratedImages([]);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const prompt = buildPrompt();

            // Step 1: Generate Posters
            setLoadingMessage(logoImage ? 'Step 1/2: Generating posters...' : 'Generating posters...');
            const imageGenResponse = await ai.models.generateImages({
                model: 'imagen-4.0-generate-001',
                prompt: prompt,
                config: {
                    numberOfImages: 3,
                    outputMimeType: 'image/png',
                    aspectRatio: '3:4',
                },
            });

            if (!imageGenResponse.generatedImages || imageGenResponse.generatedImages.length === 0) {
                throw new Error('The model did not return any images. This might be due to a safety filter. Please try adjusting your prompt.');
            }
            
            let posters = imageGenResponse.generatedImages.map(img => img.image.imageBytes);

            // Step 2: Add Logo if provided
            if (logoImageBase64) {
                setLoadingMessage('Step 2/2: Adding your logo...');
                const logoAddPromises = posters.map(p => addLogoToPoster(p, ai));
                posters = await Promise.all(logoAddPromises);
            }

            setGeneratedImages(posters);

        } catch (err) {
            console.error(err);
            setError(`An error occurred: ${err instanceof Error ? err.message : String(err)}`);
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    };

    return (
        <div className="poster-generator">
            <header className="header">
                <h1>AI Poster Generator</h1>
                <p>Describe your needs, optionally add your logo, and our AI will generate three distinct commercial posters.</p>
            </header>
            
            {error && <div className="error-message" role="alert">{error}</div>}

            <div className="options-container">
                <div className="form-group">
                    <label htmlFor="industry">1. Industry</label>
                    <input id="industry" type="text" value={industry} onChange={(e) => setIndustry(e.target.value)} className="text-input" placeholder="e.g., Cafe, Tech Startup, Fitness"/>
                </div>
                 <div className="form-group">
                    <label htmlFor="elements">2. Key Visual Elements</label>
                    <textarea id="elements" value={elements} onChange={(e) => setElements(e.target.value)} className="text-input" placeholder="e.g., A coffee cup, steaming latte art, warm lighting"/>
                </div>
                <div className="form-group">
                    <label htmlFor="slogan">3. Slogan / Headline</label>
                    <input id="slogan" type="text" value={slogan} onChange={(e) => setSlogan(e.target.value)} className="text-input" placeholder="e.g., Your Daily Grind, Perfected"/>
                </div>
                 <div className="form-group">
                    <label htmlFor="style">4. Desired Style</label>
                    <input id="style" type="text" value={style} onChange={(e) => setStyle(e.target.value)} className="text-input" placeholder="e.g., Vintage, Modern minimalist, Bold and colorful"/>
                </div>
                <div className="form-group">
                    <label>5. Add Your Logo (Optional)</label>
                    <div className="logo-upload-container">
                        <label htmlFor="logo-upload" className="btn btn-secondary">
                            Upload Logo
                        </label>
                        <input id="logo-upload" type="file" accept="image/jpeg,image/png,image/webp" onChange={handleLogoChange} />
                        {logoImageBase64 && (
                            <img src={`data:${logoImage?.type};base64,${logoImageBase64}`} alt="Logo preview" className="logo-preview"/>
                        )}
                    </div>
                </div>
            </div>

            <div className="controls">
                <button 
                    onClick={handleGenerateClick} 
                    className="btn" 
                    disabled={isLoading}
                    aria-label={isLoading ? "Generating, please wait" : "Generate Posters"}
                >
                    {isLoading ? loadingMessage : 'Generate Posters'}
                </button>
            </div>

            <section className="image-previews" aria-live="polite">
                {isLoading && generatedImages.length === 0 ? (
                    <>
                        <div className="image-container"><div className="loading-spinner"></div><p>{loadingMessage}</p></div>
                        <div className="image-container"><div className="loading-spinner"></div><p>{loadingMessage}</p></div>
                        <div className="image-container"><div className="loading-spinner"></div><p>{loadingMessage}</p></div>
                    </>
                ) : generatedImages.length > 0 ? (
                    generatedImages.map((imageBase64, index) => (
                        <div className="image-container" key={index}>
                            <h3>Option {index + 1}</h3>
                            <img src={`data:image/png;base64,${imageBase64}`} alt={`AI generated poster option ${index + 1}`} />
                            <a 
                                href={`data:image/png;base64,${imageBase64}`} 
                                download={`poster_option_${index + 1}.png`} 
                                className="btn btn-secondary"
                                style={{marginTop: '1rem'}}
                            >
                                Download
                            </a>
                        </div>
                    ))
                ) : (
                    <div style={{gridColumn: '1 / -1', textAlign: 'center', padding: '2rem 0'}}>
                        <p className="placeholder">Your generated posters will appear here.</p>
                    </div>
                )}
            </section>
        </div>
    );
};