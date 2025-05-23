// js/game_player.js
// This script relies on score_manager.js and its dependency (sql-wasm.js) being loaded first.

document.addEventListener('DOMContentLoaded', async () => {
    // Helper function to safely display error messages in gameContainer involving dynamic unsafe content
    function displayErrorInGameContainer(prefix, dynamicContent, suffix) {
        if (!gameContainer) return;
        gameContainer.innerHTML = ''; // Clear previous content
        const p = document.createElement('p');
        p.appendChild(document.createTextNode(prefix));
        if (dynamicContent) {
            const strong = document.createElement('strong'); // Make dynamic part stand out
            strong.textContent = dynamicContent; // Safely sets text
            p.appendChild(strong);
        }
        p.appendChild(document.createTextNode(suffix));
        gameContainer.appendChild(p);
    }

    const gameTitleElement = document.getElementById('game-page-title'); // Changed from 'game-title'
    const gameContainer = document.getElementById('game-container');
    const scoreValueElement = document.getElementById('current-score'); // Changed from 'score-value'
    const backButton = document.querySelector('header .back-button'); // More specific selector for game.html's header

    if (!gameTitleElement || !gameContainer || !scoreValueElement) {
        console.error('Essential UI elements for game player are missing!');
        if (gameContainer) gameContainer.innerHTML = '<p>Error: Page structure is incomplete. Cannot load game.</p>';
        return;
    }

    if (backButton) {
        backButton.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent default anchor behavior if it's an <a> tag
            window.location.href = 'index.html';
        });
    }

    const params = new URLSearchParams(window.location.search);
    const gameId = params.get('game');

    if (!gameId) {
        gameContainer.innerHTML = '<p>No game selected. Please <a href="index.html">go back to the dashboard</a> and choose a game.</p>';
        gameTitleElement.textContent = 'Error - No Game';
        return;
    }

    const GAME_ID_PATTERN = /^[a-zA-Z0-9_]+$/; // Allow alphanumeric and underscores for security
    if (!GAME_ID_PATTERN.test(gameId)) {
        gameContainer.innerHTML = '<p>Invalid game identifier format. Please check the game ID or <a href="index.html">go back to the dashboard</a>.</p>';
        gameTitleElement.textContent = 'Error - Invalid Game ID';
        return;
    }

    // Format gameId to a more readable title (e.g., "game_one" -> "Game One")
    const formattedGameTitle = gameId
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    gameTitleElement.textContent = formattedGameTitle;

    try {
        // Ensure scoreManager is available and initialized
        if (!window.scoreManager || typeof window.scoreManager.initialize !== 'function') {
            throw new Error("Score Manager is not available. Ensure score_manager.js is loaded correctly.");
        }
        await window.scoreManager.initialize();
        console.log("Score Manager initialized successfully for game player.");

        // Load initial score for the current game
        const initialScore = await window.scoreManager.getScore(gameId);
        scoreValueElement.textContent = initialScore;

        // Define the callback function for games to update the score
        const updateScoreDisplayAndPersist = async (newScore) => {
            if (typeof newScore !== 'number') {
                console.warn("Game attempted to update score with non-numeric value:", newScore);
                return;
            }
            try {
                const scoreUpdated = await window.scoreManager.updateScore(gameId, newScore);
                const currentHighestScore = await window.scoreManager.getScore(gameId); // Fetch the latest score from DB
                scoreValueElement.textContent = currentHighestScore; // Always display the authoritative score
                
                if (scoreUpdated) {
                    console.log(`Score for ${gameId} successfully updated to ${newScore} (DB highest: ${currentHighestScore}).`);
                    // TODO: Implement basic sound effect for score update (future feature)
                    // e.g., playSound('score-increase.mp3');
                }
            } catch (error) {
                console.error("Error during score update process:", error);
                // Optionally, display a subtle error to the user if score persistence fails
            }
        };

        // Dynamically load the specific game script
        const gameScriptPath = `js/games/${gameId}.js`;
        const script = document.createElement('script');
        script.src = gameScriptPath;
        script.type = 'text/javascript'; // Optional, but good practice
        script.onload = () => {
            console.log(`${gameScriptPath} loaded successfully.`);
            // Convention: Game scripts define a function: `window.start[GameName]Game`
            // e.g., for 'game_one', it's `window.startGameOneGame`
            // for 'game_two_solving', it's `window.startGameTwoSolvingGame`
            const gameFunctionName = `start${gameId.split('_').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('')}Game`;
            
            if (typeof window[gameFunctionName] === 'function') {
                // Call the game's main function, passing the container, score update callback, and initial score
                window[gameFunctionName](gameContainer, updateScoreDisplayAndPersist, initialScore);
            } else {
                console.error(`Game start function '${gameFunctionName}' not found in ${gameScriptPath}.`);
                displayErrorInGameContainer(
                    "Error: Could not initialize game logic for '",
                    formattedGameTitle,
                    "'. The game file might be missing or does not define the required start function."
                );
            }
        };
        script.onerror = () => {
            console.error(`Failed to load game script: ${gameScriptPath}`);
            displayErrorInGameContainer(
                "Error: Failed to load the game script for '",
                formattedGameTitle,
                "'. Please check if the file exists and there are no network errors."
            );
        };
        document.body.appendChild(script); // Append to body to ensure execution

    } catch (error) {
        console.error("Fatal error setting up game environment:", error);
        displayErrorInGameContainer(
            "Could not initialize the game environment: ",
            error.message, // error.message is generally safe but this helper ensures it's treated as text
            ". Please try refreshing the page or contact support."
        );
        gameTitleElement.textContent = 'Initialization Error';
    }
});
