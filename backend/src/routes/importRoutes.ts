import { Router } from 'express';
import { previewCsvController, processCsvController } from '../controllers/importController.js';

const router = Router();

router.post('/preview', previewCsvController);
router.post('/process', processCsvController);

export default router;
