// Global variables to store application state
let questionsData = {}; // Stores all fetched questions, grouped by subject for the current attempt
let userAnswers = {};   // Stores user's selected answers for each question in the current attempt
let currentBoard = '';
let currentClass = 0;   // Store as a number for calculations
let currentSubjects = [];
let score = 0;          // To store the last calculated score
let retakeAttempted = false; // Flag to track if a retake has occurred

// Get DOM elements
const inputSection = document.getElementById('input-section');
const boardInput = document.getElementById('board');
const classInput = document.getElementById('class');
const subjectNamesInput = document.getElementById('subject-names');
const generateQuestionsBtn = document.getElementById('generate-questions-btn');

const loadingOverlay = document.getElementById('loading-overlay');
const loadingSpinner = document.getElementById('loading-spinner');
const loadingQuote = document.getElementById('loading-quote'); // New element for the quote

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

const messageBox = document.getElementById('message-box');

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
    retakeAttempted = false; // Reset retake flag
}

/** Clears the question and result sections (used when generating new questions). */
function clearQuestionAndResultSections() {
    questionSection.classList.add('hidden');
    resultSection.classList.add('hidden');
    improvementReportDisplay.classList.add('hidden');
    questionsContainer.innerHTML = '';
    answerReviewContainer.innerHTML = ''; // Clear previous answer review
    improvementReportText.textContent = '';
    improvementChaptersContainer.innerHTML = ''; // Clear previous chapters
    retakeButton.classList.add('hidden');
    improvementButton.classList.add('hidden');
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
    currentBoard = boardInput.value.trim();
    const classVal = classInput.value.trim();
    currentSubjects = subjectNamesInput.value.split(',').map(s => s.trim()).filter(s => s !== '');

    const numericClass = parseInt(classVal, 10);

    if (!currentBoard || currentSubjects.length === 0) {
        showMessage('Please fill in Board and at least one Subject.', 'error');
        return;
    }
    if (isNaN(numericClass) || numericClass < 1 || numericClass > 12) {
        showMessage('Please enter a valid Class number between 1 and 12.', 'error');
        return;
    }

    currentClass = numericClass; // Store as number
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

    if (finalScore < 40) {
        // If score is less than 40%
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
    if (currentClass >= 2) {
        retakeAttempted = true; // Mark retake as attempted
        currentClass = currentClass - 1; // Decrement class by 1
        showMessage(`Generating questions for Class ${currentClass}...`, 'info');
        await fetchQuestions(currentBoard, currentClass, currentSubjects);
        resultSection.classList.add('hidden'); // Hide results while new questions load
    } else {
        showMessage('Cannot go back further (already at Class 1).', 'info');
        improvementButton.classList.remove('hidden'); // Offer improvement instead
    }
}

/** Handles the click event for the "Get Improvement Topics" button. */
async function handleGetImprovementTopics() {
    // Pass the original questions data and the user's answers from the latest attempt
    await fetchImprovementTopics(questionsData, userAnswers);
}

// --- Initialize Application ---
function initializeApp() {
    generateQuestionsBtn.addEventListener('click', handleGenerateQuestions);
    submitAnswersBtn.addEventListener('click', handleSubmitAnswers);
    retakeButton.addEventListener('click', handleRetake);
    improvementButton.addEventListener('click', handleGetImprovementTopics);
}

// Run initialization when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', initializeApp); 