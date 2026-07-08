import { Request, Response } from 'express';
import { ZodError } from 'zod';
import { createLeadSourceService, listLeadSourcesService } from '../services/leadSourceService.js';

export const listLeadSourcesController = async (_req: Request, res: Response) => {
  try {
    const sources = await listLeadSourcesService();
    return res.json({ sources });
  } catch (error) {
    console.error('Lead source list error:', error);
    return res.status(500).json({ message: 'Failed to load lead sources' });
  }
};

export const createLeadSourceController = async (req: Request, res: Response) => {
  try {
    const source = await createLeadSourceService(req.body);
    return res.status(201).json({ source });
  } catch (error) {
    console.error('Lead source create error:', error);
    if (error instanceof ZodError) {
      return res.status(400).json({ message: error.errors[0]?.message ?? 'Invalid lead source data' });
    }

    return res.status(500).json({ message: 'Failed to create lead source' });
  }
};
