document.addEventListener('DOMContentLoaded', () => {
    // ========== Глобальні змінні ==========
    let products = []; // Масив всіх товарів
    let cart = []; // Масив товарів у кошику
    const productsBlock = document.querySelector(".cards");
    const cartModal = document.querySelector("#cart-modal");
    const cartItemsBlock = document.querySelector("#cart-items");
    const cartCount = document.querySelector("#cart-count");
    const cartTotal = document.querySelector("#cart-total");
    const cartDiscord = document.querySelector("#cart-discord");
    const cartOrderError = document.querySelector("#cart-order-error");
    const cartContent = document.querySelector("#cart-content");
    const cartConfirmation = document.querySelector("#cart-confirmation");

    // Відповідність картинок до курсів
    const itemImages = {
        'SWORD': 'image.png',
        'MACE': 'image copy 2.png',
        'VANILLA': 'image copy 3.png',
        'AXE': 'image copy.png'
    };

    // ========== Отримання товарів з JSON (з надійним fallback) ==========
    async function fetchProducts() {
        try {
            const response = await fetch('storepvp.json');
            if (!response.ok) throw new Error('HTTP ' + response.status);
            const data = await response.json();
            products = data;
            displayProducts(data);
        } catch (error) {
            console.warn('Fallback: storepvp.json завантажено локально для підтримки file:// протоколу', error);
            const fallback = [
                { "id": 1, "title": "SWORD", "price": 1 },
                { "id": 2, "title": "VANILLA", "price": 4 },
                { "id": 3, "title": "MACE", "price": 3 },
                { "id": 4, "title": "AXE", "price": 2 }
            ];
            products = fallback;
            displayProducts(fallback);
        }
    }

    // ========== Відображення товарів ==========
    function displayProducts(items) {
        if (!productsBlock) return;
        productsBlock.innerHTML = '';

        items.forEach(product => {
            const card = createProductCard(product);
            productsBlock.innerHTML += card;
        });
    }

    function createProductCard(product) {
        const imageSrc = itemImages[product.title.toUpperCase()] || 'image.png';
        return `<div class="item ${product.title.toLowerCase()}" data-product-id="${product.id}">
            <div class="item-header">
                <span class="name">${product.title}</span>
                <div class="price">${product.price}$</div>
            </div>
            <div class="item-image-wrapper">
                <img src="${imageSrc}" alt="${product.title}" class="item-image">
            </div>
            <button class="buy" type="button">Купити</button>
        </div>`;
    }

    // ========== Рендер кошика ==========
    function renderCart() {
        const itemCount = cart.reduce((total, item) => total + item.quantity, 0);
        const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

        if (cartCount) cartCount.textContent = itemCount;
        if (cartTotal) cartTotal.textContent = total;

        if (cartItemsBlock) {
            cartItemsBlock.innerHTML = cart.length
                ? cart.map(item => `<div class="cart-row">
                    <div class="cart-row-info">
                        <strong>${item.title}</strong>
                        <span>${item.price}$ × ${item.quantity} = <b>${item.price * item.quantity}$</b></span>
                    </div>
                    <button class="cart-remove" type="button" data-remove-id="${item.id}">Видалити</button>
                </div>`).join("")
                : '<p class="cart-empty">Кошик порожній</p>';
        }
    }

    // Додавання товару
    if (productsBlock) {
        productsBlock.addEventListener("click", event => {
            const buyButton = event.target.closest(".buy");
            if (!buyButton) return;

            const productCard = buyButton.closest(".item");
            if (!productCard) return;

            const productId = Number(productCard.dataset.productId);
            const product = products.find(item => item.id === productId);
            const cartItem = cart.find(item => item.id === productId);

            if (cartItem) {
                cartItem.quantity += 1;
            } else if (product) {
                cart.push({ ...product, quantity: 1 });
            }

            renderCart();

            // Анімація додавання до кошика
            buyButton.textContent = 'Додано! ✓';
            setTimeout(() => {
                buyButton.textContent = 'Купити';
            }, 800);
        });
    }

    // Відкриття / закриття модалки
    const cartOpenBtn = document.querySelector("#cart-open");
    const cartCloseBtn = document.querySelector("#cart-close");
    const cartConfirmationCloseBtn = document.querySelector("#cart-confirmation-close");
    const cartOrderBtn = document.querySelector("#cart-order");
    const cartClearBtn = document.querySelector("#cart-clear");

    if (cartOpenBtn && cartModal) {
        cartOpenBtn.addEventListener("click", () => cartModal.showModal());
    }

    if (cartCloseBtn && cartModal) {
        cartCloseBtn.addEventListener("click", () => cartModal.close());
    }

    if (cartConfirmationCloseBtn && cartModal) {
        cartConfirmationCloseBtn.addEventListener("click", () => cartModal.close());
    }

    // Оформлення замовлення
    if (cartOrderBtn) {
        cartOrderBtn.addEventListener("click", () => {
            if (!cartDiscord || !cartDiscord.value.trim()) {
                if (cartOrderError) cartOrderError.hidden = false;
                return;
            }

            if (cartContent) cartContent.hidden = true;
            if (cartConfirmation) cartConfirmation.hidden = false;
            if (cartModal) cartModal.setAttribute("aria-labelledby", "cart-confirmation-title");
            
            // Очищення кошика після успішного замовлення
            cart = [];
            renderCart();
        });
    }

    if (cartDiscord) {
        cartDiscord.addEventListener("input", () => {
            if (cartDiscord.value.trim() && cartOrderError) {
                cartOrderError.hidden = true;
            }
        });
    }

    if (cartModal) {
        cartModal.addEventListener("close", () => {
            if (cartOrderError) cartOrderError.hidden = true;
            if (cartContent) cartContent.hidden = false;
            if (cartConfirmation) cartConfirmation.hidden = true;
            cartModal.setAttribute("aria-labelledby", "cart-title");
        });

        // Закриття кліком по бекдропу
        cartModal.addEventListener("click", event => {
            if (event.target === cartModal) cartModal.close();
        });

        cartModal.addEventListener("keydown", event => {
            if (event.key === "Escape") {
                event.preventDefault();
                cartModal.close();
            }
        });
    }

    // Очищення кошика
    if (cartClearBtn) {
        cartClearBtn.addEventListener("click", () => {
            cart = [];
            renderCart();
        });
    }

    // Видалення товару
    if (cartItemsBlock) {
        cartItemsBlock.addEventListener("click", event => {
            const removeButton = event.target.closest("[data-remove-id]");
            if (!removeButton) return;

            const productId = Number(removeButton.dataset.removeId);
            cart = cart.filter(item => item.id !== productId);
            renderCart();
        });
    }

    renderCart();
    fetchProducts();
});
