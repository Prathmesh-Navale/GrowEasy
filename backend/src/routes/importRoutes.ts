import { Router } from 'express';
import {
  getCrmSchemaController,
  listImportHistoryController,
  previewCsvController,
  processCsvController
} from '../controllers/importController.js';

const router = Router();

router.get('/history', listImportHistoryController);
router.get('/schema', getCrmSchemaController);
router.post('/preview', previewCsvController);
router.post('/process', processCsvController);

export default router;
