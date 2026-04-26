const http = require("http");
const fs = require("fs");

const PORT = 3000;
const FILE = "movies.json";

// Read data from JSON file
function readMovies(callback) {
    fs.readFile(FILE, "utf8", (err, data) => {
        if (err) return callback([]);
        try {
            callback(JSON.parse(data || "[]"));
        } catch {
            callback([]);
        }
    });
}

//write data from the file json step
function writeMovies(movies, callback) {
    fs.writeFile(FILE, JSON.stringify(movies, null, 2), callback);
}


function sendResponse(res, statusCode, data) {
    res.writeHead(statusCode, { "Content-Type": "application/json" });
    res.end(JSON.stringify(data));
}

const server = http.createServer((req, res) => {
    const urlParts = req.url.split("/");
    const id = parseInt(urlParts[2]);

    
    if (req.method === "GET" && req.url === "/movies") {
        readMovies(movies => {
            sendResponse(res, 200, movies);
        });
    }

    
    else if (req.method === "GET" && urlParts[1] === "movies" && id) {
        readMovies(movies => {
            const movie = movies.find(m => m.id === id);
            if (movie) {
                sendResponse(res, 200, movie);
            } else {
                sendResponse(res, 404, { message: "Movie not found" });
            }
        });
    }

    
    else if (req.method === "POST" && req.url === "/movies") {
        let body = "";

        req.on("data", chunk => {
            body += chunk;
        });

        req.on("end", () => {
            const newMovie = JSON.parse(body);

            readMovies(movies => {
                newMovie.id = movies.length > 0
                    ? movies[movies.length - 1].id + 1
                    : 1;

                movies.push(newMovie);

                writeMovies(movies, () => {
                    sendResponse(res, 201, {
                        message: "Movie added",
                        movie: newMovie
                    });
                });
            });
        });
    }

    
    else if (req.method === "PUT" && urlParts[1] === "movies" && id) {
        let body = "";

        req.on("data", chunk => {
            body += chunk;
        });

        req.on("end", () => {
            const updatedData = JSON.parse(body);

            readMovies(movies => {
                const index = movies.findIndex(m => m.id === id);

                if (index === -1) {
                    return sendResponse(res, 404, {
                        message: "Movie not found"
                    });
                }

                movies[index] = {
                    ...movies[index],
                    ...updatedData
                };

                writeMovies(movies, () => {
                    sendResponse(res, 200, {
                        message: "Movie updated",
                        movie: movies[index]
                    });
                });
            });
        });
    }


    else if (req.method === "DELETE" && urlParts[1] === "movies" && id) {

        readMovies(movies => {
            const filtered = movies.filter(m => m.id !== id);

            if (filtered.length === movies.length) {
                return sendResponse(res, 404, {
                    message: "Movie not found"
                });
            }

            writeMovies(filtered, () => {
                sendResponse(res, 200, {
                    message: "Movie deleted"
                });
            });
        });
    }

    
    else {
        sendResponse(res, 404, {
            message: "Route not found"
        });
    }
});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
// testing comleted