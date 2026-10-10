
const $ = selector => document.querySelector(selector);

const toast = message => {
  const element = $("#toast");
  element.textContent = message;
  element.classList.add("show");

  clearTimeout(toast.timer);
  toast.timer = setTimeout(
    () => element.classList.remove("show"),
    3000
  );
};

// Menú adaptable para celulares
$("#menuToggle").addEventListener("click", () => {
  $("#mainNav").classList.toggle("open");
});

document.querySelectorAll("#mainNav a").forEach(link => {
  link.addEventListener("click", () => {
    $("#mainNav").classList.remove("open");
  });
});

// Selección de paquetes
document.querySelectorAll(".choose").forEach(button => {
  button.addEventListener("click", () => {
    $("#packageSelect").value = button.dataset.package;
    $("#asesoria").scrollIntoView({ behavior: "smooth" });

    toast(
      "Seleccionaste el paquete " +
      button.dataset.package +
      ". Completa el formulario para preparar tu solicitud."
    );
  });
});

// Inventario de demostración
const KEY = "brandspark_demo_inventory_v1";
let products = [];

try {
  products = JSON.parse(localStorage.getItem(KEY) || "[]");

  if (!Array.isArray(products)) {
    products = [];
  }
} catch {
  products = [];
}

const money = value =>
  new Intl.NumberFormat("es-SV", {
    style: "currency",
    currency: "USD"
  }).format(Number(value) || 0);

const escapeHTML = value =>
  String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[character]));

function renderInventory() {
  const body = $("#inventoryRows");

  body.innerHTML = products.length
    ? products.map((product, index) => `
        <tr>
          <td>${escapeHTML(product.name)}</td>
          <td>${escapeHTML(product.category || "Sin categoría")}</td>
          <td>${product.quantity}</td>
          <td>${money(product.price)}</td>
          <td>${money(product.quantity * product.price)}</td>
          <td>
            <button
              data-del="${index}"
              aria-label="Eliminar producto"
            >✕</button>
          </td>
        </tr>
      `).join("")
    : `<tr>
        <td colspan="6" class="empty">
          Todavía no hay productos. Agrega uno para comenzar.
        </td>
      </tr>`;

  $("#productCount").textContent = products.length;

  $("#unitCount").textContent = products.reduce(
    (total, product) => total + product.quantity,
    0
  );

  $("#inventoryValue").textContent = money(
    products.reduce(
      (total, product) =>
        total + product.quantity * product.price,
      0
    )
  );
}

function saveInventory() {
  try {
    localStorage.setItem(KEY, JSON.stringify(products));
  } catch {
    toast("No se pudieron guardar los datos en este navegador.");
  }
}

// Agregar productos
$("#inventoryForm").addEventListener("submit", event => {
  event.preventDefault();

  const formData = new FormData(event.currentTarget);

  const name = String(formData.get("productName")).trim();
  const quantity = Number(formData.get("quantity"));
  const price = Number(formData.get("price"));
  const category = String(formData.get("category") || "").trim();

  if (
    !name ||
    quantity < 0 ||
    price < 0 ||
    !Number.isFinite(quantity) ||
    !Number.isFinite(price)
  ) {
    toast("Revisa el nombre, la cantidad y el precio.");
    return;
  }

  products.push({
    name,
    quantity: Math.floor(quantity),
    price,
    category
  });

  saveInventory();
  renderInventory();
  event.currentTarget.reset();

  toast("Producto agregado al inventario de demostración.");
});

// Eliminar productos
$("#inventoryRows").addEventListener("click", event => {
  const button = event.target.closest("[data-del]");

  if (!button) return;

  products.splice(Number(button.dataset.del), 1);

  saveInventory();
  renderInventory();

  toast("Producto eliminado.");
});

// Vaciar inventario
$("#clearInventory").addEventListener("click", () => {
  if (!products.length) {
    toast("La lista ya está vacía.");
    return;
  }

  if (
    confirm(
      "¿Eliminar todos los productos de demostración guardados en este navegador?"
    )
  ) {
    products = [];

    saveInventory();
    renderInventory();

    toast("Lista vaciada.");
  }
});

// Formularios de asesoría y contacto
function setupForm(formId, feedbackId, type) {
  $(formId).addEventListener("submit", event => {
    event.preventDefault();

    const data = Object.fromEntries(
      new FormData(event.currentTarget)
    );

    let summary;

    if (type === "advice") {
      summary =
        `SOLICITUD DE ASESORÍA BRANDSPARK\n` +
        `Nombre: ${data.name}\n` +
        `Emprendimiento: ${data.business}\n` +
        `Correo: ${data.email}\n` +
        `Paquete: ${data.package}\n` +
        `Área: ${data.area}\n` +
        `Mensaje: ${data.message}`;
    } else {
      summary =
        `MENSAJE PARA BRANDSPARK\n` +
        `Nombre: ${data.contactName}\n` +
        `Correo: ${data.contactEmail}\n` +
        `Mensaje: ${data.contactMessage}`;
    }

    const output = $(feedbackId);
    output.innerHTML = "";

    const message = document.createElement("p");
    message.textContent =
      "Tu información está preparada. Este prototipo no la envía automáticamente; copia el resumen para compartirlo con el equipo.";

    const details = document.createElement("details");
    const summaryElement = document.createElement("summary");
    const pre = document.createElement("pre");

    summaryElement.textContent = "Ver resumen";
    pre.style.whiteSpace = "pre-wrap";
    pre.textContent = summary;

    details.append(summaryElement, pre);

    const copyButton = document.createElement("button");
    copyButton.className = "btn outline";
    copyButton.type = "button";
    copyButton.textContent = "Copiar resumen";

    copyButton.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(summary);
        toast("Resumen copiado.");
      } catch {
        toast("Selecciona el resumen y cópialo manualmente.");
      }
    });

    output.append(message, copyButton, details);

    event.currentTarget.reset();

    toast("Solicitud preparada correctamente.");
  });
}

setupForm("#adviceForm", "#adviceFeedback", "advice");
setupForm("#contactForm", "#contactFeedback", "contact");

// Año automático en el pie de página
$("#year").textContent = new Date().getFullYear();

// Mostrar los productos guardados
renderInventory();
