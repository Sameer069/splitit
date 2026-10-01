import { userRepository } from '../repositories/user.repository';
import { NotFoundError } from '../utils/errors';

class UserService {
  async getProfile(userId: string) {
    const user = await userRepository.findById(userId);
    
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Never return password hash
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      authProvider: user.authProvider,
      createdAt: user.createdAt,
    };
  }

  async updateProfile(
    userId: string,
    data: {
      name?: string;
      avatarUrl?: string | null;
    }
  ) {
    const user = await userRepository.updateProfile(userId, data);

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      authProvider: user.authProvider,
      createdAt: user.createdAt,
    };
  }

  async getUserGroups(userId: string) {
    const memberships = await userRepository.getUserGroups(userId);

    return memberships.map(membership => ({
      id: membership.group.id,
      name: membership.group.name,
      role: membership.role,
      memberCount: membership.group._count.members,
      expenseCount: membership.group._count.expenses,
      joinedAt: membership.joinedAt,
      createdAt: membership.group.createdAt,
    }));
  }
}

export const userService = new UserService();
