const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json()); // To parse JSON request bodies

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

db.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err.stack);
    return;
  }
  console.log('Connected to the database');
});

// Fetch all data
app.get('/api/data', (req, res) => {
  // const query = `
  //   SELECT * 
  //   FROM computer_software 
  //   JOIN software 
  //   ON computer_software.software_id = software.software_id
  //   ORDER BY computer_software.Computer_ID ASC
  // `;
  const query = `
    SELECT c.Computer_ID, cs.Computer_software_ID, s.Software_ID, s.Software_Name, s.Version
    FROM computer c
    LEFT JOIN computer_software cs ON c.Computer_ID = cs.Computer_ID
    LEFT JOIN software s ON cs.Software_ID = s.Software_ID
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
app.get('/api/software', (req, res) => {
  const query = `SELECT * FROM software ORDER BY Software_Name ASC`;
  db.query(query, (err, results) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: 'Error fetching software' });
    } else {
      res.json(results);
    }
  });
});

// Add software to a computer
app.post('/api/add-software', (req, res) => {
  const { Computer_ID, Software_ID } = req.body;

  if (!Computer_ID || !Software_ID) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const query = `
    INSERT INTO computer_software (Computer_ID, Software_ID)
    VALUES (?, ?)
  `;

  db.query(query, [Computer_ID, Software_ID], (err, results) => {
    if (err) {
      console.error('Error adding software:', err);
      return res.status(500).json({ error: 'Failed to add software' });
    }

    res.status(200).json({ message: 'Software added successfully' });
  });
});




app.delete('/api/data/:computerSoftwareId', (req, res) => {
  const { computerSoftwareId } = req.params;

  // Ensure the computerSoftwareId is a valid number (or valid ID type for your DB)
  if (!computerSoftwareId || isNaN(computerSoftwareId)) {
    return res.status(400).json({ error: 'Invalid Computer_software_ID' });
  }

  // Query to delete the entry from computer_software table using the Computer_software_ID
  const query = `
    DELETE FROM computer_software WHERE Computer_software_ID = ?;
  `;

  db.query(query, [computerSoftwareId], (err, results) => {
    if (err) {
      console.error('Error deleting software entry:', err);
      return res.status(500).json({ error: 'Failed to delete software entry' });
    }

    // Check if any rows were affected (meaning the entry was deleted)
    if (results.affectedRows > 0) {
      return res.status(200).json({ message: 'Software entry deleted successfully' });
    } else {
      return res.status(404).json({ error: 'Software entry not found' });
    }
  });
});






// Update a record
app.put('/api/data/:computerId', (req, res) => {
  const { computerId } = req.params;
  const { Software_Name, Version } = req.body;

  if (!computerId || !Software_Name || !Version) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Update the software details
  const query = `
    UPDATE software 
    JOIN computer_software 
    ON software.software_id = computer_software.software_id
    SET software.Software_Name = ?, software.Version = ?
    WHERE computer_software.Computer_ID = ? 
  `;

  db.query(query, [Software_Name, Version, computerId], (err, results) => {
    if (err) {
      console.error('Error updating the software:', err);
      return res.status(500).json({ error: 'Database update failed' });
    }
    res.status(200).json({ message: 'Update successful', affectedRows: results.affectedRows });
  });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
