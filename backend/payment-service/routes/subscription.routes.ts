    import { Router } from "express";
    import {
        getActiveSubscription,
        createSubscription,
        updateSubscription,
        getSubscriptionById,
        deleteSubscription,
        incrementarSuscripcion
    } from "../controllers/subscription.controller";

    const router = Router();

    router.get("/active/:userId", getActiveSubscription);
    router.post("/", createSubscription);
    router.put("/:id", updateSubscription);
    router.get("/:id", getSubscriptionById);
    router.delete("/:subscriptionId", deleteSubscription);
    router.put("/upgrade/:userId", incrementarSuscripcion);

    export default router;
