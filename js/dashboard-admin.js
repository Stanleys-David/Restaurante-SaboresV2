import { getAllOrders, updateOrderStatus, getAllProducts, deleteProduct } from "./firebase.js"

// Verificar autenticación
const user = JSON.parse(localStorage.getItem("currentUser") || "null")

if (!user || user.role !== "admin") {
  alert("Acceso denegado. Solo los administradores pueden acceder a esta página.")
  window.location.href = "inicioSesion.html"
}

// Variables globales
let employees = JSON.parse(localStorage.getItem("employees") || "[]")
let tables = JSON.parse(localStorage.getItem("tables") || "[]")
let inventory = JSON.parse(localStorage.getItem("inventory") || "[]")
let cashRegister = JSON.parse(localStorage.getItem("cashRegister") || "null")
let editingEmployee = null
let editingTable = null
let editingInventoryItem = null

// Inicialización
document.addEventListener("DOMContentLoaded", () => {
  initializeDashboard()
  setupEventListeners()
  loadOverviewData()
})

function initializeDashboard() {
  // Inicializar datos por defecto si no existen
  if (employees.length === 0) {
    initializeDefaultEmployees()
  }

  if (tables.length === 0) {
    initializeDefaultTables()
  }

  if (inventory.length === 0) {
    initializeDefaultInventory()
  }
}

function initializeDefaultEmployees() {
  const defaultEmployees = [
    {
      id: 1,
      name: "María García",
      email: "maria@restaurante.com",
      phone: "3001234567",
      role: "mesero",
      salary: 1200000,
      status: "activo",
      startDate: new Date().toISOString().split("T")[0],
    },
    {
      id: 2,
      name: "Carlos Rodríguez",
      email: "carlos@restaurante.com",
      phone: "3007654321",
      role: "cocinero",
      salary: 1500000,
      status: "activo",
      startDate: new Date().toISOString().split("T")[0],
    },
  ]

  employees = defaultEmployees
  localStorage.setItem("employees", JSON.stringify(employees))
}

function initializeDefaultTables() {
  const defaultTables = [
    { id: 1, number: 1, capacity: 4, location: "interior", status: "libre" },
    { id: 2, number: 2, capacity: 2, location: "interior", status: "libre" },
    { id: 3, number: 3, capacity: 6, location: "terraza", status: "libre" },
    { id: 4, number: 4, capacity: 4, location: "terraza", status: "libre" },
    { id: 5, number: 5, capacity: 8, location: "privado", status: "libre" },
  ]

  tables = defaultTables
  localStorage.setItem("tables", JSON.stringify(tables))
}

function initializeDefaultInventory() {
  const defaultInventory = [
    {
      id: 1,
      name: "Arroz",
      category: "ingredientes",
      stock: 50,
      minStock: 10,
      unit: "kg",
    },
    {
      id: 2,
      name: "Pollo",
      category: "ingredientes",
      stock: 25,
      minStock: 5,
      unit: "kg",
    },
    {
      id: 3,
      name: "Coca Cola",
      category: "bebidas",
      stock: 100,
      minStock: 20,
      unit: "unidad",
    },
    {
      id: 4,
      name: "Aceite",
      category: "ingredientes",
      stock: 3,
      minStock: 5,
      unit: "l",
    },
  ]

  inventory = defaultInventory
  localStorage.setItem("inventory", JSON.stringify(inventory))
}

function setupEventListeners() {
  // Navegación del sidebar
  document.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault()
      const section = link.dataset.section
      showSection(section)

      // Actualizar navegación activa
      document.querySelectorAll(".nav-link").forEach((l) => l.classList.remove("active"))
      link.classList.add("active")

      // Actualizar título
      const title = link.querySelector("span").textContent
      document.getElementById("pageTitle").textContent = title
    })
  })

  // Toggle sidebar en móvil
  document.querySelector(".sidebar-toggle")?.addEventListener("click", () => {
    document.querySelector(".sidebar").classList.toggle("open")
  })

  // Logout
  document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.removeItem("currentUser")
    localStorage.removeItem("currentUserEmail")
    showNotification("Sesión cerrada correctamente", "success")
    window.location.href = "inicioSesion.html"
  })

  // Formularios
  setupFormListeners()
}

function setupFormListeners() {
  // Employee form
  document.getElementById("employeeForm").addEventListener("submit", (e) => {
    e.preventDefault()
    saveEmployee()
  })

  // Table form
  document.getElementById("tableForm").addEventListener("submit", (e) => {
    e.preventDefault()
    saveTable()
  })

  // Inventory form
  document.getElementById("inventoryForm").addEventListener("submit", (e) => {
    e.preventDefault()
    saveInventoryItem()
  })

  // Cash register form
  document.getElementById("cashRegisterForm").addEventListener("submit", (e) => {
    e.preventDefault()
    openCashRegisterAction()
  })
}

function showSection(sectionName) {
  // Ocultar todas las secciones
  document.querySelectorAll(".content-section").forEach((section) => {
    section.classList.remove("active")
  })

  // Mostrar la sección seleccionada
  document.getElementById(`${sectionName}-section`).classList.add("active")

  // Cargar datos específicos de la sección
  switch (sectionName) {
    case "overview":
      loadOverviewData()
      break
    case "employees":
      renderEmployees()
      break
    case "tables":
      renderTables()
      break
    case "inventory":
      renderInventory()
      break
    case "sales":
      renderSales()
      break
    case "orders":
      renderOrders()
      break
    case "menu-management":
      renderMenuManagement()
      break
  }
}

// ==========================================
// OVERVIEW FUNCTIONS
// ==========================================

async function loadOverviewData() {
  try {
    // Cargar pedidos para estadísticas
    const ordersResult = await getAllOrders()
    let allOrders = []

    if (ordersResult.success) {
      allOrders = ordersResult.orders
    }

    // Calcular estadísticas del día
    const today = new Date().toDateString()
    const todayOrders = allOrders.filter((order) => {
      const orderDate = order.createdAt
        ? order.createdAt.seconds
          ? new Date(order.createdAt.seconds * 1000).toDateString()
          : new Date(order.createdAt).toDateString()
        : new Date(order.date).toDateString()
      return orderDate === today
    })

    const todaySales = todayOrders.reduce((sum, order) => sum + (order.total || 0), 0)
    const occupiedTables = tables.filter((table) => table.status === "ocupada").length
    const activeEmployees = employees.filter((emp) => emp.status === "activo").length

    // Actualizar estadísticas en el DOM
    document.getElementById("todaySales").textContent = `$${todaySales.toLocaleString()}`
    document.getElementById("todayOrders").textContent = todayOrders.length
    document.getElementById("occupiedTables").textContent = `${occupiedTables}/${tables.length}`
    document.getElementById("activeEmployees").textContent = activeEmployees

    // Renderizar productos más vendidos
    renderTopProducts(allOrders)
  } catch (error) {
    console.error("Error loading overview data:", error)
  }
}

function renderTopProducts(orders) {
  const productSales = {}

  orders.forEach((order) => {
    if (order.items) {
      order.items.forEach((item) => {
        const productName = item.name || "Producto"
        productSales[productName] = (productSales[productName] || 0) + (item.quantity || 1)
      })
    }
  })

  const sortedProducts = Object.entries(productSales)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)

  const topProductsContainer = document.getElementById("topProducts")
  topProductsContainer.innerHTML = sortedProducts
    .map(
      ([name, quantity]) => `
    <div class="top-product-item">
      <span class="product-name">${name}</span>
      <span class="product-sales">${quantity} vendidos</span>
    </div>
  `,
    )
    .join("")
}

// ==========================================
// EMPLOYEES FUNCTIONS
// ==========================================

function renderEmployees() {
  const employeesGrid = document.getElementById("employeesGrid")

  if (employees.length === 0) {
    employeesGrid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 2rem;">
        <i class="fas fa-users" style="font-size: 3rem; color: #9ca3af; margin-bottom: 1rem;"></i>
        <h3>No hay empleados registrados</h3>
        <p style="color: #6b7280; margin-bottom: 1rem;">Agrega empleados para gestionar tu equipo</p>
        <button class="btn btn-primary" onclick="openEmployeeModal()">
          <i class="fas fa-plus"></i> Agregar Primer Empleado
        </button>
      </div>
    `
    return
  }

  employeesGrid.innerHTML = employees
    .map(
      (employee) => `
    <div class="employee-card">
      <div class="employee-header">
        <div class="employee-avatar">
          ${employee.name.charAt(0).toUpperCase()}
        </div>
        <div class="employee-info">
          <h4>${employee.name}</h4>
          <span class="employee-role">${employee.role}</span>
        </div>
      </div>
      
      <div class="employee-details">
        <div class="employee-detail">
          <span>Email:</span>
          <span>${employee.email}</span>
        </div>
        <div class="employee-detail">
          <span>Teléfono:</span>
          <span>${employee.phone}</span>
        </div>
        <div class="employee-detail">
          <span>Salario:</span>
          <span>$${employee.salary.toLocaleString()}</span>
        </div>
        <div class="employee-detail">
          <span>Estado:</span>
          <span class="status-badge ${employee.status}">${employee.status}</span>
        </div>
      </div>
      
      <div class="employee-actions">
        <button class="btn btn-sm btn-primary" onclick="editEmployee(${employee.id})">
          <i class="fas fa-edit"></i>
        </button>
        <button class="btn btn-sm btn-danger" onclick="deleteEmployee(${employee.id})">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    </div>
  `,
    )
    .join("")
}

function openEmployeeModal(employeeId = null) {
  const modal = document.getElementById("employeeModal")
  const title = document.getElementById("employeeModalTitle")
  const form = document.getElementById("employeeForm")

  if (employeeId) {
    editingEmployee = employees.find((emp) => emp.id === employeeId)
    title.textContent = "Editar Empleado"

    // Llenar formulario con datos existentes
    document.getElementById("employeeName").value = editingEmployee.name
    document.getElementById("employeeEmail").value = editingEmployee.email
    document.getElementById("employeePhone").value = editingEmployee.phone
    document.getElementById("employeeRole").value = editingEmployee.role
    document.getElementById("employeeSalary").value = editingEmployee.salary
  } else {
    editingEmployee = null
    title.textContent = "Agregar Empleado"
    form.reset()
  }

  modal.classList.add("show")
}

function closeEmployeeModal() {
  document.getElementById("employeeModal").classList.remove("show")
  editingEmployee = null
}

function saveEmployee() {
  const formData = {
    name: document.getElementById("employeeName").value,
    email: document.getElementById("employeeEmail").value,
    phone: document.getElementById("employeePhone").value,
    role: document.getElementById("employeeRole").value,
    salary: Number.parseInt(document.getElementById("employeeSalary").value),
    status: "activo",
  }

  if (editingEmployee) {
    // Actualizar empleado existente
    const index = employees.findIndex((emp) => emp.id === editingEmployee.id)
    employees[index] = { ...editingEmployee, ...formData }
    showNotification("Empleado actualizado correctamente", "success")
  } else {
    // Agregar nuevo empleado
    const newEmployee = {
      id: Date.now(),
      ...formData,
      startDate: new Date().toISOString().split("T")[0],
    }
    employees.push(newEmployee)
    showNotification("Empleado agregado correctamente", "success")
  }

  localStorage.setItem("employees", JSON.stringify(employees))
  renderEmployees()
  closeEmployeeModal()
}

function editEmployee(employeeId) {
  openEmployeeModal(employeeId)
}

function deleteEmployee(employeeId) {
  if (confirm("¿Estás seguro de que deseas eliminar este empleado?")) {
    employees = employees.filter((emp) => emp.id !== employeeId)
    localStorage.setItem("employees", JSON.stringify(employees))
    renderEmployees()
    showNotification("Empleado eliminado correctamente", "success")
  }
}

// ==========================================
// TABLES FUNCTIONS
// ==========================================

function renderTables() {
  const tablesGrid = document.getElementById("tablesGrid")

  if (tables.length === 0) {
    tablesGrid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 2rem;">
        <i class="fas fa-chair" style="font-size: 3rem; color: #9ca3af; margin-bottom: 1rem;"></i>
        <h3>No hay mesas registradas</h3>
        <p style="color: #6b7280; margin-bottom: 1rem;">Agrega mesas para gestionar tu restaurante</p>
        <button class="btn btn-primary" onclick="openTableModal()">
          <i class="fas fa-plus"></i> Agregar Primera Mesa
        </button>
      </div>
    `
    return
  }

  tablesGrid.innerHTML = tables
    .map(
      (table) => `
    <div class="table-card">
      <div class="table-number">Mesa ${table.number}</div>
      <div class="table-capacity">
        <i class="fas fa-users"></i> ${table.capacity} personas
      </div>
      <div class="table-status ${table.status}">${table.status}</div>
      <div class="table-location">
        <i class="fas fa-map-marker-alt"></i> ${table.location}
      </div>
      
      <div class="table-actions" style="margin-top: 1rem;">
        <button class="btn btn-sm btn-primary" onclick="editTable(${table.id})">
          <i class="fas fa-edit"></i>
        </button>
        <button class="btn btn-sm btn-warning" onclick="changeTableStatus(${table.id})">
          <i class="fas fa-exchange-alt"></i>
        </button>
        <button class="btn btn-sm btn-danger" onclick="deleteTable(${table.id})">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    </div>
  `,
    )
    .join("")
}

function openTableModal(tableId = null) {
  const modal = document.getElementById("tableModal")
  const title = document.getElementById("tableModalTitle")
  const form = document.getElementById("tableForm")

  if (tableId) {
    editingTable = tables.find((table) => table.id === tableId)
    title.textContent = "Editar Mesa"

    document.getElementById("tableNumber").value = editingTable.number
    document.getElementById("tableCapacity").value = editingTable.capacity
    document.getElementById("tableLocation").value = editingTable.location
  } else {
    editingTable = null
    title.textContent = "Agregar Mesa"
    form.reset()
  }

  modal.classList.add("show")
}

function closeTableModal() {
  document.getElementById("tableModal").classList.remove("show")
  editingTable = null
}

function saveTable() {
  const formData = {
    number: Number.parseInt(document.getElementById("tableNumber").value),
    capacity: Number.parseInt(document.getElementById("tableCapacity").value),
    location: document.getElementById("tableLocation").value,
    status: "libre",
  }

  // Verificar que el número de mesa no esté duplicado
  const existingTable = tables.find(
    (table) => table.number === formData.number && (!editingTable || table.id !== editingTable.id),
  )

  if (existingTable) {
    showNotification("Ya existe una mesa con ese número", "error")
    return
  }

  if (editingTable) {
    const index = tables.findIndex((table) => table.id === editingTable.id)
    tables[index] = { ...editingTable, ...formData }
    showNotification("Mesa actualizada correctamente", "success")
  } else {
    const newTable = {
      id: Date.now(),
      ...formData,
    }
    tables.push(newTable)
    showNotification("Mesa agregada correctamente", "success")
  }

  localStorage.setItem("tables", JSON.stringify(tables))
  renderTables()
  closeTableModal()
}

function editTable(tableId) {
  openTableModal(tableId)
}

function changeTableStatus(tableId) {
  const table = tables.find((t) => t.id === tableId)
  const statuses = ["libre", "ocupada", "reservada"]
  const currentIndex = statuses.indexOf(table.status)
  const nextIndex = (currentIndex + 1) % statuses.length

  table.status = statuses[nextIndex]
  localStorage.setItem("tables", JSON.stringify(tables))
  renderTables()
  showNotification(`Mesa ${table.number} marcada como ${table.status}`, "info")
}

function deleteTable(tableId) {
  if (confirm("¿Estás seguro de que deseas eliminar esta mesa?")) {
    tables = tables.filter((table) => table.id !== tableId)
    localStorage.setItem("tables", JSON.stringify(tables))
    renderTables()
    showNotification("Mesa eliminada correctamente", "success")
  }
}

// ==========================================
// INVENTORY FUNCTIONS
// ==========================================

function renderInventory() {
  const tableBody = document.getElementById("inventoryTableBody")

  if (inventory.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 2rem;">
          <i class="fas fa-boxes" style="font-size: 3rem; color: #9ca3af; margin-bottom: 1rem;"></i>
          <h3>No hay productos en inventario</h3>
          <p style="color: #6b7280;">Agrega productos para gestionar tu inventario</p>
        </td>
      </tr>
    `
    return
  }

  tableBody.innerHTML = inventory
    .map((item) => {
      let stockStatus = "normal"
      if (item.stock === 0) {
        stockStatus = "agotado"
      } else if (item.stock <= item.minStock) {
        stockStatus = "bajo"
      }

      return `
      <tr>
        <td>${item.name}</td>
        <td>${item.category}</td>
        <td>${item.stock}</td>
        <td>${item.minStock}</td>
        <td>${item.unit}</td>
        <td>
          <span class="stock-status ${stockStatus}">
            ${stockStatus === "normal" ? "Normal" : stockStatus === "bajo" ? "Stock Bajo" : "Agotado"}
          </span>
        </td>
        <td>
          <button class="btn btn-sm btn-primary" onclick="editInventoryItem(${item.id})">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn btn-sm btn-success" onclick="addStock(${item.id})">
            <i class="fas fa-plus"></i>
          </button>
          <button class="btn btn-sm btn-danger" onclick="deleteInventoryItem(${item.id})">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      </tr>
    `
    })
    .join("")
}

function openInventoryModal(itemId = null) {
  const modal = document.getElementById("inventoryModal")
  const title = document.getElementById("inventoryModalTitle")
  const form = document.getElementById("inventoryForm")

  if (itemId) {
    editingInventoryItem = inventory.find((item) => item.id === itemId)
    title.textContent = "Editar Producto"

    document.getElementById("inventoryName").value = editingInventoryItem.name
    document.getElementById("inventoryCategory").value = editingInventoryItem.category
    document.getElementById("inventoryStock").value = editingInventoryItem.stock
    document.getElementById("inventoryMinStock").value = editingInventoryItem.minStock
    document.getElementById("inventoryUnit").value = editingInventoryItem.unit
  } else {
    editingInventoryItem = null
    title.textContent = "Agregar Producto al Inventario"
    form.reset()
  }

  modal.classList.add("show")
}

function closeInventoryModal() {
  document.getElementById("inventoryModal").classList.remove("show")
  editingInventoryItem = null
}

function saveInventoryItem() {
  const formData = {
    name: document.getElementById("inventoryName").value,
    category: document.getElementById("inventoryCategory").value,
    stock: Number.parseInt(document.getElementById("inventoryStock").value),
    minStock: Number.parseInt(document.getElementById("inventoryMinStock").value),
    unit: document.getElementById("inventoryUnit").value,
  }

  if (editingInventoryItem) {
    const index = inventory.findIndex((item) => item.id === editingInventoryItem.id)
    inventory[index] = { ...editingInventoryItem, ...formData }
    showNotification("Producto actualizado correctamente", "success")
  } else {
    const newItem = {
      id: Date.now(),
      ...formData,
    }
    inventory.push(newItem)
    showNotification("Producto agregado al inventario", "success")
  }

  localStorage.setItem("inventory", JSON.stringify(inventory))
  renderInventory()
  closeInventoryModal()
}

function editInventoryItem(itemId) {
  openInventoryModal(itemId)
}

function addStock(itemId) {
  const quantity = prompt("¿Cuántas unidades deseas agregar?")
  if (quantity && !isNaN(quantity)) {
    const item = inventory.find((i) => i.id === itemId)
    item.stock += Number.parseInt(quantity)
    localStorage.setItem("inventory", JSON.stringify(inventory))
    renderInventory()
    showNotification(`Se agregaron ${quantity} unidades de ${item.name}`, "success")
  }
}

function deleteInventoryItem(itemId) {
  if (confirm("¿Estás seguro de que deseas eliminar este producto del inventario?")) {
    inventory = inventory.filter((item) => item.id !== itemId)
    localStorage.setItem("inventory", JSON.stringify(inventory))
    renderInventory()
    showNotification("Producto eliminado del inventario", "success")
  }
}

function showLowStockAlert() {
  const lowStockItems = inventory.filter((item) => item.stock <= item.minStock)

  if (lowStockItems.length === 0) {
    showNotification("No hay productos con stock bajo", "info")
    return
  }

  const alertMessage = `Productos con stock bajo:\n${lowStockItems
    .map((item) => `• ${item.name}: ${item.stock} ${item.unit} (mínimo: ${item.minStock})`)
    .join("\n")}`

  alert(alertMessage)
}

// ==========================================
// SALES FUNCTIONS
// ==========================================

async function renderSales() {
  try {
    const ordersResult = await getAllOrders()
    let allOrders = []

    if (ordersResult.success) {
      allOrders = ordersResult.orders
    }

    // Calcular ventas por método de pago
    const paymentMethods = {
      efectivo: 0,
      tarjeta: 0,
      transferencia: 0,
    }

    allOrders.forEach((order) => {
      const method = order.details?.paymentMethod || "efectivo"
      paymentMethods[method] = (paymentMethods[method] || 0) + (order.total || 0)
    })

    // Actualizar información de caja
    document.getElementById("initialCash").textContent = `$${(cashRegister?.initialAmount || 0).toLocaleString()}`
    document.getElementById("cashSales").textContent = `$${paymentMethods.efectivo.toLocaleString()}`
    document.getElementById("cardSales").textContent = `$${paymentMethods.tarjeta.toLocaleString()}`
    document.getElementById("transferSales").textContent = `$${paymentMethods.transferencia.toLocaleString()}`

    const totalCash = (cashRegister?.initialAmount || 0) + paymentMethods.efectivo
    document.getElementById("totalCash").textContent = `$${totalCash.toLocaleString()}`

    // Renderizar tabla de ventas
    renderSalesTable(allOrders)
  } catch (error) {
    console.error("Error loading sales data:", error)
  }
}

function renderSalesTable(orders) {
  const tableBody = document.getElementById("salesTableBody")

  if (orders.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 2rem;">
          <i class="fas fa-chart-line" style="font-size: 3rem; color: #9ca3af; margin-bottom: 1rem;"></i>
          <h3>No hay ventas registradas</h3>
          <p style="color: #6b7280;">Las ventas aparecerán aquí cuando se procesen pedidos</p>
        </td>
      </tr>
    `
    return
  }

  tableBody.innerHTML = orders
    .map((order) => {
      let orderDate = "N/A"
      if (order.createdAt) {
        if (order.createdAt.seconds) {
          orderDate = new Date(order.createdAt.seconds * 1000).toLocaleDateString()
        } else {
          orderDate = new Date(order.createdAt).toLocaleDateString()
        }
      } else if (order.date) {
        orderDate = new Date(order.date).toLocaleDateString()
      }

      return `
      <tr>
        <td>${orderDate}</td>
        <td>#${order.id}</td>
        <td>${order.customerName || "Cliente"}</td>
        <td>${order.details?.paymentMethod || "Efectivo"}</td>
        <td>$${(order.total || 0).toLocaleString()}</td>
        <td>
          <span class="order-status ${order.status || "pendiente"}">
            ${order.status || "pendiente"}
          </span>
        </td>
      </tr>
    `
    })
    .join("")
}

function openCashRegister() {
  if (cashRegister && cashRegister.isOpen) {
    showNotification("La caja ya está abierta", "warning")
    return
  }

  document.getElementById("cashRegisterModal").classList.add("show")
}

function closeCashRegisterModal() {
  document.getElementById("cashRegisterModal").classList.remove("show")
}

function openCashRegisterAction() {
  const initialAmount = Number.parseFloat(document.getElementById("initialAmount").value)
  const cashierName = document.getElementById("cashierName").value

  cashRegister = {
    isOpen: true,
    initialAmount: initialAmount,
    cashier: cashierName,
    openedAt: new Date().toISOString(),
    sales: [],
  }

  localStorage.setItem("cashRegister", JSON.stringify(cashRegister))
  closeCashRegisterModal()
  renderSales()
  showNotification(`Caja abierta con $${initialAmount.toLocaleString()}`, "success")
}

function closeCashRegister() {
  if (!cashRegister || !cashRegister.isOpen) {
    showNotification("La caja no está abierta", "warning")
    return
  }

  if (confirm("¿Estás seguro de que deseas cerrar la caja?")) {
    cashRegister.isOpen = false
    cashRegister.closedAt = new Date().toISOString()
    localStorage.setItem("cashRegister", JSON.stringify(cashRegister))
    showNotification("Caja cerrada correctamente", "success")
    renderSales()
  }
}

// ==========================================
// ORDERS FUNCTIONS
// ==========================================

async function renderOrders() {
  try {
    const ordersResult = await getAllOrders()
    let allOrders = []

    if (ordersResult.success) {
      allOrders = ordersResult.orders
    }

    const ordersContainer = document.getElementById("ordersContainer")

    if (allOrders.length === 0) {
      ordersContainer.innerHTML = `
        <div style="text-align: center; padding: 2rem;">
          <i class="fas fa-clipboard-list" style="font-size: 3rem; color: #9ca3af; margin-bottom: 1rem;"></i>
          <h3>No hay pedidos</h3>
          <p style="color: #6b7280;">Los pedidos aparecerán aquí cuando los clientes hagan compras</p>
        </div>
      `
      return
    }

    // Ordenar pedidos por fecha (más recientes primero)
    const sortedOrders = allOrders.sort((a, b) => {
      const dateA = a.createdAt
        ? a.createdAt.seconds
          ? new Date(a.createdAt.seconds * 1000)
          : new Date(a.createdAt)
        : new Date(a.date || 0)
      const dateB = b.createdAt
        ? b.createdAt.seconds
          ? new Date(b.createdAt.seconds * 1000)
          : new Date(b.createdAt)
        : new Date(b.date || 0)
      return dateB - dateA
    })

    ordersContainer.innerHTML = sortedOrders
      .map((order) => {
        let orderDate = "Fecha no disponible"
        if (order.createdAt) {
          if (order.createdAt.seconds) {
            orderDate = new Date(order.createdAt.seconds * 1000).toLocaleString()
          } else {
            orderDate = new Date(order.createdAt).toLocaleString()
          }
        } else if (order.date) {
          orderDate = order.date
        }

        return `
        <div class="order-card">
          <div class="order-header">
            <div class="order-info">
              <h4>Pedido #${order.id}</h4>
              <div class="order-meta">
                <p><i class="fas fa-user"></i> ${order.customerName || "Cliente"}</p>
                <p><i class="fas fa-phone"></i> ${order.phone || "Sin teléfono"}</p>
                <p><i class="fas fa-clock"></i> ${orderDate}</p>
                <p><i class="fas fa-map-marker-alt"></i> ${order.details?.orderType || "N/A"}</p>
              </div>
            </div>
            <div class="order-status-section">
              <span class="order-status ${order.status || "pendiente"}">
                ${order.status || "pendiente"}
              </span>
              <p style="font-size: 1.25rem; font-weight: 600; color: #059669; margin-top: 0.5rem;">
                $${(order.total || 0).toLocaleString()}
              </p>
            </div>
          </div>
          
          <div class="order-items">
            <h5>Productos:</h5>
            ${(order.items || [])
              .map(
                (item) => `
              <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
                <span>${item.name || "Producto"} x${item.quantity || 1}</span>
                <span>$${((item.price || 0) * (item.quantity || 1)).toLocaleString()}</span>
              </div>
            `,
              )
              .join("")}
          </div>
          
          <div class="order-actions" style="margin-top: 1rem; display: flex; gap: 0.5rem;">
            <select onchange="updateOrderStatusDashboard('${order.firebaseId || order.id}', this.value)" style="padding: 0.5rem; border-radius: 0.25rem; border: 1px solid #d1d5db;">
              <option value="pendiente" ${order.status === "pendiente" ? "selected" : ""}>Pendiente</option>
              <option value="preparando" ${order.status === "preparando" ? "selected" : ""}>Preparando</option>
              <option value="listo" ${order.status === "listo" ? "selected" : ""}>Listo</option>
              <option value="entregado" ${order.status === "entregado" ? "selected" : ""}>Entregado</option>
            </select>
            <button class="btn btn-sm btn-primary" onclick="viewOrderDetailsDashboard('${order.firebaseId || order.id}')">
              <i class="fas fa-eye"></i> Ver Detalles
            </button>
          </div>
        </div>
      `
      })
      .join("")
  } catch (error) {
    console.error("Error loading orders:", error)
  }
}

async function updateOrderStatusDashboard(orderId, newStatus) {
  try {
    const result = await updateOrderStatus(orderId, newStatus)
    if (result.success) {
      showNotification(`Pedido #${orderId} actualizado a ${newStatus}`, "success")
      renderOrders()
    } else {
      showNotification("Error al actualizar el pedido", "error")
    }
  } catch (error) {
    console.error("Error updating order status:", error)
    showNotification("Error al actualizar el pedido", "error")
  }
}

function viewOrderDetailsDashboard(orderId) {
  // Redirigir al admin original para ver detalles
  window.open(`admin.html#order-${orderId}`, "_blank")
}

// ==========================================
// MENU MANAGEMENT FUNCTIONS
// ==========================================

async function renderMenuManagement() {
  try {
    const productsResult = await getAllProducts()
    let allProducts = []

    if (productsResult.success) {
      allProducts = productsResult.products
    }

    const menuCategories = document.getElementById("menuCategories")

    if (allProducts.length === 0) {
      menuCategories.innerHTML = `
        <div style="text-align: center; padding: 2rem;">
          <i class="fas fa-utensils" style="font-size: 3rem; color: #9ca3af; margin-bottom: 1rem;"></i>
          <h3>No hay productos en el menú</h3>
          <p style="color: #6b7280; margin-bottom: 1rem;">Agrega productos para crear tu menú</p>
          <button class="btn btn-primary" onclick="openMenuItemModal()">
            <i class="fas fa-plus"></i> Agregar Primer Producto
          </button>
        </div>
      `
      return
    }

    // Agrupar productos por categoría
    const groupedProducts = allProducts.reduce((groups, product) => {
      const category = product.category || "Sin categoría"
      if (!groups[category]) {
        groups[category] = []
      }
      groups[category].push(product)
      return groups
    }, {})

    menuCategories.innerHTML = Object.entries(groupedProducts)
      .map(
        ([category, products]) => `
      <div class="menu-category">
        <div class="category-header">
          <h3 class="category-title">${category}</h3>
          <span class="category-count">${products.length} productos</span>
        </div>
        
        <div class="menu-items">
          ${products
            .map(
              (product) => `
            <div class="menu-item">
              <img src="${product.image}" alt="${product.name}" class="menu-item-image" 
                   onerror="this.src='https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=60&h=60&fit=crop'">
              <div class="menu-item-info">
                <div class="menu-item-name">${product.name}</div>
                <div class="menu-item-price">$${product.price.toLocaleString()}</div>
                <div class="menu-item-actions">
                  <button class="btn btn-sm btn-primary" onclick="editMenuItemDashboard('${product.id}')">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button class="btn btn-sm btn-danger" onclick="deleteMenuItemDashboard('${product.id}')">
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          `,
            )
            .join("")}
        </div>
      </div>
    `,
      )
      .join("")
  } catch (error) {
    console.error("Error loading menu:", error)
  }
}

function openMenuItemModal() {
  // Redirigir al admin original para gestionar productos
  window.open("admin.html", "_blank")
}

function editMenuItemDashboard(productId) {
  window.open(`admin.html#edit-${productId}`, "_blank")
}

async function deleteMenuItemDashboard(productId) {
  if (confirm("¿Estás seguro de que deseas eliminar este producto del menú?")) {
    try {
      const result = await deleteProduct(productId)
      if (result.success) {
        showNotification("Producto eliminado del menú", "success")
        renderMenuManagement()
      } else {
        showNotification("Error al eliminar el producto", "error")
      }
    } catch (error) {
      console.error("Error deleting product:", error)
      showNotification("Error al eliminar el producto", "error")
    }
  }
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

function showNotification(message, type = "info") {
  const notification = document.getElementById("notification")
  notification.textContent = message
  notification.className = `notification ${type} show`

  setTimeout(() => {
    notification.classList.remove("show")
  }, 3000)
}

// Hacer funciones globales para onclick
window.openEmployeeModal = openEmployeeModal
window.closeEmployeeModal = closeEmployeeModal
window.editEmployee = editEmployee
window.deleteEmployee = deleteEmployee
window.openTableModal = openTableModal
window.closeTableModal = closeTableModal
window.editTable = editTable
window.changeTableStatus = changeTableStatus
window.deleteTable = deleteTable
window.openInventoryModal = openInventoryModal
window.closeInventoryModal = closeInventoryModal
window.editInventoryItem = editInventoryItem
window.addStock = addStock
window.deleteInventoryItem = deleteInventoryItem
window.showLowStockAlert = showLowStockAlert
window.openCashRegister = openCashRegister
window.closeCashRegisterModal = closeCashRegisterModal
window.closeCashRegister = closeCashRegister
window.updateOrderStatusDashboard = updateOrderStatusDashboard
window.viewOrderDetailsDashboard = viewOrderDetailsDashboard
window.openMenuItemModal = openMenuItemModal
window.editMenuItemDashboard = editMenuItemDashboard
window.deleteMenuItemDashboard = deleteMenuItemDashboard
