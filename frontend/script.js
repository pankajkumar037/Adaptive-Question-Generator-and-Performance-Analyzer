// Copy and paste the entire content of the <script> block here

const setupSection = document.getElementById('setup-section');
const quizSection = document.getElementById('quiz-section');
const resultsSection = document.getElementById('results-section');
const startQuizButton = document.getElementById('start-quiz');

const quizStatusBar = document.getElementById('quiz-status-bar');
const difficultyLevelSpan = document.getElementById('difficulty-level');
const questionCountSpan = document.getElementById('question-count');
const questionArea = document.getElementById('question-area');
const questionText = document.getElementById('question-text');
const optionsContainer = document.getElementById('options-container');
const submitAnswerButton = document.getElementById('submit-answer');

const confidenceSection = document.getElementById('confidence-section');
const confidenceButtons = confidenceSection.querySelectorAll('.confidence-buttons button');
const submitConfidenceButton = document.getElementById('submit-confidence');


const feedbackArea = document.getElementById('feedback-area');
const feedbackStatus = document.getElementById('feedback-status');
const explanationText = document.getElementById('explanation-text');
const nextQuestionButton = document.getElementById('next-question');
const loadingSpinner = document.getElementById('loading-spinner');

const subjectInput = document.getElementById('subject');
const classLevelInput = document.getElementById('class-level');
const boardInput = document.getElementById('board');

// Results elements
const finalAccuracyElement = document.getElementById('final-accuracy');
const finalDifficultyElement = document.getElementById('final-difficulty');
const totalTimeElement = document.getElementById('total-time');
const classicalInterpretationElement = document.getElementById('classical-interpretation');
const timeInterpretationElement = document.getElementById('time-interpretation');
const cbaInterpretationsContainer = document.getElementById('cba-interpretations');


const restartQuizButton = document.getElementById('restart-quiz');


let websocket;
let currentDifficulty = 1;
let correctAnswer = '';
let questionsAttemptedCount = 0;
let correctAnswersCount = 0;
const totalQuestions = 10; // Changed from 4 to 10
let selectedOption = null;
let quizStartTime;
let quizEndTime;
let questionStartTime;
let questionResults = [];

let isRatingConfidence = false;
let currentConfidence = 0;


// Function to show a specific section
function showSection(sectionElement) {
    const sections = document.querySelectorAll('.section');
    sections.forEach(sec => sec.classList.remove('active'));
    sectionElement.classList.add('active');
}

// Function to show the confidence rating section
function showConfidenceRating() {
    isRatingConfidence = true;
    questionArea.classList.add('hidden'); // Hide question and options
    feedbackArea.classList.add('hidden'); // Hide feedback
     submitAnswerButton.classList.add('hidden'); // Hide the original submit button
    confidenceSection.classList.remove('hidden'); // Show confidence section
    submitConfidenceButton.disabled = true; // Disable submit until confidence is selected
     submitConfidenceButton.classList.add('opacity-60', 'cursor-not-allowed'); // Style as disabled
     submitConfidenceButton.classList.replace('bg-green-600', 'bg-gray-500'); // Reset button color


    currentConfidence = 0; // Reset confidence
    // Deselect any previously selected confidence button
    confidenceButtons.forEach(btn => btn.classList.remove('selected-confidence'));
}

// Function to hide the confidence rating section
function hideConfidenceRating() {
    isRatingConfidence = false;
    confidenceSection.classList.add('hidden'); // Hide confidence section
    questionArea.classList.remove('hidden'); // Show question and options area again (will be cleared/updated)
}


// Function to connect to the WebSocket
function connectWebSocket() {
    // Replace with your backend WebSocket URL
    const wsUrl = `ws://127.0.0.1:8000/generate_mcq`;
    websocket = new WebSocket(wsUrl);

    websocket.onopen = function(event) {
        console.log("WebSocket connection opened:", event);
        // Once connected, request the first question
         if (questionsAttemptedCount < totalQuestions) {
             requestQuestion();
         } else if (questionsAttemptedCount >= totalQuestions) {
             // If somehow we try to connect after quiz is done, just show results?
             displayResults();
         }
    };

    websocket.onmessage = function(event) {
        console.log("WebSocket message received:", event.data);
        hideSpinner();
        try {
            const mcqData = JSON.parse(event.data);
            if (mcqData && mcqData.question && mcqData.options && mcqData.answer !== undefined && mcqData.Explanation !== undefined) {
                 displayQuestion(mcqData);
            } else {
                throw new Error("Invalid data structure received from server.");
            }
        } catch (error) {
            console.error("Failed to parse or process message:", error);
            questionText.textContent = "Error loading question. Please try again.";
            optionsContainer.innerHTML = '';
            feedbackArea.classList.add('hidden');
             submitAnswerButton.classList.add('hidden');
             nextQuestionButton.classList.add('hidden');
        }
    };

    websocket.onerror = function(event) {
        console.error("WebSocket error observed:", event);
        hideSpinner();
        // Display error in results section if needed
         displayConnectionError("WebSocket error. Please check server status.");
    };

    websocket.onclose = function(event) {
        console.log("WebSocket connection closed:", event);
        if (event.wasClean) {
            console.log(`Connection closed cleanly, code=${event.code} reason=${event.reason}`);
        } else {
            console.error('Connection died');
        }
        hideSpinner();
        // Inform user if connection dropped mid-quiz or failed at start
         if (questionsAttemptedCount > 0 && questionsAttemptedCount < totalQuestions && !isRatingConfidence) { // Check if not in confidence rating
             displayConnectionError("Connection lost mid-quiz. Your progress might not be saved.");
         } else if (questionsAttemptedCount === 0) {
             displayConnectionError("Could not connect to the question generator server.");
         }
    };
}

// Function to display a connection error message in the results area
function displayConnectionError(message = "A connection error occurred.") {
    showSection(resultsSection); // Show the results section
    resultsSection.innerHTML = `
        <h2 class="text-red-600">Error</h2>
        <p class="text-red-800 mb-4">${message}</p>
        <button id="restart-quiz" class="mt-6 w-full start-button">Restart Quiz</button>
    `;
     // Add event listener to the new restart button element
     document.getElementById('restart-quiz').addEventListener('click', restartQuiz);

     // Hide other sections explicitly
     quizSection.classList.remove('active');
     setupSection.classList.remove('active');
     confidenceSection.classList.add('hidden'); // Hide confidence section too
     quizStatusBar.classList.add('hidden'); // Hide status bar
}


// Function to send a question request to the backend
function requestQuestion() {
     // Ensure websocket is open before sending
     if (!websocket || websocket.readyState !== WebSocket.OPEN) {
         console.error("WebSocket is not connected when trying to request a question.");
         // Attempt to reconnect or handle error
         if (websocket && websocket.readyState === WebSocket.CLOSED) {
              connectWebSocket(); // Try reconnecting
         } else if (!websocket || websocket.readyState === WebSocket.CONNECTING) {
             console.log("WebSocket is still connecting...");
             // Optionally wait and retry or show a loading message
         } else {
            displayConnectionError("WebSocket connection is not ready.");
         }
        return; // Stop the function if connection is not ready
     }

     hideConfidenceRating(); // Hide confidence section if it was visible
     showSpinner();
     questionText.textContent = ''; // Clear previous question
     optionsContainer.innerHTML = ''; // Clear previous options
     feedbackArea.classList.add('hidden'); // Hide feedback
     submitAnswerButton.classList.add('hidden'); // Keep the original submit button hidden
     nextQuestionButton.classList.add('hidden'); // Hide next button initially


     selectedOption = null; // Reset selected option
     feedbackStatus.classList.remove('correct', 'incorrect'); // Clear feedback status styling
     feedbackStatus.textContent = ''; // Clear feedback status text

     questionsAttemptedCount++;
     questionCountSpan.textContent = questionsAttemptedCount;

     questionStartTime = new Date(); // New: Record start time for this question

     const request = {
         subject: subjectInput.value,
         class_level: classLevelInput.value,
         board: boardInput.value,
         difficulty: currentDifficulty
     };
     websocket.send(JSON.stringify(request));
}

// Function to display the received question
function displayQuestion(mcqData) {
    questionText.textContent = mcqData.question;
    optionsContainer.innerHTML = ''; // Clear previous options
    correctAnswer = mcqData.answer; // Store the correct answer
    explanationText.textContent = mcqData.Explanation; // Store the explanation

    mcqData.options.forEach(option => {
        const button = document.createElement('button');
        button.textContent = option;
        button.classList.add('option-button');
        // Modified: Click now triggers showing confidence rating
        button.addEventListener('click', () => {
            selectedOption = option; // Store the selected option
             // Disable option buttons after selection
            const optionButtons = optionsContainer.querySelectorAll('.option-button');
            optionButtons.forEach(btn => {
                 btn.disabled = true;
                 btn.classList.remove('hover:bg-gray-300');
                 btn.style.cursor = 'default';
            });
            // Highlight the selected option
            button.classList.add('selected');
            showConfidenceRating(); // Show the confidence rating section
        });
        optionsContainer.appendChild(button);
    });
}


// New: Function to handle submission AFTER confidence is rated
function handleSubmitWithConfidence(confidence) {
     hideConfidenceRating(); // Hide the confidence section

     // Check if the selected answer is correct
     const isCorrect = (selectedOption === correctAnswer);

     questionEndTime = new Date(); // Record end time for this question
     const timeTaken = (questionEndTime - questionStartTime) / 1000; // Time for this question

     // Store the result for this question
     questionResults.push({
         question: questionText.textContent, // Store question text for CBA display
         selected: selectedOption, // Store selected option for display
         correct: isCorrect,
         time: timeTaken,
         confidence: confidence
     });


    // Apply styling based on correctness to the selected option
    const optionButtons = optionsContainer.querySelectorAll('.option-button');
     let clickedButton = null;
     optionButtons.forEach(button => {
         if (button.textContent === selectedOption) {
              clickedButton = button;
         }
     });

    if (isCorrect) {
        if(clickedButton) clickedButton.classList.add('correct-answer');
        feedbackStatus.textContent = "Correct!";
        feedbackStatus.classList.add('correct');
        correctAnswersCount++; // Increment correct answers counter
        // Increase difficulty for the next question
        currentDifficulty = Math.min(10, currentDifficulty + 1);
    } else {
         if(clickedButton) clickedButton.classList.add('incorrect-answer');
         feedbackStatus.textContent = "Incorrect.";
         feedbackStatus.classList.add('incorrect');
        // Find and highlight the correct answer
        optionButtons.forEach(button => {
            if (button.textContent === correctAnswer && button !== clickedButton) { // Highlight correct answer if it wasn't the selected one
                button.classList.add('correct-answer');
            }
        });
    }

    // Update difficulty level display
    difficultyLevelSpan.textContent = currentDifficulty;

    // Show feedback area with explanation and next question button
    feedbackArea.classList.remove('hidden');

     // Check if quiz is complete
     if (questionsAttemptedCount >= totalQuestions) {
         quizEndTime = new Date(); // Record end time
         nextQuestionButton.classList.add('hidden'); // Hide the next button
         displayResults(); // Show results - this will change the section
     } else {
         nextQuestionButton.classList.remove('hidden'); // Ensure next button is visible if not complete
     }
}


// Function to display final results and interpretations
function displayResults() {
    // Before showing results, clear the results section's dynamic content
     resultsSection.innerHTML = `
         <h2>Quiz Results</h2>

         <div class="results-summary mb-8">
             <p id="final-accuracy"></p>
             <p id="final-difficulty"></p>
             <p id="total-time"></p>
         </div>

         <div class="interpretation-block">
             <h3>Classical Scoring Interpretation</h3>
             <p id="classical-interpretation"></p>
         </div>

         <div class="interpretation-block">
             <h3>Time-Based Interpretation (Overall)</h3>
             <p id="time-interpretation"></p>
             <p class="text-sm text-gray-600 mt-2 italic">Interpretation based on your total time and overall performance.</p>
         </div>

          <div class="interpretation-block">
             <h3>Confidence-Based Assessment (Per Question)</h3>
             <div id="cba-interpretations">
                 </div>
         </div>


         <button id="restart-quiz" class="mt-8 w-full start-button">Try Another Quiz</button>
    `;

     // Re-get references to the newly created elements
     const finalAccuracyElement = document.getElementById('final-accuracy');
     const finalDifficultyElement = document.getElementById('final-difficulty');
     const totalTimeElement = document.getElementById('total-time');
     const classicalInterpretationElement = document.getElementById('classical-interpretation');
     const timeInterpretationElement = document.getElementById('time-interpretation');
     const cbaInterpretationsContainer = document.getElementById('cba-interpretations');

     const restartQuizButton = document.getElementById('restart-quiz');
     restartQuizButton.addEventListener('click', restartQuiz);


    // Hide quiz elements
    feedbackArea.classList.add('hidden');
    questionArea.classList.add('hidden');
    quizStatusBar.classList.add('hidden'); // Hide status bar
    confidenceSection.classList.add('hidden'); // Hide confidence section


    // Show results section
    showSection(resultsSection);


    // --- Calculate and display Classical Scoring ---
    const accuracy = totalQuestions > 0 ? (correctAnswersCount / totalQuestions) * 100 : 0;
    finalAccuracyElement.textContent = `Accuracy: ${accuracy.toFixed(0)}% (${correctAnswersCount}/${totalQuestions})`;

    let classicalInterpretation = '';
    if (accuracy >= 90) {
        classicalInterpretation = "Excellent";
    } else if (accuracy >= 70) {
        classicalInterpretation = "Good";
    } else if (accuracy >= 50) {
        classicalInterpretation = "Average";
    } else {
        classicalInterpretation = "Needs Improvement";
    }
    classicalInterpretationElement.textContent = `Your overall performance is: ${classicalInterpretation} (${accuracy.toFixed(0)}%).`;


    // --- Calculate and display Time-Based Interpretation (Overall) ---
    const timeElapsed = quizStartTime ? (new Date() - quizStartTime) / 1000 : 0; // Handle case if quiz never started

    const minutes = Math.floor(timeElapsed / 60);
    const seconds = Math.floor(timeElapsed % 60);
    const timeString = `${minutes}m ${seconds}s`;
    totalTimeElement.textContent = `Total Time: ${timeString}`;

    // Simple overall time interpretation - based loosely on general test taking pace and accuracy
    let timeInterpretation = '';
     const averageTimePerQuestion = questionsAttemptedCount > 0 ? timeElapsed / questionsAttemptedCount : 0;

     // Example thresholds (you might need to adjust these based on typical question complexity)
     const fastTimeThreshold = 20; // seconds per question
     const slowTimeThreshold = 60; // seconds per question

     if (correctAnswersCount === totalQuestions && averageTimePerQuestion < fastTimeThreshold) {
         timeInterpretation = "You demonstrated high speed and accuracy, indicating strong mastery.";
     } else if (correctAnswersCount >= totalQuestions * 0.8 && averageTimePerQuestion < slowTimeThreshold) {
         timeInterpretation = "You were accurate and reasonably efficient with your time.";
     } else if (correctAnswersCount >= totalQuestions * 0.6 && averageTimePerQuestion < slowTimeThreshold) {
         timeInterpretation = "Your pace was average, and your accuracy was acceptable.";
     }
     else if (correctAnswersCount < totalQuestions * 0.6 && averageTimePerQuestion < fastTimeThreshold) {
          timeInterpretation = "Your quick responses with lower accuracy might indicate some guessing or rushed decisions. Focus on understanding before answering.";
     } else if (correctAnswersCount < totalQuestions * 0.6 && averageTimePerQuestion >= slowTimeThreshold) {
         timeInterpretation = "Taking longer and getting incorrect answers suggests difficulty with the material. Review the concepts thoroughly.";
     }
     else if (averageTimePerQuestion >= slowTimeThreshold) {
         timeInterpretation = "Your pace was slow. Consider practicing time management during quizzes.";
     }
     else {
         timeInterpretation = "Insufficient data for a detailed time interpretation.";
         if (questionsAttemptedCount > 0) timeInterpretation = `Average time per question: ${averageTimePerQuestion.toFixed(1)}s`; // Fallback
     }

    timeInterpretationElement.textContent = timeInterpretation;
    finalDifficultyElement.textContent = `Final Difficulty Reached: ${currentDifficulty}`; // Display final difficulty in summary


    // --- Display Confidence-Based Assessment (Per Question) ---
    if (questionResults.length === 0) {
         cbaInterpretationsContainer.innerHTML = "<p>Confidence data not available (quiz not completed).</p>";
    } else {
         cbaInterpretationsContainer.innerHTML = ""; // Clear previous content
         questionResults.forEach((result, index) => {
             let cbaText = '';
             if (result.correct) {
                 if (result.confidence >= 4) { // Confident (4 or 5)
                     cbaText = "Correct + High Confidence: Strong understanding.";
                 } else { // Low Confidence (1, 2, 3)
                     cbaText = "Correct + Low Confidence: You got it right, but uncertainty might suggest lower mastery than perceived, or lucky guess.";
                 }
             } else { // Incorrect
                  if (result.confidence >= 4) { // Confident (4 or 5)
                     cbaText = "Incorrect + High Confidence: This indicates a misconception. Focus on clarifying this topic.";
                 } else { // Low Confidence (1, 2, 3)
                     cbaText = "Incorrect + Low Confidence: You were unsure and incorrect, indicating insufficient knowledge or a need for better strategies when unsure.";
                 }
             }
             const p = document.createElement('p');
             p.innerHTML = `<strong>Q${index + 1}:</strong> ${cbaText} (Your Confidence: ${result.confidence}/5, Time: ${result.time.toFixed(1)}s)`; // Simplified display
             cbaInterpretationsContainer.appendChild(p);
         });
    }


}

// Function to restart the quiz
function restartQuiz() {
    // Show setup section and hide others
    showSection(setupSection);

    // Reset state variables
    currentDifficulty = 1;
    questionsAttemptedCount = 0;
    correctAnswersCount = 0;
    selectedOption = null;
    quizStartTime = null;
    quizEndTime = null;
    questionStartTime = null;
    questionResults = []; // Clear results history

    isRatingConfidence = false;
    currentConfidence = 0;

    // Clear displayed info in quiz section
    questionText.textContent = '';
    optionsContainer.innerHTML = '';
    feedbackArea.classList.add('hidden');
    feedbackStatus.classList.remove('correct', 'incorrect');
    feedbackStatus.textContent = '';
    explanationText.textContent = '';

    // Hide confidence section
     confidenceSection.classList.add('hidden');


    // Reset status bar display
    difficultyLevelSpan.textContent = currentDifficulty;
    questionCountSpan.textContent = questionsAttemptedCount;
     quizStatusBar.classList.remove('hidden');

     // Clear results section dynamic content and interpretations
     if (resultsSection) {
          resultsSection.innerHTML = `
             <h2>Quiz Results</h2>

             <div class="results-summary mb-8">
                 <p id="final-accuracy"></p>
                 <p id="final-difficulty"></p>
                 <p id="total-time"></p>
             </div>

             <div class="interpretation-block">
                 <h3>Classical Scoring Interpretation</h3>
                 <p id="classical-interpretation"></p>
             </div>

             <div class="interpretation-block">
                 <h3>Time-Based Interpretation (Overall)</h3>
                 <p id="time-interpretation"></p>
                 <p class="text-sm text-gray-600 mt-2 italic">Interpretation based on your total time and overall performance.</p>
             </div>

              <div class="interpretation-block">
                 <h3>Confidence-Based Assessment (Per Question)</h3>
                 <div id="cba-interpretations">
                     </div>
             </div>


             <button id="restart-quiz" class="mt-8 w-full start-button">Try Another Quiz</button>
          `;
           // Need to re-add listener to the new button if clearing innerHTML
            document.getElementById('restart-quiz').addEventListener('click', restartQuiz);
     }


    // Close existing WebSocket connection if open
    if (websocket && websocket.readyState !== WebSocket.CLOSED) {
        websocket.close();
    }
}


// Function to show the loading spinner
function showSpinner() {
    loadingSpinner.querySelector('.spinner').style.display = 'block';
}

// Function to hide the loading spinner
function hideSpinner() {
    loadingSpinner.querySelector('.spinner').style.display = 'none';
}

// --- Event Listeners ---

// Event listener for the Start Quiz button
startQuizButton.addEventListener('click', () => {
    showSection(quizSection); // Show quiz section
    currentDifficulty = 1; // Reset difficulty for a new quiz
    questionsAttemptedCount = 0; // Reset question count
    correctAnswersCount = 0; // Reset correct answers count
    questionResults = []; // Clear results history

    difficultyLevelSpan.textContent = currentDifficulty; // Update display
    questionCountSpan.textContent = questionsAttemptedCount; // Update display
    quizStatusBar.classList.remove('hidden'); // Ensure status bar is visible

    // Clear previous content
    questionText.textContent = '';
    optionsContainer.innerHTML = '';
    feedbackArea.classList.add('hidden');
    feedbackStatus.classList.remove('correct', 'incorrect');
    feedbackStatus.textContent = '';
    explanationText.textContent = '';
    confidenceSection.classList.add('hidden'); // Hide confidence section

    quizStartTime = new Date(); // Record start time
    connectWebSocket(); // Establish WebSocket connection and request first question
});

// Event listeners for Confidence buttons
confidenceButtons.forEach(button => {
    button.addEventListener('click', () => {
        confidenceButtons.forEach(btn => btn.classList.remove('selected-confidence'));
        button.classList.add('selected-confidence');
        currentConfidence = parseInt(button.getAttribute('data-confidence'));
        submitConfidenceButton.disabled = false; // Enable submit confidence button
         submitConfidenceButton.classList.remove('opacity-60', 'cursor-not-allowed');
         submitConfidenceButton.classList.replace('bg-gray-500', 'bg-green-600');
         submitConfidenceButton.classList.replace('hover:bg-gray-600', 'hover:bg-green-700');
    });
});

// Event listener for Submit Confidence button
submitConfidenceButton.addEventListener('click', () => {
    if (currentConfidence > 0) {
        // Now proceed with handling the answer and confidence
        handleSubmitWithConfidence(currentConfidence);
    }
});


// Event listener for the Next Question button
nextQuestionButton.addEventListener('click', () => {
     if (questionsAttemptedCount < totalQuestions) {
         requestQuestion(); // Request the next question
     }
});

// Add event listener to the restart button.
 if (restartQuizButton) {
     restartQuizButton.addEventListener('click', restartQuiz);
 } else {
     console.error("Restart button not found!");
 }