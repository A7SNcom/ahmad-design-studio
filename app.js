(() => {
  const whatsappNumber = "966509015300";
  const emailAddress = "INFO@A7SN.COM";
  const storageKey = "a7sn-design-cart-v3";
  const windows = [...document.querySelectorAll(".app-window")];
  const cards = [...document.querySelectorAll(".service-card")];
  const taskButtons = document.getElementById("taskButtons");
  const startMenu = document.getElementById("startMenu");
  const startButton = document.getElementById("startButton");
  const state = { cart: [], currentServiceId: null };
  let topZ = 30;
  let interactInitialized = false;

  const serviceById = (id) => cards.find((card) => card.dataset.id === id);
  const moneyText = (value) => new Intl.NumberFormat("en-US").format(value);
  const isMobile = () => window.matchMedia("(max-width:700px)").matches;

  function saveCart() {
    try { localStorage.setItem(storageKey, JSON.stringify(state.cart)); } catch (_) {}
  }

  function loadCart() {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || "[]");
      state.cart = Array.isArray(saved)
        ? saved.filter((item) => serviceById(item.id)).map((item) => ({
            id: item.id,
            name: serviceById(item.id).dataset.name,
            price: Number(serviceById(item.id).dataset.price)
          }))
        : [];
    } catch (_) {
      state.cart = [];
    }
  }

  function cartTotal() {
    return state.cart.reduce((sum, item) => sum + item.price, 0);
  }

  function inCart(id) {
    return state.cart.some((item) => item.id === id);
  }

  function addToCart(id) {
    const card = serviceById(id);
    if (!card) return;
    if (inCart(id)) {
      state.cart = state.cart.filter((item) => item.id !== id);
    } else {
      state.cart.push({
        id,
        name: card.dataset.name,
        price: Number(card.dataset.price)
      });
    }
    saveCart();
    renderCart();
  }

  function removeFromCart(id) {
    state.cart = state.cart.filter((item) => item.id !== id);
    saveCart();
    renderCart();
  }

  function renderCart() {
    const cartItems = document.getElementById("cartItems");
    const cartEmpty = document.getElementById("cartEmpty");
    const cartTotalEl = document.getElementById("cartTotal");
    const orderSummary = document.getElementById("orderSummary");
    const orderTotal = document.getElementById("orderTotal");
    const inlineCount = document.getElementById("cartCountInline");

    inlineCount.textContent = String(state.cart.length);
    cartEmpty.hidden = state.cart.length > 0;

    cartItems.replaceChildren(...state.cart.map((item) => {
      const row = document.createElement("div");
      row.className = "cart-row";

      const name = document.createElement("strong");
      name.textContent = item.name;

      const price = document.createElement("span");
      price.className = "money";
      price.innerHTML = '<span class="currency">ر.س</span><span>' + moneyText(item.price) + "</span>";

      const remove = document.createElement("button");
      remove.type = "button";
      remove.textContent = "إزالة";
      remove.addEventListener("click", () => removeFromCart(item.id));

      row.append(name, price, remove);
      return row;
    }));

    orderSummary.replaceChildren(...(
      state.cart.length
        ? state.cart.map((item) => {
            const row = document.createElement("div");
            row.className = "order-summary-row";
            const name = document.createElement("span");
            name.textContent = item.name;
            const price = document.createElement("strong");
            price.textContent = moneyText(item.price) + " ر.س";
            row.append(name, price);
            return row;
          })
        : [(() => {
            const empty = document.createElement("div");
            empty.className = "empty-state";
            empty.textContent = "لم تختر أي خدمة حتى الآن.";
            return empty;
          })()]
    ));

    cartTotalEl.textContent = moneyText(cartTotal());
    orderTotal.textContent = moneyText(cartTotal());

    cards.forEach((card) => {
      const selected = inCart(card.dataset.id);
      card.classList.toggle("selected", selected);
      const button = card.querySelector(".add-service");
      button.textContent = selected ? "إزالة من الطلب" : "إضافة للطلب";
      button.classList.toggle("default", !selected);
    });
  }

  function ensureWindowPosition(win) {
    if (win.dataset.positioned === "true") return;
    const width = Math.min(Number(win.dataset.width || 600), window.innerWidth - 18);
    const height = Math.min(Number(win.dataset.height || 500), window.innerHeight - 48);
    const cascade = windows.indexOf(win) * 18;
    const left = Math.max(8, Math.round((window.innerWidth - width) / 2) - Math.min(cascade, 100));
    const top = Math.max(8, Math.round((window.innerHeight - 38 - height) / 2) + Math.min(cascade, 80));
    win.style.width = width + "px";
    win.style.height = height + "px";
    win.style.left = left + "px";
    win.style.top = top + "px";
    win.dataset.x = "0";
    win.dataset.y = "0";
    win.dataset.positioned = "true";
  }

  function activateWindow(win) {
    topZ += 1;
    win.style.zIndex = String(topZ);
    document.querySelectorAll(".task-button").forEach((button) => {
      button.classList.toggle("active", button.dataset.windowId === win.id);
    });
  }

  function topVisibleWindow() {
    return windows
      .filter((win) => !win.hidden)
      .sort((a, b) => Number(b.style.zIndex || 0) - Number(a.style.zIndex || 0))[0] || null;
  }

  function syncActiveTask() {
    const topWindow = topVisibleWindow();
    document.querySelectorAll(".task-button").forEach((button) => {
      button.classList.toggle("active", button.dataset.windowId === topWindow?.id);
    });
  }

  function addTaskButton(win) {
    let button = taskButtons.querySelector('[data-window-id="' + win.id + '"]');
    if (button) return button;

    button = document.createElement("button");
    button.type = "button";
    button.className = "task-button";
    button.dataset.windowId = win.id;
    button.textContent = win.dataset.title || win.querySelector(".title-bar-text")?.textContent || "نافذة";
    button.addEventListener("click", () => {
      if (win.hidden) {
        win.hidden = false;
        activateWindow(win);
      } else if (topVisibleWindow() === win) {
        win.hidden = true;
        syncActiveTask();
      } else {
        activateWindow(win);
      }
    });
    taskButtons.append(button);
    return button;
  }

  function openWindow(id) {
    const win = document.getElementById(id);
    if (!win) return;
    ensureWindowPosition(win);
    win.hidden = false;
    if (isMobile() && !win.classList.contains("maximized")) {
      win.classList.add("maximized");
      win.dataset.mobileMaximized = "true";
    } else if (!isMobile() && win.dataset.mobileMaximized === "true") {
      win.classList.remove("maximized");
      delete win.dataset.mobileMaximized;
    }
    activateWindow(win);
    addTaskButton(win).classList.add("active");

    if (id === "cartWindow" || id === "orderWindow") renderCart();
    if (id === "orderWindow") document.getElementById("customerName")?.focus();
    startMenu.hidden = true;
  }

  function closeWindow(win, removeTask = true) {
    if (!win) return;
    win.hidden = true;
    if (removeTask) {
      taskButtons.querySelector('[data-window-id="' + win.id + '"]')?.remove();
    } else {
      taskButtons.querySelector('[data-window-id="' + win.id + '"]')?.classList.remove("active");
    }
    syncActiveTask();
  }

  function toggleMaximize(win) {
    if (!win || isMobile()) return;
    win.classList.toggle("maximized");
  }

  function showPolicy(name, focusTab = false) {
    openWindow("policiesWindow");
    document.querySelectorAll("[data-policy-tab]").forEach((button) => {
      const selected = button.dataset.policyTab === name;
      button.classList.toggle("active", selected);
      button.setAttribute("aria-selected", String(selected));
      button.tabIndex = selected ? 0 : -1;
      if (selected && focusTab) button.focus();
    });
    document.querySelectorAll("[data-policy-pane]").forEach((pane) => {
      pane.classList.toggle("active", pane.dataset.policyPane === name);
    });
  }

  function showServiceDetails(id) {
    const card = serviceById(id);
    if (!card) return;
    state.currentServiceId = id;
    document.getElementById("serviceWindowTitle").textContent = card.dataset.name;
    const details = document.getElementById("serviceDetails");
    const description = card.querySelector("p")?.textContent || "";
    const features = [...card.querySelectorAll("li")].map((li) => "<li>" + li.textContent + "</li>").join("");
    details.innerHTML =
      "<h2>" + card.dataset.name + "</h2>" +
      "<p>" + description + "</p>" +
      "<fieldset><legend>يشمل</legend><ul>" + features + "</ul></fieldset>" +
      '<p><strong>السعر:</strong> <span class="money"><span class="currency">ر.س</span><span>' +
      moneyText(Number(card.dataset.price)) +
      "</span></span></p>";
    document.getElementById("addFromDetails").textContent = inCart(id) ? "إزالة من الطلب" : "إضافة للطلب";
    openWindow("serviceWindow");
  }

  function orderText() {
    const name = document.getElementById("customerName").value.trim();
    const phone = document.getElementById("customerPhone").value.trim();
    const email = document.getElementById("customerEmail").value.trim();
    const notes = document.getElementById("projectNotes").value.trim();
    const services = state.cart.length
      ? state.cart.map((item) => "- " + item.name + ": " + moneyText(item.price) + " ر.س").join("\n")
      : "- لم يتم اختيار خدمة";
    return [
      "طلب خدمة تصميم",
      "",
      "الاسم: " + (name || "غير مذكور"),
      "الجوال: " + (phone || "غير مذكور"),
      "البريد: " + (email || "غير مذكور"),
      "",
      "الخدمات:",
      services,
      "",
      "الإجمالي التقديري: " + moneyText(cartTotal()) + " ر.س",
      "",
      "تفاصيل المشروع:",
      notes || "لا توجد تفاصيل إضافية.",
      "",
      "أرغب بمراجعة النطاق والتوفر ووسيلة الدفع قبل بدء التنفيذ."
    ].join("\n");
  }

  function validateOrder() {
    const status = document.getElementById("orderStatus");
    const nameInput = document.getElementById("customerName");
    const phoneInput = document.getElementById("customerPhone");
    const emailInput = document.getElementById("customerEmail");
    const name = nameInput.value.trim();
    const phone = phoneInput.value.trim();
    const email = emailInput.value.trim();

    [nameInput, phoneInput, emailInput].forEach((input) => input.removeAttribute("aria-invalid"));

    if (!state.cart.length) {
      status.textContent = "أضف خدمة واحدة على الأقل قبل إرسال الطلب.";
      openWindow("storeWindow");
      document.getElementById("servicesPanel")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return false;
    }
    if (!name) {
      status.textContent = "اكتب الاسم أولًا.";
      nameInput.setAttribute("aria-invalid", "true");
      nameInput.focus();
      return false;
    }
    if (!phone && !email) {
      status.textContent = "أدخل رقم جوال أو بريدًا إلكترونيًا للتواصل.";
      phoneInput.setAttribute("aria-invalid", "true");
      emailInput.setAttribute("aria-invalid", "true");
      phoneInput.focus();
      return false;
    }
    if (email && !emailInput.validity.valid) {
      status.textContent = "تحقق من صحة البريد الإلكتروني.";
      emailInput.setAttribute("aria-invalid", "true");
      emailInput.focus();
      return false;
    }

    status.textContent = "";
    return true;
  }

  function sendWhatsApp() {
    if (!validateOrder()) return;
    window.open("https://wa.me/" + whatsappNumber + "?text=" + encodeURIComponent(orderText()), "_blank", "noopener");
    document.getElementById("orderStatus").textContent = "تم تجهيز الطلب وفتح واتساب لإرساله.";
  }

  function sendEmail() {
    if (!validateOrder()) return;
    const subject = encodeURIComponent("طلب خدمة تصميم — " + document.getElementById("customerName").value.trim());
    const body = encodeURIComponent(orderText());
    window.location.href = "mailto:" + emailAddress + "?subject=" + subject + "&body=" + body;
    document.getElementById("orderStatus").textContent = "تم تجهيز رسالة البريد.";
  }

  async function copyOrder() {
    if (!validateOrder()) return;
    try {
      await navigator.clipboard.writeText(orderText());
      document.getElementById("orderStatus").textContent = "تم نسخ الطلب.";
    } catch (_) {
      document.getElementById("orderStatus").textContent = "تعذر النسخ التلقائي. استخدم زر البريد أو واتساب.";
    }
  }

  document.addEventListener("click", (event) => {
    const open = event.target.closest("[data-open]");
    if (open) {
      openWindow(open.dataset.open);
      return;
    }

    const policy = event.target.closest("[data-policy]");
    if (policy) {
      showPolicy(policy.dataset.policy);
      return;
    }

    const detail = event.target.closest("[data-details]");
    if (detail) {
      showServiceDetails(detail.dataset.details);
      return;
    }

    const add = event.target.closest(".add-service");
    if (add) {
      addToCart(add.closest(".service-card").dataset.id);
      return;
    }

    const action = event.target.closest("[data-action]");
    if (action) {
      const win = action.closest(".app-window");
      if (action.dataset.action === "close") closeWindow(win, true);
      if (action.dataset.action === "minimize") closeWindow(win, false);
      if (action.dataset.action === "maximize") toggleMaximize(win);
      return;
    }

    const policyTab = event.target.closest("[data-policy-tab]");
    if (policyTab) {
      showPolicy(policyTab.dataset.policyTab);
      return;
    }

    const view = event.target.closest("[data-view]");
    if (view?.dataset.view === "services") {
      openWindow("storeWindow");
      document.getElementById("servicesPanel").scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    if (!event.target.closest("#startMenu") && !event.target.closest("#startButton")) {
      startMenu.hidden = true;
    }
  });

  document.querySelector(".policy-nav")?.addEventListener("keydown", (event) => {
    const tabs = [...document.querySelectorAll("[data-policy-tab]")];
    const current = tabs.indexOf(document.activeElement);
    if (current < 0) return;

    let next = current;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") next = (current + 1) % tabs.length;
    else if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = (current - 1 + tabs.length) % tabs.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = tabs.length - 1;
    else return;

    event.preventDefault();
    showPolicy(tabs[next].dataset.policyTab, true);
  });

  windows.forEach((win) => {
    win.addEventListener("mousedown", () => activateWindow(win));
    win.addEventListener("touchstart", () => activateWindow(win), { passive: true });
  });

  document.getElementById("clearCart").addEventListener("click", () => {
    state.cart = [];
    saveCart();
    renderCart();
  });

  document.getElementById("addFromDetails").addEventListener("click", () => {
    if (!state.currentServiceId) return;
    addToCart(state.currentServiceId);
    document.getElementById("addFromDetails").textContent =
      inCart(state.currentServiceId) ? "إزالة من الطلب" : "إضافة للطلب";
  });

  document.getElementById("orderForm").addEventListener("submit", (event) => {
    event.preventDefault();
    sendWhatsApp();
  });

  document.getElementById("emailOrder").addEventListener("click", sendEmail);
  document.getElementById("copyOrder").addEventListener("click", copyOrder);

  startButton.addEventListener("click", () => {
    startMenu.hidden = !startMenu.hidden;
  });

  function updateClock() {
    const now = new Date();
    document.getElementById("clock").textContent = new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    }).format(now);
  }

  function initInteract() {
    if (!window.interact || isMobile() || interactInitialized) return;
    interactInitialized = true;
    interact(".app-window")
      .draggable({
        allowFrom: ".window-handle",
        ignoreFrom: "button,a,input,textarea,select",
        listeners: {
          move(event) {
            const target = event.target;
            if (target.classList.contains("maximized")) return;
            const x = (parseFloat(target.dataset.x) || 0) + event.dx;
            const y = (parseFloat(target.dataset.y) || 0) + event.dy;
            target.style.transform = "translate(" + x + "px," + y + "px)";
            target.dataset.x = String(x);
            target.dataset.y = String(y);
          }
        },
        modifiers: [
          interact.modifiers.restrictRect({
            restriction: "#desktop",
            endOnly: true
          })
        ]
      })
      .resizable({
        edges: { left: true, right: true, bottom: true, top: false },
        modifiers: [
          interact.modifiers.restrictEdges({ outer: "#desktop" }),
          interact.modifiers.restrictSize({
            min: { width: 330, height: 220 }
          })
        ],
        listeners: {
          move(event) {
            const target = event.target;
            if (target.classList.contains("maximized")) return;
            let x = parseFloat(target.dataset.x) || 0;
            let y = parseFloat(target.dataset.y) || 0;
            target.style.width = event.rect.width + "px";
            target.style.height = event.rect.height + "px";
            x += event.deltaRect.left;
            y += event.deltaRect.top;
            target.style.transform = "translate(" + x + "px," + y + "px)";
            target.dataset.x = String(x);
            target.dataset.y = String(y);
          }
        }
      });
  }

  function clampWindow(win) {
    if (!win || win.hidden || win.classList.contains("maximized")) return;
    const rect = win.getBoundingClientRect();
    const safeRight = window.innerWidth - 4;
    const safeBottom = window.innerHeight - 42;
    let dx = 0;
    let dy = 0;

    if (rect.left < 4) dx += 4 - rect.left;
    if (rect.right > safeRight) dx -= rect.right - safeRight;
    if (rect.top < 4) dy += 4 - rect.top;
    if (rect.bottom > safeBottom) dy -= rect.bottom - safeBottom;

    if (dx || dy) {
      const x = (parseFloat(win.dataset.x) || 0) + dx;
      const y = (parseFloat(win.dataset.y) || 0) + dy;
      win.style.transform = "translate(" + x + "px," + y + "px)";
      win.dataset.x = String(x);
      win.dataset.y = String(y);
    }
  }

  function syncResponsiveWindows() {
    windows.filter((win) => !win.hidden).forEach((win) => {
      if (isMobile()) {
        if (!win.classList.contains("maximized")) {
          win.classList.add("maximized");
          win.dataset.mobileMaximized = "true";
        }
      } else {
        if (win.dataset.mobileMaximized === "true") {
          win.classList.remove("maximized");
          delete win.dataset.mobileMaximized;
        }
        clampWindow(win);
      }
    });
    initInteract();
  }

  window.addEventListener("resize", syncResponsiveWindows);

  document.querySelectorAll(".window-handle").forEach((handle) => {
    handle.addEventListener("dblclick", () => toggleMaximize(handle.closest(".app-window")));
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (!startMenu.hidden) {
      startMenu.hidden = true;
      return;
    }
    const topWindow = topVisibleWindow();
    if (topWindow && topWindow.id !== "storeWindow") closeWindow(topWindow, true);
  });

  document.querySelectorAll("#customerName, #customerPhone, #customerEmail").forEach((input) => {
    input.addEventListener("input", () => {
      input.removeAttribute("aria-invalid");
      document.getElementById("orderStatus").textContent = "";
    });
  });

  loadCart();
  renderCart();
  windows.forEach(ensureWindowPosition);
  openWindow("storeWindow");
  updateClock();
  setInterval(updateClock, 30000);
  initInteract();
})();