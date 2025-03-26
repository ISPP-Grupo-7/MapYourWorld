import { Router } from "express";
import {
    createPaymentIntent
} from "../controllers/stripe.controller";

const router = Router();

router.post("/:userId", createPaymentIntent);

export default router;
