import { Repository } from "typeorm";
import { Subscription } from "../models/subscription.model";
import { AppDataSource } from "../../database/appDataSource";

export default class SubscriptionRepository {

    private subscriptionRepo: Repository<Subscription>;

    constructor() {
        this.subscriptionRepo = AppDataSource.getRepository(Subscription);
    }

    async getActiveSubscriptionByUserId(userId: string): Promise<Subscription | null> {
        return await this.subscriptionRepo.findOne({ where: { is_active: true, user: { id: userId } } });
    }

    async getById(id: string): Promise<Subscription> {
        const subscription = await this.subscriptionRepo.findOne({ where: { id: id }, relations: ['user'] }); // { where: { id: id, relations: ['user'] });
        if (!subscription) {
            throw new Error(`Subscription with id ${id} not found`);
        }
        return subscription;
    }

    // Método "create" que realmente inserta en BD
    public async create(subscriptionData: Partial<Subscription>): Promise<Subscription> {
        const subscription = this.subscriptionRepo.create(subscriptionData);
        return await this.subscriptionRepo.save(subscription);
    }


    async update(subscriptionId: string, subscriptionData: Partial<Subscription>): Promise<Subscription> {
        const subscription = await this.getById(subscriptionId);
        Object.assign(subscription, subscriptionData);
        return await this.subscriptionRepo.save(subscription);
    }

    async delete(id: string): Promise<void> {
        await this.subscriptionRepo.delete(id);
    }
}