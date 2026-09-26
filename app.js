let productsCache = [];
let usersCache = [];
const ORDER_STATUSES = ["PLACED", "SHIPPED", "DELIVERED", "CANCELLED"];

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

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

function money(n) {
  return "$" + Number(n || 0).toFixed(2);
}

async function checkPulse() {
  const wrap = document.getElementById("pulse");
  const text = document.getElementById("pulse-text");
  try {
    await api("/actuator/health");
    wrap.className = "pulse up";
    text.textContent = "Gateway reporting healthy";
  } catch {
    wrap.className = "pulse down";
    text.textContent = "Gateway unreachable";
  }
}

async function loadProducts() {
  const statusEl = document.getElementById("product-status");
  const table = document.getElementById("product-table");
  const rows = document.getElementById("product-rows");
  try {
    const products = await api("/api/products");
    productsCache = products;
    populateOrderProductSelect();
    updateOrderHint();

    if (!products.length) {
      table.hidden = true;
      setStatus(statusEl, "No products yet — add one to start the catalog.");
      return;
    }
    rows.innerHTML = products.map(renderProductRow).join("");
    table.hidden = false;
    setStatus(statusEl, `${products.length} product(s) from product-service`, "ok");
    wireProductRowEvents();
  } catch (err) {
    table.hidden = true;
    setStatus(statusEl, "Could not reach product-service: " + err.message, "err");
  }
}

function renderProductRow(p) {
  return `
    <tr data-id="${p.id}">
      <td>${p.imageUrl ? `<img class="thumb" src="${p.imageUrl}">` : ""}${escapeHtml(p.name)}</td>
      <td class="cell-price">${money(p.price)}</td>
      <td class="cell-stock">${p.stock}</td>
      <td>
        <div class="file-row">
          <input type="file" data-id="${p.id}" class="img-input" accept="image/*">
          <button class="link upload-btn" data-id="${p.id}">Upload</button>
        </div>
      </td>
      <td class="actions">
        <button class="link edit-product" data-id="${p.id}">Edit</button>
        <button class="link danger del-product" data-id="${p.id}">Delete</button>
      </td>
    </tr>`;
}

function wireProductRowEvents() {
  const rows = document.getElementById("product-rows");
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
  rows.querySelectorAll(".edit-product").forEach((b) =>
    b.addEventListener("click", () => startProductEdit(b.dataset.id))
  );
}

function startProductEdit(id) {
  const product = productsCache.find((p) => String(p.id) === String(id));
  if (!product) return;
  const tr = document.querySelector(`#product-rows tr[data-id="${id}"]`);
  tr.classList.add("editing");
  tr.innerHTML = `
    <td><input type="text" class="e-name" value="${escapeHtml(product.name)}"></td>
    <td><input type="number" step="0.01" min="0" class="e-price" value="${product.price}"></td>
    <td><input type="number" min="0" class="e-stock" value="${product.stock}"></td>
    <td></td>
    <td class="actions edit-actions">
      <button class="link save-product">Save</button>
      <button class="link cancel-edit">Cancel</button>
    </td>`;
  tr.querySelector(".cancel-edit").addEventListener("click", loadProducts);
  tr.querySelector(".save-product").addEventListener("click", async () => {
    await api(`/api/products/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: tr.querySelector(".e-name").value,
        description: product.description,
        price: parseFloat(tr.querySelector(".e-price").value),
        stock: parseInt(tr.querySelector(".e-stock").value, 10)
      })
    });
    loadProducts();
  });
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

async function loadUsers() {
  const statusEl = document.getElementById("user-status");
  const table = document.getElementById("user-table");
  const rows = document.getElementById("user-rows");
  try {
    const users = await api("/api/users");
    usersCache = users;
    populateOrderCustomerSelect();
    updateOrderHint();

    if (!users.length) {
      table.hidden = true;
      setStatus(statusEl, "No customers yet — add one to start your customer list.");
      return;
    }
    rows.innerHTML = users.map(renderUserRow).join("");
    table.hidden = false;
    setStatus(statusEl, `${users.length} customer(s) from user-service`, "ok");
    wireUserRowEvents();
  } catch (err) {
    table.hidden = true;
    setStatus(statusEl, "Could not reach user-service: " + err.message, "err");
  }
}

function renderUserRow(u) {
  return `
    <tr data-id="${u.id}">
      <td>${escapeHtml(u.name)}</td>
      <td>${escapeHtml(u.email)}</td>
      <td>${escapeHtml(u.phone || "")}</td>
      <td class="actions">
        <button class="link edit-user" data-id="${u.id}">Edit</button>
        <button class="link danger del-user" data-id="${u.id}">Delete</button>
      </td>
    </tr>`;
}

function wireUserRowEvents() {
  const rows = document.getElementById("user-rows");
  rows.querySelectorAll(".del-user").forEach((b) =>
    b.addEventListener("click", async () => {
      await api(`/api/users/${b.dataset.id}`, { method: "DELETE" });
      loadUsers();
    })
  );
  rows.querySelectorAll(".edit-user").forEach((b) =>
    b.addEventListener("click", () => startUserEdit(b.dataset.id))
  );
}

function startUserEdit(id) {
  const user = usersCache.find((u) => String(u.id) === String(id));
  if (!user) return;
  const tr = document.querySelector(`#user-rows tr[data-id="${id}"]`);
  tr.classList.add("editing");
  tr.innerHTML = `
    <td><input type="text" class="e-name" value="${escapeHtml(user.name)}"></td>
    <td><input type="email" class="e-email" value="${escapeHtml(user.email)}"></td>
    <td><input type="text" class="e-phone" value="${escapeHtml(user.phone || "")}"></td>
    <td class="actions edit-actions">
      <button class="link save-user">Save</button>
      <button class="link cancel-edit">Cancel</button>
    </td>`;
  tr.querySelector(".cancel-edit").addEventListener("click", loadUsers);
  tr.querySelector(".save-user").addEventListener("click", async () => {
    await api(`/api/users/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: tr.querySelector(".e-name").value,
        email: tr.querySelector(".e-email").value,
        phone: tr.querySelector(".e-phone").value,
        address: user.address
      })
    });
    loadUsers();
  });
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

function populateOrderProductSelect() {
  const sel = document.getElementById("o-product");
  const current = sel.value;
  sel.innerHTML = '<option value="">Select a product…</option>' +
    productsCache.map((p) => `<option value="${p.id}" data-name="${escapeHtml(p.name)}" data-price="${p.price}">${escapeHtml(p.name)} — ${money(p.price)}</option>`).join("");
  if (productsCache.some((p) => String(p.id) === current)) sel.value = current;
}

function populateOrderCustomerSelect() {
  const sel = document.getElementById("o-customer");
  const current = sel.value;
  sel.innerHTML = '<option value="">Select a customer…</option>' +
    usersCache.map((u) => `<option value="${u.id}" data-name="${escapeHtml(u.name)}">${escapeHtml(u.name)}</option>`).join("");
  if (usersCache.some((u) => String(u.id) === current)) sel.value = current;
}

function updateOrderHint() {
  const hint = document.getElementById("order-hint");
  const submit = document.getElementById("order-submit");
  const ready = productsCache.length > 0 && usersCache.length > 0;
  hint.hidden = ready;
  submit.disabled = !ready;
}

document.getElementById("o-product").addEventListener("change", (e) => {
  const opt = e.target.selectedOptions[0];
  document.getElementById("o-price").value = opt && opt.dataset.price ? money(opt.dataset.price) : "";
});

async function loadOrders() {
  const statusEl = document.getElementById("order-status");
  const table = document.getElementById("order-table");
  const rows = document.getElementById("order-rows");
  try {
    const orders = await api("/api/orders");
    if (!orders.length) {
      table.hidden = true;
      setStatus(statusEl, "No orders yet — place one once you have a product and a customer.");
      return;
    }
    rows.innerHTML = orders.map(renderOrderRow).join("");
    table.hidden = false;
    setStatus(statusEl, `${orders.length} order(s) from order-service`, "ok");
    wireOrderRowEvents();
  } catch (err) {
    table.hidden = true;
    setStatus(statusEl, "Could not reach order-service: " + err.message, "err");
  }
}

function renderOrderRow(o) {
  const status = o.status || "PLACED";
  return `
    <tr data-id="${o.id}">
      <td>${escapeHtml(o.productName)}</td>
      <td>${escapeHtml(o.customerName)}</td>
      <td>${o.quantity}</td>
      <td>${money(o.totalPrice)}</td>
      <td class="status-cell"><button class="pill ${status}" data-id="${o.id}" data-status="${status}">${status}</button></td>
      <td class="actions"><button class="link danger del-order" data-id="${o.id}">Delete</button></td>
    </tr>`;
}

function wireOrderRowEvents() {
  const rows = document.getElementById("order-rows");
  rows.querySelectorAll(".del-order").forEach((b) =>
    b.addEventListener("click", async () => {
      await api(`/api/orders/${b.dataset.id}`, { method: "DELETE" });
      loadOrders();
    })
  );
  rows.querySelectorAll(".pill").forEach((pill) =>
    pill.addEventListener("click", () => startStatusEdit(pill))
  );
}

function startStatusEdit(pill) {
  const id = pill.dataset.id;
  const current = pill.dataset.status;
  const cell = pill.closest(".status-cell");
  const select = document.createElement("select");
  select.className = "status-edit";
  select.innerHTML = ORDER_STATUSES.map((s) => `<option value="${s}"${s === current ? " selected" : ""}>${s}</option>`).join("");
  cell.innerHTML = "";
  cell.appendChild(select);
  select.focus();
  select.addEventListener("change", async () => {
    await api(`/api/orders/${id}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: select.value })
    });
    loadOrders();
  });
  select.addEventListener("blur", () => loadOrders());
}

document.getElementById("order-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const productOpt = document.getElementById("o-product").selectedOptions[0];
  const customerOpt = document.getElementById("o-customer").selectedOptions[0];
  const qty = parseInt(document.getElementById("o-qty").value, 10);
  const unitPrice = parseFloat(productOpt.dataset.price);
  await api("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      productId: parseInt(productOpt.value, 10),
      productName: productOpt.dataset.name,
      customerName: customerOpt.dataset.name,
      quantity: qty,
      totalPrice: qty * unitPrice
    })
  });
  e.target.reset();
  document.getElementById("o-qty").value = 1;
  document.getElementById("o-price").value = "";
  loadOrders();
});

checkPulse();
setInterval(checkPulse, 20000);
loadProducts();
loadUsers();
loadOrders();
