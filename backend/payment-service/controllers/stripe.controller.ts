import { Request, Response } from "express";
import Stripe from "stripe";
import dotenv from "dotenv";
import path from "path";

import * as subscriptionService from "../services/subscription.service";

// Configurar dotenv para que busque el archivo .env en la raíz del proyecto
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });


const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: "2025-02-24.acacia",
  });



export const createPaymentIntent = async (req: Request, res: Response) => {
    try {
      const userId = req.params.userId; 
      const { amount } = req.body; // Monto en centavos (€10.00 = 1000)
  
      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency: "eur",
        automatic_payment_methods: { enabled: true },
      });
      
      res.json({ paymentIntent: paymentIntent.client_secret });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
};