// Math Quiz Game (Game Two - Solving)

window.startGameTwoSolvingGame = function(gameContainer, updateScoreCallback, initialScore) {
    let score = initialScore;
    let currentQuestion = {};
    let lives = 3;

    const questionEl = document.createElement('div');
    const answerInput = document.createElement('input');
    const submitButton = document.createElement('button');
    const feedbackEl = document.createElement('div');
    const livesEl = document.createElement('div');

    function initGame() {
        gameContainer.innerHTML = ''; // Clear previous content
        gameContainer.style.textAlign = 'center';
        gameContainer.style.padding = '20px';
        gameContainer.style.fontFamily = 'Nunito, sans-serif';

        questionEl.id = 'math-question';
        questionEl.style.fontSize = '2em';
        questionEl.style.color = '#073B4C'; // Dark Blue
        questionEl.style.marginBottom = '20px';

        answerInput.type = 'number';
        answerInput.id = 'math-answer';
        answerInput.placeholder = 'Your Answer';
        answerInput.style.padding = '10px';
        answerInput.style.fontSize = '1.2em';
        answerInput.style.marginRight = '10px';
        answerInput.style.border = '2px solid #118AB2'; // Cerulean
        answerInput.style.borderRadius = '5px';

        submitButton.textContent = 'Submit';
        submitButton.id = 'submit-math-answer';
        submitButton.style.padding = '10px 20px';
        submitButton.style.fontSize = '1.2em';
        submitButton.style.backgroundColor = '#FF6F61'; // Coral
        submitButton.style.color = 'white';
        submitButton.style.border = 'none';
        submitButton.style.borderRadius = '5px';
        submitButton.style.cursor = 'pointer';
        submitButton.addEventListener('click', checkAnswer);
        
        answerInput.addEventListener('keypress', function(event) {
            if (event.key === 'Enter') {
                checkAnswer();
            }
        });

        feedbackEl.id = 'math-feedback';
        feedbackEl.style.marginTop = '20px';
        feedbackEl.style.fontSize = '1.2em';
        feedbackEl.style.minHeight = '1.5em'; // Reserve space

        livesEl.id = 'math-lives';
        livesEl.style.fontSize = '1.2em';
        livesEl.style.color = '#FF6F61'; // Coral
        livesEl.style.marginTop = '10px';

        gameContainer.appendChild(livesEl);
        gameContainer.appendChild(questionEl);
        gameContainer.appendChild(answerInput);
        gameContainer.appendChild(submitButton);
        gameContainer.appendChild(feedbackEl);

        updateScoreDisplay(score);
        updateLivesDisplay();
        nextQuestion();
    }

    function generateQuestion() {
        const num1 = Math.floor(Math.random() * 10) + 1; // Numbers 1-10
        const num2 = Math.floor(Math.random() * 10) + 1;
        const operations = ['+', '-', '*'];
        const operation = operations[Math.floor(Math.random() * operations.length)];
        let questionText, correctAnswer;

        switch (operation) {
            case '+':
                questionText = `${num1} + ${num2} = ?`;
                correctAnswer = num1 + num2;
                break;
            case '-':
                // Ensure positive result for simplicity
                if (num1 < num2) {
                    questionText = `${num2} - ${num1} = ?`;
                    correctAnswer = num2 - num1;
                } else {
                    questionText = `${num1} - ${num2} = ?`;
                    correctAnswer = num1 - num2;
                }
                break;
            case '*':
                questionText = `${num1} × ${num2} = ?`;
                correctAnswer = num1 * num2;
                break;
        }
        return { text: questionText, answer: correctAnswer };
    }

    function nextQuestion() {
        currentQuestion = generateQuestion();
        questionEl.textContent = currentQuestion.text;
        answerInput.value = '';
        answerInput.focus();
        feedbackEl.textContent = '';
    }

    function checkAnswer() {
        const userAnswer = parseInt(answerInput.value);
        if (isNaN(userAnswer)) {
            feedbackEl.textContent = 'Please enter a number!';
            feedbackEl.style.color = '#FFD166'; // Mustard Yellow
            return;
        }

        if (userAnswer === currentQuestion.answer) {
            score += 5;
            feedbackEl.textContent = 'Correct! 🎉';
            feedbackEl.style.color = '#06D6A0'; // Teal
            updateScoreDisplay(score);
            setTimeout(nextQuestion, 1500); // Load next question after a delay
        } else {
            lives--;
            feedbackEl.textContent = `Oops! Wrong answer. The correct answer was ${currentQuestion.answer}.`;
            feedbackEl.style.color = '#FF6F61'; // Coral
            updateLivesDisplay();
            if (lives <= 0) {
                endGame();
            } else {
                setTimeout(nextQuestion, 2000); // Longer delay for wrong answer
            }
        }
    }
    
    function updateScoreDisplay(newScore) {
        score = newScore;
        updateScoreCallback(score);
    }

    function updateLivesDisplay() {
        livesEl.innerHTML = `Lives: ${'❤️'.repeat(lives)}${'🖤'.repeat(3 - lives)}`;
    }

    function endGame() {
        gameContainer.innerHTML = `<div style="text-align: center; color: #073B4C; font-size: 1.5em;">Game Over!<br>Your final score is: ${score}</div>`;
        const restartButton = document.createElement('button');
        restartButton.textContent = 'Try Again?';
        restartButton.style.padding = '10px 20px';
        restartButton.style.fontSize = '1em';
        restartButton.style.backgroundColor = '#FF6F61'; // Coral
        restartButton.style.color = 'white';
        restartButton.style.border = 'none';
        restartButton.style.borderRadius = '5px';
        restartButton.style.marginTop = '20px';
        restartButton.style.cursor = 'pointer';
        restartButton.onclick = () => {
            score = 0;
            lives = 3;
            initGame();
        };
        gameContainer.appendChild(restartButton);
    }

    initGame();
    console.log('Game Two (Math Quiz) Loaded');
};