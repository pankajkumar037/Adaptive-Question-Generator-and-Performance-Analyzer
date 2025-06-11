import React, { useEffect } from 'react';

interface MessageBoxProps {
    message: { text: string, type: 'success' | 'error' | 'info' } | null;
    setMessage: (message: { text: string, type: 'success' | 'error' | 'info' } | null) => void;
}

const MessageBox: React.FC<MessageBoxProps> = ({ message, setMessage }) => {
    useEffect(() => {
        if (message) {
            const timer = setTimeout(() => {
                setMessage(null);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [message, setMessage]);

    if (!message) {
        return null;
    }

    const backgroundColor = message.type === 'success' 
        ? 'bg-green-500' 
        : message.type === 'error' 
        ? 'bg-red-500' 
        : 'bg-indigo-500';

    return (
        <div id="message-box" className={`message-box show ${backgroundColor}`}>
            {message.text}
        </div>
    );
};

export default MessageBox; 