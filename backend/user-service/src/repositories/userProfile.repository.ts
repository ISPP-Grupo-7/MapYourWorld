import { Repository } from 'typeorm';
import { UserProfile } from '../models/userProfile.model';
import { AppDataSource } from '@backend/database/appDataSource';

export class UserProfileRepository {
    private repository: Repository<UserProfile>;

    constructor() {
        this.repository = AppDataSource.getRepository(UserProfile);
    }

    async findById(id: string): Promise<UserProfile | null> {
        return this.repository.findOneBy({ id });
    }

    async findByUserId(userId: string): Promise<UserProfile | null> {
        return this.repository.findOneBy({ userId });
    }

    async findByEmail(email: string): Promise<UserProfile | null> {
        return this.repository.findOneBy({ email });
    }

    async findByUsername(username: string): Promise<UserProfile | null> {
        return this.repository.findOneBy({ username });
    }

    async create(userData: Partial<UserProfile>): Promise<UserProfile> {
        const user = this.repository.create(userData);
        return await this.repository.save(user);
    }

    async update(id: string, userData: Partial<UserProfile>): Promise<UserProfile | null> {
        await this.repository.update({ id }, userData);
        return this.findById(id);
    }

    async updatePreferences(id: string, preferences: Partial<UserProfile['preferences']>): Promise<UserProfile | null> {
        const user = await this.findById(id);
        if (!user) return null;
        
        user.preferences = { ...user.preferences, ...preferences };
        return this.repository.save(user);
    }

    async updateAvatar(id: string, avatarUrl: string): Promise<UserProfile | null> {
        await this.repository.update({ id }, { avatar: avatarUrl });
        return this.findById(id);
    }

    async updateAccountStatus(id: string, status: 'active' | 'suspended' | 'deactivated'): Promise<UserProfile | null> {
        await this.repository.update({ id }, { accountStatus: status });
        return this.findById(id);
    }

    async search(query: string, limit: number, offset: number): Promise<[UserProfile[], number]> {
        return this.repository.createQueryBuilder('user')
            .where('user.username LIKE :query OR user.firstName LIKE :query OR user.lastName LIKE :query', 
                  { query: `%${query}%` })
            .take(limit)
            .skip(offset)
            .getManyAndCount();
    }
}
