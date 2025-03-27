export interface User {
  id: string;
  name: string;
  role: 'admin' | 'cashier';
  email?: string;
}

class UserService {
  private static instance: UserService;
  private users: User[] = [];
  private currentUser: User | null = null;

  private constructor() {
    // Charger les utilisateurs depuis le localStorage
    const savedUsers = localStorage.getItem('users');
    if (savedUsers) {
      this.users = JSON.parse(savedUsers);
    } else {
      // Créer un utilisateur par défaut si aucun n'existe
      this.users = [
        {
          id: 'USR-001',
          name: 'Admin',
          role: 'admin',
          email: 'admin@example.com'
        },
        {
          id: 'USR-002',
          name: 'Caissier 1',
          role: 'cashier',
          email: 'cashier1@example.com'
        }
      ];
      this.saveToStorage();
    }

    // Charger l'utilisateur actuel depuis le localStorage
    const currentUserData = localStorage.getItem('currentUser');
    if (currentUserData) {
      this.currentUser = JSON.parse(currentUserData);
    } else {
      // Définir l'utilisateur par défaut comme utilisateur actuel
      this.currentUser = this.users[0];
      this.saveCurrentUserToStorage();
    }
  }

  public static getInstance(): UserService {
    if (!UserService.instance) {
      UserService.instance = new UserService();
    }
    return UserService.instance;
  }

  private saveToStorage(): void {
    localStorage.setItem('users', JSON.stringify(this.users));
  }

  private saveCurrentUserToStorage(): void {
    if (this.currentUser) {
      localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
    }
  }

  public getUsers(): User[] {
    return [...this.users];
  }

  public getCurrentUser(): User | null {
    return this.currentUser;
  }

  public setCurrentUser(userId: string): User | null {
    const user = this.users.find(u => u.id === userId);
    if (user) {
      this.currentUser = user;
      this.saveCurrentUserToStorage();
      return user;
    }
    return null;
  }

  public addUser(userData: Omit<User, 'id'>): User {
    const newUser: User = {
      ...userData,
      id: `USR-${Date.now()}`
    };
    this.users.push(newUser);
    this.saveToStorage();
    return newUser;
  }

  public updateUser(userId: string, userData: Partial<Omit<User, 'id'>>): User | null {
    const index = this.users.findIndex(u => u.id === userId);
    if (index !== -1) {
      this.users[index] = {
        ...this.users[index],
        ...userData
      };
      this.saveToStorage();
      
      // Mettre à jour l'utilisateur actuel si nécessaire
      if (this.currentUser && this.currentUser.id === userId) {
        this.currentUser = this.users[index];
        this.saveCurrentUserToStorage();
      }
      
      return this.users[index];
    }
    return null;
  }

  public deleteUser(userId: string): boolean {
    const index = this.users.findIndex(u => u.id === userId);
    if (index !== -1) {
      // Empêcher la suppression du dernier administrateur
      const adminsCount = this.users.filter(u => u.role === 'admin').length;
      if (this.users[index].role === 'admin' && adminsCount <= 1) {
        throw new Error('Impossible de supprimer le dernier administrateur');
      }
      
      this.users.splice(index, 1);
      this.saveToStorage();
      
      // Réinitialiser l'utilisateur actuel si nécessaire
      if (this.currentUser && this.currentUser.id === userId) {
        this.currentUser = this.users.length > 0 ? this.users[0] : null;
        this.saveCurrentUserToStorage();
      }
      
      return true;
    }
    return false;
  }
}

export const userService = UserService.getInstance();
