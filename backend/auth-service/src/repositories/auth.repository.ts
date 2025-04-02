import { Repository } from 'typeorm';
import { User, Role } from '../models/user.model';
import { AppDataSource } from '../../../database/appDataSource';

export class AuthRepository {
  private repository: Repository<User>;

  constructor() {
    this.repository = AppDataSource.getRepository(User);
  }
  /**
   * Encuentra todos los usuarios
   * @returns Todos los usuarios
   */
  async findAll(): Promise<User[]> {
    return this.repository.find();
  }
  /**
   * Encuentra un usuario por su ID
   * @param id ID del usuario
   */
  async findById(id: string): Promise<User | null> {
    return this.repository.findOneBy({ id });
  }

  /**
   * Encuentra un usuario por su email
   * @param email Email del usuario
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.repository.findOneBy({ email });
  }

    /**
   * Encuentra un usuario por su email
   * @param username Email del usuario
   */
    async findByUsername(username: string): Promise<User | null> {
      return this.repository.findOne({
        where: { profile: { username: username } },
        relations: ['profile'], 
      });
    }
    

  /**
   * Busca un usuario con su contraseña (para login)
   * @param email Email del usuario
   */
  async findWithPassword(email: string): Promise<User | null> {
    return this.repository.findOne({ 
      where: { email },
      select: ['id', 'email', 'password', 'is_active', 'role', 'token_data'],
      relations: ['profile']
    });
  }

  /**
   * Crea un nuevo usuario
   * @param userData Datos del usuario a crear
   */
  async create(userData: Partial<User>): Promise<User> {
    const user = this.repository.create(userData);
    return await this.repository.save(user);
  }

  /**
   * Actualiza un usuario existente
   * @param id ID del usuario
   * @param userData Datos a actualizar
   */
  async update(id: string, userData: Partial<User>): Promise<User | null> {
    await this.repository.update({ id }, userData);
    return this.findById(id);
  }

  /**
   * Actualiza la contraseña de un usuario
   * @param id ID del usuario
   * @param hashedPassword Contraseña hasheada
   */
  async updatePassword(id: string, hashedPassword: string): Promise<User | null> {
    await this.repository.update({ id }, { password: hashedPassword });
    return this.findById(id);
  }
  
  /**
   * Actualiza el rol de un usuario
   * @param id ID del usuario
   * @param role Nuevo rol
   */
  async updateRole(id: string, role: Role): Promise<User | null> {
    await this.repository.update({ id }, { role });
    return this.findById(id);
  }
  
  /**
   * Guarda directamente un objeto User
   * @param user Objeto User
   */
  async save(user: User): Promise<User> {
    return await this.repository.save(user);
  }

  /**
   * Elimina un usuario
   * @param id ID del usuario
   */
  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete({ id });
    return result.affected !== undefined && result.affected !== null && result.affected > 0;
  }
}
