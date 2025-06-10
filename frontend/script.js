// Global variables to store application state
let questionsData = {}; // Stores all fetched questions, grouped by subject for the current attempt
let userAnswers = {};   // Stores user's selected answers for each question in the current attempt
let currentBoard = '';
let currentClass = 0;   // Store as a number for calculations
let currentSubjects = ["Hindi", "English", "Maths", "SST", "Science"]; // Fixed subjects
let score = 0;          // To store the last calculated score
let retakeAttempted = false; // Flag to track if a retake has occurred
let studentName = ''; // New variable for student name

// Reading Section Specific Variables
let mediaRecorder;
let audioChunks = [];
let audioBlob;
let currentReadingText = '';
let selectedReadingSubject = ''; // English or Hindi

// Get DOM elements for authentication
const authSection = document.getElementById('auth-section');
const authTitle = document.getElementById('auth-title');
const showLoginBtn = document.getElementById('show-login-btn');
const showRegisterBtn = document.getElementById('show-register-btn');
const loginForm = document.getElementById('login-form');
const loginUsernameInput = document.getElementById('login-username');
const loginPasswordInput = document.getElementById('login-password');
const registerForm = document.getElementById('register-form');
const registerUsernameInput = document.getElementById('register-username');
const registerPasswordInput = document.getElementById('register-password');
const registerEmailInput = document.getElementById('register-email');
const registerSchoolInput = document.getElementById('register-school');
const registerPhoneNumberInput = document.getElementById('register-phone-number');
const registerClassSelect = document.getElementById('register-class');
const registerBoardInput = document.getElementById('register-board');

const appContent = document.getElementById('app-content');
const logoutBtn = document.getElementById('logout-btn');

// Get DOM elements for main app
const inputSection = document.getElementById('input-section');
const studentNameInput = document.getElementById('student-name'); // This is still used for the quiz taker's name, not login username
const boardInput = document.getElementById('board');
const classSelect = document.getElementById('class');
const generateQuestionsBtn = document.getElementById('generate-questions-btn');

const loadingOverlay = document.getElementById('loading-overlay');
const loadingSpinner = document.getElementById('loading-spinner');
const loadingQuote = document.getElementById('loading-quote');

const questionSection = document.getElementById('question-section');
const questionsContainer = document.getElementById('questions-container');
const submitAnswersBtn = document.getElementById('submit-answers-btn');

const resultSection = document.getElementById('result-section');
const scoreDisplay = document.getElementById('score-display');
const retakeButton = document.getElementById('retake-button');
const improvementButton = document.getElementById('improvement-button');
const improvementReportDisplay = document.getElementById('improvement-report-display');
const improvementReportText = document.getElementById('improvement-report-text');
const improvementChaptersContainer = document.getElementById('improvement-chapters-container');
const answerReviewContainer = document.getElementById('answer-review');
const proceedToReadingTestBtn = document.getElementById('proceed-to-reading-test-btn');

const readingSection = document.getElementById('reading-section');
const readingSubjectSelect = document.getElementById('reading-subject-select');
const getReadingTextBtn = document.getElementById('get-reading-text-btn');
const readingContentDisplay = document.getElementById('reading-content');
const startRecordingBtn = document.getElementById('start-recording-btn');
const stopRecordingBtn = document.getElementById('stop-recording-btn');
const submitReadingBtn = document.getElementById('submit-reading-btn');
const readingResultsDisplay = document.getElementById('reading-results-display');
const recordingStatus = document.getElementById('recording-status');

const messageBox = document.getElementById('message-box');

// Fixed classes for dropdown
const availableClasses = Array.from({length: 10}, (_, i) => i + 1); // Generates [1, 2, ..., 10]

// Motivational quotes for the spinner
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

// --- Utility Functions ---

/** Fetches the JWT from localStorage. */
function getAuthToken() {
    return localStorage.getItem('accessToken');
}

/** Sets the JWT in localStorage. */
function setAuthToken(token) {
    localStorage.setItem('accessToken', token);
}

/** Removes the JWT from localStorage. */
function removeAuthToken() {
    localStorage.removeItem('accessToken');
}

/** Configures headers for authenticated requests. */
function getAuthHeaders() {
    const token = getAuthToken();
    if (token) {
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
    } else {
        return {
            'Content-Type': 'application/json'
        }; // Fallback for non-authenticated or initial requests
    }
}

/** Handles unauthorized responses. */
function handleUnauthorized() {
    removeAuthToken();
    showMessage('Session expired or unauthorized. Please log in again.', 'error');
    showAuthSection();
}

/** Shows the authentication section and hides the app content. */
function showAuthSection() {
    authSection.classList.remove('hidden');
    appContent.classList.add('hidden');
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
    authTitle.textContent = 'Login';
    showLoginBtn.classList.add('bg-indigo-500', 'text-white');
    showLoginBtn.classList.remove('bg-gray-200', 'text-gray-700');
    showRegisterBtn.classList.remove('bg-indigo-500', 'text-white');
    showRegisterBtn.classList.add('bg-gray-200', 'text-gray-700');
    // Clear form fields
    loginUsernameInput.value = '';
    loginPasswordInput.value = '';
    registerUsernameInput.value = '';
    registerPasswordInput.value = '';
    registerEmailInput.value = '';
    registerSchoolInput.value = ''; 
    registerPhoneNumberInput.value = ''; 
    registerClassSelect.value = ''; 
    registerBoardInput.value = '';
}

/** Shows the main application content and hides the authentication section. */
function showAppContent() {
    authSection.classList.add('hidden');
    appContent.classList.remove('hidden');
    populateClassDropdown();
}

/**
 * Populates the class dropdown with options from 1 to 10.
 */
function populateClassDropdown() {
    classSelect.innerHTML = '<option value="" disabled selected>Select Class</option>'; // Default disabled option
    availableClasses.forEach(cls => {
        const option = document.createElement('option');
        option.value = cls;
        option.textContent = cls;
        classSelect.appendChild(option);
    });
}

/**
 * Displays a temporary message box.
 * @param {string} message - The message to display.
 * @param {string} type = 'info' - Type of message ('success', 'error', 'info').
 */
function showMessage(message, type = 'info') {
    messageBox.textContent = message;
    messageBox.className = 'message-box show'; // Reset classes
    if (type === 'success') {
        messageBox.style.backgroundColor = '#10b981'; // Green
    } else if (type === 'error') {
        messageBox.style.backgroundColor = '#ef4444'; // Red
    } else {
        messageBox.style.backgroundColor = '#6366f1'; // Indigo (default)
    }

    setTimeout(() => {
        messageBox.classList.remove('show');
    }, 3000); // Message disappears after 3 seconds
}

/** Shows the loading spinner and overlay with a random quote. */
function showLoading() {
    const randomIndex = Math.floor(Math.random() * motivationalQuotes.length);
    loadingQuote.textContent = motivationalQuotes[randomIndex];
    loadingOverlay.classList.add('show');
}

/** Hides the loading spinner and overlay, and clears the quote. */
function hideLoading() {
    loadingOverlay.classList.remove('show');
    loadingQuote.textContent = ''; // Clear the quote
}

/** Resets the UI to the initial input state, clears previous quiz data. */
function resetUI() {
    inputSection.classList.remove('hidden');
    questionSection.classList.add('hidden');
    resultSection.classList.add('hidden');
    readingSection.classList.add('hidden'); // Hide reading section on reset
    improvementReportDisplay.classList.add('hidden');
    questionsContainer.innerHTML = ''; // Clear previous questions
    answerReviewContainer.innerHTML = ''; // Clear previous answer review
    improvementReportText.textContent = ''; // Clear previous report
    improvementChaptersContainer.innerHTML = ''; // Clear previous chapters
    userAnswers = {}; // Clear previous answers
    questionsData = {}; // Clear previous questions data
    score = 0; // Reset score
    retakeButton.classList.add('hidden');
    improvementButton.classList.add('hidden');
    proceedToReadingTestBtn.classList.add('hidden'); // Hide this button too
    retakeAttempted = false; // Reset retake flag
    // boardInput.value = ''; // No longer cleared here

    // Reset reading section specific elements
    readingSubjectSelect.value = '';
    readingContentDisplay.innerHTML = '<p class="text-gray-500">Reading passage will appear here...</p>';
    startRecordingBtn.disabled = true;
    stopRecordingBtn.disabled = true;
    submitReadingBtn.disabled = true;
    readingResultsDisplay.classList.add('hidden');
    readingResultsDisplay.innerHTML = '<h3>Reading Analysis Results:</h3>';
    recordingStatus.classList.add('hidden'); // Hide recording animation
    audioChunks = [];
    audioBlob = null;
    currentReadingText = '';
    selectedReadingSubject = '';
}

/** Resets only the application content UI, preserving login-related pre-filled fields. */
function resetAppContent() {
    questionSection.classList.add('hidden');
    resultSection.classList.add('hidden');
    readingSection.classList.add('hidden');
    improvementReportDisplay.classList.add('hidden');
    questionsContainer.innerHTML = '';
    answerReviewContainer.innerHTML = '';
    improvementReportText.textContent = '';
    improvementChaptersContainer.innerHTML = '';
    userAnswers = {};
    questionsData = {};
    score = 0;
    retakeButton.classList.add('hidden');
    improvementButton.classList.add('hidden');
    proceedToReadingTestBtn.classList.add('hidden');
    retakeAttempted = false;
    // boardInput.value = ''; // No longer cleared here

    // Reset reading section specific elements (as in resetUI)
    readingSubjectSelect.value = '';
    readingContentDisplay.innerHTML = '<p class="text-gray-500">Reading passage will appear here...</p>';
    startRecordingBtn.disabled = true;
    stopRecordingBtn.disabled = true;
    submitReadingBtn.disabled = true;
    readingResultsDisplay.classList.add('hidden');
    readingResultsDisplay.innerHTML = '<h3>Reading Analysis Results:</h3>';
    recordingStatus.classList.add('hidden');
    audioChunks = [];
    audioBlob = null;
    currentReadingText = '';
    selectedReadingSubject = '';
}

// --- API Calls (Modified for Authentication) ---

/**
 * Fetches questions from the backend API.
 * @param {string} board - The board name.
 * @param {number} classNum - The class number.
 * @param {string[]} subjects - An array of subject names.
 */
async function fetchQuestions(board, classNum, subjects) {
    showLoading();
    resetAppContent(); // Clear previous content

    try {
        const params = new URLSearchParams({
            board: board,
            class_name: String(classNum),
            subjects: subjects.join(',')
        }).toString();

        const apiUrl = `http://127.0.0.1:8000/generate_mcq?${params}`;

        const response = await fetch(apiUrl, {
            headers: getAuthHeaders() // Include JWT
        });

        if (response.status === 401) {
            handleUnauthorized();
            return; // Stop execution
        }

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        questionsData = data; 

        renderQuestions(questionsData);
        questionSection.classList.remove('hidden');
        showMessage('Questions generated successfully!', 'success');

    } catch (error) {
        console.error('Error fetching questions:', error);
        showMessage(`Failed to generate questions: ${error.message}`, 'error');
        resetUI(); 
    } finally {
        hideLoading();
    }
}

/**
 * Calls the backend API to get improvement topics.
 * @param {object} currentQuestionsData - The full questionsData object from the latest attempt.
 * @param {object} currentUserAnswers - The user's answers from the latest attempt.
 */
async function fetchImprovementTopics(currentQuestionsData, currentUserAnswers) {
    showLoading();
    improvementReportDisplay.classList.add('hidden');
    improvementReportText.textContent = '';
    improvementChaptersContainer.innerHTML = ''; 

    try {
        const apiUrl = `http://127.0.0.1:8000/improvement`;
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: getAuthHeaders(), // Include JWT
            body: JSON.stringify({
                questions: currentQuestionsData,
                user_answers: currentUserAnswers,
                class_at_call: currentClass,
                was_retake_attempt: retakeAttempted
            })
        });

        if (response.status === 401) {
            handleUnauthorized();
            return;
        }

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        if (data.Report) {
            improvementReportText.textContent = data.Report;
            improvementReportDisplay.classList.remove('hidden');

            if (data.Subjects && typeof data.Subjects === 'object') {
                for (const subjectKey in data.Subjects) {
                    if (data.Subjects.hasOwnProperty(subjectKey) && Array.isArray(data.Subjects[subjectKey])) {
                        if (data.Subjects[subjectKey].length > 0) {
                            const subjectHeader = document.createElement('h4');
                            subjectHeader.className = 'text-lg font-semibold text-purple-700 mt-3 mb-1';
                            subjectHeader.textContent = subjectKey;
                            improvementChaptersContainer.appendChild(subjectHeader);

                            const chapterList = document.createElement('ul');
                            chapterList.className = 'improvement-chapters-list';
                            data.Subjects[subjectKey].forEach(chapter => {
                                const listItem = document.createElement('li');
                                listItem.textContent = chapter;
                                chapterList.appendChild(listItem);
                            });
                            improvementChaptersContainer.appendChild(chapterList);
                        }
                    }
                }
            }
            showMessage('Improvement report received.', 'success');
        } else {
            showMessage('No specific improvement report provided at this time.', 'info');
        }

    } catch (error) {
        console.error('Error fetching improvement topics:', error);
        showMessage(`Failed to get improvement report: ${error.message}`, 'error');
    } finally {
        hideLoading();
    }
}

/**
 * Fetches reading content from the backend.
 * @param {string} subject - The subject for reading (English or Hindi).
 */
async function fetchReadingContent(subject) {
    showLoading();
    readingContentDisplay.innerHTML = '<p class="text-gray-500">Fetching reading passage...</p>';
    startRecordingBtn.disabled = true;
    stopRecordingBtn.disabled = true;
    submitReadingBtn.disabled = true;
    readingResultsDisplay.classList.add('hidden');
    readingResultsDisplay.innerHTML = '<h3>Reading Analysis Results:</h3>'; 

    try {
        const params = new URLSearchParams({
            board: currentBoard,
            class_name: String(currentClass),
            subject: subject
        }).toString();
        const apiUrl = `http://127.0.0.1:8000/generate_reading_content?${params}`;

        const response = await fetch(apiUrl, {
            headers: getAuthHeaders() // Include JWT
        });

        if (response.status === 401) {
            handleUnauthorized();
            return;
        }

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        currentReadingText = data.text_content;
        readingContentDisplay.innerHTML = `<p>${currentReadingText}</p>`;
        startRecordingBtn.disabled = false; 
        showMessage(`Reading passage for ${subject} loaded.`, 'success');

    } catch (error) {
        console.error('Error fetching reading content:', error);
        readingContentDisplay.innerHTML = `<p class="error-text">Failed to load reading passage: ${error.message}</p>`;
        showMessage(`Failed to load reading passage: ${error.message}`, 'error');
    } finally {
        hideLoading();
    }
}

/**
 * Starts recording audio from the microphone.
 */
async function startRecording() {
    audioChunks = []; 
    audioBlob = null; 
    readingResultsDisplay.classList.add('hidden'); 

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);

        mediaRecorder.ondataavailable = event => {
            audioChunks.push(event.data);
        };

        mediaRecorder.onstop = () => {
            audioBlob = new Blob(audioChunks, { type: 'audio/webm' }); 
            submitReadingBtn.disabled = false;
            showMessage('Recording stopped. Ready to submit.', 'info');
            stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        startRecordingBtn.disabled = true;
        stopRecordingBtn.disabled = false;
        submitReadingBtn.disabled = true;
        recordingStatus.classList.remove('hidden');
        showMessage('Recording started...', 'success');

    } catch (error) {
        console.error('Error accessing microphone:', error);
        showMessage(`Error accessing microphone: ${error.message}. Please allow microphone access.`, 'error');
        startRecordingBtn.disabled = false; 
    }
}

/**
 * Stops recording audio.
 */
function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
        startRecordingBtn.disabled = false;
        stopRecordingBtn.disabled = true;
        recordingStatus.classList.add('hidden'); 
    }
}

/**
 * Submits the recorded audio and original text to the backend for analysis.
 */
async function submitReading() {
    if (!audioBlob || !currentReadingText || !selectedReadingSubject) {
        showMessage('No recording or reading text available to submit.', 'error');
        return;
    }

    showLoading();
    readingResultsDisplay.classList.add('hidden'); 
    readingResultsDisplay.innerHTML = '<h3>Reading Analysis Results:</h3><p>Analyzing your reading...</p>'; 

    try {
        const formData = new FormData();
        formData.append('audio_file', audioBlob, 'recording.webm'); 
        formData.append('original_text', currentReadingText);
        formData.append('subject', selectedReadingSubject);

        const apiUrl = `http://127.0.0.1:8000/analyze_reading`; 

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Authorization': getAuthToken() ? `Bearer ${getAuthToken()}` : '' }, // Manually add Auth header for FormData
            body: formData,
        });

        if (response.status === 401) {
            handleUnauthorized();
            return;
        }

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        displayReadingResults(result); 

    } catch (error) {
        console.error('Error submitting reading for analysis:', error);
        readingResultsDisplay.classList.remove('hidden');
        readingResultsDisplay.innerHTML = `<h3 class="error-text">Error Analyzing Reading:</h3><p class="error-text">${error.message}</p>`;
        showMessage(`Failed to analyze reading: ${error.message}`, 'error');
    } finally {
        hideLoading();
        submitReadingBtn.disabled = true; 
    }
}

/**
 * Displays the reading analysis results.
 * @param {object} data - The analysis data from the backend with new keys.
 */
function displayReadingResults(data) {
    readingResultsDisplay.innerHTML = `
        <h3>Reading Analysis Results:</h3>
        <p><strong>Your Transcription:</strong></p>
        <div class="transcribed-text">${data.transcribed_text || 'N/A'}</div>
        <p class="mt-4"><strong>Words Per Minute (WPM):</strong> ${data.wpm || 'N/A'}</p>
        <p><strong>Accuracy:</strong> ${data.accuracy || 'N/A'}</p>
        <p><strong>Fluency Score (1-100):</strong> ${data.fluency || 'N/A'}</p>
        <p><strong>Recommendation for Improvement:</strong> ${data.recommendation || 'No specific recommendations.'}</p>
    `;
    readingResultsDisplay.classList.remove('hidden');
    showMessage('Reading analysis complete!', 'success');
}

// --- UI Rendering Functions ---

/**
 * Renders the fetched questions onto the page.
 * @param {object} data - The questions data object (e.g., { "Subject1": [...], "Subject2": [...] }).
 */
function renderQuestions(data) {
    questionsContainer.innerHTML = ''; 
    userAnswers = {}; 

    for (const subject in data) {
        if (data.hasOwnProperty(subject) && Array.isArray(data[subject])) {
            const subjectHeader = document.createElement('h3');
            subjectHeader.className = 'text-2xl font-bold text-gray-700 mt-6 mb-4 border-b-2 border-indigo-200 pb-2';
            subjectHeader.textContent = subject;
            questionsContainer.appendChild(subjectHeader);

            data[subject].forEach((q, qIndex) => {
                const questionBlock = document.createElement('div');
                questionBlock.className = 'question-block';
                questionBlock.dataset.subject = subject;
                questionBlock.dataset.questionIndex = qIndex;

                const questionText = document.createElement('p');
                questionText.className = 'text-lg font-semibold text-gray-800 mb-4';
                questionText.textContent = `${qIndex + 1}. ${q.question}`;
                questionBlock.appendChild(questionText);

                const optionsContainer = document.createElement('div');
                optionsContainer.className = 'space-y-3';

                q.options.forEach((option, optIndex) => {
                    const optionId = `q-${subject}-${qIndex}-opt-${optIndex}`;
                    const optionLabel = document.createElement('label');
                    optionLabel.className = 'option-label';
                    optionLabel.setAttribute('for', optionId); 
                    optionLabel.innerHTML = `
                        <input type="radio" id="${optionId}" name="question-${subject}-${qIndex}" value="${option}" class="mr-3">
                        ${option}
                    `;
                    optionsContainer.appendChild(optionLabel);
                });

                questionBlock.appendChild(optionsContainer);
                questionsContainer.appendChild(questionBlock);
            });
        }
    }
    inputSection.classList.remove('hidden'); // Keep input section visible for student name/board/class
    questionSection.classList.remove('hidden'); 
}

// --- Event Handlers (Modified for Authentication) ---

/** Handles user login. */
async function handleLogin(event) {
    event.preventDefault();
    showLoading();
    const loginIdentifier = loginUsernameInput.value.trim(); // Can be username, email, or phone
    const password = loginPasswordInput.value.trim();

    if (!loginIdentifier || !password) {
        showMessage('Please enter both login identifier (email/phone) and password.', 'error');
        hideLoading();
        return;
    }

    try {
        const response = await fetch('http://127.0.0.1:8000/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                login: loginIdentifier,
                password: password,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Login failed.');
        }

        const data = await response.json();
        setAuthToken(data.access_token);
        showMessage(`Welcome, ${data.username || 'user'}! Login successful!`, 'success');
        showAppContent();

        // Populate student name and class from login data
        if (data.username) {
            studentNameInput.value = data.username;
        }
        if (data.Class) { // 'Class' is the key from backend for class_name
            populateClassDropdown(); // Ensure options are populated first
            classSelect.value = String(data.Class); // Ensure it's a string for select value
        }
        if (data.Board) { // 'Board' is the key from backend for board
            boardInput.value = data.Board;
        }

        // Reset other UI elements, but keep pre-populated fields
        resetAppContent();
    } catch (error) {
        console.error('Login error:', error);
        showMessage(`Login failed: ${error.message}`, 'error');
    } finally {
        hideLoading();
    }
}

/** Handles user registration. */
async function handleRegister(event) {
    event.preventDefault();
    showLoading();
    const username = registerUsernameInput.value.trim();
    const password = registerPasswordInput.value.trim();
    const email = registerEmailInput.value.trim();
    const school = registerSchoolInput.value.trim();
    const phoneNumber = registerPhoneNumberInput.value.trim(); // JS variable name
    const userClass = registerClassSelect.value; // JS variable name
    const board = registerBoardInput.value.trim(); // New variable

    if (!username || !password || !email || !school || !phoneNumber || !userClass || !board) {
        showMessage('Please fill in all required registration fields.', 'error');
        hideLoading();
        return;
    }

    try {
        const response = await fetch('http://127.0.0.1:8000/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: username,
                password: password,
                email: email,
                school: school,
                phone_number: phoneNumber, // Match backend snake_case
                class_name: parseInt(userClass, 10), // Match backend snake_case and type
                board: board // Include board in the payload
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Registration failed.');
        }

        const data = await response.json();
        showMessage(`Registration successful for ${data.username}! You can now log in.`, 'success');
        showLoginSection(); // Switch back to login form
    } catch (error) {
        console.error('Registration error:', error);
        showMessage(`Registration failed: ${error.message}`, 'error');
    } finally {
        hideLoading();
    }
}

/** Handles user logout. */
function handleLogout() {
    removeAuthToken();
    resetUI(); // Clear app data and UI
    showAuthSection(); // Show login/register page
    showMessage('Logged out successfully.', 'info');
}

/** Shows the login form. */
function showLoginSection() {
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
    authTitle.textContent = 'Login';
    showLoginBtn.classList.add('bg-indigo-500', 'text-white');
    showLoginBtn.classList.remove('bg-gray-200', 'text-gray-700');
    showRegisterBtn.classList.remove('bg-indigo-500', 'text-white');
    showRegisterBtn.classList.add('bg-gray-200', 'text-gray-700');
}

/** Shows the registration form. */
function showRegisterSection() {
    registerForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
    authTitle.textContent = 'Register';
    showRegisterBtn.classList.add('bg-indigo-500', 'text-white');
    showRegisterBtn.classList.remove('bg-gray-200', 'text-gray-700');
    showLoginBtn.classList.remove('bg-indigo-500', 'text-white');
    showLoginBtn.classList.add('bg-gray-200', 'text-gray-700');
    populateRegisterClassDropdown(); // Populate dropdown when showing register form
}

/**
 * Populates the class dropdown for the registration form with options from 1 to 10.
 */
function populateRegisterClassDropdown() {
    registerClassSelect.innerHTML = '<option value="" disabled selected>Select Class</option>'; // Default disabled option
    availableClasses.forEach(cls => {
        const option = document.createElement('option');
        option.value = cls;
        option.textContent = cls;
        registerClassSelect.appendChild(option);
    });
}

/** Checks authentication status on page load. */
async function checkAuth() {
    const token = getAuthToken();
    if (token) {
        // Try to validate the token with a dummy request to a protected endpoint
        try {
            const response = await fetch('http://127.0.0.1:8000/health', { // Use a lightweight protected endpoint
                headers: getAuthHeaders()
            });

            if (response.status === 200) {
                showAppContent();
            } else {
                handleUnauthorized();
            }
        } catch (error) {
            console.error('Auth check error:', error);
            handleUnauthorized();
        }
    } else {
        showAuthSection();
    }
}

/** Handles the click event for the "Generate Questions" button. */
async function handleGenerateQuestions() {
    studentName = studentNameInput.value.trim(); 
    currentBoard = boardInput.value.trim();
    const classVal = classSelect.value;

    const numericClass = parseInt(classVal, 10);

    if (!studentName) {
        showMessage('Please enter your Name.', 'error');
        return;
    }
    if (!currentBoard) {
        showMessage('Please fill in Board Name.', 'error');
        return;
    }
    if (!classVal) { 
        showMessage('Please select a Class.', 'error');
        return;
    }
    if (isNaN(numericClass) || numericClass < 1 || numericClass > 10) {
        showMessage('Please select a valid Class number between 1 and 10.', 'error');
        return;
    }

    currentClass = numericClass; 
    retakeAttempted = false; 
    await fetchQuestions(currentBoard, currentClass, currentSubjects);
}

/** Handles the click event for the "Submit Answers" button. */
function handleSubmitAnswers() {
    let correctCount = 0;
    let totalQuestions = 0;
    userAnswers = {}; 

    for (const subject in questionsData) {
        if (questionsData.hasOwnProperty(subject) && Array.isArray(questionsData[subject])) {
            userAnswers[subject] = []; 

            questionsData[subject].forEach((q, qIndex) => {
                totalQuestions++;
                const selectedOptionInput = document.querySelector(`input[name="question-${subject}-${qIndex}"]:checked`);
                const userAnswer = selectedOptionInput ? selectedOptionInput.value : null;
                const correctAnswer = q.answer;

                userAnswers[subject].push({
                    question_text: q.question, 
                    user_chosen_answer: userAnswer,
                    correct_answer_text: correctAnswer
                });

                const questionBlock = questionsContainer.querySelector(`[data-subject="${subject}"][data-question-index="${qIndex}"]`);
                if (questionBlock) {
                    questionBlock.classList.remove('correct', 'incorrect');
                    const allOptionLabels = questionBlock.querySelectorAll('.option-label');
                    allOptionLabels.forEach(label => label.classList.remove('selected', 'correct-answer'));
                    const existingUserAnswerIndicators = questionBlock.querySelectorAll('.user-answer-indicator');
                    existingUserAnswerIndicators.forEach(indicator => indicator.remove());
                    const explanationDiv = questionBlock.querySelector('.explanation-text');
                    if (explanationDiv) explanationDiv.remove();

                    if (userAnswer === correctAnswer) {
                        correctCount++;
                        questionBlock.classList.add('correct');
                    } else {
                        questionBlock.classList.add('incorrect');
                    }

                    if (selectedOptionInput) {
                        selectedOptionInput.parentElement.classList.add('selected');
                        const span = document.createElement('span');
                        span.className = 'user-answer-indicator';
                        span.textContent = '(Your Answer)';
                        selectedOptionInput.parentElement.appendChild(span);
                    }

                    const correctOptionLabel = questionBlock.querySelector(`input[value="${correctAnswer}"]`);
                    if (correctOptionLabel) {
                        correctOptionLabel.parentElement.classList.add('correct-answer');
                        if (userAnswer !== correctAnswer || !selectedOptionInput) {
                            const span = document.createElement('span');
                            span.className = 'user-answer-indicator';
                            span.textContent = '(Correct Answer)';
                            correctOptionLabel.parentElement.appendChild(span);
                        }
                    }

                    if (q.Explanation) { 
                        const explanationText = document.createElement('div');
                        explanationText.className = 'explanation-text';
                        explanationText.textContent = `Explanation: ${q.Explanation}`;
                        questionBlock.appendChild(explanationText);
                    }
                }
            });
        }
    }

    score = (totalQuestions > 0) ? (correctCount / totalQuestions) * 100 : 0;
    displayResults(score);
    questionSection.classList.add('hidden'); 
}

/**
 * Displays the quiz results and conditional buttons.
 * @param {number} finalScore - The calculated percentage score.
 */
function displayResults(finalScore) {
    scoreDisplay.textContent = `You scored: ${finalScore.toFixed(2)}%`;
    resultSection.classList.remove('hidden');

    answerReviewContainer.innerHTML = `
        <h3 class="text-xl font-bold text-gray-700 mb-4 border-t-2 border-indigo-200 pt-4">Your Answers:</h3>
    `;

    let globalQuestionNumber = 0;
    for (const subject in userAnswers) {
        if (userAnswers.hasOwnProperty(subject) && Array.isArray(userAnswers[subject])) {
            const subjectHeader = document.createElement('h4');
            subjectHeader.className = 'subject-review-header';
            subjectHeader.textContent = subject;
            answerReviewContainer.appendChild(subjectHeader);

            userAnswers[subject].forEach(answerDetail => {
                globalQuestionNumber++;
                const reviewItem = document.createElement('div');
                reviewItem.className = 'answer-review-item';
                reviewItem.innerHTML = `
                    <p><strong>Question ${globalQuestionNumber}:</strong> ${answerDetail.question_text}</p>
                    <p>&nbsp;&nbsp;&nbsp;&nbsp;<strong>Your Answer:</strong> <span class="${answerDetail.user_chosen_answer === answerDetail.correct_answer_text ? 'correct-answer-text' : 'incorrect-answer-text'}">
                        ${answerDetail.user_chosen_answer !== null ? answerDetail.user_chosen_answer : 'No answer selected'}
                    </span></p>
                    <p>&nbsp;&nbsp;&nbsp;&nbsp;<strong>Correct Answer:</strong> <span class="correct-answer-text">${answerDetail.correct_answer_text}</span></p>
                `;
                answerReviewContainer.appendChild(reviewItem);
            });
        }
    }

    retakeButton.classList.add('hidden');
    improvementButton.classList.add('hidden'); 
    improvementReportDisplay.classList.add('hidden'); 
    improvementReportText.textContent = ''; 
    improvementChaptersContainer.innerHTML = ''; 
    proceedToReadingTestBtn.classList.remove('hidden'); 

    if (finalScore < 40) {
        if (!retakeAttempted && currentClass >= 2) {
            retakeButton.classList.remove('hidden');
            retakeButton.textContent = `Generate Questions for Class ${currentClass - 1}`;
            showMessage(`Score less than 40%. Option to retake for Class ${currentClass - 1}.`, 'info');
        } else {
            improvementButton.classList.remove('hidden'); 
            showMessage('Score less than 40%. Please focus on improvement areas.', 'info');
        }
    } else {
        improvementButton.classList.remove('hidden'); 
        showMessage('Congratulations! You scored 40% or more.', 'success');
    }
}

/** Handles the click event for the "Generate Questions for Previous Class" button. */
async function handleRetake() {
    if (currentClass >= 2) {
        retakeAttempted = true; 
        currentClass = currentClass - 1; 
        showMessage(`Generating questions for Class ${currentClass}...`, 'info');
        await fetchQuestions(currentBoard, currentClass, currentSubjects);
        resultSection.classList.add('hidden'); 
    } else {
        showMessage('Cannot go back further (already at Class 1).', 'info'); 
        improvementButton.classList.remove('hidden'); 
    }
}

/** Handles the click event for the "Get Improvement Topics" button. */
async function handleGetImprovementTopics() {
    await fetchImprovementTopics(questionsData, userAnswers);
}

/** Handles the click event for the "Proceed to Reading Test" button. */
function handleProceedToReadingTest() {
    resultSection.classList.add('hidden'); 
    readingSection.classList.remove('hidden'); 
    readingSubjectSelect.value = '';
    readingContentDisplay.innerHTML = '<p class="text-gray-500">Reading passage will appear here...</p>';
    startRecordingBtn.disabled = true;
    stopRecordingBtn.disabled = true;
    submitReadingBtn.disabled = true;
    readingResultsDisplay.classList.add('hidden');
    readingResultsDisplay.innerHTML = '<h3>Reading Analysis Results:</h3>';
    recordingStatus.classList.add('hidden'); 
    audioChunks = [];
    audioBlob = null;
    currentReadingText = '';
    selectedReadingSubject = '';
    showMessage('Select a language and get reading text to begin.', 'info');
}

/** Handles the change event for the reading subject dropdown. */
function handleReadingSubjectChange() {
    selectedReadingSubject = readingSubjectSelect.value;
    if (selectedReadingSubject) {
        getReadingTextBtn.disabled = false;
    } else {
        getReadingTextBtn.disabled = true;
    }
    readingContentDisplay.innerHTML = '<p class="text-gray-500">Reading passage will appear here...</p>';
    startRecordingBtn.disabled = true;
    stopRecordingBtn.disabled = true;
    submitReadingBtn.disabled = true;
    readingResultsDisplay.classList.add('hidden');
    readingResultsDisplay.innerHTML = '<h3>Reading Analysis Results:</h3>';
    recordingStatus.classList.add('hidden'); 
    audioChunks = [];
    audioBlob = null;
    currentReadingText = '';
}

// --- Initialize Application ---
function initializeApp() {
    // Authentication form listeners
    showLoginBtn.addEventListener('click', showLoginSection);
    showRegisterBtn.addEventListener('click', showRegisterSection);
    loginForm.addEventListener('submit', handleLogin);
    registerForm.addEventListener('submit', handleRegister);
    logoutBtn.addEventListener('click', handleLogout);

    generateQuestionsBtn.addEventListener('click', handleGenerateQuestions);
    submitAnswersBtn.addEventListener('click', handleSubmitAnswers);
    retakeButton.addEventListener('click', handleRetake);
    improvementButton.addEventListener('click', handleGetImprovementTopics);
    proceedToReadingTestBtn.addEventListener('click', handleProceedToReadingTest);

    // Reading section listeners
    readingSubjectSelect.addEventListener('change', handleReadingSubjectChange);
    getReadingTextBtn.addEventListener('click', () => fetchReadingContent(selectedReadingSubject));
    startRecordingBtn.addEventListener('click', startRecording);
    stopRecordingBtn.addEventListener('click', stopRecording);
    submitReadingBtn.addEventListener('click', submitReading);

    // Initial check for authentication status
    checkAuth();
}

// Run initialization when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', initializeApp); 