import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { checkAndGenerateRecurringBills } from '@/lib/services/recurring-bills';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    let roomId = searchParams.get('roomId');

    // Find the user's room if not explicitly provided
    const membership = await prisma.roomMember.findFirst({
      where: { userId: session.user.id },
      include: {
        room: {
          include: {
            members: {
              include: {
                user: {
                  select: { id: true, name: true, image: true },
                },
              },
            },
            wallet: true,
          },
        },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: 'You are not a member of any room' },
        { status: 400 }
      );
    }

    const room = membership.room;
    roomId = roomId || room.id;

    // Check and trigger recurring bills generation
    await checkAndGenerateRecurringBills(roomId);

    // Get all expenses in this room
    const expenses = await prisma.expense.findMany({
      where: { roomId },
      include: {
        paidBy: { select: { id: true, name: true, image: true } },
        splits: {
          include: {
            user: { select: { id: true, name: true, image: true } },
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    // Get all payments in this room (linked to room users)
    const memberIds = room.members.map((m) => m.userId);
    const payments = await prisma.payment.findMany({
      where: {
        OR: [
          { senderId: { in: memberIds }, receiverId: { in: memberIds } },
        ],
      },
      include: {
        sender: { select: { id: true, name: true } },
        receiver: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // --- Calculations ---

    const totalSpending = expenses.reduce((sum, e) => sum + e.amount, 0);
    const expenseCount = expenses.length;
    const averageExpense = expenseCount > 0 ? totalSpending / expenseCount : 0;

    // 1. Category breakdown
    const categoryTotals: Record<string, { amount: number; count: number }> = {};
    expenses.forEach((e) => {
      if (!categoryTotals[e.category]) {
        categoryTotals[e.category] = { amount: 0, count: 0 };
      }
      categoryTotals[e.category].amount += e.amount;
      categoryTotals[e.category].count += 1;
    });

    const categoryColors: Record<string, string> = {
      RENT: '#2563EB',
      GROCERIES: '#22C55E',
      ELECTRICITY: '#F59E0B',
      INTERNET: '#8B5CF6',
      FOOD: '#EF4444',
      WATER: '#06B6D4',
      GAS: '#F97316',
      CLEANING: '#EC4899',
      MAINTENANCE: '#14B8A6',
      OTHER: '#6B7280',
    };

    const categoriesList = Object.entries(categoryTotals).map(([cat, val]) => ({
      category: cat,
      amount: val.amount,
      percentage: totalSpending > 0 ? (val.amount / totalSpending) * 100 : 0,
      count: val.count,
    }));

    const categoryDataForDashboard = Object.entries(categoryTotals).map(([cat, val]) => ({
      name: cat.charAt(0) + cat.slice(1).toLowerCase(),
      value: val.amount,
      color: categoryColors[cat] || '#6B7280',
    }));

    // 2. Monthly spending trend
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyTotals: Record<string, { total: number; count: number; dateKey: string; sortVal: number }> = {};
    
    // Seed last 6 months with 0 so chart looks nice even if no data
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mLabel = monthNames[d.getMonth()];
      const year = d.getFullYear();
      const dateKey = `${year}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlyTotals[mLabel] = { total: 0, count: 0, dateKey, sortVal: d.getTime() };
    }

    expenses.forEach((e) => {
      const d = new Date(e.date);
      const mLabel = monthNames[d.getMonth()];
      if (monthlyTotals[mLabel] !== undefined) {
        monthlyTotals[mLabel].total += e.amount;
        monthlyTotals[mLabel].count += 1;
      }
    });

    const monthlyTrends = Object.entries(monthlyTotals)
      .sort((a, b) => a[1].sortVal - b[1].sortVal)
      .map(([month, val]) => ({
        month: val.dateKey,
        total: val.total,
        count: val.count,
      }));

    const monthlyDataForDashboard = Object.entries(monthlyTotals)
      .sort((a, b) => a[1].sortVal - b[1].sortVal)
      .map(([month, val]) => ({
        month,
        amount: val.total,
      }));

    // 3. Member spending balances
    const memberPaid: Record<string, number> = {};
    const memberOwed: Record<string, number> = {};

    // Initialize
    room.members.forEach((m) => {
      memberPaid[m.userId] = 0;
      memberOwed[m.userId] = 0;
    });

    expenses.forEach((e) => {
      if (memberPaid[e.paidById] !== undefined) {
        memberPaid[e.paidById] += e.amount;
      }
      e.splits.forEach((s) => {
        if (memberOwed[s.userId] !== undefined) {
          memberOwed[s.userId] += s.amount;
        }
      });
    });

    // Calculate current net outstanding balance (only counting UNPAID splits)
    // net = (what others owe this user for expenses they paid) - (what this user owes others for splits)
    const memberOutstanding: Record<string, number> = {};
    room.members.forEach((m) => {
      memberOutstanding[m.userId] = 0;
    });

    expenses.forEach((e) => {
      e.splits.forEach((s) => {
        if (!s.isPaid) {
          // s.userId owes e.paidById s.amount
          if (memberOutstanding[s.userId] !== undefined) {
            memberOutstanding[s.userId] -= s.amount;
          }
          if (memberOutstanding[e.paidById] !== undefined) {
            memberOutstanding[e.paidById] += s.amount;
          }
        }
      });
    });

    const memberSpendingList = room.members.map((m) => {
      const totalP = memberPaid[m.userId] || 0;
      const totalO = memberOwed[m.userId] || 0;
      return {
        userId: m.userId,
        name: m.user.name || 'Roommate',
        avatar: m.user.image,
        totalPaid: totalP,
        totalOwed: totalO,
        netBalance: totalP - totalO,
      };
    });

    const roomMembersDashboard = room.members.map((m) => ({
      id: m.userId,
      name: m.user.name || 'Roommate',
      image: m.user.image || undefined,
      role: m.role,
      balance: memberOutstanding[m.userId] || 0,
    }));

    // 4. Pending dues of current user
    // Sum of all unpaid splits where the user is the debtor
    const myUnpaidDebts = expenses.reduce((sum, e) => {
      const mySplit = e.splits.find((s) => s.userId === session.user.id);
      if (mySplit && !mySplit.isPaid && e.paidById !== session.user.id) {
        return sum + mySplit.amount;
      }
      return sum;
    }, 0);

    // Sum of all unpaid splits where others owe the current user
    const othersUnpaidDebts = expenses.reduce((sum, e) => {
      if (e.paidById === session.user.id) {
        const unpaidSplits = e.splits.filter((s) => s.userId !== session.user.id && !s.isPaid);
        return sum + unpaidSplits.reduce((sSum, s) => sSum + s.amount, 0);
      }
      return sum;
    }, 0);

    const pendingDues = myUnpaidDebts; // What the user owes to others
    const myNetBalance = othersUnpaidDebts - myUnpaidDebts;

    // 5. Monthly variables
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const roomExpensesThisMonth = expenses
      .filter((e) => new Date(e.date) >= startOfMonth)
      .reduce((sum, e) => sum + e.amount, 0);

    const mySpendingThisMonth = expenses
      .filter((e) => new Date(e.date) >= startOfMonth)
      .reduce((sum, e) => {
        const mySplit = e.splits.find((s) => s.userId === session.user.id);
        return sum + (mySplit ? mySplit.amount : 0);
      }, 0);

    // Total outstanding debt in the entire room
    const totalBalance = expenses.reduce((sum, e) => {
      const unpaidSplits = e.splits.filter((s) => !s.isPaid);
      return sum + unpaidSplits.reduce((sSum, s) => sSum + s.amount, 0);
    }, 0);

    // 6. Recent transactions (combined list of top 10 expenses & payments)
    const recentTxns: {
      id: string;
      title: string;
      amount: number;
      type: string;
      category: string;
      date: string;
      status: string;
    }[] = [];
    
    // Add expenses
    expenses.slice(0, 10).forEach((e) => {
      recentTxns.push({
        id: `exp-${e.id}`,
        title: e.title,
        amount: e.amount,
        type: e.paidById === session.user.id ? 'received' : 'paid',
        category: e.category,
        date: e.date.toISOString(),
        status: e.isPaid ? 'SUCCESS' : 'PENDING',
      });
    });

    // Add payments
    payments.slice(0, 10).forEach((p) => {
      recentTxns.push({
        id: `pay-${p.id}`,
        title: p.senderId === session.user.id 
          ? `Paid ${p.receiver.name}` 
          : `Received from ${p.sender.name}`,
        amount: p.amount,
        type: p.senderId === session.user.id ? 'paid' : 'received',
        category: 'OTHER',
        date: p.createdAt.toISOString(),
        status: p.status,
      });
    });

    // Sort combined by date
    const sortedRecentTxns = recentTxns
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);

    return NextResponse.json({
      // Dashboard fields
      totalBalance,
      pendingDues,
      monthExpenses: roomExpensesThisMonth,
      personalSpending: mySpendingThisMonth,
      monthlyData: monthlyDataForDashboard,
      categoryData: categoryDataForDashboard,
      recentTransactions: sortedRecentTxns,
      walletBalance: room.wallet?.balance ?? 0,
      roomMembers: roomMembersDashboard,

      // useAnalytics fields
      totalSpending,
      averageExpense,
      expenseCount,
      categories: categoriesList,
      monthly: monthlyTrends,
      members: memberSpendingList,
      myNetBalance,
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
