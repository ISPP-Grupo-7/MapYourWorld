import { Repository } from 'typeorm';
import { UserStat } from '../models/userStat.model';
import { AppDataSource } from '../../database/appDataSource';

export class UserStatRepository {
  private repository: Repository<UserStat>;

  constructor() {
    this.repository = AppDataSource.getRepository(UserStat);
  }

  async findAll(): Promise<UserStat[]> {
    return this.repository.find();
  }

  async findById(id: string): Promise<UserStat | null> {
    return this.repository.findOneBy({ id });
  }

  async findByUserId(userId: string): Promise<UserStat | null> {
    return this.repository.findOneBy({ userId });
  }

  async create(userStatData: Partial<UserStat>): Promise<UserStat> {
    const userStat = this.repository.create(userStatData);
    return await this.repository.save(userStat);
  }

  async update(userId: string, statsUpdate: Partial<UserStat>): Promise<UserStat | null> {
    await this.repository.update({ userId }, statsUpdate);
    return this.findByUserId(userId);
  }

  async updateById(id: string, userStatData: Partial<UserStat>): Promise<UserStat | null> {
    await this.repository.update({ id }, userStatData);
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}