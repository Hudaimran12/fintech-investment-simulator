# InvestSim — Full Stack FinTech MERN App
**Roll Number:** 23i-5544  
**Assignment:** Investment Simulator + Alert System  
**Complexity:** Advanced (3+ collections with relationships)  
**Course:** Web Programming — BS FinTech Semester 6, FAST NUCES

---

## 🧮 Assignment Mapping
| Digit | Value | Table | Result |
|-------|-------|-------|--------|
| digit₁ = 4 | Table A | FinTech Domain | Investment Simulator |
| digit₂ = 4 | Table B | Core Logic | Alert System |
| (4+4)%3 = 2 | Table C | Data Complexity | Advanced (3+ collections) |

---

## 🗂 Project Structure
```
fintech-app/
├── backend/
│   ├── models/
│   │   ├── User.js          # Collection 1
│   │   ├── Investment.js    # Collection 2 (references User)
│   │   ├── Portfolio.js     # Collection 3 (references User)
│   │   └── Alert.js         # Collection 4 (references User + Investment)
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── investmentRoutes.js
│   │   ├── portfolioRoutes.js
│   │   └── alertRoutes.js
│   ├── middleware/
│   │   ├── authMiddleware.js    # Middleware 1: JWT auth
│   │   └── validateMiddleware.js # Middleware 2: Input validation
│   ├── controllers/
│   │   └── finTechLogic.js    # Core simulation + alert engine
│   └── server.js
└── frontend/
    └── src/
        ├── pages/
        │   ├── LoginPage.js
        │   ├── RegisterPage.js
        │   ├── DashboardPage.js
        │   ├── InvestmentsPage.js
        │   ├── AlertsPage.js
        │   └── SimulatePage.js
        ├── components/
        │   └── Navbar.js
        ├── context/
        │   └── AuthContext.js
        └── utils/
            └── api.js
```

---

## 🚀 Local Setup

### 1. Backend
```bash
cd backend
npm install
cp .env.example .env
# Fill in MONGO_URI and JWT_SECRET in .env
npm run dev
```

### 2. Frontend
```bash
cd frontend
npm install
cp .env.example .env
# Set REACT_APP_API_URL=http://localhost:5000/api
npm start
```

---

## ☁️ Deployment

### MongoDB Atlas
1. Create a free cluster at https://cloud.mongodb.com
2. Create DB user and whitelist IP (0.0.0.0/0 for production)
3. Copy connection string as `MONGO_URI`

### Backend → Render
1. Push backend to GitHub
2. New Web Service on https://render.com
3. Set environment variables: `MONGO_URI`, `JWT_SECRET`, `FRONTEND_URL`
4. Build command: `npm install` | Start command: `node server.js`

### Frontend → Vercel
1. Push frontend to GitHub
2. Import project on https://vercel.com
3. Set env var: `REACT_APP_API_URL=https://your-backend.onrender.com/api`
4. Deploy

---

## 📊 Collections & Relationships

```
User (1) ──────────── Investment (many)   [referenced via user field]
User (1) ──────────── Portfolio (1)       [referenced via user field]
User (1) ──────────── Alert (many)        [referenced via user field]
Investment (1) ─────── Alert (many)       [referenced via investment field]
```

**Why Referencing over Embedding:**
- Investments are queried independently (filter, sort, aggregate)
- A user can have unlimited investments — embedding would bloat User doc
- Alerts reference both User AND Investment — cannot embed in both
- Portfolio stats are computed and updated frequently — separate collection avoids User doc rewrites

---

## ⚡ Core FinTech Logic

### Simulation Engine
Uses **Compound Interest Formula**: `FV = PV × (1 + r)^t`
- Projects investment value at 1, 3, and 5 years
- Three scenarios: Conservative (4%), Moderate (8%), Aggressive (14%)

### Alert Engine (Threshold-based Decisions)
| Condition | Threshold | Severity |
|-----------|-----------|----------|
| Return < -15% | Stop Loss | 🔴 Critical |
| Return < -5% | Price Drop | 🟡 Warning |
| Return > +20% | Price Surge | 🔵 Info |
| Return > +50% | Take Profit | 🟡 Warning |
| Risk Score > 70 | High Risk | 🟡 Warning |
| Diversification < 40 | Low Diversity | 🔵 Info |

### Risk Scoring
Weighted average of asset risk weights:
- Crypto: 90 | Stock: 60 | ETF: 40 | Mutual Fund: 30 | Bond: 15

---

## 🔍 Two Meaningful Queries

**Query 1 — Aggregation (Performance by Asset Type):**
Groups investments by `assetType`, sums invested/current values, calculates return %, sorts descending.

**Query 2 — Ranking (Portfolio Leaderboard):**
Aggregates all portfolios, computes return %, sorts descending, joins with User collection using `$lookup`.

---

## 🔒 Security Implemented
1. JWT authentication on all protected routes
2. Input validation on all form endpoints (express-validator)
3. Protected routes on frontend (React Router guard)
4. bcrypt password hashing (salt rounds: 12)
5. Prevention of unauthorized data access (user field checked on every query)
