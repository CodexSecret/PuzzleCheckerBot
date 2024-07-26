const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./puzzlehunt.db', (err) => {
    if (err) {
        return console.error(err.message);
    }
    console.log('Connected to the puzzlehunt database.');
});

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS magazine (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        number INTEGER NOT NULL,
        name TEXT NOT NULL
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS puzzle (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        magazine_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        correct_text TEXT,
        correct_image TEXT,
        FOREIGN KEY (magazine_id) REFERENCES magazine(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS answer (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        puzzle_id INTEGER NOT NULL,
        answer TEXT NOT NULL,
        FOREIGN KEY (puzzle_id) REFERENCES puzzle(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS errata (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        puzzle_id INTEGER NOT NULL,
        errata_text TEXT NOT NULL,
        FOREIGN KEY (puzzle_id) REFERENCES puzzle(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS keep_going_statement (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        puzzle_id INTEGER NOT NULL,
        answer_fragment TEXT NOT NULL,
        statement TEXT NOT NULL,
        FOREIGN KEY (puzzle_id) REFERENCES puzzle(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS user_state (
        user_id TEXT NOT NULL,
        magazine_id INTEGER NOT NULL,
        solved_puzzles TEXT,
        solved_answers TEXT,
        PRIMARY KEY (user_id, magazine_id),
        FOREIGN KEY (magazine_id) REFERENCES magazine(id)
    )`);
});

db.close((err) => {
    if (err) {
        return console.error(err.message);
    }
    console.log('Closed the database connection.');
});
