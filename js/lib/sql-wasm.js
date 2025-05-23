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
        factory(root); // Ensures initSqlJs is set on global 'root' (e.g. window.initSqlJs)
    }
}(typeof self !== 'undefined' ? self : this, function (exports) { // 'exports' is 'root' (window in browser)
    var sqlInitPromise = null;

    // Default locateFile function, used if no specific locateFile is provided in config.
    // It's called by Emscripten runtime with (filename, scriptDirectoryFromEmscripten).
    var locateFile = function(path, scriptDirectoryFromEmscripten) {
        // console.log(`locateFile called with: path="${path}", scriptDirectoryFromEmscripten="${scriptDirectoryFromEmscripten}"`);
        if (path.endsWith('.wasm')) { // Only customize for .wasm file
            let calculatedScriptDir = '';
            // Try to get the directory of the current script (sql-wasm.js)
            if (typeof document !== 'undefined' && document.currentScript && document.currentScript.src) {
                try {
                    // Best way: Use URL API
                    calculatedScriptDir = new URL('./', document.currentScript.src).href;
                } catch (e) {
                    // Fallback for environments where URL API on document.currentScript.src might fail
                    calculatedScriptDir = document.currentScript.src.substring(0, document.currentScript.src.lastIndexOf('/') + 1);
                }
            }

            // Use Emscripten's provided scriptDirectory if available and seems valid, 
            // otherwise use our calculated one, or default to relative path.
            let baseDir = scriptDirectoryFromEmscripten || calculatedScriptDir || './';
            
            // Ensure baseDir ends with a slash
            if (baseDir && !baseDir.endsWith('/')) {
                baseDir += '/';
            }
            
            // If path is already absolute or a full URL, use it directly
            if (path.startsWith('/') || /^(http|https|file):/.test(path)) {
                // console.log(`locateFile: path "${path}" is absolute/URL, returning as is.`);
                return path;
            }
            // console.log(`locateFile: resolving wasm path "${path}" relative to baseDir "${baseDir}". Result: "${baseDir + path}"`);
            return baseDir + path; // Relative path
        }
        // For non-wasm files, Emscripten's default behavior (scriptDirectory + path) is generally fine.
        // console.log(`locateFile: path "${path}" is not wasm, returning "${(scriptDirectoryFromEmscripten || '') + path}"`);
        return (scriptDirectoryFromEmscripten || '') + path;
    };

    exports.initSqlJs = function (config) {
        if (sqlInitPromise) {
            return sqlInitPromise;
        }

        sqlInitPromise = new Promise((resolve, reject) => {
            var Module = {};
            // User can override locateFile, otherwise use our default.
            // This Module.locateFile will be called by the (simulated) Emscripten runtime.
            Module.locateFile = (config && config.locateFile) || locateFile;
            
            Module.onRuntimeInitialized = function() {
                // This is called after the WASM is loaded and compiled by the Emscripten runtime.
                // The SQL.js API (e.g., Database constructor) should be on Module.
                if (Module.Database) {
                  resolve({ Database: Module.Database });
                } else if (Module.default && Module.default.Database) { // Handle cases where SQL.js might be an ES module default export
                  resolve({ Database: Module.default.Database });
                } else {
                  // Fallback: If Database isn't found, but Module exists, resolve with Module.
                  console.warn('SQL.js WASM loaded, but Module.Database not found directly. Attempting to use Module as SQL object. This might require `new SQL.SQL.Database()` or similar.');
                  resolve(Module); 
                }
            };

            Module.printErr = function(message) {
                console.error('SQL.js Error:', message);
                // Ensure promise is rejected only once and state is cleared for potential retry
                if (sqlInitPromise) { 
                    sqlInitPromise = null; 
                    reject(new Error('SQL.js WASM Error: ' + message));
                }
            };

            // The actual sql-wasm.js (from an SQL.js distribution) IS the Emscripten-generated loader + runtime.
            // This placeholder simulates the *fetching* part of what that runtime would do.
            // It does NOT include the Emscripten runtime itself to compile/instantiate the WASM.

            // Determine path for sql-wasm.wasm using the effective locateFile function.
            // The second argument to `Module.locateFile` (scriptDir) is what Emscripten would typically pass.
            // We determine a best-guess for this script's directory.
            let scriptDirGuess = '';
            if (typeof document !== 'undefined' && document.currentScript && document.currentScript.src) {
                 try { scriptDirGuess = new URL('./', document.currentScript.src).href; } 
                 catch (e) { scriptDirGuess = document.currentScript.src.substring(0, document.currentScript.src.lastIndexOf('/') + 1); }
            } else if (typeof self !== 'undefined' && self.location) {
                // Fallback for web workers or environments without document.currentScript
                try { scriptDirGuess = new URL('./', self.location.href).href; }
                catch(e) { /* unable to guess reliably, scriptDirGuess remains empty */ }
            }
            if (scriptDirGuess && !scriptDirGuess.endsWith('/')) { scriptDirGuess += '/'; }


            const wasmPath = Module.locateFile('sql-wasm.wasm', scriptDirGuess);
            console.log('Conceptual SQL.js: Attempting to load sql-wasm.wasm from:', wasmPath);
            
            fetch(wasmPath)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Failed to fetch SQL.js WASM file: ${response.statusText} from ${response.url}`);
                }
                return response.arrayBuffer();
            })
            .then(bytes => {
                Module.wasmBinary = bytes; // The Emscripten runtime would use this.
                
                // --- This is where the actual Emscripten runtime would take over ---
                // It would compile `Module.wasmBinary` and then call `Module.onRuntimeInitialized`.
                // Since this placeholder doesn't have that runtime, we provide strong warnings
                // and a crude simulation.

                // Check if a global SQL object with an 'init' method (possibly from an older/different SQL.js) exists.
                if (typeof self !== 'undefined' && self.SQL && typeof self.SQL.init === 'function') {
                    console.warn('Conceptual SQL.js: Found self.SQL.init. Attempting to use it. This might be from an older SQL.js version or a different setup.');
                    return self.SQL.init({ wasmBinary: Module.wasmBinary }).then(SQL_API => {
                        if (SQL_API && SQL_API.Database) {
                            resolve(SQL_API);
                        } else if (SQL_API) {
                            console.warn('Conceptual SQL.js: self.SQL.init resolved, but the API structure might differ. Resolved with:', SQL_API);
                            resolve(SQL_API);
                        } else {
                            throw new Error('self.SQL.init resolved with undefined or null.');
                        }
                    }).catch(err => {
                        console.error('Conceptual SQL.js: self.SQL.init failed:', err);
                        throw new Error('Conceptual SQL.js: self.SQL.init failed: ' + (err.message || err));
                    });
                } else {
                    // Standard path for this placeholder if no self.SQL.init is found.
                    console.warn('This is a conceptual sql-wasm.js. For real functionality, replace this file with the official one from the SQL.js project (e.g., from GitHub releases).');
                    console.warn('The `sql-wasm.wasm` file is expected to be in the path resolved by `locateFile` (defaulting to the same directory as this script or as configured). Ensure `sql-wasm.wasm` is present at:', wasmPath);
                    
                    // Simulate that after wasmBinary is set, some internal mechanism (missing here)
                    // would make `Module.Database` available and eventually call `onRuntimeInitialized`.
                    setTimeout(() => {
                        if (!Module.Database && !(Module.default && Module.default.Database)) {
                             console.warn("Conceptual SQL.js: Module.Database not found after WASM load simulation. `onRuntimeInitialized` will proceed; it might resolve with Module itself or fail if Database constructor is essential and missing.");
                        }
                        Module.onRuntimeInitialized(); 
                    }, 0); // Use setTimeout to allow any microtasks from fetch/then to complete.
                }
            })
            .catch(err => {
                console.error('Error loading or initializing SQL.js WASM (Conceptual Placeholder):', err);
                if (sqlInitPromise) {
                    sqlInitPromise = null;
                    reject(err);
                }
            });
        });
        return sqlInitPromise;
    };

    // Example of how it might be used (as in score_manager.js):
    // initSqlJs({ locateFile: file => `js/lib/${file}` })
    //  .then(SQL => {
    //      const db = new SQL.Database(); // or SQL.default.Database() or new SQL().Database() depending on resolution
    //      // ... use db
    //  });

}));
