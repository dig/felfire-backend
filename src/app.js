const express = require('express');
const app = express();

// app.get('/', (req, res) => res.redirect("https://felfire.app"));
app.get('/', (req, res) => res.send("ye"));
app.listen(port, () => console.log(`Felfire backend listening on port ${port}!`));