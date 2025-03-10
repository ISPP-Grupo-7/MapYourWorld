import { Router } from 'express';
import { createFriendController, listFriendsController, findFriendByIdController, listSearchUserController, deleteFriendController, updateFriendStatusController } from '../controllers/friend.controller';

const router: Router = Router();

router.post('/create', createFriendController);

router.get('/search/:nameData', listSearchUserController);

router.get('/:friendId', findFriendByIdController);

router.put('/update/:friendId', updateFriendStatusController);

router.delete('/delete/:friendId', deleteFriendController);


router.get('/list/:status/:userId', listFriendsController);

export default router;