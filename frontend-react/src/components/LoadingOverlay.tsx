import React from 'react';

const motivationalQuotes = [
    "The only way to do great work is to love what you do.",
    "Success is not final, failure is not fatal: it is the courage to continue that counts.",
    "Believe you can and you're halfway there.",
    "It always seems impossible until it's done.",
    "Don't watch the clock; do what it does. Keep going.",
    "The best way to predict the future is to create it.",
    "Learning is not attained by chance; it must be sought for with ardor and diligence.",
    "Education is the most powerful weapon which you can use to change the world.",
    "The mind is not a vessel to be filled, but a fire to be kindled."
];

interface LoadingOverlayProps {
    isLoading: boolean;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ isLoading }) => {
    const randomIndex = Math.floor(Math.random() * motivationalQuotes.length);
    const quote = motivationalQuotes[randomIndex];

    if (!isLoading) {
        return null;
    }

    return (
        <div id="loading-overlay" className="loading-overlay show">
            <div id="loading-spinner" className="loading-spinner"></div>
            <div id="loading-quote" className="loading-quote">{quote}</div>
        </div>
    );
};

export default LoadingOverlay; 