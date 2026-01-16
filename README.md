# 🎨 H-Bot UI (Frontend)

Modern, beautiful web interface for the Hummingbot Commercial Trading Platform. Built with Next.js 15, React 19, and deployed on Vercel.

 - **Development**: STRICTLY LOCAL. Do NOT develop on the droplet.
  - **Production**: Occasionally hosted on Vercel for remote access to the dashboard.

---

## 🚀 Features

- **Bot Orchestration**: Create, manage, and monitor multiple trading bots
- **Real-time Dashboard**: Live PnL, trades, and performance metrics
- **Portfolio Management**: Track balances across exchanges
- **Activity Monitoring**: Detailed trade history and bot logs
- **Responsive Design**: Works on desktop, tablet, and mobile

---

## 🏗️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **UI**: React 19, TailwindCSS v4, Radix UI
- **State**: Zustand (with periodic polling)
- **Real-time**: HTTP Polling (5s interval) - *WebSockets avoided for primary state stability*
- **Auth**: Basic Auth + JWT (Token naming: `accessToken`)
- **Deployment**: Vercel

---

## ⚙️ Environment Setup

### 1. Create `.env.local` for development:

```env
# Development (local backend)
NEXT_PUBLIC_BACKEND_MODE=real
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws
```

### 2. Create `.env.production` for Vercel:

```env
# Production (deployed backend)
NEXT_PUBLIC_BACKEND_MODE=real
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_WS_URL=wss://api.yourdomain.com/ws
```

> **⚠️ Never commit `.env` files!** Use `.env.example` for templates.

---

## 🚀 Quick Start

### Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open http://localhost:3000
```

### Production Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

---

## 📂 Project Structure

```
h-bot-ui/
├── app/                    # Next.js App Router
│   ├── dashboard/         # Main dashboard
│   ├── orchestration/     # Bot management
│   ├── portfolio/         # Portfolio view
│   ├── activity/          # Trade logs
│   └── api/              # API routes (proxy to backend)
├── components/            # React components
│   ├── dashboard/        # Dashboard components
│   ├── orchestration/    # Bot management components
│   └── ui/              # Reusable UI primitives
├── hooks/                # Custom React hooks
├── store/                # Zustand state management
├── lib/                  # Utilities
│   ├── api-router.ts    # API URL helper
│   └── backend-api.ts   # Axios client
└── types/                # TypeScript types
```

---

## 🌐 Deploy to Vercel

### Option 1: Vercel Dashboard

1. **Push to GitHub**:
   ```bash
   git push origin main
   ```

2. **Import in Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your `h-bot-ui` repository

3. **Configure Environment Variables**:
   ```
   NEXT_PUBLIC_BACKEND_MODE=real
   NEXT_PUBLIC_API_URL=https://api.yourdomain.com
   NEXT_PUBLIC_WS_URL=wss://api.yourdomain.com/ws
   ```

4. **Deploy**! 🚀

### Option 2: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Deploy to production
vercel --prod
```

---

## 🔧 Configuration

### API Connection

Update `lib/backend-api.ts` to point to your backend:

```typescript
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
```

### WebSocket Connection

Update `store/useStore.ts`:

```typescript
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws';
```

---

## 🎨 Styling

- **Framework**: TailwindCSS v4
- **Components**: Radix UI primitives
- **Icons**: Lucide React
- **Theme**: Dark mode support (customize in `app/globals.css`)

---

## 📊 Key Features

### Dashboard
- Real-time PnL tracking
- Portfolio overview
- Active bots monitoring
- Performance charts

### Bot Orchestration
- Create new bots with wizard
- Start/Stop bots
- Configure strategies
- View bot details

### Portfolio
- Exchange balances
- Asset allocation
- Historical performance

### Activity Log
- Trade history
- Bot errors
- System events (via MQTT logs relayed to UI)

---

## 🎨 Recent UI Updates & Design Decisions

### ⚡ Smart Auto-Fill Wizard
The Bot Creation Wizard now includes a **Smart Auto-Fill** for DCA strategies. It automatically calculates:
- Martingale scaling for safety orders.
- Required capital commitment based on price deviation.
- Conversion from USD targets to raw decimal units (e.g., $100 -> 0.0011 BTC).

### 🖱️ Interaction Model
- **Group Filtering**: Changed from *Hover* to *Click* on the Orchestration page to prevent accidental view switching.
- **Unit Toggles**: Always verify the "Units" vs "USD" toggle when configuring DCA bots to avoid enormous order sizes.

### 🔄 Communication Pattern
We standardized on **5-second HTTP polling** in `store/useStore.ts`. Do not use WebSockets for primary dashboard updates unless real-time sub-second latency is required for a specific reactive component.

---

## 🐛 Troubleshooting

### Can't connect to backend

1. **Check backend is running**:
   ```bash
   curl https://api.yourdomain.com/health
   ```

2. **Verify environment variables**:
   - Check `NEXT_PUBLIC_API_URL` is set correctly
   - Ensure no trailing slash

3. **Check CORS**:
   - Backend must allow your frontend domain

### Build errors

```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```

### 🖥️ UI / UX Refinements
- **Interaction Model**: Group selection interaction changed from **Hover** to **Click** on the Orchestration page for more deliberate filtering.
- **Wizard Features**: The Bot Wizard now includes a **Smart Auto-Fill** for DCA that calculates martingale scaling and capital requirements automatically.
---

## 📚 Documentation

- **Next.js**: [nextjs.org/docs](https://nextjs.org/docs)
- **TailwindCSS**: [tailwindcss.com](https://tailwindcss.com)
- **Radix UI**: [radix-ui.com](https://www.radix-ui.com/)

---

## 🤝 Contributing

Contributions welcome! Please open an issue or PR.

---

## 📄 License

[Your License Here]

---

**Need help?** Open an issue or check the [backend repository](https://github.com/YOUR_USERNAME/h-bot-stack).
