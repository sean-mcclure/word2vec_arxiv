const express = require('express');
const path = require('path');
const app = express();
const PORT = parseInt(process.argv[2]) || 3000;

// Serve static files from the 'app' directory
app.use(express.static(path.join(__dirname, 'app')));

// Fallback to index.html for any other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'app', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
});
