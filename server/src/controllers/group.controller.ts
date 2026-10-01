import { Request, Response, NextFunction } from 'express';
import { groupService } from '../services/group.service';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';

class GroupController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('User not authenticated');
      }

      const { name } = req.body;
      const group = await groupService.createGroup(name, req.user.id);

      res.status(201).json(group);
    } catch (error) {
      next(error);
    }
  }

  async getOne(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const group = await groupService.getGroupDetail(id);

      res.json(group);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { name } = req.body;
      
      const group = await groupService.updateGroup(id, name);

      res.json(group);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const force = req.query.force === 'true';

      await groupService.deleteGroup(id, force);

      res.json({ message: 'Group deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  async addMember(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('User not authenticated');
      }

      const { id } = req.params;
      const { email } = req.body;

      const member = await groupService.addMember(id, email, req.user.id);

      res.status(201).json(member);
    } catch (error) {
      next(error);
    }
  }

  async removeMember(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('User not authenticated');
      }

      const { id, userId } = req.params;

      await groupService.removeMember(id, userId, req.user.id);

      res.json({ message: 'Member removed successfully' });
    } catch (error) {
      next(error);
    }
  }

  async leaveGroup(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('User not authenticated');
      }

      const { id } = req.params;

      // Check if user is the owner
      if (req.membership?.role === 'OWNER') {
        throw new ForbiddenError(
          'Group owner cannot leave. Transfer ownership first or delete the group.'
        );
      }

      await groupService.removeMember(id, req.user.id, req.user.id);

      res.json({ message: 'Left group successfully' });
    } catch (error) {
      next(error);
    }
  }

  async transferOwnership(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('User not authenticated');
      }

      const { id } = req.params;
      const { newOwnerId } = req.body;

      await groupService.transferOwnership(id, req.user.id, newOwnerId);

      res.json({ message: 'Ownership transferred successfully' });
    } catch (error) {
      next(error);
    }
  }
}

export const groupController = new GroupController();
