import { Request, Response } from 'express';
import { previewCsvService, processCsvService } from '../services/importService.js';
import { listImportJobs } from '../services/importJobService.js';
import { allowedCrmStatuses, allowedDataSources, crmFields } from '../constants/crmImportSchema.js';

export const previewCsvController = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    if (!req.file.originalname.toLowerCase().endsWith('.csv')) {
      return res.status(400).json({ message: 'Invalid file format. Please upload a CSV file.' });
    }

    const preview = await previewCsvService(req.file);
    return res.json(preview);
  } catch (error) {
    console.error('Preview error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to preview CSV';
    return res.status(500).json({ message: `Preview failed: ${errorMessage}` });
  }
};

export const processCsvController = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    if (!req.file.originalname.toLowerCase().endsWith('.csv')) {
      return res.status(400).json({ message: 'Invalid file format. Please upload a CSV file.' });
    }

    const leadSourceId = typeof req.body?.leadSourceId === 'string' ? req.body.leadSourceId.trim() : '';
    const result = await processCsvService(req.file, leadSourceId || undefined);
    return res.json(result);
  } catch (error) {
    console.error('Process error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to process CSV';
    return res.status(500).json({ message: `Processing failed: ${errorMessage}` });
  }
};

export const listImportHistoryController = async (_req: Request, res: Response) => {
  try {
    const jobs = await listImportJobs();
    return res.json({ jobs });
  } catch (error) {
    console.error('Import history error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to load import history';
    return res.status(500).json({ message: errorMessage });
  }
};

export const getCrmSchemaController = (_req: Request, res: Response) => {
  return res.json({
    fields: crmFields,
    statuses: allowedCrmStatuses,
    dataSources: allowedDataSources
  });
};
