import React, { useState, useEffect } from 'react';
import { UserAnswers, QuestionsData, UserAnswerDetail } from '../types';

interface ResultSectionProps {
    score: number;
    userAnswers: UserAnswers | null;
    questionsData: QuestionsData | null;
    onRetake: () => void;
    onGetImprovementSuggestions: () => void;
    onProceedToReadingTest: () => void;
    retakeAttempted: boolean;
    currentClass: number;
    improvementReport: { text: string; chapters: string[]; } | null;
}

const ResultSection: React.FC<ResultSectionProps> = ({
    score,
    userAnswers,
    questionsData,
    onRetake,
    onGetImprovementSuggestions,
    onProceedToReadingTest,
    retakeAttempted,
    currentClass,
    improvementReport,
}) => {
    const [showImprovementReport, setShowImprovementReport] = useState(false);

    useEffect(() => {
        if (improvementReport) {
            setShowImprovementReport(true);
        } else {
            setShowImprovementReport(false);
        }
    }, [improvementReport]);

    const calculateCorrectCount = () => {
        let correctCount = 0;
        if (userAnswers && questionsData) {
            for (const subject in userAnswers) {
                if (userAnswers.hasOwnProperty(subject) && questionsData.hasOwnProperty(subject)) {
                    userAnswers[subject].forEach((answerDetail: UserAnswerDetail) => {
                        const correspondingQuestion = questionsData[subject].find(q => q.question_text === answerDetail.question_text);
                        if (correspondingQuestion && answerDetail.user_chosen_answer === correspondingQuestion.answer) {
                            correctCount++;
                        }
                    });
                }
            }
        }
        return correctCount;
    };

    const totalQuestions = questionsData ? Object.values(questionsData).flat().length : 0;
    const currentScore = (totalQuestions > 0) ? (calculateCorrectCount() / totalQuestions) * 100 : 0;

    return (
        <div id="result-section" className="mt-8 p-6 bg-blue-50 rounded-xl shadow-md text-center">
            <h2 className="text-3xl font-bold text-blue-800 mb-4">Quiz Results</h2>
            <p id="score-display" className="text-2xl font-semibold text-gray-700 mb-6">{`You scored: ${currentScore.toFixed(2)}%`}</p>

            {currentScore < 40 && !retakeAttempted && currentClass >= 2 && (
                <button
                    onClick={onRetake}
                    className="w-full bg-yellow-600 text-white font-bold py-3 rounded-xl hover:bg-yellow-700 transition duration-300 ease-in-out transform hover:-translate-y-1 shadow-lg mb-6"
                >
                    {`Generate Questions for Class ${currentClass - 1}`}
                </button>
            )}

            {(currentScore >= 40 || (currentScore < 40 && (retakeAttempted || currentClass < 2))) && (
                <button
                    onClick={onGetImprovementSuggestions}
                    className="w-full bg-purple-600 text-white font-bold py-3 rounded-xl hover:bg-purple-700 transition duration-300 ease-in-out transform hover:-translate-y-1 shadow-lg mb-6"
                >
                    Get Improvement Suggestions
                </button>
            )}

            {showImprovementReport && improvementReport && (
                <div id="improvement-report-display" className="mt-6 p-4 bg-purple-100 border-l-4 border-purple-500 text-left rounded-lg">
                    <h3 className="text-xl font-bold text-purple-800 mb-3">Improvement Report:</h3>
                    <p id="improvement-report-text" className="text-gray-700 mb-4">{improvementReport.text}</p>
                    {improvementReport.chapters.length > 0 && (
                        <div id="improvement-chapters-container">
                            <ul className="improvement-chapters-list">
                                {improvementReport.chapters.filter(chapter => chapter).map((chapter, index) => (
                                    <li key={index}>{chapter}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}

            <div id="answer-review" className="mt-8 text-left">
                <h3 className="text-xl font-bold text-gray-700 mb-4 border-t-2 border-indigo-200 pt-4">Your Answers:</h3>
                {userAnswers && Object.keys(userAnswers).map(subject => (
                    <div key={subject}>
                        <h4 className="subject-review-header">{subject}</h4>
                        {userAnswers[subject].map((answerDetail, index) => (
                            <div key={index} className="answer-review-item">
                                <p><strong>Question {index + 1}:</strong> {answerDetail.question_text}</p>
                                <p>&nbsp;&nbsp;&nbsp;&nbsp;<strong>Your Answer:</strong> <span className={answerDetail.user_chosen_answer === answerDetail.correct_answer_text ? 'correct-answer-text' : 'incorrect-answer-text'}>
                                    {answerDetail.user_chosen_answer !== null ? answerDetail.user_chosen_answer : 'No answer selected'}
                                </span></p>
                                <p>&nbsp;&nbsp;&nbsp;&nbsp;<strong>Correct Answer:</strong> <span className="correct-answer-text">{answerDetail.correct_answer_text}</span></p>
                            </div>
                        ))}
                    </div>
                ))}
            </div>

            <div id="result-actions" className="space-y-4 mt-8">
                <button
                    onClick={onProceedToReadingTest}
                    className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition duration-300 ease-in-out transform hover:-translate-y-1 shadow-lg mt-4"
                >
                    Proceed to Reading Test
                </button>
            </div>
        </div>
    );
};

export default ResultSection;
