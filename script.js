const api = async (action, options = {}) => {
  const response = await fetch(`index.php?api=${action}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await response.json();
  if (!response.ok)
    throw new Error(data.error || "Could not complete that action.");
  return data;
};
const money = (value) =>
  "₱" +
  Number(value).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
let products = [],
  cart = new Map(),
  category = "All",
  payment = "Cash",
  editingProduct = null;
const $ = (selector) => document.querySelector(selector);
const escapeHtml = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
function toast(message) {
  const el = $("#toast");
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.remove("show"), 2600);
}
async function loadProducts() {
  products = await api("products");
  renderCategories();
  renderProducts();
  renderCart();
  renderInventory();
}
function renderCategories() {
  const cats = ["All", ...new Set(products.map((p) => p.category))];
  $("#categories").innerHTML = cats
    .map(
      (c) =>
        `<button class="category-chip ${category === c ? "active" : ""}" data-category="${escapeHtml(c)}">${escapeHtml(c)}</button>`,
    )
    .join("");
}
function renderProducts() {
  const query = $("#searchInput").value.toLowerCase();
  const shown = products.filter(
    (p) =>
      (category === "All" || p.category === category) &&
      p.name.toLowerCase().includes(query),
  );
  $("#productGrid").innerHTML = shown.length
    ? shown
        .map(
          (p) =>
            `<button class="product-card" data-add="${p.id}" ${Number(p.stock) < 1 ? "disabled" : ""}><span class="product-emoji">${escapeHtml(p.emoji)}</span><span class="add-badge">+</span><span class="product-category">${escapeHtml(p.category)}</span><span class="product-name">${escapeHtml(p.name)}</span><span class="product-meta"><span class="product-price">${money(p.price)}</span><span class="product-stock ${p.stock <= 5 ? "low" : ""}">${p.stock} left</span></span></button>`,
        )
        .join("")
    : '<div class="empty-table">No menu items found.</div>';
}
function renderCart() {
  const list = [...cart.values()];
  const qty = list.reduce((n, x) => n + x.quantity, 0);
  const total = list.reduce((n, x) => n + x.price * x.quantity, 0);
  $("#cartCaption").textContent = qty
    ? `${qty} ${qty === 1 ? "item" : "items"} in this order`
    : "No items yet";
  $("#subtotal").textContent = money(total);
  $("#total").textContent = money(total);
  $("#chargeTotal").innerHTML = `${money(total)} <span>→</span>`;
  $("#checkout").disabled = !qty;
  $("#cartItems").innerHTML = list.length
    ? list
        .map(
          (x) =>
            `<div class="cart-line"><span class="cart-line-emoji">${escapeHtml(x.emoji)}</span><div><div class="cart-line-name">${escapeHtml(x.name)}</div><div class="cart-line-price">${money(x.price)} each</div></div><div class="qty"><button data-qty="${x.id}" data-delta="-1" aria-label="Remove one">−</button><span>${x.quantity}</span><button data-qty="${x.id}" data-delta="1" aria-label="Add one">+</button></div></div>`,
        )
        .join("")
    : '<div class="empty-cart"><div class="empty-icon">＋</div><b>Your order is waiting</b><span>Add items from the menu to get started.</span></div>';
}
function renderInventory() {
  const rows = [...products].sort(
    (a, b) =>
      a.category.localeCompare(b.category) || a.name.localeCompare(b.name),
  );
  $("#inventoryCount").textContent = products.length;
  $("#statProducts").textContent = products.length;
  $("#inventoryRows").innerHTML =
    rows
      .map(
        (p) =>
          `<tr><td><div class="inventory-product"><span>${escapeHtml(p.emoji)}</span><span><b>${escapeHtml(p.name)}</b><small>Menu item #${p.id}</small></span></div></td><td>${escapeHtml(p.category)}</td><td><b>${money(p.price)}</b></td><td><span class="stock-pill ${p.stock <= 5 ? "low" : ""}">${p.stock} in stock</span></td><td><div class="stock-actions"><button data-stock="${p.id}" data-change="-1" aria-label="Reduce stock">−</button><span>${p.stock}</span><button data-stock="${p.id}" data-change="1" aria-label="Add stock">+</button></div></td><td><div class="row-actions"><button data-edit="${p.id}">Edit</button><button class="delete-action" data-delete="${p.id}">Delete</button></div></td></tr>`,
      )
      .join("") ||
    '<tr><td colspan="6" class="empty-table">Your menu is empty.</td></tr>';
}
async function loadOverview() {
  try {
    const data = await api("sales");
    $("#statSales").textContent = money(data.today.total);
    $("#statOrders").textContent = data.today.orders;
    $("#statLow").textContent = data.low;
    $("#salesRows").innerHTML = data.sales.length
      ? data.sales
          .map(
            (s) =>
              `<tr><td class="order-id">#${String(s.id).padStart(4, "0")}</td><td>${new Date(s.created_at.replace(" ", "T") + "Z").toLocaleString("en-PH", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</td><td>${s.lines} ${Number(s.lines) === 1 ? "item" : "items"}</td><td><span class="payment-tag">${escapeHtml(s.payment)}</span></td><td class="right"><b>${money(s.total)}</b></td></tr>`,
          )
          .join("")
      : '<tr><td colspan="5" class="empty-table">No orders yet. Your first sale will show up here.</td></tr>';
  } catch (e) {
    toast(e.message);
  }
}
function go(page) {
  document
    .querySelectorAll(".page")
    .forEach((el) => el.classList.toggle("active", el.id === `page-${page}`));
  document
    .querySelectorAll(".nav-item")
    .forEach((el) => el.classList.toggle("active", el.dataset.page === page));
  $("#pageCrumb").textContent = {
    pos: "Point of sale",
    overview: "Overview",
    inventory: "Inventory",
  }[page];
  if (page === "overview") loadOverview();
}
document.addEventListener("click", async (e) => {
  const nav = e.target.closest("[data-page]");
  if (nav) {
    go(nav.dataset.page);
    return;
  }
  const jump = e.target.closest("[data-goto]");
  if (jump) {
    go(jump.dataset.goto);
    return;
  }
  const cat = e.target.closest("[data-category]");
  if (cat) {
    category = cat.dataset.category;
    renderCategories();
    renderProducts();
    return;
  }
  const add = e.target.closest("[data-add]");
  if (add) {
    const p = products.find((x) => Number(x.id) === Number(add.dataset.add));
    const existing = cart.get(Number(p.id));
    if ((existing?.quantity || 0) >= Number(p.stock)) {
      toast("That’s all the stock you have for this item.");
      return;
    }
    cart.set(Number(p.id), { ...p, quantity: (existing?.quantity || 0) + 1 });
    renderCart();
    return;
  }
  const q = e.target.closest("[data-qty]");
  if (q) {
    const id = Number(q.dataset.qty),
      line = cart.get(id),
      next = line.quantity + Number(q.dataset.delta);
    if (next <= 0) cart.delete(id);
    else if (next <= Number(line.stock))
      cart.set(id, { ...line, quantity: next });
    else toast("That’s all the stock you have for this item.");
    renderCart();
    return;
  }
  const stock = e.target.closest("[data-stock]");
  if (stock) {
    try {
      await api("stock", {
        method: "POST",
        body: JSON.stringify({
          id: Number(stock.dataset.stock),
          change: Number(stock.dataset.change),
        }),
      });
      await loadProducts();
      if ($("#page-overview").classList.contains("active")) loadOverview();
    } catch (err) {
      toast(err.message);
    }
    return;
  }
  const edit = e.target.closest("[data-edit]");
  if (edit) {
    editingProduct = products.find(
      (p) => Number(p.id) === Number(edit.dataset.edit),
    );
    const form = $("#productForm");
    for (const key of ["name", "category", "emoji", "price", "stock"])
      form.elements[key].value = editingProduct[key];
    $("#modalTitle").textContent = "Edit product";
    $("#modalSubtitle").textContent = "Update the details for this menu item.";
    $("#submitLabel").textContent = "Save changes";
    $("#productModal").classList.add("show");
    return;
  }
  const del = e.target.closest("[data-delete]");
  if (del) {
    const product = products.find(
      (p) => Number(p.id) === Number(del.dataset.delete),
    );
    if (!confirm(`Delete ${product.name} from your menu?`)) return;
    try {
      await api(`product&id=${product.id}`, { method: "DELETE" });
      await loadProducts();
      if ($("#page-overview").classList.contains("active")) loadOverview();
      toast(`${product.name} deleted from your menu.`);
    } catch (err) {
      toast(err.message);
    }
    return;
  }
});
$("#searchInput").addEventListener("input", renderProducts);
$("#clearCart").addEventListener("click", () => {
  cart.clear();
  renderCart();
});
$("#refreshOverview").addEventListener("click", loadOverview);
document.querySelectorAll(".pay-option").forEach((b) =>
  b.addEventListener("click", () => {
    payment = b.dataset.payment;
    document.querySelectorAll(".pay-option").forEach((el) => {
      const selected = el === b;
      el.classList.toggle("selected", selected);
      el.setAttribute("aria-pressed", String(selected));
    });
    $("#checkoutLabel").textContent = `Complete ${payment} order`;
  }),
);
$("#checkout").addEventListener("click", async () => {
  const button = $("#checkout");
  button.disabled = true;
  try {
    const result = await api("checkout", {
      method: "POST",
      body: JSON.stringify({
        payment,
        items: [...cart.values()].map((x) => ({
          id: x.id,
          quantity: x.quantity,
        })),
      }),
    });
    cart.clear();
    await loadProducts();
    toast(
      `Order #${String(result.id).padStart(4, "0")} saved · ${money(result.total)}`,
    );
    if ($("#page-overview").classList.contains("active")) loadOverview();
  } catch (e) {
    toast(e.message);
    await loadProducts();
  } finally {
    renderCart();
  }
});
function closeProductModal() {
  editingProduct = null;
  $("#productForm").reset();
  $("#productForm").elements.emoji.value = "🍔";
  $("#modalTitle").textContent = "Add a product";
  $("#modalSubtitle").textContent = "Add something delicious to your stall.";
  $("#submitLabel").textContent = "Add to my menu";
  $("#productModal").classList.remove("show");
}
$("#addProduct").addEventListener("click", () => {
  closeProductModal();
  $("#productModal").classList.add("show");
});
$("#closeModal").addEventListener("click", closeProductModal);
$("#productModal").addEventListener("click", (e) => {
  if (e.target.id === "productModal") closeProductModal();
});
$("#productForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = new FormData(e.currentTarget),
    item = Object.fromEntries(form);
  item.price = Number(item.price);
  item.stock = Number(item.stock);
  const current = editingProduct;
  try {
    await api(current ? `product&id=${current.id}` : "product", {
      method: current ? "PUT" : "POST",
      body: JSON.stringify(item),
    });
    closeProductModal();
    await loadProducts();
    toast(
      current ? `${item.name} updated.` : `${item.name} added to your menu.`,
    );
  } catch (err) {
    toast(err.message);
  }
});
document.addEventListener("keydown", (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
    e.preventDefault();
    $("#searchInput").focus();
  }
  if (e.key === "Escape") $("#productModal").classList.remove("show");
});
$("#dateLabel").textContent = new Date().toLocaleDateString("en-PH", {
  weekday: "short",
  month: "short",
  day: "numeric",
});
loadProducts().catch((e) => toast(e.message));
