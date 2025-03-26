import { Request, Response } from "express";
import * as subscriptionService from "../services/subscription.service";

export const getActiveSubscription = async (req: Request, res: Response) => {
    try {
        const userId = req.params.userId;
        const subscription = await subscriptionService.getActiveSubscriptionByUserId(userId);
        res.status(200).json(subscription);
    } catch (error) {
        res.status(400).json({ error: (error as Error).message });
    }
};

export const createSubscription = async (req: Request, res: Response) => {
    try {
        const subscriptionData = req.body;

        const newSubscription = await subscriptionService.createSubscription(subscriptionData);
        res.status(201).json({ message: "Suscripción creada exitosamente", subscription: newSubscription });
    } catch (error) {
        res.status(400).json({ error: (error as Error).message });
    }
};

export const updateSubscription = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.body.userId; // Asegúrate de obtener el userId de la sesión o del body
        const subscriptionData = req.body;
        const updatedSubscription = await subscriptionService.updateSubscription(id, subscriptionData, userId);
        res.status(200).json(updatedSubscription);
    } catch (error) {
        res.status(400).json({ error: (error as Error).message });
    }
};

export const getSubscriptionById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const subscription = await subscriptionService.getSubscriptionById(id);
        res.status(200).json(subscription);
    } catch (error) {
        res.status(404).json({ error: (error as Error).message });
    }
};

export const deleteSubscription = async (req: Request, res: Response) => {
    try {
        const { subscriptionId } = req.params;
        const userId = req.body.userId;
        await subscriptionService.deleteSubscription(subscriptionId, userId);
        res.status(200).json({ message: "Suscripción eliminada exitosamente" });
    } catch (error) {
        res.status(400).json({ error: (error as Error).message });
    }
};

export const incrementarSuscripcion = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        await subscriptionService.incrementarSuscripcion(userId);
        res.status(200).json({ message: "Suscripción incrementada exitosamente" });
    } catch (error) {
        res.status(400).json({ error: (error as Error).message });
    }
};
