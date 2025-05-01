import { Repository } from 'typeorm';
import { UserProfile } from '../models/userProfile.model';
import { AppDataSource } from '../../../database/appDataSource';

export class UserProfileRepository {
  private repository: Repository<UserProfile>;

  constructor() {
    this.repository = AppDataSource.getRepository(UserProfile);
  }

  async findById(id: string): Promise<UserProfile | null> {
    return this.repository.findOneBy({ id });
  }

  async findByUsername(username: string): Promise<UserProfile | null> {
    return this.repository.findOneBy({ username });
  }

  async create(userData: Partial<UserProfile>): Promise<UserProfile> {
    const userProfile = this.repository.create(userData);
    return await this.repository.save(userProfile);
  }

  async update(id: string, userData: Partial<UserProfile>): Promise<UserProfile | null> {
    await this.repository.update({ id }, userData);
    return this.findById(id);
  }

  async search(query: string, limit: number, offset: number): Promise<[UserProfile[], number]> {
    return this.repository.createQueryBuilder('userProfile')
      .where('userProfile.username LIKE :query OR userProfile.firstName LIKE :query OR userProfile.lastName LIKE :query', 
             { query: `%${query}%` })
      .take(limit)
      .skip(offset)
      .getManyAndCount();
  }
}
