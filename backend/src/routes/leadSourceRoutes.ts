import { Router } from 'express';
import { createLeadSourceController, listLeadSourcesController } from '../controllers/leadSourceController.js';

const router = Router();

router.get('/', listLeadSourcesController);
router.post('/', createLeadSourceController);

export default router;
