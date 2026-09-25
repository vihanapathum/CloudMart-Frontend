// Tiny vanilla-JS frontend. No build step, no framework - just enough to
// prove every microservice is reachable and working through the API Gateway.
// UI polish is intentionally minimal; this module grades the backend, not the UI.

// ---- tab switching ----
document.querySelectorAll("nav .tab").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("nav .tab").forEach((b) => b.classList.remove("active"));
    document.querySelectorAll(".panel").forEach((p) => p.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(btn.dataset.panel).classList.add("active");
  });
});

function setStatus(el, msg, kind) {
  el.textContent = msg;
  el.className = "status" + (kind ? " " + kind : "");
}

async function api(path, options) {
  const res = await fetch(API_BASE_URL + path, options);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText}${text ? " - " + text : ""}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

// ---------------- PRODUCTS ----------------
async function loadProducts() {
  const statusEl = document.getElementById("product-status");
  const table = document.getElementById("product-table");
  const rows = document.getElementById("product-rows");
  try {
    const products = await api("/api/products");
    if (!products.length) {
      table.style.display = "none";
      setStatus(statusEl, "No products yet - add one above.");
      return;
    }
    rows.innerHTML = products.map((p) => `
      <tr>
        <td>${p.imageUrl ? `<img class="thumb" src="${p.imageUrl}">` : ""}${escapeHtml(p.name)}</td>
        <td>$${Number(p.price).toFixed(2)}</td>
        <td>${p.stock}</td>
        <td>
          <div class="file-row">
            <input type="file" data-id="${p.id}" class="img-input" accept="image/*">
            <button class="link upload-btn" data-id="${p.id}">Upload</button>
          </div>
        </td>
        <td class="actions"><button class="link del-product" data-id="${p.id}">Delete</button></td>
      </tr>`).join("");
    table.style.display = "";
    setStatus(statusEl, `${products.length} product(s) loaded from product-service.`, "ok");

    rows.querySelectorAll(".del-product").forEach((b) =>
      b.addEventListener("click", async () => {
        await api(`/api/products/${b.dataset.id}`, { method: "DELETE" });
        loadProducts();
      })
    );
    rows.querySelectorAll(".upload-btn").forEach((b) =>
      b.addEventListener("click", async () => {
        const input = rows.querySelector(`.img-input[data-id="${b.dataset.id}"]`);
        if (!input.files.length) return;
        const fd = new FormData();
        fd.append("file", input.files[0]);
        await api(`/api/products/${b.dataset.id}/image`, { method: "POST", body: fd });
        loadProducts();
      })
    );
  } catch (err) {
    table.style.display = "none";
    setStatus(statusEl, "Could not reach product-service: " + err.message, "err");
  }
}

document.getElementById("product-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  await api("/api/products", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: document.getElementById("p-name").value,
      description: document.getElementById("p-desc").value,
      price: parseFloat(document.getElementById("p-price").value),
      stock: parseInt(document.getElementById("p-stock").value, 10)
    })
  });
  e.target.reset();
  loadProducts();
});

// ---------------- ORDERS ----------------
async function loadOrders() {
  const statusEl = document.getElementById("order-status");
  const table = document.getElementById("order-table");
  const rows = document.getElementById("order-rows");
  try {
    const orders = await api("/api/orders");
    if (!orders.length) {
      table.style.display = "none";
      setStatus(statusEl, "No orders yet - place one above.");
      return;
    }
    rows.innerHTML = orders.map((o) => `
      <tr>
        <td>${escapeHtml(o.productName)}</td>
        <td>${escapeHtml(o.customerName)}</td>
        <td>${o.quantity}</td>
        <td>$${Number(o.totalPrice).toFixed(2)}</td>
        <td>${escapeHtml(o.status || "")}</td>
        <td class="actions"><button class="link del-order" data-id="${o.id}">Delete</button></td>
      </tr>`).join("");
    table.style.display = "";
    setStatus(statusEl, `${orders.length} order(s) loaded from order-service.`, "ok");

    rows.querySelectorAll(".del-order").forEach((b) =>
      b.addEventListener("click", async () => {
        await api(`/api/orders/${b.dataset.id}`, { method: "DELETE" });
        loadOrders();
      })
    );
  } catch (err) {
    table.style.display = "none";
    setStatus(statusEl, "Could not reach order-service: " + err.message, "err");
  }
}

document.getElementById("order-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const qty = parseInt(document.getElementById("o-qty").value, 10);
  const unitPrice = parseFloat(document.getElementById("o-price").value);
  await api("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      productId: parseInt(document.getElementById("o-product-id").value, 10),
      productName: document.getElementById("o-product-name").value,
      customerName: document.getElementById("o-customer").value,
      quantity: qty,
      totalPrice: qty * unitPrice
    })
  });
  e.target.reset();
  document.getElementById("o-qty").value = 1;
  loadOrders();
});

// ---------------- USERS ----------------
async function loadUsers() {
  const statusEl = document.getElementById("user-status");
  const table = document.getElementById("user-table");
  const rows = document.getElementById("user-rows");
  try {
    const users = await api("/api/users");
    if (!users.length) {
      table.style.display = "none";
      setStatus(statusEl, "No users yet - add one above.");
      return;
    }
    rows.innerHTML = users.map((u) => `
      <tr>
        <td>${escapeHtml(u.name)}</td>
        <td>${escapeHtml(u.email)}</td>
        <td>${escapeHtml(u.phone || "")}</td>
        <td class="actions"><button class="link del-user" data-id="${u.id}">Delete</button></td>
      </tr>`).join("");
    table.style.display = "";
    setStatus(statusEl, `${users.length} user(s) loaded from user-service.`, "ok");

    rows.querySelectorAll(".del-user").forEach((b) =>
      b.addEventListener("click", async () => {
        await api(`/api/users/${b.dataset.id}`, { method: "DELETE" });
        loadUsers();
      })
    );
  } catch (err) {
    table.style.display = "none";
    setStatus(statusEl, "Could not reach user-service: " + err.message, "err");
  }
}

document.getElementById("user-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  await api("/api/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: document.getElementById("u-name").value,
      email: document.getElementById("u-email").value,
      phone: document.getElementById("u-phone").value,
      address: document.getElementById("u-address").value
    })
  });
  e.target.reset();
  loadUsers();
});

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

// initial load
loadProducts();
loadOrders();
loadUsers();
