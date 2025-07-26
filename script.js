class GroceryApp {
    constructor() {
        this.items = this.loadItems();
        this.initializeElements();
        this.attachEventListeners();
        this.render();
    }

    initializeElements() {
        this.form = document.getElementById('add-item-form');
        this.itemNameInput = document.getElementById('item-name');
        this.itemQuantityInput = document.getElementById('item-quantity');
        this.groceryList = document.getElementById('grocery-list');
        this.emptyState = document.getElementById('empty-state');
    }

    attachEventListeners() {
        this.form.addEventListener('submit', (e) => this.handleAddItem(e));
    }

    loadItems() {
        try {
            const saved = localStorage.getItem('groceryItems');
            if (!saved) return [];
            const parsed = JSON.parse(saved);
            return Array.isArray(parsed) ? parsed : [];
        } catch (error) {
            console.warn('Failed to load items from localStorage:', error);
            localStorage.removeItem('groceryItems');
            return [];
        }
    }

    saveItems() {
        localStorage.setItem('groceryItems', JSON.stringify(this.items));
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    sanitizeText(text) {
        if (typeof text !== 'string') return '';
        return text.trim().substring(0, 100); // Limit length to 100 chars
    }

    validateItemName(name) {
        const sanitized = this.sanitizeText(name);
        return sanitized.length > 0 && sanitized.length <= 100;
    }

    handleAddItem(e) {
        e.preventDefault();
        
        const name = this.sanitizeText(this.itemNameInput.value);
        const quantity = parseInt(this.itemQuantityInput.value);
        
        if (!this.validateItemName(name) || quantity < 1 || quantity > 9999) {
            alert('Please enter a valid item name (1-100 characters) and quantity (1-9999)');
            return;
        }

        const existingItem = this.items.find(item => 
            item.name.toLowerCase() === name.toLowerCase()
        );

        if (existingItem) {
            const newQuantity = existingItem.quantity + quantity;
            if (newQuantity > 9999) {
                alert('Maximum quantity is 9999');
                return;
            }
            existingItem.quantity = newQuantity;
        } else {
            this.items.push({
                id: this.generateId(),
                name: name,
                quantity: quantity
            });
        }

        this.itemNameInput.value = '';
        this.itemQuantityInput.value = '1';
        this.saveItems();
        this.render();
    }

    handleDeleteItem(id) {
        if (confirm('Are you sure you want to delete this item?')) {
            this.items = this.items.filter(item => item.id !== id);
            this.saveItems();
            this.render();
        }
    }

    handleQuantityChange(id, change) {
        const item = this.items.find(item => item.id === id);
        if (item) {
            item.quantity += change;
            if (item.quantity <= 0) {
                this.handleDeleteItem(id);
            } else {
                this.saveItems();
                this.render();
            }
        }
    }

    handleInlineEdit(element, id, field) {
        const originalValue = element.textContent;
        const isQuantity = field === 'quantity';
        
        element.contentEditable = true;
        element.classList.add('editing');
        element.focus();
        
        if (isQuantity) {
            this.selectText(element);
        }

        const finishEdit = () => {
            element.contentEditable = false;
            element.classList.remove('editing');
            
            let newValue = element.textContent.trim();
            
            if (isQuantity) {
                newValue = parseInt(newValue);
                if (isNaN(newValue) || newValue < 1 || newValue > 9999) {
                    element.textContent = originalValue;
                    return;
                }
            } else {
                newValue = this.sanitizeText(newValue);
                if (!this.validateItemName(newValue)) {
                    element.textContent = originalValue;
                    return;
                }
            }

            const item = this.items.find(item => item.id === id);
            if (item && item[field] !== newValue) {
                item[field] = newValue;
                this.saveItems();
                this.render();
            }
        };

        const handleKeyDown = (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                element.blur();
            } else if (e.key === 'Escape') {
                element.textContent = originalValue;
                element.blur();
            }
        };

        element.addEventListener('blur', finishEdit, { once: true });
        element.addEventListener('keydown', handleKeyDown);
    }

    selectText(element) {
        const range = document.createRange();
        range.selectNodeContents(element);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
    }

    createItemElement(item) {
        const itemEl = document.createElement('div');
        itemEl.className = 'grocery-item';

        // Create item info container
        const itemInfo = document.createElement('div');
        itemInfo.className = 'item-info';

        // Create item name span (secure)
        const itemName = document.createElement('span');
        itemName.className = 'item-name';
        itemName.textContent = this.sanitizeText(item.name); // Use textContent, not innerHTML
        itemName.addEventListener('click', () => this.handleInlineEdit(itemName, item.id, 'name'));

        // Create quantity controls
        const quantityControls = document.createElement('div');
        quantityControls.className = 'quantity-controls';

        const decreaseBtn = document.createElement('button');
        decreaseBtn.className = 'quantity-btn';
        decreaseBtn.textContent = '−';
        decreaseBtn.addEventListener('click', () => this.handleQuantityChange(item.id, -1));

        const quantityDisplay = document.createElement('span');
        quantityDisplay.className = 'quantity-display';
        quantityDisplay.textContent = item.quantity.toString();
        quantityDisplay.addEventListener('click', () => this.handleInlineEdit(quantityDisplay, item.id, 'quantity'));

        const increaseBtn = document.createElement('button');
        increaseBtn.className = 'quantity-btn';
        increaseBtn.textContent = '+';
        increaseBtn.addEventListener('click', () => this.handleQuantityChange(item.id, 1));

        quantityControls.appendChild(decreaseBtn);
        quantityControls.appendChild(quantityDisplay);
        quantityControls.appendChild(increaseBtn);

        itemInfo.appendChild(itemName);
        itemInfo.appendChild(quantityControls);

        // Create item actions
        const itemActions = document.createElement('div');
        itemActions.className = 'item-actions';

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = '🗑️';
        deleteBtn.addEventListener('click', () => this.handleDeleteItem(item.id));

        itemActions.appendChild(deleteBtn);

        itemEl.appendChild(itemInfo);
        itemEl.appendChild(itemActions);

        return itemEl;
    }

    render() {
        if (this.items.length === 0) {
            this.groceryList.innerHTML = '<div id="empty-state" class="empty-state"><p>Your grocery list is empty. Add your first item above!</p></div>';
        } else {
            this.groceryList.innerHTML = '';
            this.items.forEach(item => {
                this.groceryList.appendChild(this.createItemElement(item));
            });
        }
    }
}

let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new GroceryApp();
});