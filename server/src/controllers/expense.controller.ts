import { Request, Response, NextFunction } from 'express';
import { expenseService } from '../services/expense.service';
import { UnauthorizedError } from '../utils/errors';

class ExpenseController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('User not authenticated');
      }

      const { id: groupId } = req.params;
      const expense = await expenseService.createExpense(String(groupId), req.user.id, req.body);

      res.status(201).json(expense);
    } catch (error) {
      next(error);
    }
  }

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id: groupId } = req.params;
      const { page, limit, categoryId } = req.query as {
        page: string;
        limit: string;
        categoryId?: string;
      };

      const result = await expenseService.listExpenses(String(groupId), {
        page: Number(page) || 1,
        limit: Number(limit) || 20,
        categoryId,
      });

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getOne(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { expenseId } = req.params;
      const expense = await expenseService.getExpenseDetail(String(expenseId));

      res.json(expense);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('User not authenticated');
      }

      const { expenseId } = req.params;
      const expense = await expenseService.updateExpense(String(expenseId), req.user.id, req.body);

      res.json(expense);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('User not authenticated');
      }

      const { expenseId } = req.params;
      await expenseService.deleteExpense(String(expenseId), req.user.id);

      res.json({ message: 'Expense deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  async addComment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('User not authenticated');
      }

      const { expenseId } = req.params;
      const { body } = req.body;

      const comment = await expenseService.addComment(String(expenseId), req.user.id, body);

      res.status(201).json(comment);
    } catch (error) {
      next(error);
    }
  }

  async deleteComment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id: groupId, expenseId, commentId } = req.params;
      await expenseService.deleteComment(String(commentId), String(expenseId), String(groupId));

      res.json({ message: 'Comment deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  async getHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { expenseId } = req.params;
      const history = await expenseService.getExpenseHistory(String(expenseId));

      res.json(history);
    } catch (error) {
      next(error);
    }
  }
}

export const expenseController = new ExpenseController();
