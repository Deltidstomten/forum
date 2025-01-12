const express = require('express')
const sqlite3 = require('sqlite3').verbose()
const jwt = require("jsonwebtoken");
const app = express()
const port = 4000

const db = new sqlite3.Database('database.db')
db.run("PRAGMA foreign_keys = ON;")

app.use(express.static('public'))
app.use(express.json()); // support json encoded bodies
app.use(express.urlencoded({ extended: true })); // support encoded bodies
app.set('view engine', 'pug')

let createTableSQL = `CREATE TABLE post (
    id INTEGER PRIMARY KEY,
	thread_id INTEGER,
    author_id INTEGER,
    text TEXT NOT NULL,
    image TEXT,
    creation_date TEXT NOT NULL,
    FOREIGN KEY(thread_id) REFERENCES thread(id),
    FOREIGN KEY(author_id) REFERENCES user(id)
);`

let createCategorySQL = `
    INSERT INTO category(name, description) 
    VALUES ('music', 'post about your favorite bangers')`

let createUserSQL = `
    INSERT INTO user(username, status, password, image, creation_date) 
    VALUES ('admin', 'man i love banning people', 'qwe123!!', '', ?)`

let createThreadSQL = `
    INSERT INTO thread(category_id, author_id, name, description, creation_date) 
    VALUES (1, 1, 'Bananas', 'Write about Bananas', ?)`

let createPostSQL = `
    INSERT INTO post(thread_id, author_id, text, image, creation_date) 
    VALUES (1, 1, 'Bananas are good 1 2 3', '', ?)`

let getCategorySQL = `SELECT * FROM category`

let getCategoryName = `SELECT * FROM category WHERE id = ?`

let getThreadsInCategory = 
    `SELECT user.creation_date AS user_creation_date, thread.creation_date AS thread_creation_date, * 
    FROM thread INNER JOIN user ON user.id = thread.author_id WHERE category_id = ? `

let getPostsInThread = `
    SELECT user.creation_date AS user_creation_date, post.creation_date AS post_creation_date, * 
    FROM post INNER JOIN user ON user.id = post.author_id WHERE thread_id = ?`

let getThreadName = `SELECT * FROM thread WHERE id = ?`

let getUserById = `SELECT * FROM user WHERE id = ?`


function getPreciseTime(){
    let yourDate = new Date()
    const offset = yourDate.getTimezoneOffset()
    yourDate = new Date(yourDate.getTime() - (offset*60*1000))
    let yourDateList = yourDate.toISOString().split('T')
    return `${yourDateList[0]} ${yourDateList[1].split('.')[0]}`
}

function createCategory() {
    db.serialize(() => {
        db.all(createCategorySQL, (err, row) => {
            if (err) {
                console.error(err.message);
            }
        });
    });
}

function createUser() {
    db.serialize(() => {
        db.all(createUserSQL, [getPreciseTime()], (err, row) => {
            if (err) {
                console.error(err.message);
            }
        });
    });
}

function createThread() {
    db.serialize(() => {
        db.all(createThreadSQL, [getPreciseTime()], (err, row) => {
            if (err) {
                console.error(err.message);
            }
        });
    });
}

function createPost() {
    db.serialize(() => {
        db.all(createPostSQL, [getPreciseTime()], (err, row) => {
            if (err) {
                console.error(err.message);
            }
        });
    });
}

app.get('/', (req, res) => {
    db.serialize(() => {
        db.all(getCategorySQL, (err, row) => {
            if (err) {
                console.error(err.message);
            }
            if (row == undefined) {
                return
            }
            res.render('index', { "categories" : row })
        });
    });
})

app.get('/login', (req, res) => {
    res.render('login', {})
})

app.get('/test', (req, res) => {
    const decodedToken = jwt.verify("", "secretkeyappearshere");
    res.send(decodedToken.userId)
})

app.post('/login', (req, res) => {
    console.log(req.body)
    let token = jwt.sign(
        {
            username: req.body.username,
            email: req.body.password
        },
        "secretkeyappearshere",
        { expiresIn: "1h" }
    );
    console.log(token)
    //res.redirect('/')
    res.render('index', {"title" : token, "categories" : []})
})

app.get('/category/:id', (req, res) => {
    db.serialize(() => {
        let categoryName = "Category Name Here"
        db.all(getCategoryName, [req.params.id], (err, row) => {
            if (err) {
                console.error(err.message);
            }
            if (row == undefined) {
                return
            }
            if (row.length == 0){
                res.render('category', { title: "No Category", "threads" : []})
                return
            }
            categoryName = row[0].name
            db.all(getThreadsInCategory, [req.params.id], (err, row) => {
                if (err) {
                    console.error(err.message);
                }
                if (row == undefined) {
                    return
                }
                if (row.length == 0){
                    res.render('category', { title: categoryName, "threads" : []})
                    return
                }
                res.render('category', { title: categoryName, "threads" : row})
            });
        });
        
        
        
    });
})

app.get('/thread/:id', (req, res) => {
    db.serialize(() => {
        let threadName = "Thread Name Here"
        db.all(getThreadName, [req.params.id], (err, row) => {
            if (err) {
                console.error(err.message);
            }
            if (row == undefined) {
                return
            }
            if (row.length == 0){
                res.render('thread', { title: "No Post", "posts" : []})
                return
            }
            threadName = row[0].name
            db.all(getPostsInThread, [req.params.id], (err, row) => {
                if (err) {
                    console.error(err.message);
                }
                if (row == undefined) {
                    return
                }
                if (row.length == 0){
                    res.render('thread', { title: threadName, "posts" : []})
                    return
                }
                res.render('thread', { title: threadName, "posts" : row})
            });
        });
    });
})

app.get('/user/:id', (req, res) => {
    db.serialize(() => {
        db.all(getUserById, [req.params.id], (err, row) => {
            if (err) {
                console.error(err.message);
            }
            if (row == undefined) {
                return
            }
            if (row.length == 0){
                res.render('user', { title: "No User", "info" : []})
                return
            }
            let user = row[0]
            res.render('user', { title: user.username, "info" : user})
        });
    });
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})

/*
db.all("asd", (err, row) => {
    if (err) {
        console.error(err.message);
    }
});
*/


/*

user
	id INTEGER PRIMARY KEY,
	username
	status
	password
	image
	creation_date

category
	id INTEGER PRIMARY KEY,
	name TEXT NOT NULL,
	description TEXT

thread
	id
	category category_id
	author user_id
	name
	description
	creation_date

post
	id
	thread_id
	author
	text
	image
	creation_date



*/