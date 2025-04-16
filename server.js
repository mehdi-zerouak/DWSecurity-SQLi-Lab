// SQL INJECTION VULNERABLE WEBSITE
// Mehdi ZEROUAK G2
// DW SECURITY, L3 COMPUTER SCIENCE, MEDEA UNIVERSITY 2025

const express = require('express');
const app = express();
const port = 3000;

const jwt = require('jsonwebtoken');

var cookieParser = require('cookie-parser');

const {db, seedDatabase} = require('./database/database.js');

const path = require('path');

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(express.static('./views')); 

//seedDatabase(); // Uncomment only when you want to reset the database to default

// ============== AUTH MIDDLEWARE ======================

// SECRET KEY MUST BE AN ENVIRONMENT VARIABLE, THIS IS A DEMO APP ONLY
const secretKey = '57be7162bb256db2ee3a60819b76372f820656f10809569028e5e5aa0e88f1ea883c24c21b6107d3877b051a77fc2720934c2a65d114474f2e50f97abfb6a833';

function authenticateMiddleware(req, res, next) {
    try {
        // i'm putting jwt token in a http-only cookie because this is a web based app only
        const token = req.cookies['jwt-token'];
        const decoded_token = jwt.verify(token, secretKey);
        req.user = decoded_token;
        next();
    } catch (error) {
        res.redirect('/login');
    }
}
// =====================================================

// ============== ROUTES AND CONTROLLERS ===============

app.get('/login', (req,res) => {
    res.sendFile('views/login.html', {'root': __dirname}); 
});

app.post('/login',(req, res) => {
                                
    const username = req.body.username;
    const password = req.body.password;

    // ❌ BAD PRACTICE (Vulnerable to SQL Injection) -----------
    // DO NOT use string concatenation with user inputs in production code
    const query = `SELECT id, username FROM users WHERE username = '${username}'  AND password = '${password}';`;

    console.log('===============================================');
    console.log('executed login SQL query: ' + query);
    console.log('===============================================');

    db.get(query, (error, row) => {
        if (row) {
            // generate a jwt token
            payload = {
                id: row.id,
                username: row.username
            };
            const token = jwt.sign(payload, secretKey, {expiresIn: '24h'});
    
            // store it in a http-only cookie and then send it to client
            res.cookie('jwt-token', token, {maxAge: 86400000, httpOnly: true}); // it will last 1 day
            return res.redirect('/');
        } else {
            return res.send('Error, invalid username or password');
        }
    });
    // ✅ SAFE ALTERNATIVE -------------------------------------
    // always use parameterized queries
    /*
    const query = "SELECT id, username FROM users WHERE username = ?  AND password = ?;";
    db.get(query, [username, password], (error, row) => {
        ..............
        });
    */

});

app.get('/', authenticateMiddleware ,(req,res) => {
    const userSearchQuery = req.query.search;

    if (!userSearchQuery) {
        // get all posts when loading the page for the first time 
        const query1 = `
        SELECT posts.id, username, title, content 
        FROM users, posts 
        WHERE users.id = posts.user_id 
        ORDER BY posts.id DESC
        `; // order by posts.id desc meaning show the last added post on top of the list
        
        db.all(query1, (error, rows) => {
            if (error) {
                //  ⚠️❌❌ returning database error codes directly to user..... 
                return  res.send('an error occured in the database\n' + error);
            };
            data = {'username': req.user.username, 'posts':rows};
            return res.render(path.join(__dirname, 'views/blog.ejs'), data);
        })

    } else {
        // in case of user searched about a specific post 
        //  ⚠️❌⚠️❌ vulnerable to SQL Injection..... 
        // this is unsafe because user input is directly concatenated with the SQL statement
        const query2 = `
        SELECT posts.id, username, title, content 
        FROM users, posts 
        WHERE users.id = posts.user_id 
        AND title LIKE '%${userSearchQuery}%'
        ORDER BY posts.id DESC
        ;`;

        console.log('===============================================');
        console.log('executed search SQL query: ' + query2);
        console.log('===============================================');

        db.all(query2, (error, rows) => {
            if (error) {
            //  ⚠️❌❌ returning database error codes directly to user..... 
                return res.send('an error occured in the database\n' + error);
            };
            data = {'username': req.user.username, 'posts':rows, 'query':userSearchQuery};
            return res.render(path.join(__dirname, 'views/blog.ejs'), data);
        })

        // ✅ correct approach (using parameterized queries):
        // const query2 = `
        //     SELECT username, title, content 
        //     FROM users, posts 
        //     WHERE users.id = posts.user_id 
        //     AND title LIKE ?;
        // `;
        // db.all(query2, [`%${userSearchQuery}%`], (error, rows) => {
        //     ...
        // });

    };
});

app.post('/create-post', authenticateMiddleware,(req,res) => {

    const title = req.body.title;
    const content = req.body.content;
    const author_id = req.user.id;

    //  ⚠️❌⚠️❌ vulnerable to SQL Injection..... 
    const query = `
    INSERT INTO posts (title, content, user_id)
    VALUES ("${title}", "${content}", "${author_id}");
    `;

    console.log('===============================================');
    console.log('executed create post SQL query: ' + query);
    console.log('===============================================');

    db.run(query, (error) => {
        if (error) {
            //  ⚠️❌❌ returning database error codes directly to user..... 
                return res.send('an error occured in the database\n' + error);
        };
        return res.redirect('/'); // if everything is fine and posts is successfully created, redirect user to main page
    })

    // ✅ correct approach (using parameterized queries):
    //      const query = `
    //      INSERT INTO posts (title, content, user_id)
    //      VALUES (?, ?, ?);
    //      `;

    // db.run(query, [title, content, author_id], (error) => {
    //     ...
    // });

});

app.post('/logout', (req,res) => {
    res.cookie('jwt-token', '', {httpOnly: true, expires: new Date(0)}); // set cookie to empty string then delete it from browser
    return res.redirect('/login'); 
});

// =====================================================



// server listening at port 3000

app.listen(port, () => {
    console.log('Server running at port 3000');
})