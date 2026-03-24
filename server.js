const express = require('express');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(express.json());


const pool = mysql.createPool({
    host: process.env.MYSQL_HOST || '127.0.0.1',
    port: process.env.MYSQL_PORT || 3306,
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASS || '',
    database: process.env.MYSQL_DB || 'proiect',
});

async function initializeDatabase() {
    try {
        const connection = await pool.getConnection();
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                age INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        connection.release();
        console.log('Tabela users a fost creată sau deja există.');
    } catch (err) {
        console.error('Eroare la inițializarea bazei de date:', err);
    }
}

function renderPage(res, page, options = {}) {
    res.sendFile(path.join(__dirname, 'public', page));
}

app.get('/', (req, res) => renderPage(res, 'index.html'));
app.get('/about', (req, res) => renderPage(res, 'about.html'));
app.get('/product', (req, res) => renderPage(res, 'product.html'));
app.get('/contact', (req, res) => renderPage(res, 'contact.html'));
app.get('/register', (req, res) => renderPage(res, 'register.html'));

app.post('/register', async (req, res) => {
    const { username, email, password, age } = req.body;

    if (!username || !email || !password || !age) {
        return res.status(400).send('Toate câmpurile sunt obligatorii.');
    }

    try {
        const connection = await pool.getConnection();
        try {
            await connection.execute(
                'INSERT INTO users (username, email, password, age) VALUES (?, ?, ?, ?)',
                [username, email, password, age]
            );
            connection.release();
            res.sendFile(path.join(__dirname, 'public', 'register-success.html'));
        } catch (err) {
            connection.release();
            console.error(err);
            res.status(500).send('A apărut o eroare la salvarea datelor.');
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Nu se poate conecta la baza de date.');
    }
});

app.listen(PORT, async () => {
    await initializeDatabase();
    console.log(`Server pornit pe http://localhost:${PORT}`);
});
