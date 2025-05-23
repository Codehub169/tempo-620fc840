// Memory Match Game (Game One)

// Expose the game start function globally
window.startGameOneGame = function(gameContainer, updateScoreCallback, initialScore) {
    // Game state
    let score = initialScore;
    let cards = [];
    let flippedCards = [];
    let matchedPairs = 0;
    let canFlip = true;
    const symbols = ['🎈', '⭐', '🎁', '🎉', '🎂', '🍭', '🚀', '🧩']; // 8 symbols, 16 cards
    const gameSymbols = [...symbols, ...symbols]; // Duplicate for pairs

    // Initialize game
    function initGame() {
        gameContainer.innerHTML = ''; // Clear previous content
        gameContainer.style.display = 'grid';
        gameContainer.style.gridTemplateColumns = 'repeat(4, 1fr)';
        gameContainer.style.gap = '10px';
        gameContainer.style.maxWidth = '400px';
        gameContainer.style.margin = '20px auto';

        shuffleArray(gameSymbols);

        gameSymbols.forEach((symbol, index) => {
            const card = document.createElement('div');
            card.classList.add('memory-card');
            card.dataset.symbol = symbol;
            card.dataset.id = index;
            card.textContent = '?'; // Initially hidden
            card.style.width = '80px';
            card.style.height = '80px';
            card.style.backgroundColor = '#FFD166'; // Mustard Yellow
            card.style.color = '#073B4C'; // Dark Blue
            card.style.display = 'flex';
            card.style.justifyContent = 'center';
            card.style.alignItems = 'center';
            card.style.fontSize = '2em';
            card.style.borderRadius = '10px';
            card.style.cursor = 'pointer';
            card.style.transition = 'transform 0.3s ease, background-color 0.3s ease';
            card.addEventListener('click', handleCardClick);
            cards.push(card);
            gameContainer.appendChild(card);
        });
        
        updateScoreDisplay(score);
    }

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    function handleCardClick(event) {
        if (!canFlip) return;
        const clickedCard = event.target;

        if (flippedCards.length < 2 && !clickedCard.classList.contains('flipped') && !clickedCard.classList.contains('matched')) {
            flipCard(clickedCard);
            flippedCards.push(clickedCard);

            if (flippedCards.length === 2) {
                checkForMatch();
            }
        }
    }

    function flipCard(card) {
        card.textContent = card.dataset.symbol;
        card.style.backgroundColor = '#06D6A0'; // Teal
        card.classList.add('flipped');
    }

    function unflipCards() {
        flippedCards.forEach(card => {
            if (!card.classList.contains('matched')) {
                card.textContent = '?';
                card.style.backgroundColor = '#FFD166'; // Mustard Yellow
                card.classList.remove('flipped');
            }
        });
        flippedCards = [];
        canFlip = true;
    }

    function checkForMatch() {
        canFlip = false;
        const [card1, card2] = flippedCards;
        if (card1.dataset.symbol === card2.dataset.symbol) {
            // Match found
            score += 10;
            matchedPairs++;
            card1.classList.add('matched');
            card2.classList.add('matched');
            card1.style.backgroundColor = '#118AB2'; // Cerulean
            card2.style.backgroundColor = '#118AB2'; // Cerulean
            flippedCards = [];
            canFlip = true;
            if (matchedPairs === symbols.length) {
                endGame();
            }
        } else {
            // No match
            score = Math.max(0, score - 2); // Penalize for mismatch
            setTimeout(unflipCards, 1000);
        }
        updateScoreDisplay(score);
    }
    
    function updateScoreDisplay(newScore) {
        score = newScore;
        updateScoreCallback(score); // Persist and update global display
    }

    function endGame() {
        gameContainer.innerHTML = `<div style="text-align: center; color: #073B4C; font-size: 1.5em;">Congratulations! You found all pairs!<br>Final Score: ${score}</div>`;
        // Optionally, add a restart button
        const restartButton = document.createElement('button');
        restartButton.textContent = 'Play Again?';
        restartButton.style.padding = '10px 20px';
        restartButton.style.fontSize = '1em';
        restartButton.style.backgroundColor = '#FF6F61';
        restartButton.style.color = 'white';
        restartButton.style.border = 'none';
        restartButton.style.borderRadius = '5px';
        restartButton.style.marginTop = '20px';
        restartButton.style.cursor = 'pointer';
        restartButton.onclick = () => {
            score = 0;
            matchedPairs = 0;
            flippedCards = [];
            cards = [];
            canFlip = true;
            initGame();
        };
        gameContainer.appendChild(restartButton);
    }

    // Start the game
    initGame();
    console.log('Game One (Memory Match) Loaded');
};