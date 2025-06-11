import React, { useState, useEffect } from 'react';
import Auth from './components/Auth';
import InputSection from './components/InputSection';
import LoadingOverlay from './components/LoadingOverlay';
import MessageBox from './components/MessageBox';
import QuestionSection from './components/QuestionSection';
import ResultSection from './components/ResultSection';
import ReadingSection from './components/ReadingSection';
import { loginUser, registerUser, fetchQuestions, fetchImprovementTopics, fetchReadingContent, analyzeReading, getAuthToken, removeAuthToken } from './utils/api';
import { QuestionsData, UserAnswers, UserAnswerDetail } from './types';

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [studentName, setStudentName] = useState<string>('');
    const [selectedClass, setSelectedClass] = useState<string>('');
    const [board, setBoard] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' | 'info' } | null>(null);
    const [questionsData, setQuestionsData] = useState<QuestionsData | null>(null);
    const [currentUserAnswers, setCurrentUserAnswers] = useState<UserAnswers | null>(null);
    const [score, setScore] = useState<number>(0);
    const [retakeAttempted, setRetakeAttempted] = useState<boolean>(false);
    const [improvementReport, setImprovementReport] = useState<{ text: string, chapters: string[] } | null>(null);
    const [showReadingSection, setShowReadingSection] = useState<boolean>(false);
    const [readingText, setReadingText] = useState<string>('');
    const [selectedReadingSubject, setSelectedReadingSubject] = useState<string>('');
    const [readingResults, setReadingResults] = useState<any>(null); // To be typed later

    useEffect(() => {
        const token = getAuthToken();
        if (token) {
            setIsAuthenticated(true);
        } else {
            setIsAuthenticated(false);
        }
    }, []);

    const showAppMessage = (text: string, type: 'success' | 'error' | 'info') => {
        setMessage({ text, type });
    };

    const handleLogout = () => {
        removeAuthToken();
        setIsAuthenticated(false);
        setQuestionsData(null);
        setCurrentUserAnswers(null);
        setScore(0);
        setRetakeAttempted(false);
        setImprovementReport(null);
        setShowReadingSection(false); // Hide reading section on logout
        setReadingText(''); // Clear reading text
        setSelectedReadingSubject(''); // Clear selected reading subject
        setReadingResults(null); // Clear reading results
        showAppMessage('Logged out successfully.', 'info');
    };

    const handleLoginSuccess = (userData: any) => {
        setBoard(userData.Board);
        setSelectedClass(String(userData.Class));
        setStudentName(userData.username || ''); // Assuming username is also available in user data
    };

    const handleGenerateQuestions = async () => {
        if (!studentName || !selectedClass || !board) {
            showAppMessage('Please fill in your name, class, and board.', 'error');
            return;
        }
        setIsLoading(true);
        setQuestionsData(null); // Clear previous questions
        setCurrentUserAnswers(null); // Clear previous answers
        setScore(0);
        setImprovementReport(null);
        setShowReadingSection(false); // Hide reading section when generating new questions

        try {
            const subjects = ["Hindi", "English", "Math", "SST", "Science"]; // Assuming these are fixed subjects
            const response = await fetchQuestions(board, parseInt(selectedClass, 10), subjects);
            if (response.success) {
                setQuestionsData(response.questions);
                showAppMessage('Questions generated!', 'success');
            } else {
                showAppMessage(response.message || 'Failed to generate questions.', 'error');
            }
        } catch (error: any) {
            showAppMessage(error.message || 'Network error or server unavailable.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmitAnswers = (userAnswers: UserAnswers) => {
        setCurrentUserAnswers(userAnswers);

        let correctCount = 0;
        let totalQuestions = 0;

        if (questionsData) {
            for (const subject in userAnswers) {
                if (userAnswers.hasOwnProperty(subject) && questionsData.hasOwnProperty(subject)) {
                    userAnswers[subject].forEach((answerDetail: UserAnswerDetail) => {
                        totalQuestions++;
                        const correspondingQuestion = questionsData[subject].find(q => q.question_text === answerDetail.question_text);
                        if (correspondingQuestion && answerDetail.user_chosen_answer === correspondingQuestion.answer) {
                            correctCount++;
                        }
                    });
                }
            }
        }

        const calculatedScore = (totalQuestions > 0) ? (correctCount / totalQuestions) * 100 : 0;
        setScore(calculatedScore);
        showAppMessage('Answers submitted. Results calculated!', 'success');
    };

    const handleRetake = async () => {
        const currentClassNum = parseInt(selectedClass, 10);
        if (currentClassNum >= 2) {
            setRetakeAttempted(true);
            const newClass = String(currentClassNum - 1);
            setSelectedClass(newClass);
            showAppMessage(`Generating questions for Class ${newClass}...`, 'info');
            setQuestionsData(null);
            setCurrentUserAnswers(null);
            setScore(0);
            setImprovementReport(null);
            setIsLoading(true);
            try {
                const subjects = ["Hindi", "English", "Math", "SST", "Science"];
                const response = await fetchQuestions(board, parseInt(newClass, 10), subjects);
                if (response.success) {
                    setQuestionsData(response.questions);
                    showAppMessage('Questions generated for previous class!', 'success');
                } else {
                    showAppMessage(response.message || 'Failed to generate questions for previous class.', 'error');
                }
            } catch (error: any) {
                showAppMessage(error.message || 'Network error or server unavailable.', 'error');
            } finally {
                setIsLoading(false);
            }
        } else {
            showAppMessage('Cannot go back further (already at Class 1).', 'info');
        }
    };

    const handleGetImprovementSuggestions = async () => {
        if (!questionsData || !currentUserAnswers) {
            showAppMessage('No quiz data to generate improvement suggestions.', 'error');
            return;
        }
        setIsLoading(true);
        try {
            const response = await fetchImprovementTopics(questionsData, currentUserAnswers);
            if (response.success) {
                setImprovementReport(response.report);
                showAppMessage('Improvement suggestions generated.', 'success');
            } else {
                showAppMessage(response.message || 'Failed to generate improvement suggestions.', 'error');
            }
        } catch (error: any) {
            showAppMessage(error.message || 'Network error or server unavailable.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleProceedToReadingTest = () => {
        setShowReadingSection(true);
        showAppMessage('Proceeding to Reading Test.', 'info');
    };

    const handleBackToQuizResults = () => {
        setShowReadingSection(false);
        showAppMessage('Back to quiz results.', 'info');
    };

    return (
        <div className="container bg-white p-10 rounded-3xl shadow-xl w-full max-w-4xl mt-8">
            <h1 className="text-4xl font-extrabold text-center text-gray-800 mb-8">Test Question Generator</h1>

            {!isAuthenticated ? (
                <Auth setIsAuthenticated={setIsAuthenticated} onLoginSuccess={handleLoginSuccess} />
            ) : (
                <div id="app-content">
                    <div className="flex justify-end mb-4">
                        <button onClick={handleLogout} className="bg-red-500 text-white px-4 py-2 rounded-lg">Logout</button>
                    </div>

                    {!questionsData && !currentUserAnswers && !showReadingSection ? (
                        <InputSection
                            studentName={studentName}
                            setStudentName={setStudentName}
                            selectedClass={selectedClass}
                            setSelectedClass={setSelectedClass}
                            board={board}
                            setBoard={setBoard}
                            onGenerateQuestions={handleGenerateQuestions}
                        />
                    ) : questionsData && !currentUserAnswers && !showReadingSection ? (
                        <QuestionSection
                            questionsData={questionsData}
                            onSubmitAnswers={handleSubmitAnswers}
                        />
                    ) : showReadingSection ? (
                        <ReadingSection
                            onBackToResults={handleBackToQuizResults}
                            currentBoard={board}
                            currentClass={parseInt(selectedClass, 10) || 0}
                            showAppMessage={showAppMessage}
                            setIsLoading={setIsLoading}
                            fetchReadingContent={fetchReadingContent}
                            analyzeReading={analyzeReading}
                        />
                    ) : ( // questionsData and currentUserAnswers are available, show ResultSection
                        <ResultSection
                            score={score}
                            userAnswers={currentUserAnswers}
                            questionsData={questionsData}
                            onRetake={handleRetake}
                            onGetImprovementSuggestions={handleGetImprovementSuggestions}
                            onProceedToReadingTest={handleProceedToReadingTest}
                            retakeAttempted={retakeAttempted}
                            currentClass={parseInt(selectedClass, 10) || 0}
                            improvementReport={improvementReport}
                        />
                    )}

                    <LoadingOverlay isLoading={isLoading} />
                    <MessageBox message={message} setMessage={setMessage} />
                </div>
            )}
        </div>
    );
}

export default App; 