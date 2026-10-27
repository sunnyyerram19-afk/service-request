
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

let requests = [];
let nextId = 1;

const validStatuses = ["Pending", "In Progress", "Resolved"];

app.get("/", (req, res) => {
  res.json({ message: "Service Request Backend is running!" });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "Backend API is working" });
});

// Get all requests
app.get("/api/requests", (req, res) => {
  res.json(requests);
});

// Create a request
app.post("/api/requests", (req, res) => {
  const { name, email, phone, category, priority, description } = req.body;

  if (
    typeof name !== "string" || name.trim().length < 3 ||
    typeof email !== "string" ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
    typeof phone !== "string" || !/^[0-9]{10}$/.test(phone.trim()) ||
    typeof category !== "string" || !category.trim() ||
    !["Low", "Medium", "High"].includes(priority) ||
    typeof description !== "string" || description.trim().length < 10
  ) {
    return res.status(400).json({
      message: "Please provide valid service request details."
    });
  }

  const newRequest = {
    id: nextId++,
    name: name.trim(),
    email: email.trim(),
    phone: phone.trim(),
    category: category.trim(),
    priority,
    description: description.trim(),
    date: new Date().toLocaleDateString("en-GB"),
    status: "Pending"
  };

  requests.push(newRequest);
  res.status(201).json(newRequest);
});

// Update request status
app.patch("/api/requests/:id", (req, res) => {
  const request = requests.find(
    (item) => item.id === Number(req.params.id)
  );

  if (!request) {
    return res.status(404).json({ message: "Request not found." });
  }

  if (!validStatuses.includes(req.body.status)) {
    return res.status(400).json({ message: "Invalid status." });
  }

  request.status = req.body.status;
  res.json(request);
});

// Delete a request
app.delete("/api/requests/:id", (req, res) => {
  const index = requests.findIndex(
    (item) => item.id === Number(req.params.id)
  );

  if (index === -1) {
    return res.status(404).json({ message: "Request not found." });
  }

  requests.splice(index, 1);
  res.json({ message: "Request deleted successfully." });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

