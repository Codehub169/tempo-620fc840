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
        if (path.endsWith('.wasm')) {
            let calculatedScriptDir = '';
            if (typeof document !== 'undefined' && document.currentScript && document.currentScript.src) {
                try {
                    calculatedScriptDir = new URL('./', document.currentScript.src).href;
                } catch (e) {
                    calculatedScriptDir = document.currentScript.src.substring(0, document.currentScript.src.lastIndexOf('/') + 1);
                }
            }

            // Prefer Emscripten's provided scriptDirectory if available
            let baseDir = scriptDirectoryFromEmscripten || calculatedScriptDir || './';
            if (!baseDir.endsWith('/')) {
                baseDir += '/';
            }
            
            if (path.startsWith('/') || /^(http|https|file):/.test(path)) return path; // Absolute or full URL
            return baseDir + path;
        }
        // For non-wasm files, Emscripten's default behavior (scriptDirectory + path) is fine.
        return (scriptDirectoryFromEmscripten || '') + path;
    };

    exports.initSqlJs = function (config) {
        if (sqlInitPromise) {
            return sqlInitPromise;
        }

        sqlInitPromise = new Promise((resolve, reject) => {
            var Module = {};
            Module.locateFile = (config && config.locateFile) || locateFile;
            
            Module.onRuntimeInitialized = function() {
                if (Module.Database) {
                  resolve({ Database: Module.Database });
                } else if (Module.default && Module.default.Database) { // Handle cases where SQL.js might be an ES module default export
                  resolve({ Database: Module.default.Database });
                } else {
                  console.warn('SQL.js WASM loaded, but Module.Database not found directly. Attempting to use Module as SQL object.');
                  resolve(Module); 
                }
            };

            Module.printErr = function(message) {
                console.error('SQL.js Error:', message);
                reject(new Error('SQL.js WASM Error: ' + message));
            };

            // This placeholder simulates loading if the real SQL.js isn't present.
            // The actual sql-wasm.js from a distribution IS the Emscripten-generated loader + runtime.

            // Determine path for sql-wasm.wasm using the effective locateFile function
            const wasmPath = Module.locateFile('sql-wasm.wasm', 
                (typeof document !== 'undefined' && document.currentScript && document.currentScript.src) ? 
                document.currentScript.src.substring(0, document.currentScript.src.lastIndexOf('/') + 1) : './'
            );
            console.log('Placeholder: Attempting to load sql-wasm.wasm from: ', wasmPath);
            
            fetch(wasmPath)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Failed to fetch SQL.js WASM file: ${response.statusText} from ${response.url}`);
                }
                return response.arrayBuffer();
            })
            .then(bytes => {
                Module.wasmBinary = bytes;
                
                // In a real scenario, the Emscripten runtime (which IS sql-wasm.js) would now
                // compile and instantiate the WASM, then call Module.onRuntimeInitialized.
                // This placeholder doesn't include that runtime.

                // Check if a global SQL object with an 'init' method (possibly from an older/different SQL.js) exists.
                if (typeof self !== 'undefined' && self.SQL && typeof self.SQL.init === 'function') {
                    console.warn('Placeholder: Found self.SQL.init. Attempting to use it. This might be from an older SQL.js version.');
                    return self.SQL.init({ wasmBinary: Module.wasmBinary }).then(SQL_API => {
                        resolve(SQL_API); // Assuming SQL_API is what's expected (e.g., { Database: ... })
                    }).catch(err => {
                        console.error('Placeholder: self.SQL.init failed:', err);
                        reject(new Error('Placeholder: self.SQL.init failed: ' + (err.message || err)));
                    });
                } else {
                    console.warn('This is a placeholder sql-wasm.js. For real functionality, replace this file with the official one from the SQL.js project.');
                    console.warn('The `sql-wasm.wasm` file is expected to be in the path resolved by locateFile (e.g., same directory).');
                    
                    // Simulate that after wasmBinary is set, some internal mechanism (missing here)
                    // would make `Module.Database` available and eventually call `onRuntimeInitialized`.
                    // Since we don't have the Emscripten runtime, we'll try to manually trigger a check via `onRuntimeInitialized`.
                    setTimeout(() => {
                        if (!Module.Database && !(Module.default && Module.default.Database)) {
                             console.warn("Placeholder: Module.Database not found after WASM load simulation. Module.onRuntimeInitialized will proceed; it might resolve with Module itself or fail if Database constructor is essential.");
                        }
                        // Call onRuntimeInitialized to let it attempt to resolve the promise based on current Module state.
                        Module.onRuntimeInitialized(); 
                    }, 0);
                }
            })
            .catch(err => {
                console.error('Error loading or initializing SQL.js WASM (Placeholder):', err);
                reject(err);
            });
        });
        return sqlInitPromise;
    };

    // Example of how it might be used (as in score_manager.js):
    // initSqlJs({ locateFile: file => `js/lib/${file}` })
    //  .then(SQL => {
    //      const db = new SQL.Database();
    //      // ... use db
    //  });

}));
