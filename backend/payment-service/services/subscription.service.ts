import SubscriptionRepository from '../repositories/subscription.repository';
import { Subscription, PlanType } from '../models/subscription.model';

const subscriptionRepository = new SubscriptionRepository();

/**
 * Crea una nueva suscripción:
 * - Asigna automáticamente:
 *    - startDate: fecha actual
 *    - endDate: 30 días después de la fecha actual
 *    - createdAt y updatedAt: fecha actual
 * - Si no se especifica plan, se asigna FREE.
 * - El campo is_active se marca como true solo si el plan es PREMIUM y la fecha actual está entre startDate y endDate.
 */
export const createSubscription = async (subscriptionData: Partial<Subscription>): Promise<Subscription> => {
    try {
        if (!subscriptionData) { 
            throw new Error("No se ha proporcionado información de suscripción");
        }
        const now = new Date();

        subscriptionData.startDate = now;
        subscriptionData.endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 días después

        if (!subscriptionData.plan) {
            subscriptionData.plan = PlanType.FREE;
        }

        subscriptionData.is_active =
            subscriptionData.plan === PlanType.PREMIUM &&
            now >= subscriptionData.startDate &&
            now <= subscriptionData.endDate;
        
        const newSubscription = new Subscription();
        newSubscription.plan = subscriptionData.plan;
        newSubscription.startDate = subscriptionData.startDate;
        newSubscription.endDate = subscriptionData.endDate;
        newSubscription.is_active = subscriptionData.is_active;

        if (!subscriptionData.user) {
            throw new Error("El campo 'user' es obligatorio para crear una suscripción");
        }
        newSubscription.user = subscriptionData.user;

        return await subscriptionRepository.create(newSubscription);
    } catch (error) {
        console.error("Error creating subscription:", error);
        throw error;
    }
};

/**
 * Actualiza una suscripción existente:
 * - Si se actualiza el plan o las fechas, se recalcula is_active en función de:
 *    - El plan debe ser PREMIUM.
 *    - La fecha actual debe estar entre startDate y endDate.
 * - Se actualiza el campo updatedAt.
 */
export const updateSubscription = async (subscriptionId: string, subscriptionData: Partial<Subscription>, userId: string): Promise<Subscription> => {
    try {
        // Se obtiene la suscripción actual para usar sus valores en caso de no actualizarse
        const existingSubscription = await subscriptionRepository.getById(subscriptionId);
        if (existingSubscription.user.id !== userId) {
            throw new Error("No tienes permisos para actualizar esta suscripción");
        }
        const now = new Date();

        const effectivePlan = subscriptionData.plan ? subscriptionData.plan : existingSubscription.plan;
        const effectiveStartDate = subscriptionData.startDate ? subscriptionData.startDate : existingSubscription.startDate;
        const effectiveEndDate = subscriptionData.endDate ? subscriptionData.endDate : existingSubscription.endDate;

        

        subscriptionData.is_active =
            effectivePlan === PlanType.PREMIUM &&
            now >= effectiveStartDate &&
            now <= effectiveEndDate;



        return await subscriptionRepository.update(subscriptionId, subscriptionData);
    } catch (error) {
        console.error("Error updating subscription:", error);
        throw error;
    }
};

/**
 * Obtiene una suscripción por su ID.
 */
export const getSubscriptionById = async (subscriptionId: string): Promise<Subscription> => {
    return await subscriptionRepository.getById(subscriptionId);
};

/**
 * Obtiene la suscripción activa de un usuario, identificada por su ID.
 */
export const getActiveSubscriptionByUserId = async (userId: string): Promise<Subscription | null> => {
    return await subscriptionRepository.getActiveSubscriptionByUserId(userId);
};


export const incrementarSuscripcion = async (userId: string): Promise<void> => {
    const suscripcion_usuario = await subscriptionRepository.getSuscriptionByUserId(userId)

    if(suscripcion_usuario.plan === PlanType.PREMIUM){
        throw new Error("El usuario ya tiene el plan Premium asignado")
    }
    
    await subscriptionRepository.increaseSuscription(userId);
};

/**
 * Elimina una suscripción por su ID.
 */
export const deleteSubscription = async (subscriptionId: string, userId: string): Promise<void> => {
    const existingSubscription = await subscriptionRepository.getById(subscriptionId);
    if (existingSubscription.user.id !== userId) {
        throw new Error("No tienes permisos para actualizar esta suscripción");
    }
    return await subscriptionRepository.delete(subscriptionId);
};