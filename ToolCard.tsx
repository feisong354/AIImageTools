/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface ToolCardProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    onClick: () => void;
}

export const ToolCard: React.FC<ToolCardProps> = ({ icon, title, description, onClick }) => {
    
    const handleKeyPress = (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key === 'Enter' || event.key === ' ') {
            onClick();
        }
    };

    return (
        <div 
            className="tool-card" 
            onClick={onClick} 
            onKeyPress={handleKeyPress}
            role="button" 
            tabIndex={0}
            aria-label={`Select tool: ${title}`}
        >
            <div className="tool-header">
                <div className="tool-icon">{icon}</div>
                <h2 className="tool-title">{title}</h2>
            </div>
            <p className="tool-description">{description}</p>
        </div>
    );
};
