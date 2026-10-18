// Active State Tracking
let products = [];
let cart = [];

// DOM Element Cache
const productGrid = document.getElementById('productGrid');
const cartDrawer = document.getElementById('cartDrawer');
const cartToggle = document.getElementById('cartToggle');
const closeCart = document.getElementById('closeCart');
const overlay = document.getElementById('overlay');
const cartItemsContainer = document.getElementById('cartItems');
const cartCount = document.getElementById('cartCount');
const cartTotal = document.getElementById('cartTotal');
const checkoutBtn = document.getElementById('checkoutBtn');

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            // Store user session state
            localStorage.setItem('user', JSON.stringify({ email: email, loggedIn: true }));

            // Redirect directly to main storefront
            window.location.href = 'home.html';
        });
    }
     const signupForm = document.getElementById('signupForm');

    if (signupForm) {
       signupForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const fullname = document.getElementById('fullname')?.value;
            const email = document.getElementById('email')?.value;
            const password = document.getElementById('password')?.value;
       

            // Store user session state
            localStorage.setItem('user', JSON.stringify({ email: email, loggedIn: true }));

            // Redirect directly to main storefront
            window.location.href = 'home.html';
});
    }
});

// Toggle for Password field
const togglePassword = document.getElementById('togglePassword');
const passwordInput = document.getElementById('password');

if (togglePassword && passwordInput) {
    togglePassword.addEventListener('click', function () {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        
        // Toggle between eye and eye-slash
        this.classList.toggle('fa-eye');
        this.classList.toggle('fa-eye-slash');
    });
}

// Toggle for Confirm Password field
const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');
const confirmPasswordInput = document.getElementById('confirm-password');

if (toggleConfirmPassword && confirmPasswordInput) {
    toggleConfirmPassword.addEventListener('click', function () {
        const type = confirmPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        confirmPasswordInput.setAttribute('type', type);
        
        // Toggle between eye and eye-slash
        this.classList.toggle('fa-eye');
        this.classList.toggle('fa-eye-slash');
    });
}

// Fetch Inventory Data from Express API / Database
async function fetchProducts() {
  try {
    productGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--gray);">Loading products...</p>';

    const response = await fetch('/api/products');
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    products = await response.json();
    displayProducts(products);
  } catch (error) {
    console.error('Failed to pull storefront inventory:', error);
    productGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: red;">Failed to load products.</p>';
  }
}

// Render Inventory Grid Layout
function displayProducts(productsToRender) {
  if (!productsToRender || productsToRender.length === 0) {
    productGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">No products found.</p>';
    return;
  }

  productGrid.innerHTML = productsToRender.map(product => {
    // Fallback check for MySQL image column name
    const imgSrc = product.thumbnail_url || product.thumbnail || 'https://via.placeholder.com/150';

    return `
      <div class="product-card">
        <div class="product-img-container">
          <img src="${imgSrc}" alt="${product.product_name}" class="product-img" />
        </div>
        <div class="product-info">
          <div class="product-name">${product.product_name}</div>
          <div class="product-price">₱${product.price}</div>
          <button class="add-to-cart" data-id="${product.id}">Add to Cart</button>
        </div>
      </div>
    `;
  }).join('');

  // Attach click events for dynamic Add to Cart buttons
  document.querySelectorAll('.add-to-cart').forEach(button => {
    button.addEventListener('click', (e) => {
      const productId = parseInt(e.target.getAttribute('data-id'));
      addToCart(productId);

    });
  });
}

// Segment & Display Data by Selected Category
// Segment & Display Data by Selected Category
function filterProducts(category, selectedButton) {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    if (selectedButton) selectedButton.classList.add('active');

    if (category === 'all') {
        displayProducts(products);
    } else {
        const filtered = products.filter(p => p.category && p.category.trim().toLowerCase() === category.trim().toLowerCase());
        displayProducts(filtered);
    }
}

// Event listener for filter buttons using data-category attributes
document.querySelectorAll('.filter-btn').forEach(button => {
    button.addEventListener('click', (e) => {
        const category = e.target.getAttribute('data-category');
        filterProducts(category, e.target);
    });
});

// Cart State Mutation Logics
function addToCart(productId) {
    // ALWAYS load the live cart fresh from localStorage first
    let cart = JSON.parse(localStorage.getItem('cart')) || [];

    const product = products.find(p => p.id === productId);
    if (!product) return;

    const cartItem = cart.find(item => item.id === productId);

    if (cartItem) {
        cartItem.quantity++;
    } else {
        cart.push({
            id: product.id,
            name: product.product_name || product.name,
            price: Number(product.price) || 0,
            thumbnail_url: product.thumbnail_url || product.image_url || product.image,
            quantity: 1
        });
    }

    // Save back to localStorage immediately
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartUI();
}

// Update Screen States

function updateCartUI() {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    const cartItemsContainer = document.getElementById('cart-items-container');
    const cartCountEl = document.getElementById('cart-count');
    const cartTotal = document.getElementById('cart-total-amount');
    const checkoutBtn = document.getElementById('checkout-btn');
    
    // Update badge count at the top navigation
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (cartCountEl) {
        cartCountEl.textContent = totalItems;
    }

    if (!cartItemsContainer) return;

    // Handle empty cart state
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = `<p style="color: #999; text-align: center; margin-top: 3rem;">Your cart is empty</p>`;
        if (cartTotal) cartTotal.textContent = '₱0';
        if (checkoutBtn) checkoutBtn.textContent = 'Pay with Maya (0)';
        return;
    }

    // Render Product Cards inside Cart using array index
    const itemsHTML = cart.map((item, index) => {
        const itemName = item.product_name || item.name || 'Product';
        const imgsrc = item.thumbnail_url || item.image_url || item.image || 'https://placeholder.co/100x100';

        return `
            <div class="cart-item" style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 10px;">
                <div class="cart-item-details" style="display: flex; align-items: center;">
                    <img 
                        src="${imgsrc}"
                        alt="${itemName}"
                        class="cart-item-img"
                        style="width: 50px; height: 50px; object-fit: cover; border-radius: 6px; margin-right: 10px;"
                        onerror="this.onerror=null; this.src='https://placeholder.co/100x100/png?text=No+Image';"
                    />
                    <div class="cart-item-text">
                        <h4 class="cart-item-title" style="margin: 0 0 2px 0; font-size: 0.9rem;">${itemName}</h4>
                        <span class="cart-item-price" style="color: #555; font-size: 0.85rem;">₱${item.price}</span>
                    </div>
                </div>
                <div class="cart-item-actions" style="text-align: right;">
                    <div class="quantity-control" style="margin-bottom: 5px;">
                        <button class="qty-btn btn-minus" data-index="${index}" style="padding: 2px 6px; cursor: pointer;">-</button>
                        <span class="qty-count" style="margin: 0 5px;">${item.quantity}</span>
                        <button class="qty-btn btn-plus" data-index="${index}" style="padding: 2px 6px; cursor: pointer;">+</button>
                    </div>
                    <button class="btn-delete" data-index="${index}" style="background: none; border: none; color: #d9534f; cursor: pointer; font-size: 0.8rem;">Delete</button>
                </div>
            </div>
        `;
    }).join('');

    // Calculate Subtotals
    const merchandiseTotal = cart.reduce((sum, item) => sum + ((parseFloat(item.price) || 0) * item.quantity), 0);
    const shippingFee = merchandiseTotal > 0 ? 50 : 0;
    const grandTotal = merchandiseTotal + shippingFee;

    // Render Summary Block cleanly
    const summaryHTML = `
        <div class="cart-summary-section" style="border-top: 1px solid #ddd; padding-top: 10px; margin-top: 15px; font-size: 0.85rem;">
            <div class="summary-row" style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                <span>Merchandise Subtotal:</span>
                <span>₱${merchandiseTotal.toFixed(2)}</span>
            </div>
            <div class="summary-row" style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span>Shipping Subtotal:</span>
                <span>₱${shippingFee.toFixed(2)}</span>
            </div>
            <div class="summary-row total-row" style="display: flex; justify-content: space-between; font-weight: bold; font-size: 0.95rem; border-top: 1px dashed #ccc; padding-top: 8px;">
                <span>Total Payment:</span>
                <strong class="total-price">₱${grandTotal.toFixed(2)}</strong>
            </div>
        </div>
    `;

    cartItemsContainer.innerHTML = itemsHTML + summaryHTML;

    if (cartTotal) cartTotal.textContent = `₱${grandTotal.toFixed(2)}`;
    if (checkoutBtn) checkoutBtn.textContent = `Pay with Maya (${totalItems})`;

    bindCartEvents();
}

function bindCartEvents() {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];

    // Plus button events
    document.querySelectorAll('.btn-plus').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(e.target.getAttribute('data-index'));
            if (cart[index]) {
                cart[index].quantity++;
                localStorage.setItem('cart', JSON.stringify(cart));
                updateCartUI();
            }
        });
    });

    // Minus button events
    document.querySelectorAll('.btn-minus').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(e.target.getAttribute('data-index'));
            if (cart[index]) {
                if (cart[index].quantity > 1) {
                    cart[index].quantity--;
                } else {
                    cart.splice(index, 1);
                }
                localStorage.setItem('cart', JSON.stringify(cart));
                updateCartUI();
            }
        });
    });

    // Delete button events
    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(e.target.getAttribute('data-index'));
            if (cart[index]) {
                cart.splice(index, 1);
                localStorage.setItem('cart', JSON.stringify(cart));
                updateCartUI();
            }
        });
    });
}

  document.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = parseInt(e.target.getAttribute('data-id'));
      cart = cart.filter(i => i.id !== id);
      updateCartUI();
    });
  });

  

function toggleCart() {
    console.log("Cart clicked!");
    const cartDrawer = document.getElementById('cart-drawer');
    const overlay = document.getElementById('cart-overlay');
    
    if (cartDrawer) cartDrawer.classList.toggle('open');
    if (overlay) overlay.classList.toggle('open');
    document.body.classList.toggle('cart-open');
}

// Close smoothly when clicking anywhere on the background overlay outside the cart
const overlayEl = document.getElementById('cart-overlay');
if (overlayEl) {
    overlayEl.addEventListener('click', () => {
        const cartDrawer = document.getElementById('cart-drawer');
        if (cartDrawer) cartDrawer.classList.remove('open');
        overlayEl.classList.remove('open');
        document.body.classList.remove('cart-open');
    });
}



// Checkout Action Triggering Maya Sandbox

   // Event delegation: permanently listens for clicks on the checkout button, even if redrawn
document.addEventListener('click', async (e) => {
    // Check if the clicked element is our checkout button (or inside it)
    const checkoutBtn = e.target.closest('#checkout-btn');
    if (!checkoutBtn) return;

    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    if (cart.length === 0) {
        alert("Your cart is empty!");
        return;
    }

    const merchandiseTotal = cart.reduce((sum, item) => sum + ((parseFloat(item.price) || 0) * item.quantity), 0);
    const shippingFee = merchandiseTotal > 0 ? 50 : 0;
    const grandTotal = merchandiseTotal + shippingFee;

    const checkoutPayload = {
        items: cart.map(item => {
            const itemPrice = parseFloat(item.price) || 0;
            const itemQty = parseInt(item.quantity, 10) || 1;
            return {
                name: item.product_name || item.title || item.name || 'Product Item',
                quantity: itemQty,
                totalAmount: {
                    value: itemPrice * itemQty
                }
            };
        }),
        totalAmount: grandTotal
    };

    try {
        checkoutBtn.disabled = true;
        checkoutBtn.textContent = 'Processing...';

        const response = await fetch('/api/maya/checkout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(checkoutPayload)
        });

        const data = await response.json();

        if (data.success && data.redirectUrl) {
            window.location.href = data.redirectUrl;
        } else {
            const errorMsg = typeof data.error === 'object' ? JSON.stringify(data.error, null, 2) : (data.error || data.message || 'Failed to initialize session.');
            alert(`Checkout error:\n${errorMsg}`);
            checkoutBtn.disabled = false;
            checkoutBtn.textContent = `Pay with Maya (${cart.reduce((sum, i) => sum + i.quantity, 0)})`;
        }
    } catch (error) {
        console.error('Checkout Request Failed:', error);
        alert('Unable to connect to payment server.');
        checkoutBtn.disabled = false;
        checkoutBtn.textContent = `Pay with Maya (${cart.reduce((sum, i) => sum + i.quantity, 0)})`;
    }
});



// Initial App Mount
fetchProducts();
updateCartUI();

