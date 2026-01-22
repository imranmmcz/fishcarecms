# FishCare Pro - Hostinger Backend API

Express.js Backend API for FishCare Pro application with MySQL database support for Hostinger hosting.

## 📋 Requirements

- Node.js v18+ 
- MySQL 5.7+ or 8.0
- npm or yarn

## 🚀 Installation Steps

### 1. Upload Files to Hostinger

Upload all files from this `hostinger-backend` folder to your Hostinger hosting via:
- File Manager
- FTP (FileZilla)
- Git

### 2. Create MySQL Database

1. Log in to Hostinger hPanel
2. Go to **Databases** → **MySQL Databases**
3. Create a new database
4. Note down:
   - Database Host (e.g., `mysql.hostinger.com`)
   - Database Name
   - Database Username  
   - Database Password

### 3. Import Database Schema

1. Go to **phpMyAdmin** in hPanel
2. Select your database
3. Click **Import**
4. Upload `database/schema.sql`
5. Click **Go**

### 4. Configure Environment

1. Rename `.env.example` to `.env`
2. Update with your credentials:

```env
DB_HOST=your-mysql-host.hostinger.com
DB_PORT=3306
DB_NAME=your_database_name
DB_USER=your_database_user
DB_PASSWORD=your_database_password

JWT_SECRET=generate-a-strong-secret-key-here
JWT_EXPIRES_IN=7d

PORT=3000
NODE_ENV=production

FRONTEND_URL=https://your-frontend-domain.com
```

### 5. Install Dependencies

```bash
npm install
```

### 6. Start Server

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

## 📚 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register new user |
| POST | `/api/auth/signin` | Login user |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/password` | Update password |
| POST | `/api/auth/signout` | Logout user |

### Users (Admin)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | Get all users |
| GET | `/api/users/:id` | Get user by ID |
| PUT | `/api/users/:id` | Update user |
| PATCH | `/api/users/:id/role` | Update user role |
| DELETE | `/api/users/:id` | Delete user |

### Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | Get all products |
| GET | `/api/products/:id` | Get product by ID |
| POST | `/api/products` | Create product (Admin) |
| PUT | `/api/products/:id` | Update product (Admin) |
| DELETE | `/api/products/:id` | Delete product (Admin) |

### Market Prices
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/market-prices` | Get all prices |
| GET | `/api/market-prices/:id` | Get price by ID |
| POST | `/api/market-prices` | Create price (Admin) |
| PUT | `/api/market-prices/:id` | Update price (Admin) |
| DELETE | `/api/market-prices/:id` | Delete price (Admin) |

### Settings
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/settings` | Get all settings |
| PUT | `/api/settings/:key` | Update setting (Admin) |
| GET | `/api/ad-settings` | Get ad settings |
| PUT | `/api/ad-settings` | Update ad settings (Admin) |

### Page Content
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/page-content` | Get all content |
| GET | `/api/page-content/section/:key` | Get by section key |
| POST | `/api/page-content` | Create content (Admin) |
| PUT | `/api/page-content/:id` | Update content (Admin) |
| DELETE | `/api/page-content/:id` | Delete content (Admin) |

## 🔐 Authentication

All protected endpoints require Bearer token in Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## 📱 Frontend Integration

Update your frontend to use this API:

```javascript
// src/lib/api-client.ts
const API_URL = 'https://your-hostinger-domain.com/api';

export const apiClient = {
  async get(endpoint) {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}${endpoint}`, {
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json'
      }
    });
    return res.json();
  },
  
  async post(endpoint, data) {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    return res.json();
  }
};
```

## 🔧 Default Admin Account

- **Email:** admin@fishcare.com
- **Password:** admin123

⚠️ **Important:** Change this password immediately after first login!

## 📂 File Structure

```
hostinger-backend/
├── config/
│   └── database.js      # MySQL connection
├── middleware/
│   └── auth.js          # JWT authentication
├── routes/
│   ├── auth.js          # Auth endpoints
│   ├── users.js         # User management
│   ├── products.js      # Products CRUD
│   ├── marketPrices.js  # Market prices
│   ├── settings.js      # System settings
│   ├── adSettings.js    # Ad settings
│   └── pageContent.js   # Page content
├── database/
│   └── schema.sql       # Database schema
├── uploads/             # File uploads
├── .env.example         # Environment template
├── package.json         # Dependencies
├── server.js            # Main server
└── README.md            # This file
```

## 🛡️ Security Features

- Password hashing with bcrypt (12 rounds)
- JWT token authentication
- Rate limiting (100 requests/15 min)
- Helmet security headers
- CORS protection
- Input validation

## 🐛 Troubleshooting

**Database Connection Error:**
- Verify DB credentials in `.env`
- Check if MySQL server is running
- Ensure database exists

**JWT Token Invalid:**
- Check JWT_SECRET matches
- Token may be expired

**CORS Error:**
- Update FRONTEND_URL in `.env`
- Verify allowed origins

## 📞 Support

For issues, check:
- Hostinger Knowledge Base
- Node.js documentation
- MySQL documentation
