import { Router } from 'express';
import {findAllPhotos,uploadPhoto,getPhotoById,updatePhoto,deletePhoto,getPhotosofPoi} from '../controllers/photo.controller'

const router: Router = Router();
router.post('/', findAllPhotos);
router.post('/upload/:poiId', uploadPhoto);
router.post('/:photoId', getPhotoById);
router.post('/update/:photoId', updatePhoto);
router.post('/delete/:poiId', deletePhoto);
router.post('/poi/:poiId', getPhotosofPoi);

export default router;