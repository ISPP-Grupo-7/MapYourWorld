// Add this to your src/routes/friend.routes.js file:

import express from 'express';
import { 
    createFriendController,
    findFriendByIdController,
    updateFriendStatusController,
    listFriendsController,
    listSearchUserController,
    getFriendsController,
    getPendingRequestsForRecipientController
} from '../controllers/friend.controller';

const router = express.Router();

// POST routes
router.post('/create', createFriendController);

// GET routes
router.get('/search/:nameData', listSearchUserController);
router.get('/list/:status/:userId', listFriendsController);
router.get('/friends/:userId', getFriendsController);
router.get('/request/:userId', getPendingRequestsForRecipientController);
router.get('/:friendId', findFriendByIdController);

// PUT routes
router.put('/update/:friendId/:status', updateFriendStatusController);

export default router;