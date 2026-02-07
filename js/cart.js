// js/cart.js
(function () {
  const CART_KEY = "cbs_cart_v1";

  function readCart() {
    try { return JSON.parse(localStorage.getItem(CART_KEY)) ?? []; }
    catch { return []; }
  }
  function writeCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    renderCartCount();
    renderCartPanel();
  }

  function addToCart(productId, qty = 1) {
    const cart = readCart();
    const idx = cart.findIndex(i => i.productId === productId);
    if (idx >= 0) cart[idx].qty += qty;
    else cart.push({ productId, qty });
    writeCart(cart);
    openCart();
  }

  function removeFromCart(productId) {
    const cart = readCart().filter(i => i.productId !== productId);
    writeCart(cart);
  }

  function updateQty(productId, qty) {
    const cart = readCart();
    const item = cart.find(i => i.productId === productId);
    if (!item) return;
    item.qty = Math.max(1, qty);
    writeCart(cart);
  }

  function currencyINR(amount) {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
  }

  function getProduct(productId) {
    return (window.PRODUCTS || []).find(p => p.id === productId);
  }

  function ensureCartUI() {
    // Insert cart button into header (right side) if not present
    const headerRight = document.querySelector("[data-header-right]");
    if (!headerRight || headerRight.querySelector("[data-cart-btn]")) return;

    const btn = document.createElement("button");
    btn.className = "icon-btn cart-btn";
    btn.setAttribute("data-cart-btn", "true");
    btn.setAttribute("aria-label", "Open cart");
    btn.innerHTML = `🛒 <span class="cart-count" data-cart-count>0</span>`;
    btn.addEventListener("click", openCart);

    headerRight.appendChild(btn);

    // Add cart drawer + backdrop once per page
    if (!document.querySelector("[data-cart-drawer]")) {
      const backdrop = document.createElement("div");
      backdrop.className = "drawer-backdrop";
      backdrop.setAttribute("data-cart-backdrop", "true");
      backdrop.addEventListener("click", closeCart);

      const drawer = document.createElement("aside");
      drawer.className = "cart-drawer";
      drawer.setAttribute("data-cart-drawer", "true");
      drawer.innerHTML = `
        <div class="cart-head">
          <div class="cart-title">Your Cart</div>
          <button class="icon-btn" data-cart-close aria-label="Close cart">✕</button>
        </div>
        <div class="cart-body" data-cart-body></div>
        <div class="cart-foot" data-cart-foot></div>
      `;

      document.body.appendChild(backdrop);
      document.body.appendChild(drawer);

      drawer.querySelector("[data-cart-close]").addEventListener("click", closeCart);
    }
  }

  function renderCartCount() {
    const cart = readCart();
    const count = cart.reduce((sum, i) => sum + i.qty, 0);
    document.querySelectorAll("[data-cart-count]").forEach(el => (el.textContent = String(count)));
  }

  function renderCartPanel() {
    const body = document.querySelector("[data-cart-body]");
    const foot = document.querySelector("[data-cart-foot]");
    if (!body || !foot) return;

    const cart = readCart();
    if (cart.length === 0) {
      body.innerHTML = `<div class="cart-empty">Your cart is empty.</div>`;
      foot.innerHTML = `
        <div class="cart-total-row"><span>Total</span><strong>${currencyINR(0)}</strong></div>
        <a class="primary-btn disabled" href="javascript:void(0)">Checkout (coming soon)</a>
      `;
      return;
    }

    let total = 0;
    const rows = cart.map(item => {
      const p = getProduct(item.productId);
      if (!p) return "";
      const line = p.price * item.qty;
      total += line;

      return `
        <div class="cart-item">
          <img class="cart-img" src="${p.img}" alt="${p.name}">
          <div class="cart-info">
            <div class="cart-name">${p.name}</div>
            <div class="cart-meta">${currencyINR(p.price)} • ${p.category}</div>
            <div class="cart-controls">
              <button class="qty-btn" data-qty-dec="${p.id}">−</button>
              <input class="qty-input" data-qty-input="${p.id}" value="${item.qty}" inputmode="numeric" />
              <button class="qty-btn" data-qty-inc="${p.id}">+</button>
              <button class="link-btn" data-remove="${p.id}">Remove</button>
            </div>
          </div>
          <div class="cart-line">${currencyINR(line)}</div>
        </div>
      `;
    }).join("");

    body.innerHTML = rows;
    const checkoutPath = window.location.pathname.includes('/html/') ? 'checkout.html' : 'html/checkout.html';
    foot.innerHTML = `
      <div class="cart-total-row"><span>Total</span><strong>${currencyINR(total)}</strong></div>
      <a class="primary-btn" href="${checkoutPath}">Proceed to Checkout</a>
    `;

    // bind events
    cart.forEach(item => {
      const id = item.productId;
      const dec = document.querySelector(`[data-qty-dec="${id}"]`);
      const inc = document.querySelector(`[data-qty-inc="${id}"]`);
      const inp = document.querySelector(`[data-qty-input="${id}"]`);
      const rem = document.querySelector(`[data-remove="${id}"]`);

      dec?.addEventListener("click", () => updateQty(id, Math.max(1, item.qty - 1)));
      inc?.addEventListener("click", () => updateQty(id, item.qty + 1));
      rem?.addEventListener("click", () => removeFromCart(id));

      inp?.addEventListener("change", () => {
        const v = parseInt(inp.value, 10);
        updateQty(id, Number.isFinite(v) ? v : 1);
      });
    });
  }

  function openCart() {
    document.querySelector("[data-cart-backdrop]")?.classList.add("show");
    document.querySelector("[data-cart-drawer]")?.classList.add("open");
  }
  function closeCart() {
    document.querySelector("[data-cart-backdrop]")?.classList.remove("show");
    document.querySelector("[data-cart-drawer]")?.classList.remove("open");
  }

  // Expose addToCart for buttons
  window.CBS = window.CBS || {};
  window.CBS.addToCart = addToCart;

  // Boot
  document.addEventListener("DOMContentLoaded", () => {
    ensureCartUI();
    renderCartCount();
    renderCartPanel();
  });

  // If products render dynamically later, re-render safely
  window.addEventListener("storage", (e) => {
    if (e.key === CART_KEY) {
      renderCartCount();
      renderCartPanel();
    }
  });
})();
