import { PrismaClient, NotificationType, ExpenseCategory, Prisma } from '@prisma/client';
import { hashSync } from 'bcryptjs';

interface SeedExpense {
  title: string;
  amount: number;
  category: ExpenseCategory;
  description?: string;
  paidById: string;
  date?: Date;
  dueDate?: Date;
  isPaid?: boolean;
}

interface SeedNotification {
  type: NotificationType;
  title: string;
  message: string;
  userId: string;
  isRead?: boolean;
  data?: Prisma.InputJsonValue;
}

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting BachelorsPay database seed...\n');

  // ---------------------------------------------------------------------------
  // Clean existing data (order matters due to foreign key constraints)
  // ---------------------------------------------------------------------------
  console.log('🧹 Cleaning existing data...');
  await prisma.auditLog.deleteMany();
  await prisma.loanRepayment.deleteMany();
  await prisma.loan.deleteMany();
  await prisma.creditHistory.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.walletTransaction.deleteMany();
  await prisma.wallet.deleteMany();
  await prisma.expenseSplit.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.recurringExpense.deleteMany();
  await prisma.inviteCode.deleteMany();
  await prisma.roomMember.deleteMany();
  await prisma.room.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.verificationToken.deleteMany();
  await prisma.user.deleteMany();

  // ---------------------------------------------------------------------------
  // 1. Users — 4 roommates with hashed passwords
  // ---------------------------------------------------------------------------
  console.log('👤 Creating users...');
  const hashedPassword = hashSync('Password123!', 12);

  const rahul = await prisma.user.create({
    data: {
      name: 'Rahul Sharma',
      email: 'rahul@example.com',
      password: hashedPassword,
      phone: '+919876543210',
      creditScore: 750,
      image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rahul',
    },
  });

  const priya = await prisma.user.create({
    data: {
      name: 'Priya Patel',
      email: 'priya@example.com',
      password: hashedPassword,
      phone: '+919876543211',
      creditScore: 720,
      image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Priya',
    },
  });

  const amit = await prisma.user.create({
    data: {
      name: 'Amit Kumar',
      email: 'amit@example.com',
      password: hashedPassword,
      phone: '+919876543212',
      creditScore: 680,
      image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Amit',
    },
  });

  const sneha = await prisma.user.create({
    data: {
      name: 'Sneha Reddy',
      email: 'sneha@example.com',
      password: hashedPassword,
      phone: '+919876543213',
      creditScore: 710,
      image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sneha',
    },
  });

  const allUsers = [rahul, priya, amit, sneha];
  console.log(`   ✅ Created ${allUsers.length} users`);

  // ---------------------------------------------------------------------------
  // 2. Room — Sunshine Apartment 4B
  // ---------------------------------------------------------------------------
  console.log('🏠 Creating room...');
  const room = await prisma.room.create({
    data: {
      name: 'Sunshine Apartment 4B',
      code: 'SUN-4B-2024',
      maxMembers: 6,
    },
  });
  console.log(`   ✅ Created room: ${room.name}`);

  // ---------------------------------------------------------------------------
  // 3. Room Members — Rahul as OWNER, rest as MEMBER
  // ---------------------------------------------------------------------------
  console.log('👥 Adding room members...');
  await prisma.roomMember.create({
    data: { userId: rahul.id, roomId: room.id, role: 'OWNER' },
  });
  await prisma.roomMember.create({
    data: { userId: priya.id, roomId: room.id, role: 'MEMBER' },
  });
  await prisma.roomMember.create({
    data: { userId: amit.id, roomId: room.id, role: 'MEMBER' },
  });
  await prisma.roomMember.create({
    data: { userId: sneha.id, roomId: room.id, role: 'MEMBER' },
  });
  console.log('   ✅ Added 4 room members');

  // ---------------------------------------------------------------------------
  // 4. Wallet — shared room wallet with ₹4000 balance
  // ---------------------------------------------------------------------------
  console.log('💰 Creating wallet...');
  const wallet = await prisma.wallet.create({
    data: {
      balance: 4000,
      roomId: room.id,
    },
  });
  console.log(`   ✅ Created wallet with balance ₹${wallet.balance}`);

  // ---------------------------------------------------------------------------
  // 5. Wallet Transactions — deposits from each member
  // ---------------------------------------------------------------------------
  console.log('💳 Creating wallet transactions...');
  const walletTxnData = [
    { amount: 1000, type: 'DEPOSIT' as const, description: 'Monthly contribution - Rahul', userId: rahul.id },
    { amount: 1000, type: 'DEPOSIT' as const, description: 'Monthly contribution - Priya', userId: priya.id },
    { amount: 1000, type: 'DEPOSIT' as const, description: 'Monthly contribution - Amit', userId: amit.id },
    { amount: 1000, type: 'DEPOSIT' as const, description: 'Monthly contribution - Sneha', userId: sneha.id },
  ];

  for (const txn of walletTxnData) {
    await prisma.walletTransaction.create({
      data: { ...txn, walletId: wallet.id },
    });
  }
  console.log(`   ✅ Created ${walletTxnData.length} wallet transactions`);

  // ---------------------------------------------------------------------------
  // 6. Expenses — 22 realistic expenses across all categories
  //    Each expense is split equally among 4 members.
  // ---------------------------------------------------------------------------
  console.log('📝 Creating expenses...');

  // Helper: creates an expense and its 4 equal splits in one go
  async function createExpenseWithSplits(data: {
    title: string;
    amount: number;
    category: ExpenseCategory;
    description?: string;
    paidById: string;
    date?: Date;
    dueDate?: Date;
    isPaid?: boolean;
  }) {
    const splitAmount = data.amount / 4;
    const expense = await prisma.expense.create({
      data: {
        title: data.title,
        amount: data.amount,
        category: data.category,
        description: data.description,
        splitType: 'EQUAL',
        paidById: data.paidById,
        roomId: room.id,
        date: data.date ?? new Date(),
        dueDate: data.dueDate,
        isPaid: data.isPaid ?? false,
        splits: {
          create: allUsers.map((user) => ({
            amount: splitAmount,
            userId: user.id,
            // The person who paid has their split already settled
            isPaid: user.id === data.paidById,
            paidAt: user.id === data.paidById ? new Date() : null,
          })),
        },
      },
    });
    return expense;
  }

  // June 2026 expenses
  const june1 = new Date('2026-06-01');
  const june5 = new Date('2026-06-05');
  const june8 = new Date('2026-06-08');
  const june10 = new Date('2026-06-10');
  const june12 = new Date('2026-06-12');
  const june15 = new Date('2026-06-15');
  const june18 = new Date('2026-06-18');
  const june20 = new Date('2026-06-20');
  const june22 = new Date('2026-06-22');
  const june25 = new Date('2026-06-25');
  const june28 = new Date('2026-06-28');
  const june30 = new Date('2026-06-30');

  // July 2026 expenses
  const july1 = new Date('2026-07-01');
  const july3 = new Date('2026-07-03');
  const july5 = new Date('2026-07-05');
  const july7 = new Date('2026-07-07');
  const july10 = new Date('2026-07-10');
  const july12 = new Date('2026-07-12');
  const july14 = new Date('2026-07-14');
  const july15 = new Date('2026-07-15');
  const july16 = new Date('2026-07-16');
  const july17 = new Date('2026-07-17');

  const expenses: SeedExpense[] = [
    // RENT — biggest monthly expense
    { title: 'Monthly Rent - June', amount: 48000, category: 'RENT', description: 'Rent for June 2026 paid to landlord Mr. Venkatesh', paidById: rahul.id, date: june1, dueDate: june5, isPaid: true },
    { title: 'Monthly Rent - July', amount: 48000, category: 'RENT', description: 'Rent for July 2026', paidById: rahul.id, date: july1, dueDate: july5 },

    // ELECTRICITY
    { title: 'Electricity Bill - June', amount: 2400, category: 'ELECTRICITY', description: 'BESCOM bill for June', paidById: priya.id, date: june10, isPaid: true },
    { title: 'Electricity Bill - July', amount: 2800, category: 'ELECTRICITY', description: 'BESCOM bill for July (AC usage increase)', paidById: priya.id, date: july10 },

    // WATER
    { title: 'Water Bill - June', amount: 600, category: 'WATER', description: 'Monthly water supply charges', paidById: amit.id, date: june12, isPaid: true },

    // INTERNET
    { title: 'WiFi Bill - June', amount: 1200, category: 'INTERNET', description: 'ACT Fibernet 100 Mbps plan', paidById: sneha.id, date: june8, isPaid: true },
    { title: 'WiFi Bill - July', amount: 1200, category: 'INTERNET', description: 'ACT Fibernet 100 Mbps plan', paidById: sneha.id, date: july7 },

    // GROCERIES
    { title: 'Weekly Groceries - Week 1', amount: 3200, category: 'GROCERIES', description: 'Rice, dal, vegetables, oil from BigBasket', paidById: rahul.id, date: june5, isPaid: true },
    { title: 'Weekly Groceries - Week 2', amount: 2800, category: 'GROCERIES', description: 'Fruits, milk, bread, eggs from DMart', paidById: priya.id, date: june12, isPaid: true },
    { title: 'Weekly Groceries - Week 3', amount: 3500, category: 'GROCERIES', description: 'Monthly stock-up: atta, spices, snacks', paidById: amit.id, date: june20, isPaid: true },
    { title: 'Weekly Groceries - Week 4', amount: 2600, category: 'GROCERIES', description: 'Vegetables and daily essentials', paidById: sneha.id, date: june28 },
    { title: 'Weekly Groceries - July W1', amount: 3100, category: 'GROCERIES', description: 'Fresh produce and pantry items', paidById: rahul.id, date: july3 },
    { title: 'Weekly Groceries - July W2', amount: 2900, category: 'GROCERIES', description: 'Household supplies and snacks', paidById: priya.id, date: july12 },

    // GAS
    { title: 'Gas Cylinder Refill', amount: 900, category: 'GAS', description: 'HP Gas cylinder refill', paidById: amit.id, date: june15, isPaid: true },
    { title: 'Gas Cylinder - July', amount: 900, category: 'GAS', description: 'HP Gas cylinder refill for July', paidById: rahul.id, date: july14 },

    // CLEANING
    { title: 'House Cleaning Supplies', amount: 800, category: 'CLEANING', description: 'Brooms, mop, floor cleaner, dish soap', paidById: sneha.id, date: june18, isPaid: true },
    { title: 'Maid Service - June', amount: 2000, category: 'CLEANING', description: 'Part-time maid salary for June', paidById: rahul.id, date: june30, isPaid: true },

    // FOOD — eating out / ordering
    { title: 'Weekend Dinner - Meghana Foods', amount: 2400, category: 'FOOD', description: 'Biryani dinner at Meghana Foods, Koramangala', paidById: priya.id, date: june22, isPaid: true },
    { title: 'Swiggy Order - Friday Night', amount: 1600, category: 'FOOD', description: 'Pizza and sides from Swiggy', paidById: amit.id, date: june25 },
    { title: 'Sunday Brunch - Third Wave', amount: 3200, category: 'FOOD', description: 'Brunch at Third Wave Coffee, Indiranagar', paidById: sneha.id, date: july5 },

    // MAINTENANCE
    { title: 'Plumber Visit', amount: 500, category: 'MAINTENANCE', description: 'Fixed leaking kitchen tap', paidById: rahul.id, date: june15, isPaid: true },
    { title: 'AC Service', amount: 1200, category: 'MAINTENANCE', description: 'Annual AC servicing for 2 units', paidById: priya.id, date: july15 },

    // OTHER
    { title: 'Netflix Subscription', amount: 649, category: 'OTHER', description: 'Netflix Standard plan shared account', paidById: amit.id, date: june1, isPaid: true },
  ];

  const createdExpenses = [];
  for (const exp of expenses) {
    const created = await createExpenseWithSplits(exp);
    createdExpenses.push(created);
  }
  console.log(`   ✅ Created ${createdExpenses.length} expenses with splits`);

  // ---------------------------------------------------------------------------
  // 7. Payments — 2 sample payments settling expense debts
  // ---------------------------------------------------------------------------
  console.log('💸 Creating payments...');
  await prisma.payment.create({
    data: {
      amount: 12000,
      method: 'UPI',
      status: 'SUCCESS',
      transactionId: 'UPI-TXN-20260602-001',
      notes: 'Rent share for June',
      senderId: priya.id,
      receiverId: rahul.id,
      expenseId: createdExpenses[0].id, // June Rent
    },
  });

  await prisma.payment.create({
    data: {
      amount: 600,
      method: 'UPI',
      status: 'SUCCESS',
      transactionId: 'UPI-TXN-20260611-002',
      notes: 'Electricity share for June',
      senderId: amit.id,
      receiverId: priya.id,
      expenseId: createdExpenses[2].id, // June Electricity
    },
  });
  console.log('   ✅ Created 2 payments');

  // ---------------------------------------------------------------------------
  // 8. Notifications — welcome + expense notifications for each user
  // ---------------------------------------------------------------------------
  console.log('🔔 Creating notifications...');
  const notificationData: SeedNotification[] = [
    // Rahul's notifications
    { type: 'MEMBER_JOINED' as const, title: 'Welcome to BachelorsPay!', message: 'You created Sunshine Apartment 4B. Invite your roommates!', userId: rahul.id },
    { type: 'PAYMENT_RECEIVED' as const, title: 'Payment Received', message: 'Priya paid ₹12,000 for June rent share', userId: rahul.id, data: { amount: 12000, from: 'Priya Patel' } },
    { type: 'EXPENSE_ADDED' as const, title: 'New Expense Added', message: 'Priya added Electricity Bill - July (₹2,800)', userId: rahul.id, isRead: false },
    { type: 'DUE_REMINDER' as const, title: 'Payment Due', message: 'Your share of ₹12,000 for July Rent is due by Jul 5', userId: rahul.id },

    // Priya's notifications
    { type: 'MEMBER_JOINED' as const, title: 'Room Joined', message: 'You joined Sunshine Apartment 4B', userId: priya.id },
    { type: 'EXPENSE_ADDED' as const, title: 'New Expense Added', message: 'Rahul added Monthly Rent - July (₹48,000)', userId: priya.id },
    { type: 'PAYMENT_RECEIVED' as const, title: 'Payment Received', message: 'Amit paid ₹600 for electricity share', userId: priya.id, data: { amount: 600, from: 'Amit Kumar' } },

    // Amit's notifications
    { type: 'MEMBER_JOINED' as const, title: 'Room Joined', message: 'You joined Sunshine Apartment 4B', userId: amit.id },
    { type: 'LOAN_APPROVED' as const, title: 'Loan Approved', message: 'Rahul approved your loan request of ₹5,000', userId: amit.id, data: { amount: 5000, lender: 'Rahul Sharma' } },
    { type: 'DUE_REMINDER' as const, title: 'Loan Repayment Due', message: 'Your loan of ₹5,000 is due for repayment by Aug 15', userId: amit.id },

    // Sneha's notifications
    { type: 'MEMBER_JOINED' as const, title: 'Room Joined', message: 'You joined Sunshine Apartment 4B', userId: sneha.id },
    { type: 'EXPENSE_ADDED' as const, title: 'New Expense Added', message: 'Rahul added Monthly Rent - July (₹48,000)', userId: sneha.id },
    { type: 'WALLET_LOW' as const, title: 'Wallet Balance Low', message: 'Room wallet balance is below ₹5,000. Consider adding funds.', userId: sneha.id },
  ];

  for (const notif of notificationData) {
    await prisma.notification.create({
      data: {
        type: notif.type,
        title: notif.title,
        message: notif.message,
        userId: notif.userId,
        isRead: notif.isRead ?? false,
        data: notif.data ?? undefined,
      },
    });
  }
  console.log(`   ✅ Created ${notificationData.length} notifications`);

  // ---------------------------------------------------------------------------
  // 9. Loan — Amit borrowed ₹5,000 from Rahul
  // ---------------------------------------------------------------------------
  console.log('🤝 Creating loan...');
  const loan = await prisma.loan.create({
    data: {
      amount: 5000,
      reason: 'Personal emergency — needed funds before salary credit',
      interestRate: 0,
      status: 'APPROVED',
      repaymentDate: new Date('2026-08-15'),
      approvedAt: new Date('2026-07-02'),
      borrowerId: amit.id,
      lenderId: rahul.id,
    },
  });

  // Partial repayment of ₹2,000
  await prisma.loanRepayment.create({
    data: {
      amount: 2000,
      loanId: loan.id,
      userId: amit.id,
    },
  });
  console.log('   ✅ Created 1 loan with 1 partial repayment');

  // ---------------------------------------------------------------------------
  // 10. Credit History — track score changes for users
  // ---------------------------------------------------------------------------
  console.log('📊 Creating credit history...');
  const creditEntries = [
    // Rahul — good payment behavior
    { scoreBefore: 700, scoreAfter: 720, reason: 'On-time rent payment for 3 consecutive months', userId: rahul.id },
    { scoreBefore: 720, scoreAfter: 750, reason: 'Approved a peer loan and received timely repayment', userId: rahul.id },

    // Priya — steady improvement
    { scoreBefore: 700, scoreAfter: 710, reason: 'On-time utility bill payments', userId: priya.id },
    { scoreBefore: 710, scoreAfter: 720, reason: 'Consistent expense settlement within 48 hours', userId: priya.id },

    // Amit — slight dip due to late payments, then partial recovery
    { scoreBefore: 700, scoreAfter: 690, reason: 'Late payment on grocery expense share', userId: amit.id },
    { scoreBefore: 690, scoreAfter: 680, reason: 'Outstanding loan pending repayment', userId: amit.id },

    // Sneha — good standing
    { scoreBefore: 700, scoreAfter: 710, reason: 'Timely contribution to room wallet', userId: sneha.id },
  ];

  for (const entry of creditEntries) {
    await prisma.creditHistory.create({ data: entry });
  }
  console.log(`   ✅ Created ${creditEntries.length} credit history entries`);

  // ---------------------------------------------------------------------------
  // 11. Invite Code — one active invite for the room
  // ---------------------------------------------------------------------------
  console.log('✉️  Creating invite code...');
  await prisma.inviteCode.create({
    data: {
      code: 'SUN4B-INVITE-X7K9',
      isUsed: false,
      expiresAt: new Date('2026-08-01'),
      roomId: room.id,
    },
  });
  console.log('   ✅ Created 1 invite code');

  // ---------------------------------------------------------------------------
  // 12. Recurring Expenses — rent and wifi set on auto
  // ---------------------------------------------------------------------------
  console.log('🔄 Creating recurring expenses...');
  await prisma.recurringExpense.create({
    data: {
      title: 'Monthly Rent',
      amount: 48000,
      category: 'RENT',
      dayOfMonth: 1,
      isActive: true,
      roomId: room.id,
    },
  });

  await prisma.recurringExpense.create({
    data: {
      title: 'WiFi Bill',
      amount: 1200,
      category: 'INTERNET',
      dayOfMonth: 7,
      isActive: true,
      roomId: room.id,
    },
  });
  console.log('   ✅ Created 2 recurring expenses');

  // ---------------------------------------------------------------------------
  // 13. Audit Logs — track key actions in the room
  // ---------------------------------------------------------------------------
  console.log('📋 Creating audit logs...');
  const auditEntries = [
    { action: 'ROOM_CREATED', details: { roomName: 'Sunshine Apartment 4B', code: 'SUN-4B-2024' }, userId: rahul.id, roomId: room.id },
    { action: 'MEMBER_ADDED', details: { memberName: 'Priya Patel', role: 'MEMBER' }, userId: rahul.id, roomId: room.id },
    { action: 'MEMBER_ADDED', details: { memberName: 'Amit Kumar', role: 'MEMBER' }, userId: rahul.id, roomId: room.id },
    { action: 'MEMBER_ADDED', details: { memberName: 'Sneha Reddy', role: 'MEMBER' }, userId: rahul.id, roomId: room.id },
    { action: 'EXPENSE_CREATED', details: { title: 'Monthly Rent - June', amount: 48000, category: 'RENT' }, userId: rahul.id, roomId: room.id },
    { action: 'PAYMENT_MADE', details: { amount: 12000, method: 'UPI', from: 'Priya Patel', to: 'Rahul Sharma' }, userId: priya.id, roomId: room.id },
    { action: 'WALLET_DEPOSIT', details: { amount: 1000, contributor: 'Rahul Sharma' }, userId: rahul.id, roomId: room.id },
    { action: 'LOAN_APPROVED', details: { amount: 5000, borrower: 'Amit Kumar', lender: 'Rahul Sharma' }, userId: rahul.id, roomId: room.id },
    { action: 'INVITE_CODE_GENERATED', details: { code: 'SUN4B-INVITE-X7K9', expiresAt: '2026-08-01' }, userId: rahul.id, roomId: room.id },
    { action: 'RECURRING_EXPENSE_CREATED', details: { title: 'Monthly Rent', amount: 48000, dayOfMonth: 1 }, userId: rahul.id, roomId: room.id },
  ];

  for (const log of auditEntries) {
    await prisma.auditLog.create({ data: log });
  }
  console.log(`   ✅ Created ${auditEntries.length} audit log entries`);

  // ---------------------------------------------------------------------------
  // Summary
  // ---------------------------------------------------------------------------
  console.log('\n🎉 Seed completed successfully!');
  console.log('─'.repeat(50));
  console.log(`   Users:              ${allUsers.length}`);
  console.log(`   Room:               1 (${room.name})`);
  console.log(`   Room Members:       4`);
  console.log(`   Wallet:             1 (₹${wallet.balance})`);
  console.log(`   Wallet Txns:        ${walletTxnData.length}`);
  console.log(`   Expenses:           ${createdExpenses.length}`);
  console.log(`   Expense Splits:     ${createdExpenses.length * 4}`);
  console.log(`   Payments:           2`);
  console.log(`   Notifications:      ${notificationData.length}`);
  console.log(`   Loans:              1`);
  console.log(`   Loan Repayments:    1`);
  console.log(`   Credit History:     ${creditEntries.length}`);
  console.log(`   Invite Codes:       1`);
  console.log(`   Recurring Expenses: 2`);
  console.log(`   Audit Logs:         ${auditEntries.length}`);
  console.log('─'.repeat(50));
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seed failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
