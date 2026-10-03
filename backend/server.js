const express = require("express");
const cors = require("cors");
require("./config/supabase");

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ message: "TaskSync API is running" });
});

app.listen(port, () => {
  console.log(`TaskSync API listening on port ${port}`);
});
