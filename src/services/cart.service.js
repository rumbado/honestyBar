const fs = require('fs/promises');
const path = require('path');

class CartService {
  constructor() {
    this.cartsDir = path.join(__dirname, '../data/carts');
  }

  getCartFilePath(userId) {
    return path.join(this.cartsDir, `${userId}.json`);
  }

  async initializeStorage() {
    try {
      await fs.access(this.cartsDir);
    } catch {
      await fs.mkdir(this.cartsDir, { recursive: true });
    }
  }

  async getCart(userId) {
    try {
      const data = await fs.readFile(this.getCartFilePath(userId), 'utf8');
      return JSON.parse(data);
    } catch {
      // If cart doesn't exist, return empty cart
      return {
        userId,
        items: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }
  }

  async saveCart(userId, cart) {
    cart.updatedAt = new Date().toISOString();
    await fs.writeFile(
      this.getCartFilePath(userId),
      JSON.stringify(cart, null, 2)
    );
  }

  async addToCart(userId, product, quantity = 1) {
    const cart = await this.getCart(userId);
    const existingItem = cart.items.find(item => item.productId === product.id);

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({
        productId: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity
      });
    }

    await this.saveCart(userId, cart);
    return cart;
  }

  async removeFromCart(userId, productId) {
    const cart = await this.getCart(userId);
    cart.items = cart.items.filter(item => item.productId !== productId);
    await this.saveCart(userId, cart);
    return cart;
  }

  async clearCart(userId) {
    const emptyCart = {
      userId,
      items: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await this.saveCart(userId, emptyCart);
    return emptyCart;
  }

  async getPurchaseHistory(userId) {
    try {
      const data = await fs.readFile(
        path.join(this.cartsDir, `${userId}_history.json`),
        'utf8'
      );
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  async addToPurchaseHistory(userId, cart) {
    const history = await this.getPurchaseHistory(userId);
    const purchase = {
      ...cart,
      purchasedAt: new Date().toISOString()
    };
    history.push(purchase);
    await fs.writeFile(
      path.join(this.cartsDir, `${userId}_history.json`),
      JSON.stringify(history, null, 2)
    );
    return purchase;
  }
}

module.exports = new CartService(); 