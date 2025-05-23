// js/score_manager.js
// IMPORTANT: This script assumes `js/lib/sql-wasm.js` is loaded BEFORE it.

const scoreManager = (() => {
    let db; // Will hold the SQLite database instance
    let initPromise = null; // Promise for a single initialization

    const dbPath = 'data/kids_games.db'; // Path to the SQLite DB file (seed)
    const localStorageKey = 'kidsGamesDbPersistent';
    // The wasm file path is relative to the HTML, but initSqlJs's locateFile needs path relative to where sql-wasm.js is if not same dir
    // Assuming sql-wasm.js and sql-wasm.wasm are both in js/lib/
    const wasmConfig = { locateFile: file => `js/lib/${file}` };

    async function _saveDbToLocalStorage() {
        if (!db) {
            console.warn("Attempted to save DB, but DB instance is not available.");
            return;
        }
        try {
            const dbData = db.export(); // Uint8Array
            // Efficiently convert Uint8Array to Base64 string
            // 1. Convert Uint8Array to a binary string
            let binary = '';
            const len = dbData.byteLength;
            for (let i = 0; i < len; i++) {
                binary += String.fromCharCode(dbData[i]);
            }
            // 2. Convert binary string to Base64
            const base64String = btoa(binary);
            localStorage.setItem(localStorageKey, base64String);
            console.log("Database state saved to localStorage.");
        } catch (e) {
            console.error("Failed to save database to localStorage:", e);
        }
    }

    async function _initialize() {
        try {
            if (!window.initSqlJs) {
                const errorMsg = "SQL.js library (sql-wasm.js) not loaded. Make sure it's included before score_manager.js";
                console.error(errorMsg);
                throw new Error(errorMsg);
            }
            
            const SQL = await window.initSqlJs(wasmConfig);
            let dbLoadedFromStorage = false;

            try {
                const savedDbBase64 = localStorage.getItem(localStorageKey);
                if (savedDbBase64) {
                    const binaryString = atob(savedDbBase64);
                    const len = binaryString.length;
                    const bytes = new Uint8Array(len);
                    for (let i = 0; i < len; i++) {
                        bytes[i] = binaryString.charCodeAt(i);
                    }
                    db = new SQL.Database(bytes);
                    console.log("Database loaded from localStorage.");
                    dbLoadedFromStorage = true;
                }
            } catch (e) {
                console.warn("Failed to load database from localStorage, or localStorage is not available (this may be normal on first run or if data is corrupted):", e);
                localStorage.removeItem(localStorageKey); // Clear potentially corrupted data
            }

            if (!dbLoadedFromStorage) {
                let dbFileBuffer = null;
                try {
                    const response = await fetch(dbPath);
                    if (response.ok) {
                        dbFileBuffer = await response.arrayBuffer();
                        if (dbFileBuffer && dbFileBuffer.byteLength > 0) {
                            console.log(`Database file loaded successfully from ${dbPath} (${dbFileBuffer.byteLength} bytes). Initializing with this.`);
                            db = new SQL.Database(new Uint8Array(dbFileBuffer));
                        } else {
                            console.warn(`Fetched database file at ${dbPath} is empty or invalid. Creating new database.`);
                            db = new SQL.Database();
                        }
                    } else {
                        console.warn(`Failed to fetch database file at ${dbPath} (status: ${response.status}). This is normal if the DB doesn't exist yet. Creating new database.`);
                        db = new SQL.Database();
                    }
                } catch (error) {
                    console.warn(`Error fetching ${dbPath}: ${error}. This might be a network issue or CSP. Creating new database.`);
                    db = new SQL.Database();
                }
            }
            
            // Ensure the scores table exists
            db.run(`
                CREATE TABLE IF NOT EXISTS scores (
                    game_id TEXT PRIMARY KEY,
                    score INTEGER DEFAULT 0
                );
            `);

            // Ensure known games have an entry (e.g. for displaying 0 score initially or if DB was new/from seed)
            const knownGames = ['game_one', 'game_two_solving', 'game_three'];
            knownGames.forEach(gameId => {
                try {
                    // This will insert if game_id doesn't exist, or do nothing if it exists.
                    // If it exists, its score remains unchanged by this specific operation.
                    db.run("INSERT OR IGNORE INTO scores (game_id, score) VALUES (?, ?)", [gameId, 0]);
                } catch (e) {
                    console.error(`Error ensuring score entry for ${gameId}:`, e);
                }
            });

            console.log("Score manager initialized. Database is ready.");
            // If the DB was not loaded from localStorage (i.e., it's from fetched seed or a new DB),
            // save its current state (which includes ensured table and known games) to localStorage.
            if (!dbLoadedFromStorage) { 
                await _saveDbToLocalStorage();
            }
            return true; 
        } catch (err) {
            console.error("Failed to initialize score manager:", err);
            db = null; 
            throw err; 
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
        await initialize(); 
        if (!db) throw new Error("Database not available in getScore. Initialization might have failed.");
        
        try {
            const stmt = db.prepare("SELECT score FROM scores WHERE game_id = :gameId");
            stmt.bind({ ':gameId': gameId });
            let currentScore = 0;
            if (stmt.step()) { // true if row found
                const row = stmt.get(); // Returns an array, e.g., [50]
                if (row && typeof row[0] === 'number') {
                    currentScore = row[0];
                }
            }
            stmt.free();
            return currentScore;
        } catch (err) {
            console.error(`Error getting score for ${gameId}:`, err);
            return 0; // Return default score on error or if not found
        }
    }

    async function updateScore(gameId, newScore) {
        await initialize(); 
        if (!db) throw new Error("Database not available in updateScore. Initialization might have failed.");

        if (typeof newScore !== 'number' || isNaN(newScore) || newScore < 0) {
            console.error("Invalid score provided: must be a non-negative number.", newScore);
            return false;
        }
        try {
            const currentScoreInDb = await getScore(gameId); 

            if (newScore > currentScoreInDb) {
                 db.run("INSERT OR REPLACE INTO scores (game_id, score) VALUES (:gameId, :score)", {
                    ':gameId': gameId,
                    ':score': newScore
                });
                console.log(`Score updated for ${gameId} from ${currentScoreInDb} to ${newScore}.`);
                await _saveDbToLocalStorage(); // Save after successful update
                return true;
            }
            console.log(`New score ${newScore} is not higher than current ${currentScoreInDb} for ${gameId}. No update.`);
            return false; 
        } catch (err) {
            console.error(`Error updating score for ${gameId}:`, err);
            return false;
        }
    }
    
    async function getAllScores() {
        await initialize(); 
        if (!db) throw new Error("Database not available in getAllScores. Initialization might have failed.");
        
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

    // Exposed methods
    return {
        initialize,
        getScore,
        updateScore,
        getAllScores
    };
})();

// Make scoreManager globally accessible
window.scoreManager = scoreManager;
