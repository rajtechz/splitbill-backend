# SplitMate Backend — Production-Grade Dynamic REST API

This is the official backend server for **SplitMate**, built with **Node.js, Express, TypeScript, and JWT Authentication**. It features dynamic data recalculation, persistent JSON/file database, and a flexible third-party services layer (OTP, Push Notifications, Storage, and Currencies) with built-in development fallbacks.

---

## 🚀 Quick Start

From the root project directory:
```bash
npm run backend
```

Or from inside the `backend/` directory:
```bash
cd backend
npm run dev
```

The server starts on **`http://localhost:3000`**:
- **Health Check**: `http://localhost:3000/health`
- **Base API Path**: `http://localhost:3000/api/v1`
- **Persistent Database**: Automatically persisted to `backend/data/db.json`
- **Static Uploads**: `http://localhost:3000/uploads/`

To run backend automated integration tests:
```bash
npm run test # inside backend/ directory
```

---

## 🧩 Flexible Third-Party Service Architecture

The backend isolates external third-party dependencies behind clean interfaces located in `src/services/providers/`:

### 1. OTP Service (`IOtpProvider` in `src/services/providers/otp.provider.ts`)
- **Default (Mock Mode)**: Dispatches a 6-digit dynamic code (with 5-minute expiry) and prints a formatted card in the server terminal. Additionally, the universal code **`123456`** is always accepted so you never get blocked during testing or demoing.
- **Production Extension**: Ready-to-go `TwilioOtpProvider` template. Simply set `OTP_PROVIDER=twilio`, `TWILIO_ACCOUNT_SID`, and `TWILIO_AUTH_TOKEN` in `.env`.

### 2. Push Notification Service (`INotificationProvider` in `src/services/providers/notification.provider.ts`)
- **Default (Mock Mode)**: Automatically creates dynamic in-app notification records in `db.json` and logs simulated push dispatch cards to the terminal when expenses or payments are added.
- **Production Extension**: Ready-to-go `FcmNotificationProvider` template for Firebase Cloud Messaging / APNs. Set `PUSH_PROVIDER=fcm` and provide `FIREBASE_PROJECT_ID`.

### 3. File & Avatar Storage (`IStorageProvider` in `src/services/providers/storage.provider.ts`)
- **Default (Local Mode)**: Decodes base64 avatar photos and receipt images, writes them to `backend/data/uploads/`, and serves them directly via HTTP static route `/uploads/<filename>`.
- **Production Extension**: Ready-to-go `S3StorageProvider` template for AWS S3 or Cloudflare R2. Set `STORAGE_PROVIDER=s3` and `AWS_S3_BUCKET`.

### 4. Dynamic Currency & Geolocation Service (`src/services/providers/currency.provider.ts`)
- 9 supported world currencies (INR, USD, EUR, GBP, AUD, CAD, SGD, AED, JPY) with symbols, exchange rates, and names.
- Automatic country-to-currency auto-detection (e.g. `IN` -> `INR`, `US` -> `USD`, `GB` -> `GBP`, `AE` -> `AED`, etc.).

---

## 📡 REST API Reference

### 🔐 Authentication & Security (`/api/v1/auth`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/auth/register` | Register new user with name, email, password, currency, country |
| `POST` | `/auth/login` | Login with email and password, returns JWT tokens |
| `POST` | `/auth/otp/send` | Send OTP via SMS/Email (Dev code `123456` or dynamic code) |
| `POST` | `/auth/otp/verify` | Verify OTP code and automatically log in or sign up |
| `POST` | `/auth/refresh-token` | Exchange refresh token for new access token |
| `POST` | `/auth/mpin/setup` | Setup or update 4-digit security mPIN |
| `POST` | `/auth/mpin/verify` | Verify 4-digit security mPIN (Default: `1234`) |
| `POST` | `/auth/mpin/toggle-biometrics` | Enable or disable Fingerprint / Biometric unlock |
| `GET`  | `/auth/security` | Get user's current security lock settings |
| `POST` | `/auth/forgot-password` | Request password reset |
| `POST` | `/auth/logout` | Revoke session |

### 👤 Users & Contacts (`/api/v1/users`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET`   | `/users/me` | Fetch authenticated user profile |
| `PATCH` | `/users/me` | Update name, upiId, currency, or country |
| `POST`  | `/users/me/avatar` | Upload base64 profile avatar photo |
| `POST`  | `/users/sync-contacts` | Match phone address book contacts with registered users |
| `POST`  | `/users/me/location-currency` | Automatically set default currency from GPS country |
| `GET`   | `/users/:id` | Get public profile of another user |

### 👥 Groups (`/api/v1/groups`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET`    | `/groups` | List user's groups with dynamic balances |
| `POST`   | `/groups` | Create group (Trip, Home, Office, etc.) |
| `GET`    | `/groups/:id` | Get group details, members, expenses, debts |
| `PATCH`  | `/groups/:id` | Update group name, description, category |
| `DELETE` | `/groups/:id` | Delete group |
| `POST`   | `/groups/:id/members` | Add member to group |
| `DELETE` | `/groups/:id/members/:userId` | Remove member from group |
| `GET`    | `/groups/:id/balances` | Get debt simplification and settlements |

### 🤝 Friends (`/api/v1/friends`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET`    | `/friends` | List all friends with dynamic `netBalance` |
| `POST`   | `/friends` | Add friend by email/phone |
| `GET`    | `/friends/:id` | Get friend balance and profile |
| `DELETE` | `/friends/:id` | Remove friend |
| `GET`    | `/friends/:id/expenses` | Get shared expenses with this friend |

### 💸 Expenses (`/api/v1/expenses`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET`    | `/expenses` | List expenses (optional `?groupId=...`) |
| `POST`   | `/expenses` | Create expense (EQUAL, EXACT, PERCENTAGE, SHARES) |
| `GET`    | `/expenses/:id` | Get expense details & comments |
| `PATCH`  | `/expenses/:id` | Update expense and trigger balance recalculation |
| `DELETE` | `/expenses/:id` | Delete expense and restore balances |
| `POST`   | `/expenses/:id/comments` | Post a comment on an expense |

### 💳 Settlements (`/api/v1/settlements`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET`   | `/settlements` | List payments and settlements |
| `POST`  | `/settlements` | Record a payment / settle debt |
| `PATCH` | `/settlements/:id/confirm` | Confirm receipt of payment |
| `PATCH` | `/settlements/:id/reject` | Reject unreceived payment |

### 🔔 Notifications & Activities
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET`   | `/notifications` | List user notifications |
| `PATCH` | `/notifications/:id/read` | Mark single notification as read |
| `PATCH` | `/notifications/read-all` | Mark all notifications as read |
| `POST`  | `/notifications/test-push` | Dispatch test push notification |
| `GET`   | `/activities` | Audit trail of all actions and expenses |

### ⚙️ System Configuration (`/api/v1/config`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/config/currencies` | All 9 supported currencies with symbols & rates |
| `GET` | `/config/currency-by-country/:code` | Currency mapped to country code (e.g. IN, US, GB) |
| `GET` | `/config/categories` | Expense and group category metadata |
| `GET` | `/config/features` | Active provider configuration flags |

---

## 📱 Connecting SplitMate Mobile App

1. In terminal, start the backend:
   ```bash
   npm run backend
   ```
2. In the SplitMate app, navigate to **Account & Settings** &rarr; **Backend & Server API**.
3. Select your URL preset (**iOS Simulator**: `http://localhost:3000/api/v1` or **Android Emulator**: `http://10.0.2.2:3000/api/v1`).
4. Toggle from **Mock Adapter** to **Live Backend (REST)**.
5. Tap **Test Ping** &rarr; tap **Apply & Save**. All changes made in the app will now dynamically sync to your backend database!
