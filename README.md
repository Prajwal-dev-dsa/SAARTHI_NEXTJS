# 🚖 **Saarthi V1**

![Project Status](https://img.shields.io/badge/status-completed-success?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![MIT License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge&logo=opensourceinitiative&logoColor=white)

**Saarthi** is a production-grade, full-stack vehicle booking platform built from scratch to simulate a real-world ride-hailing ecosystem — inspired by industry leaders like Ola, Uber, and Rapido.

The platform features three distinct roles — **User**, **Partner (Driver)**, and **Admin** — each with dedicated interfaces, workflows, and real-time capabilities powered by **Socket.IO**. From a strict 7-step Partner onboarding process with live Video KYC, to OTP-verified ride milestones, AI-powered chat suggestions, live map tracking, and Razorpay payment integration — Saarthi handles the complete ride lifecycle from booking to earning, end to end.

[![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen?style=for-the-badge&logo=vercel)](https://saarthi-nextjs.vercel.app/)
[![GitHub](https://img.shields.io/badge/GitHub-Saarthi-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/Prajwal-dev-dsa/Saarthi)

---

## 🌟 Key Features

### 👤 User Experience
* **Dual Authentication**: Sign in via Google OAuth or register manually with Email OTP verification powered by **Nodemailer**.
* **Theme Flexibility**: Full Dark / Light mode toggle for a personalized experience.
* **Smart Booking**: Auto-fetch your current location as the pickup point via **OpenStreetMap & Geoapify**, then manually enter the drop address.
* **Real-Time Partner Discovery**: View available partners within a live **10 km radius** — only online partners are shown.
* **Flexible Payments**: Pay via Cash after the ride or online instantly via **Razorpay** before it starts.
* **Live Map Tracking**: Follow your partner's real-time movement on an interactive map powered by **React-Leaflet**.
* **AI-Powered Chat**: WhatsApp-style real-time messaging with **Google Gemini AI** smart reply suggestions — all over **Socket.IO**.
* **OTP-Verified Ride Milestones**: Pickup OTP and Drop OTP sent to user's email to verify actual arrival and successful completion.

### 🚗 Partner (Driver) Portal
* **7-Step Onboarding**: A rigorous, admin-supervised registration process before a partner can accept any rides:
  * Step 1 — Unique vehicle details (type, number, model)
  * Step 2 — Document upload: Aadhaar, Driving Licence & RC (via **Cloudinary**)
  * Step 3 — Bank account & optional UPI setup for earnings
  * Step 4 — Admin reviews all submitted details in real time (**Socket.IO**)
  * Step 5 — Live **Video KYC** call with Admin (**ZegoCloud / WebRTC**)
  * Step 6 — 4-angle vehicle images with number plate matching + competitive pricing setup
  * Step 7 — Final approval → officially onboarded as a verified Partner ✅
* **Ride Management**: Accept or reject ride requests in real time via Socket.IO.
* **OTP Confirmation**: Enter Pickup & Drop OTPs to confirm each ride milestone.
* **Earnings Dashboard**: Personal dashboard with a **Daily Earnings Chart** powered by **Recharts**.

### 🛡️ Admin Panel
* **Platform Dashboard**: Centralized analytics and platform metrics visualized with **Recharts**.
* **Strict Partner Vetting**: Review, approve, or reject each of the 7 onboarding steps — a valid reason is mandatory on every rejection.
* **Live Video KYC**: Conduct real-time video verification calls with applicants via **ZegoCloud**.
* **Real-Time Operations**: All admin-to-partner interactions are instant, powered by **Socket.IO**.
* **Revenue Share**: Admin automatically receives **20% commission** on every completed ride.

---

## 🛠️ Tech Stack

| Area | Technologies |
| :--- | :--- |
| **Frontend** | ![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white) ![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white) ![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white) ![Redux](https://img.shields.io/badge/Redux-593D88?style=for-the-badge&logo=redux&logoColor=white) ![Framer Motion](https://img.shields.io/badge/Framer_Motion-0055FF?style=for-the-badge&logo=framer&logoColor=white) |
| **Backend & Database** | ![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white) ![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white) ![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white) ![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white) |
| **Real-Time & Video** | ![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socket.io&logoColor=white) ![ZegoCloud](https://img.shields.io/badge/ZegoCloud_WebRTC-0066FF?style=for-the-badge) |
| **Maps & Location** | ![Leaflet](https://img.shields.io/badge/React_Leaflet-199900?style=for-the-badge&logo=Leaflet&logoColor=white) ![OpenStreetMap](https://img.shields.io/badge/OpenStreetMap-7EBC6F?style=for-the-badge&logo=openstreetmap&logoColor=white) |
| **Auth & Security** | ![NextAuth](https://img.shields.io/badge/NextAuth.js-000000?style=for-the-badge&logo=next.js&logoColor=white) |
| **Tools & Services** | ![Razorpay](https://img.shields.io/badge/Razorpay-02042B?style=for-the-badge&logo=razorpay&logoColor=white) ![Cloudinary](https://img.shields.io/badge/Cloudinary-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white) ![Google Gemini](https://img.shields.io/badge/Google_Gemini-8E75B2?style=for-the-badge&logo=google&logoColor=white) |

---

## 📁 Project Structure

```
Saarthi/
├── my-app/                              # Next.js Frontend + API Routes
│   ├── prisma/
│   │   ├── migrations/                  # Database migration history
│   │   └── schema.prisma                # Prisma schema definition
│   ├── public/                          # Static assets
│   └── src/
│       ├── app/
│       │   ├── admin/                   # Admin pages & routes
│       │   ├── api/                     # Next.js API route handlers
│       │   ├── partner/                 # Partner pages & routes
│       │   ├── user/                    # User pages & routes
│       │   ├── video-kyc/               # ZegoCloud Video KYC page
│       │   ├── globals.css
│       │   ├── layout.tsx
│       │   └── page.tsx
│       ├── components/
│       │   ├── dashboards/
│       │   │   ├── AdminDashboard.tsx
│       │   │   ├── PartnerDashboard.tsx
│       │   │   └── UserDashboard.tsx
│       │   ├── ActiveRideMap.tsx        # Live ride tracking map
│       │   ├── AuthModal.tsx            # Login / Register modal
│       │   ├── EarningsChart.tsx        # Daily earnings chart
│       │   ├── Footer.tsx
│       │   ├── Hero.tsx
│       │   ├── MapComponent.tsx         # Pickup-drop route map
│       │   ├── Navbar.tsx
│       │   ├── Providers.tsx
│       │   ├── ReduxProvider.tsx
│       │   ├── RideChat.tsx             # Real-time chat with AI suggestions
│       │   └── VehicleSlider.tsx        # Vehicle category slider
│       ├── context/
│       │   └── AlertContext.tsx
│       ├── generated/prisma/            # Auto-generated Prisma client (do not edit)
│       ├── hooks/
│       │   └── GeoLocationUpdater.tsx   # Real-time partner location updater
│       ├── lib/
│       │   ├── cloudinary.ts
│       │   ├── mail.ts
│       │   ├── prisma.ts
│       │   ├── razorpay.ts
│       │   └── rideStatuses.ts
│       ├── store/
│       │   ├── authSlice.ts
│       │   ├── index.ts
│       │   └── themeSlice.ts
│       ├── auth.ts                      # NextAuth configuration
│       └── proxy.ts
│
├── socket-server/                       # Standalone Socket.IO Server (Node.js + TypeScript)
│   └── src/
│       ├── lib/
│       │   └── prisma.ts
│       └── index.ts                     # Main server entry point
│
└── screenshots/                         # Project screenshots
    ├── admin/
    ├── partner/
    └── user/
```

---

## 📸 Screenshots

A comprehensive look at the Saarthi application workflow.

### 👤 User Interface

| Dashboard | All Roles View |
| :---: | :---: |
| <img src="screenshots/user/dashboard.png" width="400" /> | <img src="screenshots/user/dashboard-for-all.png" width="400" /> |

| Register Form | Vehicle Categories |
| :---: | :---: |
| <img src="screenshots/user/register-form.png" width="400" /> | <img src="screenshots/user/vehicle-categories-slider.png" width="400" /> |

| Book Vehicle | Search Vehicle & Route |
| :---: | :---: |
| <img src="screenshots/user/book-vehicle.png" width="400" /> | <img src="screenshots/user/search-vehicle.png" width="400" /> |

| Checkout | Razorpay Payment |
| :---: | :---: |
| <img src="screenshots/user/checkout.png" width="400" /> | <img src="screenshots/user/razorpay-payment.png" width="400" /> |

| Active Ride (Live Tracking) | Footer |
| :---: | :---: |
| <img src="screenshots/user/active-ride.png" width="400" /> | <img src="screenshots/user/footer.png" width="400" /> |

### 🚗 Partner Interface

| Dashboard | Vehicle Details (Step 1) |
| :---: | :---: |
| <img src="screenshots/partner/dashboard.png" width="400" /> | <img src="screenshots/partner/vehicle-details.png" width="400" /> |

| Upload Documents (Step 2) | Bank & Payout Setup (Step 3) |
| :---: | :---: |
| <img src="screenshots/partner/upload-documents.png" width="400" /> | <img src="screenshots/partner/bank-payout-setup.png" width="400" /> |

| Pricing & Vehicle Images (Step 6) | Live Video KYC (Step 5) |
| :---: | :---: |
| <img src="screenshots/partner/pricing-vehicle.png" width="400" /> | <img src="screenshots/partner/video-kyc.png" width="400" /> |

| Ride Requests | Active Ride |
| :---: | :---: |
| <img src="screenshots/partner/ride-requests.png" width="400" /> | <img src="screenshots/partner/active-ride.png" width="400" /> |

| Bookings History | Ride Completed | Ride Cancelled |
| :---: | :---: | :---: |
| <img src="screenshots/partner/bookings.png" width="250" /> | <img src="screenshots/partner/ride-completed.png" width="250" /> | <img src="screenshots/partner/ride-cancelled.png" width="250" /> |

### 🛡️ Admin Interface

| Dashboard & Analytics |
| :---: |
| <img src="screenshots/admin/dashboard.png" width="600" /> |

---

## ⚙️ Environment Variables

To run this project locally, you must configure environment variables for both the Next.js app and the Socket.IO server.

> **⚠️ Security Warning:** Never commit your actual API keys or secrets to GitHub. Both directories have `.gitignore` files that already exclude `.env`.

### 1. Next.js App (`my-app/.env`)

```env
# ── Database (Supabase + Prisma) ──────────────────────────────────
DATABASE_URL="your_supabase_pooling_connection_url"
DIRECT_URL="your_supabase_direct_connection_url"

# ── NextAuth ──────────────────────────────────────────────────────
AUTH_SECRET="your_nextauth_secret"
AUTH_GOOGLE_ID="your_google_oauth_client_id"
AUTH_GOOGLE_SECRET="your_google_oauth_client_secret"

# ── Email — Nodemailer (Gmail App Password) ───────────────────────
EMAIL_USER="your_gmail_address"
EMAIL_PASS="your_16_char_gmail_app_password"

# ── Cloudinary ────────────────────────────────────────────────────
CLOUDINARY_CLOUD_NAME="your_cloudinary_cloud_name"
CLOUDINARY_API_KEY="your_cloudinary_api_key"
CLOUDINARY_API_SECRET="your_cloudinary_api_secret"

# ── ZegoCloud — Video KYC ─────────────────────────────────────────
NEXT_PUBLIC_ZEGO_APP_ID="your_zego_app_id"
NEXT_PUBLIC_ZEGO_SERVER_SECRET="your_zego_server_secret"

# ── Socket.IO Server ──────────────────────────────────────────────
NEXT_PUBLIC_SOCKET_SERVER_URL="http://localhost:8000"

# ── Maps — Geoapify + OpenStreetMap ──────────────────────────────
NEXT_PUBLIC_GEOAPIFY_API_KEY="your_geoapify_api_key"

# ── Razorpay — Payments ───────────────────────────────────────────
RAZORPAY_KEY_ID="your_razorpay_key_id"
RAZORPAY_KEY_SECRET="your_razorpay_key_secret"
NEXT_PUBLIC_RAZORPAY_KEY_ID="your_razorpay_key_id"

# ── Google Gemini — AI Chat Suggestions ──────────────────────────
GEMINI_API_KEY="your_gemini_api_key"
```

### 2. Socket.IO Server (`socket-server/.env`)

```env
# ── Database (Supabase) ───────────────────────────────────────────
DATABASE_URL="your_supabase_pooling_connection_url"
DIRECT_URL="your_supabase_direct_connection_url"

# ── Next.js App Origin ────────────────────────────────────────────
NEXT_BASE_URL="http://localhost:3000"

# ── Server Port ───────────────────────────────────────────────────
PORT=8000
```

---

## 🚀 Getting Started

Follow these steps to get Saarthi running on your local machine.

### Prerequisites

* **Node.js** (v18 or above)
* A **Supabase** account — for your PostgreSQL database
* Accounts for **Razorpay**, **Cloudinary**, **ZegoCloud**, **Geoapify**, and **Google Cloud Console** (for OAuth & Gemini)

### Installation & Setup

1. **Clone the Repository**
   ```bash
   git clone https://github.com/Prajwal-dev-dsa/Saarthi.git
   cd Saarthi
   ```

2. **Install Dependencies for Both Servers**
   ```bash
   # Next.js app
   cd my-app
   npm install

   # Socket.IO server
   cd ../socket-server
   npm install
   ```

3. **Configure Environment Variables**

   Create a `.env` file inside both `my-app/` and `socket-server/` using the variable references in the [Environment Variables](#️-environment-variables) section above.

4. **Set Up the Database (Supabase + Prisma)**

   * Create a project on [Supabase](https://supabase.com/)
   * In your project dashboard, click **Connect** → select the **ORM** tab → choose **Prisma**
   * Supabase will display your exact `DATABASE_URL` (pooling / transaction) and `DIRECT_URL` — copy both and paste them into `.env` files for both `my-app` and `socket-server`
   * Then generate the Prisma client:

   ```bash
   cd my-app
   npx prisma generate
   ```

   > All migration files are already included in the repository. Running `prisma generate` is all you need — the schema is applied automatically via existing migrations.

5. **Run Both Servers**

   **Terminal 1 — Socket.IO Server:**
   ```bash
   cd socket-server
   npm run dev
   # Runs on http://localhost:8000
   ```

   **Terminal 2 — Next.js App:**
   ```bash
   cd my-app
   npm run dev
   # Runs on http://localhost:3000
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser and you're good to go! 🚀

---

## 🤝 Contributing

Contributions are welcome! If you'd like to improve the project or add new features, follow these steps:

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📬 Contact

**Prajwal**

[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/prajwal-dwivedi-799838370/)
[![Gmail](https://img.shields.io/badge/Gmail-Mail_Me-EA4335?style=for-the-badge&logo=gmail&logoColor=white)](mailto:prajwal77dwivedi@gmail.com)

**GitHub Repository:** https://github.com/Prajwal-dev-dsa/Saarthi

**Live Application:** https://saarthi-nextjs.vercel.app/
