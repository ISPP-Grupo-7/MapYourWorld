import { Router } from 'express';
import {findAllPhotos,uploadPhoto,getPhotoById,updatePhoto,deletePhoto,getPhotosofPoi} from '../controllers/photo.controller'

const router: Router = Router();
router.get('/', findAllPhotos);
router.post('/upload/:poiId', uploadPhoto);
router.get('/:photoId', getPhotoById);
router.put('/update/:photoId', updatePhoto);
router.delete('/delete/:photoId', deletePhoto);
router.get('/poi/:poiId', getPhotosofPoi);

export default router;