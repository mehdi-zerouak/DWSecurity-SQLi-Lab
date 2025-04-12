// ======== database configuration ===============================
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database/database.db');
// ===============================================================

// ============= SETUP ===========================================

function seedDatabase() {
    db.run("PRAGMA foreign_keys = ON;");

    db.serialize(() => {
        db.run(`DROP TABLE IF EXISTS posts;`);
        db.run(`DROP TABLE IF EXISTS users;`);

        db.run(`
            CREATE TABLE users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL -- not hashed (demo only!)
            );
        `);

        db.run(`
            CREATE TABLE posts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                content TEXT,
                user_id INTEGER,
                FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
            );
        `);

        // inserting some seed data

        // IN REAL WORLD APPLICATIONS USER PASSWORDS MUST BE HASHED BEFORE STORED IN DATABASE, THIS IS A VERY BAD PRACTICE
        // I AM STORING PASSWORDS IN PLAIN TEXT BECAUSE IT'S A DEMO WEB APP ONLY
        db.run(`
            INSERT INTO users (username, password) VALUES
            ('admin', 'admin'),
            ('theTechGuy', 'pass12345'),
            ('Hack3rOne', 'aaa2568'),
            ('Rand0mUser', '6689bbp'),
            ('demo_user', 'demo1234');
    `, (err) => { 
            if (err) {
                console.error("Error inserting users:", err);
            } else {
                console.log("Users inserted successfully.");
                db.run(`
                    INSERT INTO posts (title, content, user_id) VALUES
                    ('Frontend vs Backend', 'Understand the roles and responsibilities of each side.', 1),
                    ('What is an API?', 'APIs let apps talk to each other — they re everywhere.', 2),
                    ('Clean Code Tips', 'Meaningful names and small functions go a long way.', 1),
                    ('Database Basics', 'Learn SQL before diving into complex systems.', 3),
                    ('Version Control', 'Git is a must-have tool for every developer.', 2),
                    ('Responsive Design', 'Mobile-first design improves user experience.', 1),
                    ('Cybersecurity 101', 'Never trust user input. Validate everything.', 3);
                `, (err) => {
                    if (err) {
                        console.error("Error inserting posts:", err);
                    } else {
                        console.log("Posts inserted successfully.");
                    }
                });
            }
        });
    });
};


// ===============================================================


// the rest of the queries are going to be made in the server.js controllers


module.exports = {db, seedDatabase};