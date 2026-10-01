import { Request, Response, NextFunction } from 'express';
import { expenseService } from '../services/expense.service';

class CategoryController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categories = await expenseService.getAllCategories();
      res.json(categories);
    } catch (error) {
      next(error);
    }
  }
}

export const categoryController = new CategoryController();
