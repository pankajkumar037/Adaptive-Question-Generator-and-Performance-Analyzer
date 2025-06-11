import React, { useState, useEffect, useRef } from 'react';

interface ReadingSectionProps {
    onBackToResults: () => void;
    currentBoard: string;
    currentClass: number;
    showAppMessage: (text: string, type: 'success' | 'error' | 'info') => void;
    setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
    fetchReadingContent: (board: string, classNum: number, subject: string) => Promise<{ success: boolean; text_content?: string; message?: string; }>;
    analyzeReading: (audioBlob: Blob, originalText: string, subject: string) => Promise<{ success: boolean; results?: any; message?: string; }>;
}

const ReadingSection: React.FC<ReadingSectionProps> = ({
    onBackToResults,
    currentBoard,
    currentClass,
    showAppMessage,
    setIsLoading,
    fetchReadingContent,
    analyzeReading,
}) => {
    const [selectedLanguage, setSelectedLanguage] = useState<string>('');
    const [readingText, setReadingText] = useState<string>('');
    const [isRecording, setIsRecording] = useState<boolean>(false);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [recordingStatus, setRecordingStatus] = useState<string>('Idle');
    const [readingResults, setReadingResults] = useState<any>(null); // To be typed later

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    useEffect(() => {
        // Cleanup media recorder on unmount
        return () => {
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                mediaRecorderRef.current.stop();
            }
        };
    }, []);

    const handleGetReadingText = async () => {
        if (!selectedLanguage) {
            showAppMessage('Please select a language.', 'error');
            return;
        }
        setIsLoading(true);
        setReadingText('');
        setReadingResults(null);
        setAudioBlob(null);
        setIsRecording(false);
        setRecordingStatus('Fetching text...');

        try {
            const response = await fetchReadingContent(currentBoard, currentClass, selectedLanguage);
            if (response.success) {
                setReadingText(response.text_content || '');
                showAppMessage('Reading text loaded.', 'success');
            } else {
                showAppMessage(response.message || 'Failed to fetch reading content.', 'error');
            }
        } catch (error: any) {
            showAppMessage(error.message || 'Network error or server unavailable.', 'error');
        } finally {
            setIsLoading(false);
            setRecordingStatus('Ready to record.');
        }
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            audioChunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (event) => {
                audioChunksRef.current.push(event.data);
            };

            mediaRecorderRef.current.onstop = () => {
                const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' }); // Use webm for broader browser compatibility
                setAudioBlob(blob);
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);
            setRecordingStatus('Recording...');
            showAppMessage('Recording started.', 'info');
        } catch (err) {
            console.error('Error accessing microphone:', err);
            setRecordingStatus('Microphone access denied or error.');
            showAppMessage('Error accessing microphone. Please ensure it\'s connected and allowed.', 'error');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            setRecordingStatus('Stopped.');
            showAppMessage('Recording stopped.', 'info');
        }
    };

    const submitReading = async () => {
        if (!audioBlob || !readingText || !selectedLanguage) {
            showAppMessage('Missing audio, text, or language for submission.', 'error');
            return;
        }

        setIsLoading(true);
        setRecordingStatus('Submitting...');

        try {
            const response = await analyzeReading(audioBlob, readingText, selectedLanguage);
            if (response.success) {
                setReadingResults(response.results);
                showAppMessage('Reading analysis complete!', 'success');
            } else {
                showAppMessage(response.message || 'Failed to analyze reading.', 'error');
            }
        } catch (error: any) {
            showAppMessage(error.message || 'Network error or server unavailable.', 'error');
        } finally {
            setIsLoading(false);
            setRecordingStatus('Analysis Complete.');
        }
    };

    return (
        <div id="reading-section" className="mt-8 p-6 bg-purple-50 rounded-xl shadow-md text-center">
            <h2 className="text-3xl font-bold text-purple-800 mb-4">Reading Test</h2>

            <div className="mb-4">
                <label htmlFor="reading-subject-select" className="block text-gray-700 text-lg font-semibold mb-2">Select Language:</label>
                <select
                    id="reading-subject-select"
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-purple-500 focus:border-purple-500 transition duration-200"
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                >
                    <option value="" disabled>Choose Language</option>
                    <option value="English">English</option>
                    <option value="Hindi">Hindi</option>
                </select>
            </div>

            <button
                onClick={handleGetReadingText}
                className="w-full bg-purple-600 text-white font-bold py-3 rounded-xl hover:bg-purple-700 transition duration-300 ease-in-out transform hover:-translate-y-1 shadow-lg mb-6"
                disabled={!selectedLanguage}
            >
                Get Reading Text
            </button>

            <div id="reading-content" className="reading-content-display">
                <p className="text-gray-500">{readingText || "Reading passage will appear here..."}</p>
            </div>

            <div className="reading-controls">
                <button
                    onClick={startRecording}
                    className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-xl shadow-md"
                    disabled={!readingText || isRecording}
                >
                    Start Recording
                </button>
                <button
                    onClick={stopRecording}
                    className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-xl shadow-md"
                    disabled={!isRecording}
                >
                    Stop Recording
                </button>
                <button
                    onClick={submitReading}
                    className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-xl shadow-md"
                    disabled={!audioBlob || isRecording}
                >
                    Submit Reading
                </button>
                {isRecording && (
                    <div id="recording-status" className="flex items-center text-red-500 font-semibold ml-4">
                        <span className="recording-dot mr-2"></span>
                        <span>{recordingStatus}</span>
                    </div>
                )}
            </div>

            {readingResults && (
                <div id="reading-results-display" className="reading-results-display mt-4">
                    <h3>Reading Analysis Results:</h3>
                    <p><strong>Words Per Minute (WPM):</strong> {readingResults.wpm}</p>
                    <p><strong>Accuracy:</strong> {readingResults.accuracy}%</p>
                    <p><strong>Feedback:</strong> {readingResults.feedback}</p>
                    <p><strong>Transcription:</strong></p>
                    <p className="transcribed-text">{readingResults.transcription}</p>
                </div>
            )}
            
            <button
                onClick={onBackToResults}
                className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition duration-300 ease-in-out transform hover:-translate-y-1 shadow-lg mt-8"
            >
                Back to Quiz Results
            </button>
        </div>
    );
};

export default ReadingSection; 