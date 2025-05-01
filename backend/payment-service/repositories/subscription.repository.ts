import { Repository } from "typeorm";
import { PlanType, Subscription } from "../models/subscription.model";
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



    async getSubscriptionByUserId(userId:string): Promise<Subscription>{

        const suscription = await this.subscriptionRepo.findOne({where:{user:{id:userId}}, relations:['user']});
    

        if(!suscription){
            throw new Error(`No se ha encontrado ninguna suscripción asociada al usuario con id: ${userId}`)
        }

        return suscription;
    }


    async increaseSuscription(userId:string): Promise<void>{
        const suscripcion_usuario = await this.subscriptionRepo.findOne({where:{user:{id:userId}}, relations:['user']})


        if(!suscripcion_usuario){
            throw new Error(`No se ha encontrado ninguna suscripción asociada al usuario con id: ${userId}`)
        }

        const now = new Date();

        suscripcion_usuario.startDate= new Date(now.getTime());
        suscripcion_usuario.endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 días después
        suscripcion_usuario.is_active = true
        suscripcion_usuario.plan = PlanType.PREMIUM
        
        this.subscriptionRepo.save(suscripcion_usuario)
    }

    async delete(id: string): Promise<void> {
        await this.subscriptionRepo.delete(id);
    }
}