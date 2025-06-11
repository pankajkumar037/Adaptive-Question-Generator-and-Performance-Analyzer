import React, { useState } from 'react';
import { QuestionsData, UserAnswers, Question } from '../types';

interface QuestionSectionProps {
    questionsData: QuestionsData;
    onSubmitAnswers: (userAnswers: UserAnswers) => void;
}

const QuestionSection: React.FC<QuestionSectionProps> = ({
    questionsData,
    onSubmitAnswers,
}) => {
    const [selectedOptions, setSelectedOptions] = useState<{
        [subject: string]: { [questionIndex: number]: string };
    }>({});

    const handleOptionChange = (subject: string, questionIndex: number, value: string) => {
        setSelectedOptions(prev => ({
            ...prev,
            [subject]: {
                ...prev[subject],
                [questionIndex]: value,
            },
        }));
    };

    const handleSubmit = () => {
        const currentUserAnswers: UserAnswers = {};
        for (const subject in questionsData) {
            if (questionsData.hasOwnProperty(subject)) {
                currentUserAnswers[subject] = questionsData[subject].map((q, qIndex) => ({
                    question_text: q.question,
                    user_chosen_answer: selectedOptions[subject]?.[qIndex] || null,
                    correct_answer_text: q.answer,
                }));
            }
        }
        onSubmitAnswers(currentUserAnswers);
    };

    return (
        <div id="question-section" className="mt-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Generated Questions</h2>
            <div id="questions-container" className="space-y-6">
                {Object.keys(questionsData).map(subject => (
                    <div key={subject}>
                        <h3 className="text-2xl font-bold text-gray-700 mt-6 mb-4 border-b-2 border-indigo-200 pb-2">
                            {subject}
                        </h3>
                        {questionsData[subject].map((question, qIndex) => (
                            <div key={qIndex} className="question-block" data-subject={subject} data-question-index={qIndex}>
                                <p className="text-lg font-semibold text-gray-800 mb-4">{`${qIndex + 1}. ${question.question}`}</p>
                                <div className="space-y-3">
                                    {question.options.map((option, optIndex) => (
                                        <label key={optIndex} htmlFor={`q-${subject}-${qIndex}-opt-${optIndex}`} className="option-label">
                                            <input
                                                type="radio"
                                                id={`q-${subject}-${qIndex}-opt-${optIndex}`}
                                                name={`question-${subject}-${qIndex}`}
                                                value={option}
                                                checked={selectedOptions[subject]?.[qIndex] === option}
                                                onChange={() => handleOptionChange(subject, qIndex, option)}
                                                className="mr-3"
                                            />
                                            {option}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
            <button
                onClick={handleSubmit}
                className="w-full bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700 transition duration-300 ease-in-out transform hover:-translate-y-1 shadow-lg mt-8"
            >
                Submit Answers
            </button>
        </div>
    );
};

export default QuestionSection; 