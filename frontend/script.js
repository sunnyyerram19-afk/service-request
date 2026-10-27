
const API_URL = "http://localhost:5000/api/requests";

const form = document.getElementById("requestForm");
const tbody = document.getElementById("requestBody");
const emptyMsg = document.getElementById("emptyMsg");
const filterSelect = document.getElementById("filter");

let requests = [];

// ---------- API helper ----------
async function apiRequest(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const text = await response.text();
  let data = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    throw new Error("The server returned an invalid response.");
  }

  if (!response.ok) {
    throw new Error(data?.message || "Something went wrong.");
  }

  return data;
}

// ---------- Load requests ----------
async function loadRequests() {
  try {
    requests = await apiRequest(API_URL);
    render();
  } catch (error) {
    console.error("Unable to load requests:", error);
    alert(
      "Could not connect to the backend. Make sure your backend server is running on port 5000."
    );
  }
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
    setError(
      "name",
      name.length < 3 ? "Name must be at least 3 characters" : ""
    ),
    setError("email", !emailPattern.test(email) ? "Enter a valid email" : ""),
    setError("phone", !phonePattern.test(phone) ? "Enter a 10-digit phone number" : ""),
    setError("category", category === "" ? "Please select a category" : ""),
    setError(
      "description",
      description.length < 10
        ? "Describe the problem (min 10 characters)"
        : ""
    ),
  ];

  return results.every(Boolean);
}

// ---------- Add request ----------
form.addEventListener("submit", async function (e) {
  e.preventDefault();

  if (!validateForm()) return;

  const priorityInput = document.querySelector(
    'input[name="priority"]:checked'
  );

  if (!priorityInput) {
    alert("Please select a priority.");
    return;
  }

  const newRequest = {
    name: document.getElementById("name").value.trim(),
    email: document.getElementById("email").value.trim(),
    phone: document.getElementById("phone").value.trim(),
    category: document.getElementById("category").value,
    priority: priorityInput.value,
    description: document.getElementById("description").value.trim(),
  };

  const submitButton = form.querySelector('[type="submit"]');

  try {
    if (submitButton) submitButton.disabled = true;

    await apiRequest(API_URL, {
      method: "POST",
      body: JSON.stringify(newRequest),
    });

    form.reset();
    await loadRequests();

    alert("Service request submitted successfully!");
  } catch (error) {
    alert("Could not submit request: " + error.message);
  } finally {
    if (submitButton) submitButton.disabled = false;
  }
});

form.addEventListener("reset", function () {
  ["name", "email", "phone", "category", "description"].forEach((id) => {
    setError(id, "");
  });
});

// ---------- Update status ----------
async function updateStatus(id, newStatus) {
  try {
    const updatedRequest = await apiRequest(`${API_URL}/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: newStatus }),
    });

    requests = requests.map((r) =>
      r.id === updatedRequest.id ? updatedRequest : r
    );

    render();
  } catch (error) {
    alert("Could not update status: " + error.message);
    await loadRequests();
  }
}

// ---------- Delete request ----------
async function deleteRequest(id) {
  if (!confirm("Delete this request?")) return;

  try {
    await apiRequest(`${API_URL}/${id}`, {
      method: "DELETE",
    });

    requests = requests.filter((r) => r.id !== id);
    render();
    alert("Request deleted successfully.");
  } catch (error) {
    alert("Could not delete request: " + error.message);
  }
}

// Make functions available to the HTML event handlers.
window.updateStatus = updateStatus;
window.deleteRequest = deleteRequest;

// ---------- Escape HTML ----------
function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = String(value ?? "");
  return div.innerHTML;
}

// ---------- Render requests ----------
function render() {
  const selectedFilter = filterSelect.value;

  const visible =
    selectedFilter === "All"
      ? requests
      : requests.filter((r) => r.status === selectedFilter);

  tbody.innerHTML = "";

  visible.forEach((r, index) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${index + 1}</td>
      <td>
        ${escapeHtml(r.name)}<br>
        <small>${escapeHtml(r.email)}<br>${escapeHtml(r.phone)}</small>
      </td>
      <td>${escapeHtml(r.category)}</td>
      <td><span class="badge ${escapeHtml(r.priority)}">${escapeHtml(r.priority)}</span></td>
      <td>${escapeHtml(r.description)}</td>
      <td>${escapeHtml(r.date)}</td>
      <td>
        <select class="status-select"
          onchange="updateStatus(${Number(r.id)}, this.value)">
          ${["Pending", "In Progress", "Resolved"]
            .map(
              (status) =>
                `<option value="${status}" ${
                  status === r.status ? "selected" : ""
                }>${status}</option>`
            )
            .join("")}
        </select>
      </td>
      <td>
        <button class="del-btn"
          onclick="deleteRequest(${Number(r.id)})">Delete</button>
      </td>
    `;

    tbody.appendChild(tr);
  });

  emptyMsg.style.display = visible.length === 0 ? "block" : "none";

  document.getElementById("statTotal").textContent = requests.length;
  document.getElementById("statPending").textContent =
    requests.filter((r) => r.status === "Pending").length;
  document.getElementById("statProgress").textContent =
    requests.filter((r) => r.status === "In Progress").length;
  document.getElementById("statResolved").textContent =
    requests.filter((r) => r.status === "Resolved").length;
}

filterSelect.addEventListener("change", render);

// Start the application.
loadRequests();

