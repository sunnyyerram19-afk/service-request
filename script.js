// Service Request Portal - script.js
// Data is saved in the browser's localStorage so it stays after refresh.

const STORAGE_KEY = "serviceRequests";

const form = document.getElementById("requestForm");
const tbody = document.getElementById("requestBody");
const emptyMsg = document.getElementById("emptyMsg");
const filterSelect = document.getElementById("filter");

let requests = loadRequests();

// ---------- Storage ----------
function loadRequests() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch (e) {
    return [];
  }
}

function saveRequests() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
}

// ---------- Validation ----------
function setError(id, message) {
  const input = document.getElementById(id);
  const errorEl = document.getElementById(id + "Error");
  errorEl.textContent = message;
  input.closest(".field").classList.toggle("invalid", message !== "");
  return message === "";
}

function validateForm() {
  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const category = document.getElementById("category").value;
  const description = document.getElementById("description").value.trim();

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phonePattern = /^[0-9]{10}$/;

  const results = [
    setError("name", name.length < 3 ? "Name must be at least 3 characters" : ""),
    setError("email", !emailPattern.test(email) ? "Enter a valid email" : ""),
    setError("phone", !phonePattern.test(phone) ? "Enter a 10-digit phone number" : ""),
    setError("category", category === "" ? "Please select a category" : ""),
    setError("description", description.length < 10 ? "Describe the problem (min 10 characters)" : ""),
  ];
  return results.every(Boolean);
}

// ---------- Add request ----------
form.addEventListener("submit", function (e) {
  e.preventDefault();
  if (!validateForm()) return;

  const newRequest = {
    id: Date.now(),
    name: document.getElementById("name").value.trim(),
    email: document.getElementById("email").value.trim(),
    phone: document.getElementById("phone").value.trim(),
    category: document.getElementById("category").value,
    priority: document.querySelector('input[name="priority"]:checked').value,
    description: document.getElementById("description").value.trim(),
    date: new Date().toLocaleDateString(),
    status: "Pending",
  };

  requests.push(newRequest);
  saveRequests();
  form.reset();
  render();
  alert("Service request submitted successfully!");
});

form.addEventListener("reset", function () {
  ["name", "email", "phone", "category", "description"].forEach((id) => setError(id, ""));
});

// ---------- Update / delete ----------
function updateStatus(id, newStatus) {
  const item = requests.find((r) => r.id === id);
  if (item) {
    item.status = newStatus;
    saveRequests();
    render();
  }
}

function deleteRequest(id) {
  if (!confirm("Delete this request?")) return;
  requests = requests.filter((r) => r.id !== id);
  saveRequests();
  render();
}

// ---------- Render ----------
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function render() {
  const filter = filterSelect.value;
  const visible = filter === "All" ? requests : requests.filter((r) => r.status === filter);

  tbody.innerHTML = "";
  visible.forEach((r, index) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${index + 1}</td>
      <td>${escapeHtml(r.name)}<br><small>${escapeHtml(r.email)}<br>${escapeHtml(r.phone)}</small></td>
      <td>${escapeHtml(r.category)}</td>
      <td><span class="badge ${r.priority}">${r.priority}</span></td>
      <td>${escapeHtml(r.description)}</td>
      <td>${r.date}</td>
      <td>
        <select class="status-select" onchange="updateStatus(${r.id}, this.value)">
          ${["Pending", "In Progress", "Resolved"]
            .map((s) => `<option ${s === r.status ? "selected" : ""}>${s}</option>`)
            .join("")}
        </select>
      </td>
      <td><button class="del-btn" onclick="deleteRequest(${r.id})">Delete</button></td>
    `;
    tbody.appendChild(tr);
  });

  emptyMsg.style.display = visible.length === 0 ? "block" : "none";

  document.getElementById("statTotal").textContent = requests.length;
  document.getElementById("statPending").textContent = requests.filter((r) => r.status === "Pending").length;
  document.getElementById("statProgress").textContent = requests.filter((r) => r.status === "In Progress").length;
  document.getElementById("statResolved").textContent = requests.filter((r) => r.status === "Resolved").length;
}

filterSelect.addEventListener("change", render);

render();
