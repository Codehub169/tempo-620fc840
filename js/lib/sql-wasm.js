// Standard SQL.js WASM loader (Conceptual - User should replace with actual sql-wasm.js from SQL.js distribution)
// This file is responsible for loading and initializing the sql-wasm.wasm file.

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD
        define(['exports'], factory);
    } else if (typeof exports === 'object' && typeof exports.nodeName !== 'string') {
        // CommonJS
        factory(exports);
    } else {
        // Browser globals
        factory(root.SQL = {});
    }
}(typeof self !== 'undefined' ? self : this, function (exports) {
    var sqlInitPromise = null;

    // Default path to the .wasm file. Assumes it's in the same directory.
    var locateFile = function(path, prefix) {
        // In a real SQL.js distribution, this function might be more complex
        // or might be configured during the build of SQL.js itself.
        // For this placeholder, we assume 'sql-wasm.wasm' is alongside 'sql-wasm.js'.
        if (path.endsWith('.wasm')) {
            // Construct URL relative to the current script's location if not absolute
            let scriptDir = '';
            if (typeof document !== 'undefined' && document.currentScript) {
                scriptDir = document.currentScript.src.substring(0, document.currentScript.src.lastIndexOf('/') + 1);
            }
            // Check if prefix is already part of the path to avoid duplication if SQL.js itself adds it.
            // This is a simplified assumption.
            if (prefix && !path.startsWith(prefix)){
                 return prefix + path;
            }
            // If path is already /js/lib/sql-wasm.wasm, use it. Otherwise, try to make it relative to scriptDir
            if (path.startsWith('/')) return path; // Absolute path
            return scriptDir + path; 
        }
        return prefix + path;
    };

    exports.initSqlJs = function (config) {
        if (sqlInitPromise) {
            return sqlInitPromise;
        }

        sqlInitPromise = new Promise((resolve, reject) => {
            var Module = {};
            Module.locateFile = (config && config.locateFile) || locateFile;
            
            Module.onRuntimeInitialized = function() {
                // The SQL object is now available on Module.FS, Module.Database, etc.
                // We are exposing the top-level `SQL` that was passed in (or created globally)
                // and attaching the Database constructor to it, similar to how official SQL.js does.
                if (Module.Database) {
                  resolve({ Database: Module.Database });
                } else {
                  // Fallback for older/different SQL.js structures if necessary
                  // This part is highly dependent on the actual SQL.js version
                  // For a modern SQL.js, Module itself might be the main export or contain `new SQL.Database()`
                  console.warn('SQL.js WASM loaded, but Module.Database not found directly. Attempting to use Module as SQL object.');
                  resolve(Module); 
                }
            };

            Module.printErr = function(message) {
                console.error('SQL.js Error:', message);
                reject(new Error(message));
            };

            // This is where the actual WASM loading script would be included or generated.
            // For a real SQL.js, the `sql-wasm.js` file itself contains a large script
            // that fetches and instantiates `sql-wasm.wasm`.
            // We'll simulate the call that would typically be at the end of that script.

            // Check if `SQL` function is already defined (by the actual SQL.js loader script)
            if (typeof SQL !== 'undefined' && typeof SQL.init === 'function') {
                SQL.init(Module).then(db => resolve({ Database: db.Database })).catch(reject);
            } else {
                // This is a placeholder for where the WebAssembly is fetched and compiled.
                // The actual sql.js library script does this internally.
                // If this file (`sql-wasm.js`) is *the* library script from a distribution,
                // it will handle this itself. We are just providing a conceptual structure.
                console.log('Attempting to load wasm: ', Module.locateFile('sql-wasm.wasm', ''));
                
                // The following is a conceptual fetch. The real SQL.js has its own bootstrap logic.
                fetch(Module.locateFile('sql-wasm.wasm', '')).then(response => {
                    if (!response.ok) {
                        throw new Error(`Failed to fetch SQL.js WASM file: ${response.statusText} from ${response.url}`);
                    }
                    return response.arrayBuffer();
                }).then(bytes => {
                    Module.wasmBinary = bytes;
                    // The actual SQL.js loader script would be self-executing or provide an init function.
                    // For this placeholder, we assume a global `SQL` object might be created by the WASM module itself
                    // or that `Module` gets populated correctly by the WASM instantiation process.
                    // This is a very simplified mock of the WASM loading process.
                    // The script tag that loads `sql-wasm.js` (this file) would typically be followed by
                    // the actual WASM loading logic if it's not self-contained.
                    
                    // The following is a simplified version of how SQL.js might set itself up.
                    // The actual `sql-wasm.js` from an official distribution is complex and self-contained.
                    // It defines `initSqlJs` which returns a promise that resolves with the SQL object.
                    // This placeholder tries to mimic that final step.
                    
                    // --- This is the part that is usually INSIDE the real sql-wasm.js --- 
                    // It's a self-executing function or a complex build artifact.
                    // We are trying to simulate its outcome.
                    // For a real scenario, this file (`js/lib/sql-wasm.js`) would BE the file from the SQL.js GitHub release.
                    
                    // A common pattern for SQL.js is to have a global `SQL` or `initSqlJs` function.
                    // Let's assume the WASM, once loaded with `Module.wasmBinary`, populates `Module` correctly.
                    if (self.SQL && self.SQL.init) { // If the actual SQL.js library was somehow preloaded
                        return self.SQL.init({ wasmBinary: Module.wasmBinary }).then(SQL_API => {
                            resolve(SQL_API);
                        });
                    } else {
                        // This is a very rough approximation. The real sql-wasm.js sets up 'Module' and its exports.
                        // We'll assume after wasmBinary is set, some internal mechanism in a *hypothetical*
                        // minimal SQL.js loader would make `Module.Database` available.
                        // In reality, you'd use the full, unmodified `sql-wasm.js` from the SQL.js project.
                        if (typeofalasql !== 'undefined') { // A common alternative, though not what was asked for
                             console.warn('Using alasql as a fallback, this is not SQL.js/SQLite');
                             resolve(alasql); // This is NOT SQLite, just a placeholder if everything else fails conceptually
                             return;
                        }
                        
                        // If a user is to drop in the real sql-wasm.js, it will define initSqlJs properly.
                        // This current placeholder structure is more for illustrating the .wasm loading part.
                        console.warn('This is a placeholder sql-wasm.js. For real functionality, replace this file with the official one from the SQL.js project.');
                        console.warn('The `sql-wasm.wasm` file is expected to be in the same directory (`js/lib/`).');
                        // Simulate that the 'Module' object itself becomes the API or contains it
                        // This is a guess; actual structure varies with SQL.js versions
                        setTimeout(() => { // Allow event loop to process if WASM init is async internally
                            if(Module.Database) {
                                resolve({ Database: Module.Database });
                            } else {
                                console.error('Failed to initialize SQL.js: `Module.Database` not found after attempting to load WASM.');
                                reject(new Error('SQL.js WASM initialization failed: Module.Database not found.'));
                            }
                        }, 0);
                    }
                }).catch(err => {
                    console.error('Error loading or initializing SQL.js WASM:', err);
                    reject(err);
                });
            }
        });
        return sqlInitPromise;
    };

    // Example of how it might be used (as in score_manager.js):
    // SQL.initSqlJs({ locateFile: file => `js/lib/${file}` })
    //  .then(SQL => {
    //      const db = new SQL.Database();
    //      // ... use db
    //  });

}));
