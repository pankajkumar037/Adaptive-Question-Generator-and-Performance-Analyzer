export interface QuestionOption {
    text: string;
    isCorrect: boolean;
}

export interface Question {
    question: string;
    options: string[]; // Options as strings
    answer: string; // Correct answer as a string
    Explanation?: string;
}

export interface QuestionsData {
    [subject: string]: Question[];
}

export interface UserAnswerDetail {
    question_text: string;
    user_chosen_answer: string | null;
    correct_answer_text: string;
}

export interface UserAnswers {
    [subject: string]: UserAnswerDetail[];
} 