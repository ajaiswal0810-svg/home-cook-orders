// Home Cook Orders Platform - Vanilla JS Frontend
// Works for both index.html (customer) and dashboard.html (cook)

const API_BASE = 'http://localhost:5000/api';

// ==================== SHARED FUNCTIONS ====================

/**
 * Load menu items from API
 */
async function loadMenu() {
    try {
        const response = await fetch(`${API_BASE}/menu`);
        if (!response.ok) throw new Error('Failed to load menu');
        return await response.json();
    } catch (error) {
        console.error('Error loading menu:', error);
        handleError('error-msg', 'Failed to load menu items');
        return [];
    }
}

/**
 * Load orders from API
 */
async function loadOrders() {
    try {
        const response = await fetch(`${API_BASE}/orders`);
        if (!response.ok) throw new Error('Failed to load orders');
        return await response.json();
    } catch (error) {
        console.error('Error loading orders:', error);
        handleError('error-msg', 'Failed to load orders');
        return [];
    }
}

/**
 * Load prep list from API
 */
async function loadPrep() {
    try {
        const response = await fetch(`${API_BASE}/prep`);
        if (!response.ok) throw new Error('Failed to load prep list');
        return await response.json();
    } catch (error) {
        console.error('Error loading prep list:', error);
        handleError('error-msg', 'Failed to load prep list');
        return [];
    }
}

/**
 * Display error message
 */
function handleError(elementId, message) {
    const el = document.getElementById(elementId);
    if (el) {
        el.textContent = message;
        el.style.display = 'block';
        setTimeout(() => {
            el.style.display = 'none';
        }, 5000);
    }
}

/**
 * Display success message
 */
function handleSuccess(elementId, message) {
    const el = document.getElementById(elementId);
    if (el) {
        el.textContent = message;
        el.style.display = 'block';
        setTimeout(() => {
            el.style.display = 'none';
        }, 3000);
    }
}

/**
 * Format datetime to readable string
 */
function formatDateTime(isoString) {
    const date = new Date(isoString);
    return date.toLocaleString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Check if current time is past cutoff time
 */
function isPastCutoff(cutoffTime) {
    return new Date() > new Date(cutoffTime);
}

// ==================== CUSTOMER PAGE (index.html) ====================

/**
 * Initialize customer page
 */
async function initCustomerPage() {
    if (document.getElementById('order-form')) {
        // Load menu and populate both display and dropdown
        const menu = await loadMenu();
        displayMenuCards(menu);
        populateMenuDropdown(menu);
        
        // Handle order form submission
        document.getElementById('order-form').addEventListener('submit', submitOrder);
    }
}

/**
 * Display menu items as cards
 */
function displayMenuCards(menu) {
    const menuList = document.getElementById('menu-list');
    if (!menuList) return;
    
    if (menu.length === 0) {
        menuList.innerHTML = '<div class="empty-state">No menu items available</div>';
        return;
    }
    
    menuList.innerHTML = menu.map(item => {
        const cutoff = new Date(item.cutoff_time);
        const isPast = isPastCutoff(item.cutoff_time);
        const statusClass = isPast ? 'order-status' : 'menu-item-portions';
        const statusText = isPast ? 'Order Closed' : `${item.portions} left`;
        
        return `
            <div class="card menu-item">
                <div class="menu-item-info">
                    <h3>${item.name}</h3>
                    <div class="menu-item-price">₹${item.price.toFixed(2)}</div>
                    <p><strong>Cutoff:</strong> ${formatDateTime(item.cutoff_time)}</p>
                    <p><strong>Portions:</strong> <span class="${statusClass}">${statusText}</span></p>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Populate menu dropdown for order form
 */
function populateMenuDropdown(menu) {
    const select = document.getElementById('item-select');
    if (!select) return;
    
    const options = menu
        .filter(item => !isPastCutoff(item.cutoff_time))
        .map(item => `<option value="${item.id}">${item.name} - ₹${item.price}</option>`)
        .join('');
    
    select.innerHTML = '<option value="">-- Choose an item --</option>' + options;
}

/**
 * Submit order form
 */
async function submitOrder(event) {
    event.preventDefault();
    
    const formData = new FormData(document.getElementById('order-form'));
    const data = {
        name: formData.get('name'),
        phone: formData.get('phone'),
        item_id: parseInt(formData.get('item_id')),
        quantity: parseInt(formData.get('quantity'))
    };
    
    // Validate
    if (!data.name || !data.phone || !data.item_id || !data.quantity) {
        handleError('error-msg', 'Please fill all fields');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/order`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            handleError('error-msg', result.error || 'Failed to place order');
            return;
        }
        
        // Show confirmation
        showOrderConfirmation(result);
        
        // Clear form
        document.getElementById('order-form').reset();
        document.getElementById('item-select').value = '';
        
        // Reload menu
        const menu = await loadMenu();
        displayMenuCards(menu);
        populateMenuDropdown(menu);
        
        handleSuccess('success-msg', 'Order placed successfully!');
        
    } catch (error) {
        console.error('Error submitting order:', error);
        handleError('error-msg', 'Error placing order. Please try again.');
    }
}

/**
 * Show order confirmation details
 */
function showOrderConfirmation(order) {
    document.getElementById('order-form-section').style.display = 'none';
    document.getElementById('menu').style.display = 'none';
    
    const confirmSection = document.getElementById('order-confirmation');
    confirmSection.style.display = 'block';
    
    document.getElementById('confirm-order-id').textContent = order.id;
    document.getElementById('confirm-name').textContent = order.name;
    document.getElementById('confirm-item').textContent = `Item ID: ${order.item_id}`;
    document.getElementById('confirm-quantity').textContent = order.quantity;
    document.getElementById('confirm-time').textContent = formatDateTime(order.timestamp);
}

// ==================== COOK PAGE (dashboard.html) ====================

/**
 * Initialize cook dashboard
 */
async function initDashboard() {
    if (document.getElementById('add-item-form')) {
        // Load initial data
        loadDashboardData();
        
        // Handle add item form
        document.getElementById('add-item-form').addEventListener('submit', submitAddItem);
        
        // Update last refresh time
        updateLastRefresh();
    }
}

/**
 * Load all dashboard data
 */
async function loadDashboardData() {
    const menu = await loadMenu();
    displayCurrentMenu(menu);
    
    const orders = await loadOrders();
    displayOrders(orders);
    
    const prep = await loadPrep();
    displayPrepList(prep);
    
    updateLastRefresh();
}

/**
 * Display current menu items
 */
function displayCurrentMenu(menu) {
    const container = document.getElementById('menu-container');
    if (!container) return;
    
    if (menu.length === 0) {
        container.innerHTML = '<div class="empty-state">No menu items added yet</div>';
        return;
    }
    
    const html = menu.map(item => `
        <div class="card">
            <h3>${item.name}</h3>
            <p><strong>Price:</strong> ₹${item.price.toFixed(2)}</p>
            <p><strong>Portions:</strong> ${item.portions}</p>
            <p><strong>Cutoff:</strong> ${formatDateTime(item.cutoff_time)}</p>
        </div>
    `).join('');
    
    container.innerHTML = html;
}

/**
 * Submit add item form
 */
async function submitAddItem(event) {
    event.preventDefault();
    
    const formData = new FormData(document.getElementById('add-item-form'));
    const cutoffLocal = formData.get('cutoff_time');
    
    // Convert datetime-local to ISO string
    const cutoffDate = new Date(cutoffLocal);
    const isoString = cutoffDate.toISOString();
    
    const data = {
        name: formData.get('name'),
        price: parseFloat(formData.get('price')),
        portions: parseInt(formData.get('portions')),
        cutoff_time: isoString
    };
    
    // Validate
    if (!data.name || !data.price || !data.portions || !data.cutoff_time) {
        handleError('error-msg', 'Please fill all fields');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/menu`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            handleError('error-msg', result.error || 'Failed to add item');
            return;
        }
        
        // Clear form
        document.getElementById('add-item-form').reset();
        
        // Reload data
        loadDashboardData();
        handleSuccess('success-msg', 'Item added successfully!');
        
    } catch (error) {
        console.error('Error adding item:', error);
        handleError('error-msg', 'Error adding item. Please try again.');
    }
}

/**
 * Display orders in table
 */
function displayOrders(orders) {
    const table = document.getElementById('orders-table');
    const tbody = document.getElementById('orders-tbody');
    const noOrders = document.getElementById('no-orders');
    const container = document.getElementById('orders-container');
    
    if (!tbody) return;
    
    if (orders.length === 0) {
        if (table) table.style.display = 'none';
        if (noOrders) noOrders.style.display = 'block';
        if (container) container.innerHTML = '';
        return;
    }
    
    tbody.innerHTML = orders.map(order => {
        const status = order.delivered ? 'Delivered' : 'Pending';
        const statusClass = order.delivered ? 'delivered' : '';
        const buttonClass = order.delivered ? 'btn-secondary' : 'btn-primary';
        const buttonText = order.delivered ? 'Delivered' : 'Mark Delivered';
        
        return `
            <tr class="${statusClass}">
                <td>${order.name}</td>
                <td>${order.phone}</td>
                <td>${order.item_name}</td>
                <td>${order.quantity}</td>
                <td><span class="order-status ${statusClass}">${status}</span></td>
                <td>${formatDateTime(order.timestamp)}</td>
                <td>
                    <button 
                        class="btn ${buttonClass}" 
                        onclick="toggleOrderDelivered(${order.id})"
                        ${order.delivered ? 'disabled' : ''}
                    >${buttonText}</button>
                </td>
            </tr>
        `;
    }).join('');
    
    if (table) table.style.display = 'table';
    if (noOrders) noOrders.style.display = 'none';
    if (container) container.innerHTML = '';
}

/**
 * Toggle order delivered status
 */
async function toggleOrderDelivered(orderId) {
    try {
        const response = await fetch(`${API_BASE}/order/${orderId}/deliver`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (!response.ok) {
            handleError('error-msg', 'Failed to mark order as delivered');
            return;
        }
        
        // Reload orders and prep list
        loadDashboardData();
        handleSuccess('success-msg', 'Order marked as delivered!');
        
    } catch (error) {
        console.error('Error toggling delivery:', error);
        handleError('error-msg', 'Error updating order. Please try again.');
    }
}

/**
 * Display prep list
 */
function displayPrepList(prep) {
    const table = document.getElementById('prep-table');
    const tbody = document.getElementById('prep-tbody');
    const noPrep = document.getElementById('no-prep');
    const container = document.getElementById('prep-container');
    
    if (!tbody) return;
    
    if (prep.length === 0) {
        if (table) table.style.display = 'none';
        if (noPrep) noPrep.style.display = 'block';
        if (container) container.innerHTML = '';
        return;
    }
    
    tbody.innerHTML = prep.map(item => `
        <tr>
            <td><strong>${item.item_name}</strong></td>
            <td>${item.total_quantity}</td>
        </tr>
    `).join('');
    
    if (table) table.style.display = 'table';
    if (noPrep) noPrep.style.display = 'none';
    if (container) container.innerHTML = '';
}

/**
 * Refresh prep list manually
 */
async function refreshPrepList() {
    const prep = await loadPrep();
    displayPrepList(prep);
}

/**
 * Refresh entire dashboard
 */
async function refreshDashboard() {
    loadDashboardData();
}

/**
 * Update last refresh timestamp
 */
function updateLastRefresh() {
    const el = document.getElementById('last-refresh');
    if (el) {
        el.textContent = new Date().toLocaleTimeString('en-IN');
    }
}

// ==================== PAGE INITIALIZATION ====================

document.addEventListener('DOMContentLoaded', function() {
    // Determine which page we're on and initialize
    if (document.getElementById('order-form')) {
        // Customer page
        initCustomerPage();
    } else if (document.getElementById('add-item-form')) {
        // Dashboard page
        initDashboard();
    }
});
