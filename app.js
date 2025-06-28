
        document.addEventListener('DOMContentLoaded', () => {
            // DOM Elements
            const introScreen = document.getElementById('introScreen');
            const loader = document.getElementById('loader');
            const quizContainer = document.getElementById('quizContainer');
            const resultsScreen = document.getElementById('resultsScreen');
            
            const startQuizBtn = document.getElementById('startQuiz');
            const prevQuestionBtn = document.getElementById('prevQuestion');
            const nextQuestionBtn = document.getElementById('nextQuestion');
            const restartQuizBtn = document.getElementById('restartQuiz');
            
            const questionCountDisplay = document.getElementById('questionCountDisplay');
            const scoreDisplay = document.getElementById('scoreDisplay');
            const progressBar = document.getElementById('progressBar');
            const questionElement = document.getElementById('question');
            const optionsElement = document.getElementById('options');
            const finalScoreElement = document.getElementById('finalScore');
            const resultMessageElement = document.getElementById('resultMessage');
            
            // Quiz variables
            let questions = [];
            let currentQuestionIndex = 0;
            let score = 0;
            let userAnswers = [];
            let quizSettings = {};
            
            // Event Listeners
            startQuizBtn.addEventListener('click', startQuiz);
            prevQuestionBtn.addEventListener('click', showPreviousQuestion);
            nextQuestionBtn.addEventListener('click', showNextQuestion);
            restartQuizBtn.addEventListener('click', restartQuiz);
            
            // Start the quiz
            async function startQuiz() {
                // Get quiz settings
                quizSettings = {
                    category: document.getElementById('category').value,
                    difficulty: document.getElementById('difficulty').value,
                    amount: document.getElementById('questionCount').value
                };
                
                // Validate question count
                if (quizSettings.amount < 5 || quizSettings.amount > 20) {
                    alert('Please select between 5 and 20 questions');
                    return;
                }
                
                // Show loading screen
                introScreen.style.display = 'none';
                loader.style.display = 'block';
                
                try {
                    // Fetch questions from API
                    questions = await fetchQuizQuestions(quizSettings);
                    
                    // Initialize user answers array
                    userAnswers = Array(questions.length).fill(null);
                    
                    // Hide loading screen and show quiz
                    loader.style.display = 'none';
                    quizContainer.style.display = 'block';
                    
                    // Display first question
                    displayQuestion();
                } catch (error) {
                    console.error('Error fetching questions:', error);
                    loader.style.display = 'none';
                    introScreen.style.display = 'flex';
                    alert('Failed to load questions. Please try again.');
                }
            }
            
            // Fetch questions from Open Trivia DB API
            async function fetchQuizQuestions(settings) {
                let apiUrl = `https://opentdb.com/api.php?amount=${settings.amount}`;
                
                if (settings.category) {
                    apiUrl += `&category=${settings.category}`;
                }
                
                if (settings.difficulty) {
                    apiUrl += `&difficulty=${settings.difficulty}`;
                }
                
                // Add encoding parameter to handle special characters
                apiUrl += '&encode=url3986';
                
                const response = await fetch(apiUrl);
                const data = await response.json();
                
                if (data.response_code !== 0) {
                    throw new Error('Unable to fetch questions');
                }
                
                return data.results.map(question => {
                    // Decode URL-encoded strings
                    question.question = decodeURIComponent(question.question);
                    question.correct_answer = decodeURIComponent(question.correct_answer);
                    question.incorrect_answers = question.incorrect_answers.map(answer => 
                        decodeURIComponent(answer)
                    );
                    
                    // Combine all answers and shuffle them
                    const allAnswers = [...question.incorrect_answers, question.correct_answer];
                    question.shuffled_answers = shuffleArray(allAnswers);
                    
                    return question;
                });
            }
            
            // Shuffle array (Fisher-Yates algorithm)
            function shuffleArray(array) {
                const newArray = [...array];
                for (let i = newArray.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
                }
                return newArray;
            }
            
            // Display current question
            function displayQuestion() {
                const question = questions[currentQuestionIndex];
                
                // Update question count display
                questionCountDisplay.textContent = `Question ${currentQuestionIndex + 1} of ${questions.length}`;
                
                // Update progress bar
                progressBar.style.width = `${((currentQuestionIndex + 1) / questions.length) * 100}%`;
                
                // Display question
                questionElement.innerHTML = `
                    ${question.question}
                    ${question.difficulty ? `<span class="difficulty-badge ${question.difficulty}">${question.difficulty}</span>` : ''}
                `;
                
                // Display options
                optionsElement.innerHTML = '';
                question.shuffled_answers.forEach((answer, index) => {
                    const option = document.createElement('div');
                    option.className = 'option';
                    option.textContent = answer;
                    option.dataset.index = index;
                    
                    // Highlight selected answer
                    if (userAnswers[currentQuestionIndex] === answer) {
                        option.classList.add('selected');
                    }
                    
                    // Highlight correct/incorrect answers if already answered
                    if (userAnswers[currentQuestionIndex] !== null) {
                        if (answer === question.correct_answer) {
                            option.classList.add('correct');
                        } else if (userAnswers[currentQuestionIndex] === answer && answer !== question.correct_answer) {
                            option.classList.add('incorrect');
                        }
                    }
                    
                    option.addEventListener('click', () => selectAnswer(answer));
                    optionsElement.appendChild(option);
                });
                
                // Update navigation buttons
                prevQuestionBtn.disabled = currentQuestionIndex === 0;
                nextQuestionBtn.textContent = currentQuestionIndex === questions.length - 1 ? 'Finish' : 'Next';
            }
            
            // Select an answer
            function selectAnswer(answer) {
                // Don't allow changing answer if already answered
                if (userAnswers[currentQuestionIndex] !== null) return;
                
                const question = questions[currentQuestionIndex];
                userAnswers[currentQuestionIndex] = answer;
                
                // Update score if answer is correct
                if (answer === question.correct_answer) {
                    score++;
                    scoreDisplay.textContent = `Score: ${score}/${questions.length}`;
                }
                
                // Highlight selected answer and show correct/incorrect
                const options = document.querySelectorAll('.option');
                options.forEach(option => {
                    option.classList.remove('selected');
                    if (option.textContent === answer) {
                        option.classList.add('selected');
                    }
                    
                    if (option.textContent === question.correct_answer) {
                        option.classList.add('correct');
                    } else if (option.textContent === answer && answer !== question.correct_answer) {
                        option.classList.add('incorrect');
                    }
                });
            }
            
            // Show previous question
            function showPreviousQuestion() {
                if (currentQuestionIndex > 0) {
                    currentQuestionIndex--;
                    displayQuestion();
                }
            }
            
            // Show next question or finish quiz
            function showNextQuestion() {
                // Require answer before proceeding (except for the last question)
                if (userAnswers[currentQuestionIndex] === null && currentQuestionIndex !== questions.length - 1) {
                    alert('Please select an answer before proceeding.');
                    return;
                }
                
                if (currentQuestionIndex < questions.length - 1) {
                    currentQuestionIndex++;
                    displayQuestion();
                } else {
                    finishQuiz();
                }
            }
            
            // Finish the quiz and show results
            function finishQuiz() {
                quizContainer.style.display = 'none';
                resultsScreen.style.display = 'block';
                
                // Display final score
                finalScoreElement.textContent = `Score: ${score}/${questions.length}`;
                
                // Display result message based on performance
                const percentage = (score / questions.length) * 100;
                let message = '';
                
                if (percentage >= 80) {
                    message = 'Excellent work! You really know your stuff.';
                } else if (percentage >= 60) {
                    message = 'Good job! You have a solid understanding.';
                } else if (percentage >= 40) {
                    message = 'Not bad! With a bit more practice, you\'ll improve.';
                } else {
                    message = 'Keep learning! Everyone starts somewhere.';
                }
                
                resultMessageElement.textContent = message;
            }
            
            // Restart the quiz
            function restartQuiz() {
                // Reset quiz variables
                questions = [];
                currentQuestionIndex = 0;
                score = 0;
                userAnswers = [];
                
                // Reset displays
                scoreDisplay.textContent = 'Score: 0';
                progressBar.style.width = '0%';
                
                // Show intro screen
                resultsScreen.style.display = 'none';
                introScreen.style.display = 'flex';
            }
        });
