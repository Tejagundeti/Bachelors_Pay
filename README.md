# BachelorsPay 💰

BachelorsPay is a full-stack, production-ready web application designed to help roommates, bachelors, or flatmates manage and automate shared flat finances. It handles expense splits, shared wallets, peer micro-loans, recurring monthly bills, roommate credit scores, and transaction history with a modern fintech glassmorphic UI.

---

## Key Features

- 🔐 **Secure Authentication**: Credentials login & signup (secured via bcrypt hashing), custom password reset workflow, and Google OAuth structure.
- ⚡ **Room Onboarding**: Join an existing flat instantly using a 6-character room code or create a new room and act as the room Owner.
- 💸 **Smart Split Engine**: Add shared expenses and split them **equally**, **by percentages**, or using **custom manual amounts**, with dynamic decimal rounding precision.
- 💼 **Shared Room Wallet**: Contribute money to a shared room wallet to deduct expenses (like groceries) directly.
- 📈 **Fintech Dashboard & Analytics**: Dynamic spending counters, Recharts category breakdown pie charts, and monthly expenditure trends.
- 📆 **Automated Recurring Bills**: Configure rent, WiFi, electricity, or water to auto-generate actual splits on the due date of every month.
- 🛡️ **Owner/Admin Control Panel**: Manage flatmates (remove members), transfer ownership, lock room invitations, or delete the room.
- 🤝 **Peer-to-Peer Micro Loans**: Roommates can request small internal loans with calculated repayment dates and custom reasons, backed by an **Internal Credit Score** rating system.
- 🔔 **In-App Notification Center**: Unread bells alerts for new expenses, payments, notifications of loans, and low wallet warnings.

---

## Tech Stack

### Frontend
- **Framework**: Next.js 16 (App Router)
- **UI & State**: React 19, Lucide Icons, Recharts, Framer Motion
- **Styling**: Tailwind CSS v4
- **Validation**: Zod

### Backend & Database
- **Engine**: Next.js API Routes (REST endpoints under `/api/`)
- **ORM**: Prisma Client v6+
- **Database**: PostgreSQL (via Neon for cloud / Docker for local)
- **Sessions & Security**: NextAuth v5 (JWT sessions), bcryptjs password hashing

---

## Database Schema (16 Models)

| Model | Description |
| :--- | :--- |
| `User` | User account with credit score, auth relations |
| `Account` | OAuth provider accounts (Google, etc.) |
| `Session` | Active user sessions |
| `VerificationToken` | Password reset tokens |
| `Room` | Shared flat/apartment room |
| `RoomMember` | User ↔ Room membership with roles (OWNER/ADMIN/MEMBER) |
| `Expense` | Shared expense with category, split type, proof image |
| `ExpenseSplit` | Individual user's share of an expense |
| `Wallet` | Shared room wallet with balance |
| `WalletTransaction` | Deposit/withdrawal records |
| `RecurringExpense` | Auto-generated monthly bills |
| `Payment` | P2P payment records (UPI, QR, Bank Transfer, Cash) |
| `Notification` | In-app notification center |
| `Loan` | Peer-to-peer micro loans |
| `LoanRepayment` | Loan repayment tracking |
| `CreditHistory` | Credit score change audit trail |
| `InviteCode` | Room invite codes with expiry |
| `AuditLog` | Action audit trail for compliance |

---

## Local Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
```bash
cp .env.example .env
```
Update `.env` with your **PostgreSQL connection string**:
```env
# Option A: Neon (Free Cloud PostgreSQL - recommended)
DATABASE_URL="postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/bachelorspay?sslmode=require"

# Option B: Docker (local PostgreSQL)
DATABASE_URL="postgresql://bachelorspay:bachelorspay_dev_123@localhost:5432/bachelorspay?schema=public"

NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Push Schema to Database
```bash
npm run db:push
```

### 4. Seed the Database
Populate with demo users, expenses, loans, wallet transactions:
```bash
npm run db:seed
```

### 5. Start the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 6. (Optional) Open Prisma Studio
Browse and edit database records visually:
```bash
npm run db:studio
```

---

## Available Scripts

| Script | Description |
| :--- | :--- |
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run db:push` | Push Prisma schema to database |
| `npm run db:migrate` | Create a new migration |
| `npm run db:seed` | Seed database with demo data |
| `npm run db:studio` | Open Prisma Studio GUI |
| `npm run db:reset` | Reset database & re-seed |

---

## Demo Accounts

| Flatmate | Email | Password | Role |
| :--- | :--- | :--- | :--- |
| **Rahul Sharma** | `rahul@example.com` | `Password123!` | Owner |
| **Priya Patel** | `priya@example.com` | `Password123!` | Member |
| **Amit Kumar** | `amit@example.com` | `Password123!` | Member |
| **Sneha Reddy** | `sneha@example.com` | `Password123!` | Member |

---

## API Endpoints

### Authentication
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| POST | `/api/auth/signup` | Register new user |
| POST | `/api/auth/[...nextauth]` | NextAuth login handler |
| POST | `/api/auth/forgot-password` | Request password reset |
| POST | `/api/auth/reset-password` | Reset password with token |

### Rooms
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| GET | `/api/rooms` | Get user's current room |
| POST | `/api/rooms` | Create a new room |
| GET | `/api/rooms/[id]` | Get room details |
| PUT | `/api/rooms/[id]` | Update room settings |
| DELETE | `/api/rooms/[id]` | Delete room |
| POST | `/api/rooms/join` | Join room by code |
| POST | `/api/rooms/[id]/leave` | Leave room |
| POST | `/api/rooms/[id]/invite` | Generate invite code |
| POST | `/api/rooms/[id]/transfer` | Transfer ownership |
| DELETE | `/api/rooms/[id]/members/[userId]` | Remove member |

### Expenses
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| GET | `/api/expenses` | List expenses (paginated, filterable) |
| POST | `/api/expenses` | Create expense with auto-split |
| GET | `/api/expenses/[id]` | Get expense details |
| PUT | `/api/expenses/[id]` | Update expense |
| DELETE | `/api/expenses/[id]` | Delete expense |
| GET | `/api/expenses/export` | Export expenses as CSV |
| GET | `/api/expenses/recurring` | List recurring bills |
| POST | `/api/expenses/recurring` | Create recurring bill |

### Wallet
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| GET | `/api/wallet` | Get wallet balance |
| POST | `/api/wallet/deposit` | Deposit to wallet |
| POST | `/api/wallet/withdraw` | Withdraw from wallet |
| GET | `/api/wallet/history` | Transaction history |

### Payments
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| GET | `/api/payments` | Payment history |
| POST | `/api/payments` | Record a payment |
| GET | `/api/payments/qr` | Generate QR code |

### Loans
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| GET | `/api/loans` | List loans |
| POST | `/api/loans` | Request a loan |
| POST | `/api/loans/[id]/approve` | Approve loan |
| POST | `/api/loans/[id]/reject` | Reject loan |
| POST | `/api/loans/[id]/repay` | Repay loan |

### Other
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| GET | `/api/analytics` | Dashboard analytics |
| GET | `/api/notifications` | List notifications |
| POST | `/api/notifications/mark-read` | Mark notification as read |
| POST | `/api/notifications/mark-all-read` | Mark all as read |
| GET | `/api/notifications/unread-count` | Unread count |

---

## Production Deployment

### Option 1: Vercel + Neon (Recommended)

1. Create a free PostgreSQL database at [neon.tech](https://neon.tech)
2. Push code to GitHub
3. Import into [Vercel](https://vercel.com)
4. Set environment variables:
   - `DATABASE_URL` → Neon connection string
   - `NEXTAUTH_SECRET` → Secure random string
   - `NEXTAUTH_URL` → Your live domain
5. Deploy!

### Option 2: Docker Compose

```bash
docker compose up -d
```
This starts both PostgreSQL and the Next.js app.

---

## Project Structure

```
├── prisma/
│   ├── schema.prisma          # Database schema (16 models)
│   └── seed.ts                # Seed script with demo data
├── src/
│   ├── app/
│   │   ├── (auth)/            # Login, signup, forgot/reset password
│   │   ├── (dashboard)/       # All dashboard pages
│   │   │   ├── dashboard/     # Main dashboard with charts
│   │   │   ├── expenses/      # Expense management
│   │   │   ├── room/          # Room management
│   │   │   ├── wallet/        # Shared wallet
│   │   │   ├── payments/      # Payment history
│   │   │   ├── loans/         # Peer-to-peer loans
│   │   │   ├── analytics/     # Spending analytics
│   │   │   ├── notifications/ # Notification center
│   │   │   ├── profile/       # User profile
│   │   │   └── settings/      # Settings & recurring bills
│   │   ├── api/               # 30+ REST API endpoints
│   │   └── page.tsx           # Landing page
│   ├── components/            # Navbar, Sidebar, Providers
│   ├── hooks/                 # 7 custom React hooks
│   ├── lib/
│   │   ├── auth.ts            # NextAuth configuration
│   │   ├── prisma.ts          # Prisma client singleton
│   │   ├── services/          # Business logic services
│   │   └── validations/       # Zod schemas
│   └── types/                 # TypeScript type definitions
├── docker-compose.yml         # PostgreSQL + App services
├── Dockerfile                 # Multi-stage production build
└── docker-entrypoint.sh       # Migration runner
```
