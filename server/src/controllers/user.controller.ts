import { Request, Response, NextFunction } from 'express';
import { userService } from '../services/user.service';
import { UnauthorizedError } from '../utils/errors';

class UserController {
  async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('User not authenticated');
      }

      const user = await userService.getProfile(req.user.id);
      res.json(user);
    } catch (error) {
      next(error);
    }
  }

  async updateMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('User not authenticated');
      }

      const user = await userService.updateProfile(req.user.id, req.body);
      res.json(user);
    } catch (error) {
      next(error);
    }
  }

  async getMyGroups(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('User not authenticated');
      }

      const groups = await userService.getUserGroups(req.user.id);
      res.json(groups);
    } catch (error) {
      next(error);
    }
  }
}

export const userController = new UserController();
