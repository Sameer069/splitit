import { Request, Response, NextFunction } from 'express';
import { inviteService } from '../services/invite.service';
import { UnauthorizedError } from '../utils/errors';

class InviteController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('User not authenticated');
      }

      const { id: groupId } = req.params;
      const { email } = req.body;

      const invite = await inviteService.createInvite(String(groupId), email, req.user.id);

      res.status(201).json(invite);
    } catch (error) {
      next(error);
    }
  }

  async getDetails(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token } = req.params;
      const invite = await inviteService.getInviteDetails(String(token));

      res.json(invite);
    } catch (error) {
      next(error);
    }
  }

  async accept(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('User not authenticated');
      }

      const { token } = req.params;
      const result = await inviteService.acceptInvite(String(token), req.user.id);

      res.json({
        message: 'Invite accepted successfully',
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  async listPending(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('User not authenticated');
      }

      const invites = await inviteService.getPendingInvitesForUser(req.user.email);

      res.json(invites);
    } catch (error) {
      next(error);
    }
  }

  async listGroupInvites(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id: groupId } = req.params;
      const invites = await inviteService.getGroupInvites(String(groupId));

      res.json(invites);
    } catch (error) {
      next(error);
    }
  }
}

export const inviteController = new InviteController();
