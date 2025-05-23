// js/main.js
document.addEventListener('DOMContentLoaded', async () => {
    console.log("Main dashboard script loaded. Welcome to Kids Games!");

    // Attempt to initialize score manager if it's available.
    // This is useful if index.html needs to display global scores or stats.
    // For this to work, `sql-wasm.js` and `score_manager.js` must be loaded before this script on index.html.
    if (window.scoreManager && typeof window.scoreManager.initialize === 'function') {
        try {
            console.log("Initializing Score Manager from main.js...");
            await window.scoreManager.initialize();
            console.log("Score Manager initialized successfully from main.js.");
            
            // Example: You could fetch and display all high scores here if desired
            // const allScores = await window.scoreManager.getAllScores();
            // console.log("All game scores:", allScores);
            // renderHighScores(allScores); // A function you would create
        } catch (error) {
            console.error("Failed to initialize Score Manager from main.js:", error);
            // Optionally, inform the user that score features might be limited
        }
    } else {
        console.warn("Score Manager (score_manager.js or its dependency sql-wasm.js) not found or not loaded prior to main.js. Score functionalities on the dashboard might be unavailable.");
    }

    // Add any specific JavaScript interactions for the dashboard (index.html) below.
    // For example, animations on game cards, dynamic content loading, etc.
    const gameCards = document.querySelectorAll('.game-card');
    gameCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            // Example: Add a subtle animation or effect on hover
        });
        card.addEventListener('mouseleave', () => {
            // Example: Remove the effect
        });
    });

});

// Example function (you would need to define where to render this)
/*
function renderHighScores(scores) {
    const container = document.getElementById('high-scores-container'); // Assuming such an element exists
    if (!container) return;
    if (scores.length === 0) {
        container.innerHTML = '<p>No scores recorded yet!</p>';
        return;
    }
    let html = '<ul>';
    scores.forEach(score => {
        html += `<li>${score.game_id.replace(/_/g, ' ')}: ${score.score}</li>`;
    });
    html += '</ul>';
    container.innerHTML = html;
}
*/
