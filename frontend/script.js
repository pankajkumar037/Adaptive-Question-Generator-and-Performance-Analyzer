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

// Get DOM elements
const inputSection = document.getElementById('input-section');
const studentNameInput = document.getElementById('student-name');
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

// --- Helper Functions ---

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
    classSelect.value = ''; // Reset class dropdown
    studentNameInput.value = ''; // Clear student name input
    boardInput.value = ''; // Clear board input

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

/** Clears the question and result sections (used when generating new questions). */
function clearQuestionAndResultSections() {
    questionSection.classList.add('hidden');
    resultSection.classList.add('hidden');
    readingSection.classList.add('hidden'); // Also hide reading section
    improvementReportDisplay.classList.add('hidden');
    questionsContainer.innerHTML = '';
    answerReviewContainer.innerHTML = ''; // Clear previous answer review
    improvementReportText.textContent = '';
    improvementChaptersContainer.innerHTML = ''; // Clear previous chapters
    retakeButton.classList.add('hidden');
    improvementButton.classList.add('hidden');
    proceedToReadingTestBtn.classList.add('hidden'); // Hide this button too
}

// --- API Calls ---

/**
 * Fetches questions from the backend API.
 * @param {string} board - The board name.
 * @param {number} classNum - The class number.
 * @param {string[]} subjects - An array of subject names.
 */
async function fetchQuestions(board, classNum, subjects) {
    showLoading();
    clearQuestionAndResultSections(); // Clear previous content

    try {
        // Construct query parameters
        const params = new URLSearchParams({
            board: board,
            class_name: String(classNum), // Ensure class_name is a string for the API
            subjects: subjects.join(',') // Send subjects as a comma-separated string
        }).toString();

        // Updated API URL to include the full server address
        const apiUrl = `http://127.0.0.1:8000/generate_mcq?${params}`;

        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        questionsData = data; // Store the fetched data globally for the current attempt

        renderQuestions(questionsData);
        questionSection.classList.remove('hidden');
        showMessage('Questions generated successfully!', 'success');

    } catch (error) {
        console.error('Error fetching questions:', error);
        showMessage(`Failed to generate questions: ${error.message}`, 'error');
        resetUI(); // Go back to input form on error
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
    improvementChaptersContainer.innerHTML = ''; // Clear previous chapters

    try {
        // Updated API URL to include the full server address
        const apiUrl = `http://127.0.0.1:8000/improvement`;
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                questions: currentQuestionsData, // Sending the latest questionsData
                user_answers: currentUserAnswers, // Sending the latest userAnswers
                // Add context for the backend
                class_at_call: currentClass, // The class at which this improvement call is made
                was_retake_attempt: retakeAttempted // True if this is after a retake quiz
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json(); // Now expecting a JSON object with 'Report' and 'Subjects'

        if (data.Report) {
            improvementReportText.textContent = data.Report;
            improvementReportDisplay.classList.remove('hidden'); // Show the report section

            // Check for and populate subject-wise chapters if 'Subjects' key exists
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
    readingResultsDisplay.innerHTML = '<h3>Reading Analysis Results:</h3>'; // Clear previous results

    try {
        const params = new URLSearchParams({
            board: currentBoard,
            class_name: String(currentClass),
            subject: subject
        }).toString();
        const apiUrl = `http://127.0.0.1:8000/generate_reading_content?${params}`;

        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        currentReadingText = data.text_content;
        readingContentDisplay.innerHTML = `<p>${currentReadingText}</p>`;
        startRecordingBtn.disabled = false; // Enable start recording button
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
    audioChunks = []; // Clear previous audio chunks
    audioBlob = null; // Clear previous audio blob
    readingResultsDisplay.classList.add('hidden'); // Hide previous results

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);

        mediaRecorder.ondataavailable = event => {
            audioChunks.push(event.data);
        };

        mediaRecorder.onstop = () => {
            audioBlob = new Blob(audioChunks, { type: 'audio/webm' }); // Use webm for broader compatibility
            // You can now enable the submit button
            submitReadingBtn.disabled = false;
            showMessage('Recording stopped. Ready to submit.', 'info');
            // Stop the microphone stream tracks to release the mic
            stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        startRecordingBtn.disabled = true;
        stopRecordingBtn.disabled = false;
        submitReadingBtn.disabled = true; // Disable submit until recording is stopped
        recordingStatus.classList.remove('hidden'); // Show recording animation
        showMessage('Recording started...', 'success');

    } catch (error) {
        console.error('Error accessing microphone:', error);
        showMessage(`Error accessing microphone: ${error.message}. Please allow microphone access.`, 'error');
        startRecordingBtn.disabled = false; // Re-enable if error
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
        recordingStatus.classList.add('hidden'); // Hide recording animation
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
    readingResultsDisplay.classList.add('hidden'); // Hide previous results
    readingResultsDisplay.innerHTML = '<h3>Reading Analysis Results:</h3><p>Analyzing your reading...</p>'; // Show loading message

    try {
        const formData = new FormData();
        formData.append('audio_file', audioBlob, 'recording.webm'); // Filename can be anything
        formData.append('original_text', currentReadingText);
        formData.append('subject', selectedReadingSubject);

        const apiUrl = `http://127.0.0.1:8000/analyze_reading`; // Your backend endpoint

        const response = await fetch(apiUrl, {
            method: 'POST',
            body: formData,
            // No 'Content-Type' header needed for FormData, browser sets it automatically
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        displayReadingResults(result); // Display the analysis results

    } catch (error) {
        console.error('Error submitting reading for analysis:', error);
        readingResultsDisplay.classList.remove('hidden');
        readingResultsDisplay.innerHTML = `<h3 class="error-text">Error Analyzing Reading:</h3><p class="error-text">${error.message}</p>`;
        showMessage(`Failed to analyze reading: ${error.message}`, 'error');
    } finally {
        hideLoading();
        submitReadingBtn.disabled = true; // Disable submit after attempt
    }
}

/**
 * Displays the reading analysis results.
 * @param {object} data - The analysis data from the backend with new keys.
 * {
 * "transcribed_text": "the given transcribed text",
 * "wpm": "words per miniute",
 * "accuracy": "accuarcy of Transcribed text with respect to original text",
 * "fluency": "Fluecy score of Transcription in 1-100 acore",
 * "recommendation": "recoemendation for impovement what user can improve in their reading"
 * }
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
    questionsContainer.innerHTML = ''; // Clear previous questions
    userAnswers = {}; // Reset user answers for new set of questions

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
                    optionLabel.setAttribute('for', optionId); // Link label to input
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
    inputSection.classList.add('hidden'); // Hide input section
    questionSection.classList.remove('hidden'); // Show question section
}

// --- Event Handlers ---

/** Handles the click event for the "Generate Questions" button. */
async function handleGenerateQuestions() {
    studentName = studentNameInput.value.trim(); // Get student name
    currentBoard = boardInput.value.trim();
    const classVal = classSelect.value;
    // currentSubjects is now fixed globally, no need to get from UI

    const numericClass = parseInt(classVal, 10);

    if (!studentName) {
        showMessage('Please enter your Name.', 'error');
        return;
    }
    if (!currentBoard) {
        showMessage('Please fill in Board Name.', 'error');
        return;
    }
    if (!classVal) { // Check if a class is selected
        showMessage('Please select a Class.', 'error');
        return;
    }
    // No subject validation needed as they are fixed
    if (isNaN(numericClass) || numericClass < 1 || numericClass > 10) {
        showMessage('Please select a valid Class number between 1 and 10.', 'error');
        return;
    }

    currentClass = numericClass; // Store as number
    // currentSubjects is already set globally
    retakeAttempted = false; // Reset retake flag for a new generation flow
    await fetchQuestions(currentBoard, currentClass, currentSubjects);
}

/** Handles the click event for the "Submit Answers" button. */
function handleSubmitAnswers() {
    let correctCount = 0;
    let totalQuestions = 0;
    userAnswers = {}; // Reset user answers for current submission

    // Iterate through each subject in questionsData
    for (const subject in questionsData) {
        if (questionsData.hasOwnProperty(subject) && Array.isArray(questionsData[subject])) {
            userAnswers[subject] = []; // Initialize array for current subject's answers

            questionsData[subject].forEach((q, qIndex) => {
                totalQuestions++;
                const selectedOptionInput = document.querySelector(`input[name="question-${subject}-${qIndex}"]:checked`);
                const userAnswer = selectedOptionInput ? selectedOptionInput.value : null;
                const correctAnswer = q.answer;

                // Store the user's answer (for displaying in results)
                userAnswers[subject].push({
                    question_text: q.question, // Store the question text
                    user_chosen_answer: userAnswer,
                    correct_answer_text: correctAnswer
                });

                // Visual feedback for correct/incorrect answers on the quiz page itself
                const questionBlock = questionsContainer.querySelector(`[data-subject="${subject}"][data-question-index="${qIndex}"]`);
                if (questionBlock) {
                    // Remove previous feedback classes
                    questionBlock.classList.remove('correct', 'incorrect');
                    const allOptionLabels = questionBlock.querySelectorAll('.option-label');
                    allOptionLabels.forEach(label => label.classList.remove('selected', 'correct-answer'));
                    const existingUserAnswerIndicators = questionBlock.querySelectorAll('.user-answer-indicator');
                    existingUserAnswerIndicators.forEach(indicator => indicator.remove()); // Remove all existing indicators
                    const explanationDiv = questionBlock.querySelector('.explanation-text');
                    if (explanationDiv) explanationDiv.remove();

                    // Add correct/incorrect class to question block
                    if (userAnswer === correctAnswer) {
                        correctCount++;
                        questionBlock.classList.add('correct');
                    } else {
                        questionBlock.classList.add('incorrect');
                    }

                    // Highlight user's selected answer
                    if (selectedOptionInput) {
                        selectedOptionInput.parentElement.classList.add('selected');
                        // Add "Your answer" indicator
                        const span = document.createElement('span');
                        span.className = 'user-answer-indicator';
                        span.textContent = '(Your Answer)';
                        selectedOptionInput.parentElement.appendChild(span);
                    }

                    // Highlight the correct answer (always show)
                    const correctOptionLabel = questionBlock.querySelector(`input[value="${correctAnswer}"]`);
                    if (correctOptionLabel) {
                        correctOptionLabel.parentElement.classList.add('correct-answer');
                        // Add "Correct answer" indicator if it wasn't the user's choice OR if user didn't select any option
                        if (userAnswer !== correctAnswer || !selectedOptionInput) {
                            const span = document.createElement('span');
                            span.className = 'user-answer-indicator';
                            span.textContent = '(Correct Answer)';
                            correctOptionLabel.parentElement.appendChild(span);
                        }
                    }

                    // Display explanation
                    if (q.Explanation) { // Always show explanation if available
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
    questionSection.classList.add('hidden'); // Hide questions after submission
}

/**
 * Displays the quiz results and conditional buttons.
 * @param {number} finalScore - The calculated percentage score.
 */
function displayResults(finalScore) {
    scoreDisplay.textContent = `You scored: ${finalScore.toFixed(2)}%`;
    resultSection.classList.remove('hidden');

    // Clear previous answer review content
    answerReviewContainer.innerHTML = `
        <h3 class="text-xl font-bold text-gray-700 mb-4 border-t-2 border-indigo-200 pt-4">Your Answers:</h3>
    `;

    // Populate the answer review section subject-wise
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

    // Hide all action buttons and report section initially
    retakeButton.classList.add('hidden');
    improvementButton.classList.add('hidden'); // Ensure it's hidden initially
    improvementReportDisplay.classList.add('hidden'); // Ensure report is hidden
    improvementReportText.textContent = ''; // Clear previous report
    improvementChaptersContainer.innerHTML = ''; // Clear previous chapters
    proceedToReadingTestBtn.classList.remove('hidden'); // Show proceed to reading test button

    if (finalScore < 40) {
        // If score is less than 40%
        // Allow retake only once and if class can be decremented by 1 (e.g., class 1 -> cannot retake, class 2 -> class 1)
        if (!retakeAttempted && currentClass >= 2) {
            retakeButton.classList.remove('hidden');
            retakeButton.textContent = `Generate Questions for Class ${currentClass - 1}`;
            showMessage(`Score less than 40%. Option to retake for Class ${currentClass - 1}.`, 'info');
        } else {
            // If retake already attempted OR class is too low for further decrement
            improvementButton.classList.remove('hidden'); // Show improvement button
            showMessage('Score less than 40%. Please focus on improvement areas.', 'info');
        }
    } else {
        // If score is 40% or more
        improvementButton.classList.remove('hidden'); // Show improvement button
        showMessage('Congratulations! You scored 40% or more.', 'success');
    }
}

/** Handles the click event for the "Generate Questions for Previous Class" button. */
async function handleRetake() {
    // Changed from currentClass >= 3 to currentClass >= 2 to allow decrement by 1
    if (currentClass >= 2) {
        retakeAttempted = true; // Mark retake as attempted
        currentClass = currentClass - 1; // Decrement class by 1
        showMessage(`Generating questions for Class ${currentClass}...`, 'info');
        await fetchQuestions(currentBoard, currentClass, currentSubjects);
        resultSection.classList.add('hidden'); // Hide results while new questions load
    } else {
        showMessage('Cannot go back further (already at Class 1).', 'info'); // Updated message
        improvementButton.classList.remove('hidden'); // Offer improvement instead
    }
}

/** Handles the click event for the "Get Improvement Topics" button. */
async function handleGetImprovementTopics() {
    // Pass the original questions data and the user's answers from the latest attempt
    await fetchImprovementTopics(questionsData, userAnswers);
}

/** Handles the click event for the "Proceed to Reading Test" button. */
function handleProceedToReadingTest() {
    resultSection.classList.add('hidden'); // Hide quiz results
    readingSection.classList.remove('hidden'); // Show reading section
    // Reset reading section state for new test
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
    // Reset reading content and buttons if subject changes
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
}

// --- Initialize Application ---
function initializeApp() {
    populateClassDropdown();

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
}

// Run initialization when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', initializeApp); 