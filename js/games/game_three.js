// Shape Sorting Game (Game Three)

window.startGameThreeGame = function(gameContainer, updateScoreCallback, initialScore) {
    let score = initialScore;
    const shapes = [
        { name: 'circle', color: '#FF6F61', symbol: '●', type: 'round' },
        { name: 'square', color: '#FFD166', symbol: '■', type: 'angular' },
        { name: 'triangle', color: '#06D6A0', symbol: '▲', type: 'angular' },
        { name: 'star', color: '#118AB2', symbol: '★', type: 'angular' }, // More complex angular
        { name: 'heart', color: '#FF6F61', symbol: '♥', type: 'round' } // More complex round
    ];
    const targetTypes = [
        { name: 'Round Shapes', type: 'round', color: '#FF6F61'},
        { name: 'Angular Shapes', type: 'angular', color: '#118AB2' }
    ];

    let currentShapeToDrag;
    let shapeContainer, dropZonesContainer;

    function initGame() {
        gameContainer.innerHTML = '';
        gameContainer.style.display = 'flex';
        gameContainer.style.flexDirection = 'column';
        gameContainer.style.alignItems = 'center';
        gameContainer.style.padding = '20px';
        gameContainer.style.fontFamily = 'Nunito, sans-serif';

        const instruction = document.createElement('p');
        instruction.textContent = 'Drag the shape to the correct category!';
        instruction.style.fontSize = '1.2em';
        instruction.style.color = '#073B4C';
        instruction.style.marginBottom = '20px';
        gameContainer.appendChild(instruction);

        shapeContainer = document.createElement('div');
        shapeContainer.id = 'shape-to-drag-area';
        shapeContainer.style.marginBottom = '30px';
        shapeContainer.style.padding = '20px';
        shapeContainer.style.border = '2px dashed #073B4C';
        shapeContainer.style.borderRadius = '10px';
        shapeContainer.style.minHeight = '100px';
        shapeContainer.style.display = 'flex';
        shapeContainer.style.justifyContent = 'center';
        shapeContainer.style.alignItems = 'center';
        gameContainer.appendChild(shapeContainer);

        dropZonesContainer = document.createElement('div');
        dropZonesContainer.id = 'drop-zones';
        dropZonesContainer.style.display = 'flex';
        dropZonesContainer.style.justifyContent = 'space-around';
        dropZonesContainer.style.width = '100%';
        dropZonesContainer.style.maxWidth = '500px';
        gameContainer.appendChild(dropZonesContainer);

        targetTypes.forEach(target => {
            const zone = document.createElement('div');
            zone.classList.add('drop-zone');
            zone.dataset.type = target.type;
            zone.textContent = target.name;
            zone.style.width = '180px';
            zone.style.height = '150px';
            zone.style.border = `3px dashed ${target.color}`;
            zone.style.borderRadius = '10px';
            zone.style.display = 'flex';
            zone.style.justifyContent = 'center';
            zone.style.alignItems = 'center';
            zone.style.fontSize = '1.3em';
            zone.style.color = target.color;
            zone.style.backgroundColor = '#f0f0f0';
            zone.style.transition = 'background-color 0.3s ease';

            zone.addEventListener('dragover', handleDragOver);
            zone.addEventListener('drop', handleDrop);
            zone.addEventListener('dragenter', handleDragEnter);
            zone.addEventListener('dragleave', handleDragLeave);
            dropZonesContainer.appendChild(zone);
        });

        updateScoreDisplay(score);
        spawnNewShape();
    }

    function spawnNewShape() {
        shapeContainer.innerHTML = ''; // Clear previous shape
        currentShapeToDrag = shapes[Math.floor(Math.random() * shapes.length)];
        
        const shapeEl = document.createElement('div');
        shapeEl.textContent = currentShapeToDrag.symbol;
        shapeEl.id = 'draggable-shape';
        shapeEl.draggable = true;
        shapeEl.style.fontSize = '4em';
        shapeEl.style.color = currentShapeToDrag.color;
        shapeEl.style.cursor = 'grab';
        shapeEl.style.padding = '10px';
        shapeEl.addEventListener('dragstart', handleDragStart);
        shapeContainer.appendChild(shapeEl);
    }

    function handleDragStart(event) {
        event.dataTransfer.setData('text/plain', currentShapeToDrag.name); // Not strictly needed but good practice
        event.target.style.opacity = '0.5';
    }

    function handleDragOver(event) {
        event.preventDefault(); // Necessary to allow dropping
    }

    function handleDragEnter(event) {
        if (event.target.classList.contains('drop-zone')) {
            event.target.style.backgroundColor = '#e0e0e0';
        }
    }

    function handleDragLeave(event) {
        if (event.target.classList.contains('drop-zone')) {
            event.target.style.backgroundColor = '#f0f0f0';
        }
    }

    function handleDrop(event) {
        event.preventDefault();
        const dropZone = event.target.closest('.drop-zone');
        if (!dropZone) return;

        dropZone.style.backgroundColor = '#f0f0f0'; // Reset background
        document.getElementById('draggable-shape').style.opacity = '1';

        const droppedShapeType = currentShapeToDrag.type;
        const targetZoneType = dropZone.dataset.type;

        if (droppedShapeType === targetZoneType) {
            score += 10;
            showFeedback('Correct! 👍', '#06D6A0');
        } else {
            score = Math.max(0, score - 5);
            showFeedback('Oops! Wrong category. 😟', '#FF6F61');
        }
        updateScoreDisplay(score);
        
        if (score >= 50) { // Arbitrary win condition for demo
            endGame(true);
        } else if (score < 0 && initialScore >=0) { // Game over if score becomes negative after starting positive
            endGame(false);
        } else {
            spawnNewShape();
        }
    }

    let feedbackTimeout;
    function showFeedback(message, color) {
        let feedbackEl = gameContainer.querySelector('#game-feedback');
        if (!feedbackEl) {
            feedbackEl = document.createElement('div');
            feedbackEl.id = 'game-feedback';
            feedbackEl.style.position = 'fixed';
            feedbackEl.style.top = '80px';
            feedbackEl.style.left = '50%';
            feedbackEl.style.transform = 'translateX(-50%)';
            feedbackEl.style.padding = '10px 20px';
            feedbackEl.style.borderRadius = '8px';
            feedbackEl.style.fontSize = '1.2em';
            feedbackEl.style.zIndex = '1000';
            feedbackEl.style.transition = 'opacity 0.5s ease';
            gameContainer.appendChild(feedbackEl);
        }
        feedbackEl.textContent = message;
        feedbackEl.style.backgroundColor = color;
        feedbackEl.style.color = 'white';
        feedbackEl.style.opacity = '1';

        clearTimeout(feedbackTimeout);
        feedbackTimeout = setTimeout(() => {
            feedbackEl.style.opacity = '0';
        }, 1500);
    }
    
    function updateScoreDisplay(newScore) {
        score = newScore;
        updateScoreCallback(score);
    }

    function endGame(isWin) {
        gameContainer.innerHTML = '';
        const message = isWin ? `Congratulations! You reached ${score} points!` : `Game Over! Your final score is ${score}.`;
        const endMessageEl = document.createElement('div');
        endMessageEl.innerHTML = `${message}<br><img src="https://source.unsplash.com/random/200x150/?${isWin ? 'celebration' : 'gameover'}" alt="${isWin ? 'Celebration' : 'Game Over'}" style="margin-top:15px; border-radius: 8px;">`;
        endMessageEl.style.textAlign = 'center';
        endMessageEl.style.color = '#073B4C';
        endMessageEl.style.fontSize = '1.5em';
        gameContainer.appendChild(endMessageEl);

        const restartButton = document.createElement('button');
        restartButton.textContent = 'Play Again?';
        restartButton.style.padding = '10px 20px';
        restartButton.style.fontSize = '1em';
        restartButton.style.backgroundColor = '#FF6F61'; // Coral
        restartButton.style.color = 'white';
        restartButton.style.border = 'none';
        restartButton.style.borderRadius = '5px';
        restartButton.style.marginTop = '20px';
        restartButton.style.cursor = 'pointer';
        restartButton.onclick = () => {
            score = 0; // Reset score for a new game
            initGame();
        };
        gameContainer.appendChild(restartButton);
    }

    initGame();
    console.log('Game Three (Shape Sorting) Loaded');
};