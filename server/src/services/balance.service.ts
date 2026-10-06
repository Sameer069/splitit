import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';

export interface MemberBalance {
  userId: string;
  userName: string;
  avatarUrl: string | null; // Changed from userAvatar
  amount: number; // Changed from balance - positive = owed to them, negative = they owe
}

export interface SimplifiedSettlement {
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserName: string;
  amount: number;
}

class BalanceService {
  /**
   * Calculate net balance for each group member
   * Balance = (amount paid) - (amount owed in splits) + (settlements received) - (settlements sent)
   */
  async calculateGroupBalances(groupId: string): Promise<MemberBalance[]> {
    // Get all group members
    const members = await prisma.groupMember.findMany({
      where: { groupId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });

    const balances: MemberBalance[] = [];

    for (const member of members) {
      const userId = member.userId;

      // Amount user paid
      const expensesPaid = await prisma.expense.aggregate({
        where: {
          groupId,
          paidById: userId,
        },
        _sum: { amount: true },
      });
      const totalPaid = Number(expensesPaid._sum.amount || 0);

      // Amount user owes (their share of all expenses)
      const splits = await prisma.expenseSplit.aggregate({
        where: {
          expense: { groupId },
          userId,
        },
        _sum: { shareAmount: true },
      });
      const totalOwed = Number(splits._sum.shareAmount || 0);

      // Net settlements (received - sent)
      const settlementsReceived = await prisma.settlement.aggregate({
        where: {
          groupId,
          toUserId: userId,
        },
        _sum: { amount: true },
      });
      const totalReceived = Number(settlementsReceived._sum.amount || 0);

      const settlementsSent = await prisma.settlement.aggregate({
        where: {
          groupId,
          fromUserId: userId,
        },
        _sum: { amount: true },
      });
      const totalSent = Number(settlementsSent._sum.amount || 0);

      // Net balance calculation
      const balance = totalPaid - totalOwed + totalReceived - totalSent;

      balances.push({
        userId: member.user.id,
        userName: member.user.name,
        avatarUrl: member.user.avatarUrl, // Changed from userAvatar
        amount: Number(balance.toFixed(2)), // Changed from balance
      });
    }

    return balances;
  }

  /**
   * Greedy debt simplification algorithm
   * Minimizes the number of transactions needed to settle all debts
   * 
   * Algorithm:
   * 1. Calculate net balance for each member
   * 2. Separate into creditors (positive balance) and debtors (negative balance)
   * 3. Repeatedly match largest creditor with largest debtor
   * 4. Create a settlement for the minimum of their absolute balances
   * 5. Update balances and repeat until all settled
   * 
   * This is a greedy approach that doesn't guarantee absolute minimum transactions
   * but provides a very good approximation in O(n²) time.
   */
  simplifyDebts(balances: MemberBalance[]): SimplifiedSettlement[] {
    const settlements: SimplifiedSettlement[] = [];

    // Create working copy of balances
    const workingBalances = balances.map(b => ({ ...b }));

    // Tolerance for floating point comparison
    const EPSILON = 0.01;

    while (true) {
      // Find largest creditor (person owed the most)
      const creditor = workingBalances
        .filter(b => b.amount > EPSILON)
        .sort((a, b) => b.amount - a.amount)[0];

      // Find largest debtor (person who owes the most)
      const debtor = workingBalances
        .filter(b => b.amount < -EPSILON)
        .sort((a, b) => a.amount - b.amount)[0];

      // If no creditor or debtor, we're done
      if (!creditor || !debtor) {
        break;
      }

      // Settlement amount is minimum of what's owed and what's due
      const settlementAmount = Math.min(
        creditor.amount,
        Math.abs(debtor.amount)
      );

      // Create settlement record
      settlements.push({
        fromUserId: debtor.userId,
        fromUserName: debtor.userName,
        toUserId: creditor.userId,
        toUserName: creditor.userName,
        amount: Number(settlementAmount.toFixed(2)),
      });

      // Update working balances
      creditor.amount -= settlementAmount;
      debtor.amount += settlementAmount;

      logger.debug(
        {
          from: debtor.userName,
          to: creditor.userName,
          amount: settlementAmount,
        },
        'Simplified settlement created'
      );
    }

    return settlements;
  }

  /**
   * Get balance summary with simplified settlement suggestions
   */
  async getBalanceSummary(groupId: string): Promise<{
    balances: MemberBalance[];
    suggestions: SimplifiedSettlement[];
  }> {
    const balances = await this.calculateGroupBalances(groupId);
    const suggestions = this.simplifyDebts(balances);

    return {
      balances,
      suggestions,
    };
  }

  /**
   * Verify all balances sum to approximately zero (sanity check)
   */
  verifyBalancesSum(balances: MemberBalance[]): boolean {
    const sum = balances.reduce((acc, b) => acc + b.amount, 0);
    const TOLERANCE = 0.02; // Allow small rounding errors
    const isValid = Math.abs(sum) < TOLERANCE;

    if (!isValid) {
      logger.warn(
        { sum, balances },
        'Balance sum does not equal zero - possible calculation error'
      );
    }

    return isValid;
  }
}

export const balanceService = new BalanceService();
