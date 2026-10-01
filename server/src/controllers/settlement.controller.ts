import { Request, Response, NextFunction } from 'express';
import { settlementService } from '../services/settlement.service';
import { UnauthorizedError } from '../utils/errors';

class SettlementController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('User not authenticated');
      }

      const { id: groupId } = req.params;
      const settlement = await settlementService.createSettlement(String(groupId), req.body);

      res.status(201).json(settlement);
    } catch (error) {
      next(error);
    }
  }

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id: groupId } = req.params;
      const { page, limit } = req.query as {
        page: string;
        limit: string;
      };

      const result = await settlementService.listSettlements(String(groupId), {
        page: Number(page) || 1,
        limit: Number(limit) || 20,
      });

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getBalances(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id: groupId } = req.params;
      const summary = await settlementService.getGroupBalances(String(groupId));

      res.json(summary);
    } catch (error) {
      next(error);
    }
  }
}

export const settlementController = new SettlementController();
