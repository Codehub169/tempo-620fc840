// js/score_manager.js
// IMPORTANT: This script assumes `js/lib/sql-wasm.js` is loaded BEFORE it.

const scoreManager = (() => {
    let db; // Will hold the SQLite database instance
    let initPromise = null; // Promise for a single initialization

    const dbPath = 'data/kids_games.db'; // Path to the SQLite DB file (read-only for fetch)
    // The wasm file path is relative to the HTML, but initSqlJs's locateFile needs path relative to where sql-wasm.js is if not same dir
    // Assuming sql-wasm.js and sql-wasm.wasm are both in js/lib/
    const wasmConfig = { locateFile: file => `js/lib/${file}` }; 

    async function _initialize() {
        try {
            if (!window.initSqlJs) {
                const errorMsg = "SQL.js library (sql-wasm.js) not loaded. Make sure it's included before score_manager.js";
                console.error(errorMsg);
                throw new Error(errorMsg);
            }
            
            const SQL = await window.initSqlJs(wasmConfig);

            let dbFileBuffer = null;
            try {
                const response = await fetch(dbPath);
                if (response.ok) {
                    dbFileBuffer = await response.arrayBuffer();
                    if (dbFileBuffer && dbFileBuffer.byteLength > 0) {
                        console.log(`Database file loaded successfully from ${dbPath} (${dbFileBuffer.byteLength} bytes).`);
                        db = new SQL.Database(new Uint8Array(dbFileBuffer));
                    } else {
                        console.warn(`Fetched database file at ${dbPath} is empty or invalid. Creating new in-memory DB.`);
                        db = new SQL.Database(); // Create a new empty database
                    }
                } else {
                    console.warn(`Failed to fetch database file at ${dbPath} (status: ${response.status}). This is normal if the DB doesn't exist yet. Creating new in-memory DB.`);
                    db = new SQL.Database(); // Create a new empty database
                }
            } catch (error) {
                console.warn(`Error fetching ${dbPath}: ${error}. This might be a network issue or CSP. Creating new in-memory DB.`);
                db = new SQL.Database(); // Create a new empty database
            }
            
            // Create scores table if it doesn't exist. Stores the highest score per game.
            db.run(`
                CREATE TABLE IF NOT EXISTS scores (
                    game_id TEXT PRIMARY KEY,
                    score INTEGER DEFAULT 0
                );
            `);

            // Ensure known games have an entry (e.g. for displaying 0 score initially)
            const knownGames = ['game_one', 'game_two_solving', 'game_three'];
            knownGames.forEach(gameId => {
                try {
                    db.run("INSERT OR IGNORE INTO scores (game_id, score) VALUES (?, ?)", [gameId, 0]);
                } catch (e) {
                    console.error(`Error ensuring score entry for ${gameId}:`, e);
                }
            });

            console.log("Score manager initialized successfully. Database is in-memory.");
            // Note: Changes to this DB are in-memory. For persistence on a static site,
            // one would need to use localStorage to save/load db.export() or have a backend.
            return true; // Indicate success
        } catch (err) {
            console.error("Failed to initialize score manager:", err);
            db = null; // Ensure db is null if init fails
            throw err; // Propagate error to allow callers to handle it
        }
    }

    function initialize() {
        if (!initPromise) {
            initPromise = _initialize().catch(err => {
                initPromise = null; // Reset promise on failure to allow retry if desired
                throw err;
            });
        }
        return initPromise;
    }

    async function getScore(gameId) {
        await initialize(); // Ensure DB is ready
        if (!db) throw new Error("Database not available in getScore.");
        
        try {
            const stmt = db.prepare("SELECT score FROM scores WHERE game_id = :gameId");
            stmt.bind({ ':gameId': gameId });
            let currentScore = 0;
            if (stmt.step()) { // true if row found
                currentScore = stmt.get()[0];
            }
            stmt.free();
            return currentScore;
        } catch (err) {
            console.error(`Error getting score for ${gameId}:`, err);
            return 0; // Return default score on error
        }
    }

    async function updateScore(gameId, newScore) {
        await initialize(); // Ensure DB is ready
        if (!db) throw new Error("Database not available in updateScore.");

        if (typeof newScore !== 'number' || newScore < 0) {
            console.error("Invalid score provided:", newScore);
            return false;
        }
        try {
            const currentScore = await getScore(gameId); // getScore already ensures init
            if (newScore > currentScore) {
                 db.run("INSERT OR REPLACE INTO scores (game_id, score) VALUES (:gameId, :score)", {
                    ':gameId': gameId,
                    ':score': newScore
                });
                console.log(`Score updated for ${gameId} from ${currentScore} to ${newScore}.`);
                return true;
            }
            console.log(`New score ${newScore} is not higher than current ${currentScore} for ${gameId}.`);
            return false; // Score not higher
        } catch (err) {
            console.error(`Error updating score for ${gameId}:`, err);
            return false;
        }
    }
    
    async function getAllScores() {
        await initialize(); // Ensure DB is ready
        if (!db) throw new Error("Database not available in getAllScores.");
        
        try {
            const results = [];
            const stmt = db.prepare("SELECT game_id, score FROM scores ORDER BY game_id");
            while(stmt.step()) {
                results.push(stmt.getAsObject());
            }
            stmt.free();
            return results;
        } catch (err) {
            console.error("Error getting all scores:", err);
            return [];
        }
    }

    return {
        initialize,
        getScore,
        updateScore,
        getAllScores
    };
})();

// Make scoreManager globally accessible (optional, but common for this pattern without modules)
window.scoreManager = scoreManager;
