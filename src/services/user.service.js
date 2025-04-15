const fs = require('fs/promises');
const bcrypt = require('bcrypt');
const path = require('path');

const USERS_FILE = path.join(__dirname, '../data/users.json');

class UserService {
  async initializeStorage() {
    try {
      await fs.access(USERS_FILE);
    } catch {
      await fs.mkdir(path.dirname(USERS_FILE), { recursive: true });
      await fs.writeFile(USERS_FILE, JSON.stringify([]));
    }
  }

  async getUsers() {
    const data = await fs.readFile(USERS_FILE, 'utf8');
    return JSON.parse(data);
  }

  async saveUsers(users) {
    await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
  }

  async findByUsername(username) {
    const users = await this.getUsers();
    return users.find(u => u.name === username);
  }

  async createUser(userData) {
    const users = await this.getUsers();
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    const newUser = {
      id: Date.now().toString(),
      name: userData.name,
      email: userData.email,
      password: hashedPassword,
      role: userData.role || 'user'
    };

    users.push(newUser);
    await this.saveUsers(users);
    
    const { password, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
  }

  async deleteUser(userId) {
    const users = await this.getUsers();
    const filteredUsers = users.filter(u => u.id !== userId);
    await this.saveUsers(filteredUsers);
  }

  async validatePassword(user, password) {
    return bcrypt.compare(password, user.password);
  }
}

module.exports = new UserService(); 