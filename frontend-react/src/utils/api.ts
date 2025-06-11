export const getAuthToken = () => {
    return localStorage.getItem('accessToken');
};

export const setAuthToken = (token: string) => {
    localStorage.setItem('accessToken', token);
};

export const removeAuthToken = () => {
    localStorage.removeItem('accessToken');
};

export const getAuthHeaders = () => {
    const token = getAuthToken();
    const headers: Record<string, string> = {
        'Content-Type': 'application/json'
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
};

export const loginUser = async (login: string, password: string) => {
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ login, password }),
        });
        const data = await response.json();
        return { success: response.ok, message: data.message, token: data.accessToken, user: data };
    } catch (error) {
        console.error('Login error:', error);
        return { success: false, message: 'Network error or server unavailable.' };
    }
};

export const registerUser = async (userData: any) => {
    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData),
        });
        const data = await response.json();
        return { success: response.ok, message: data.message };
    } catch (error) {
        console.error('Registration error:', error);
        return { success: false, message: 'Network error or server unavailable.' };
    }
};

export const fetchQuestions = async (board: string, classNum: number, subjects: string[]) => {
    try {
        const params = new URLSearchParams({
            board: board,
            class_name: String(classNum),
            subjects: subjects.join(',')
        }).toString();
        const apiUrl = `/api/generate_mcq?${params}`;

        const response = await fetch(apiUrl, {
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Failed to fetch questions.');
        }

        const data = await response.json();
        return { success: true, questions: data };
    } catch (error: any) {
        console.error('Error fetching questions:', error);
        return { success: false, message: error.message || 'Network error or server unavailable.' };
    }
};

export const fetchImprovementTopics = async (questionsData: any, userAnswers: any) => {
    try {
        const apiUrl = '/api/generate_improvement_topics';
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ questions_data: questionsData, user_answers: userAnswers }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Failed to fetch improvement topics.');
        }

        const data = await response.json();
        return { success: true, report: data };
    } catch (error: any) {
        console.error('Error fetching improvement topics:', error);
        return { success: false, message: error.message || 'Network error or server unavailable.' };
    }
};

export const fetchReadingContent = async (board: string, classNum: number, subject: string) => {
    try {
        const params = new URLSearchParams({
            board: board,
            class_name: String(classNum),
            subject: subject
        }).toString();
        const apiUrl = `/api/generate_reading_content?${params}`;

        const response = await fetch(apiUrl, {
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Failed to fetch reading content.');
        }

        const data = await response.json();
        return { success: true, text_content: data.text_content };
    } catch (error: any) {
        console.error('Error fetching reading content:', error);
        return { success: false, message: error.message || 'Network error or server unavailable.' };
    }
};

export const analyzeReading = async (audioBlob: Blob, originalText: string, subject: string) => {
    try {
        const formData = new FormData();
        formData.append('audio_file', audioBlob, 'recording.webm');
        formData.append('original_text', originalText);
        formData.append('subject', subject);

        const apiUrl = '/api/analyze_reading';

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Authorization': getAuthToken() ? `Bearer ${getAuthToken()}` : '',
            },
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Failed to analyze reading.');
        }

        const data = await response.json();
        return { success: true, results: data };
    } catch (error: any) {
        console.error('Error submitting reading for analysis:', error);
        return { success: false, message: error.message || 'Network error or server unavailable.' };
    }
}; 