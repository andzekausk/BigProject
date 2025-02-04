require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const app = express();
const port = 3005;

// Middleware to parse JSON
app.use(express.json());

// Enable CORS (Cross-Origin Resource Sharing)
app.use(cors());

// MySQL database connection
const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'computer_test_database',
});

// Test MySQL connection
db.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err.stack);
    return;
  }
  console.log('Connected to database.');
});

// Secret key for JWT (should be stored in .env file for production)
const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY || 'your_secret_key';

// Register route
app.post('/register', (req, res) => {
  const { email, password } = req.body;

  // Input validation
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  // Insert the user into the database (role '2' for regular users)
  db.execute(
    'INSERT INTO users (email, password, idRoles) VALUES (?, ?, ?)',
    [email, password, 2],
    (err, results) => {
      if (err) {
        console.error('Error inserting into database:', err);
        return res.status(500).json({ error: 'Error registering user.' });
      }

      // Send success response
      return res.status(201).json({ message: 'User registered successfully.' });
    }
  );
});


// Login route
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  console.log("check ");
   
  // Input validation
  if (!email || !password) {
    console.log("check unsuccessful:");
    return res.status(400).json({ error: 'Email andsdfsdfdsf password are required.' });
  }

  // Query to check if the email exists
  db.execute('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error.' });
    }

    // If no user is found with that email
    if (results.length === 0) {
      return res.status(401).json({ error: 'User  not found.' });
    }

    // Get the user data from the query result
    const user = results[0];

    
    if (password === user.password) {
      
      const isAdmin = user.idRoles === 1; 

      console.log("user.idRoles:");
      console.log(user.idRoles);
      console.log("isAdmin:");
      console.log(isAdmin);

      const payload = {
        userId: user.id,
        email: user.email,
        role: user.idRoles, 
        isAdmin, 
      };

      const token = jwt.sign(payload, JWT_SECRET_KEY, { expiresIn: '1h' });

      // Send the token and user info back to the client
      return res.status(200).json({
        message: 'Login successful.',
        token, // Send JWT token
        user: {
          email: user.email,
          role: user.idRoles, // Send the role of the user
          isAdmin, // Send the isAdmin flag
        },
      });
    } else {
      return res.status(401).json({ error: 'Incorrect password.' });
    }
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
