const fs = require('fs/promises');
const path = require('path');

const PRODUCTS_FILE = path.join(__dirname, '../data/products.json');

class ProductService {
  async initializeStorage() {
    try {
      await fs.access(PRODUCTS_FILE);
    } catch {
      await fs.mkdir(path.dirname(PRODUCTS_FILE), { recursive: true });
      await fs.writeFile(PRODUCTS_FILE, JSON.stringify([]));
    }
  }

  async getProducts() {
    const data = await fs.readFile(PRODUCTS_FILE, 'utf8');
    return JSON.parse(data);
  }

  async saveProducts(products) {
    await fs.writeFile(PRODUCTS_FILE, JSON.stringify(products, null, 2));
  }

  async createProduct(productData) {
    const products = await this.getProducts();
    
    const newProduct = {
      id: Date.now().toString(),
      name: productData.name,
      cost: productData.cost,
      price: productData.price,
      image: productData.image,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    products.push(newProduct);
    await this.saveProducts(products);
    
    return newProduct;
  }

  async updateProduct(productId, updateData) {
    const products = await this.getProducts();
    const productIndex = products.findIndex(p => p.id === productId);
    
    if (productIndex === -1) {
      throw new Error('Product not found');
    }

    products[productIndex] = {
      ...products[productIndex],
      ...updateData,
      updatedAt: new Date().toISOString()
    };

    await this.saveProducts(products);
    return products[productIndex];
  }

  async deleteProduct(productId) {
    const products = await this.getProducts();
    const productIndex = products.findIndex(p => p.id === productId);
    
    if (productIndex === -1) {
      throw new Error('Product not found');
    }

    // Logical deletion
    products[productIndex].isActive = false;
    products[productIndex].updatedAt = new Date().toISOString();

    await this.saveProducts(products);
  }

  async getProduct(productId) {
    const products = await this.getProducts();
    return products.find(p => p.id === productId);
  }
}

module.exports = new ProductService(); 