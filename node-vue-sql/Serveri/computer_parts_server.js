const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;


app.use(cors());
app.use(express.json());


const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});


db.connect(err => {
  if (err) {
    console.error('Database connection failed:', err.stack);
    return;
  }
  console.log('Connected to the database');
});


app.get('/api/data', (req, res) => {
  // const query = `
  //   SELECT * 
  //   FROM computer_parts 
  //   JOIN Pc_parts 
  //   USING (Part_ID)
  //   ORDER by Computer_ID ASC
  // `;
  const query = `
    SELECT c.Computer_ID, cp.Computer_Part_ID, p.Part_ID, p.Part_type, p.Part_name, p.apraksts
    FROM computer c
    LEFT JOIN computer_parts cp ON c.Computer_ID = cp.Computer_ID
    LEFT JOIN Pc_parts p ON cp.Part_ID = p.Part_ID
    ORDER BY c.Computer_ID ASC;
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: 'Error fetching data' });
    } else {
      res.json(results);
    }
  });
});

// Fetch all software
app.get('/api/parts', (req, res) => {
  const query = `SELECT * FROM pc_parts ORDER BY Part_type ASC`;
  db.query(query, (err, results) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: 'Error fetching parts' });
    } else {
      res.json(results);
    }
  });
});

// Add software to a computer
app.post('/api/add-parts', (req, res) => {
  const { Computer_ID , Part_ID } = req.body;

  if (!Part_ID || !Computer_ID) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const query = `
    INSERT INTO computer_parts (Part_ID, Computer_ID)
    VALUES (?, ?)
  `;

  db.query(query, [Part_ID, Computer_ID], (err, results) => {
    if (err) {
      console.error('Error adding software:', err);
      return res.status(500).json({ error: 'Failed to add software' });
    }

    res.status(200).json({ message: 'Software added successfully' });
  });
});


// Delete a part (Delete operation)
app.delete('/api/data/:computerPartId', (req, res) => {
  const { computerPartId } = req.params;

  const query = `
    DELETE FROM computer_parts WHERE Computer_Part_ID = ?
  `;

  db.query(query, [computerPartId], (err, results) => {
    if (err) {
      console.error('Error deleting the part:', err);
      return res.status(500).json({ error: 'Failed to delete part' });
    }

    if (results.affectedRows > 0) {
      return res.status(200).json({ message: 'Part deleted successfully' });
    } else {
      return res.status(404).json({ error: 'Part not found' });
    }
  });
});









// Update a part
app.put('/api/data/:id', (req, res) => {
  const { id } = req.params;
  const { Part_type, Part_name, apraksts } = req.body;

  // Example: validate required fields
  if (!Part_type || !Part_name || !apraksts) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Perform database update logic here
  // Example using a SQL database (you should adjust this according to your DB setup)
  const query = 'UPDATE computer_parts SET Part_type = ?, Part_name = ?, apraksts = ? WHERE Computer_Part_ID = ?';
  const values = [Part_type, Part_name, apraksts, id];

  db.query(query, values, (err, result) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Part not found' });
    }

    res.status(200).json({ message: 'Part updated successfully' });
  });
});




app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
