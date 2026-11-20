# 🪐 Pluto Campus Web Dashboard

The Pluto Campus Web Dashboard is the powerful administrative, organizational, and web-access portal built to support the Pluto Campus ecosystem. It serves as the bridge between community managers, college administrators, event organizers, and the student body.

---

## 🚀 Key Features

*   **Event Management Engine:** A robust interface to create, update, manage, and publish campus-wide and inter-college events (like Hackathons, Tech Fests, and Sports Tournaments). 
*   **Community Moderation:** Powerful moderation tools to oversee the community feed, manage user reports, delete inappropriate posts, and ensure a healthy digital environment.
*   **User & Role Administration (Admin Dashboard):** View registered students, manage their verifications, and securely define role-based access for organizers and admins.
*   **Analytics Dashboard:** Visual insights and metrics tracking active users, event participation, platform revenue, and overall community engagement.
*   **Web-Based Access:** Allows users (both students and organizers) to seamlessly view profiles, manage events, and explore the community outside the mobile app environment.

---

## 🏗️ Architecture & How It Works

This repository contains the front-end code for the Pluto web platform, bootstrapped using **Vite** and **React (TypeScript)**.

**Data Flow & Backend Integration:**
1. **Supabase Integration:** The dashboard communicates directly with our centralized Supabase project using the `@supabase/supabase-js` client. It handles authentication, data fetching, and real-time updates identically to the mobile app, ensuring perfect synchronization.
2. **Role-Based Routing:** The frontend features secure routing. Upon authentication, the app checks the user's `role` (Admin, Organizer, or Student) and dynamically restricts access to sensitive routes like the Admin Dashboard or Organizer Events page.
3. **Styling & UI:** Uses vanilla/module CSS designed with premium dark-mode aesthetics, Aurora backgrounds, and glassmorphism elements to match the futuristic "Pluto" brand language.

---

## 📂 Project Structure

```text
pluto_web/src/
├── App.tsx
├── index.css
├── main.tsx
├── assets/
│   ├── hero.png
│   ├── Institutioncap.png
│   ├── Portfolioform 1.jpg
│   ├── Portfolioform 2.jpg
│   ├── Portfolioform 3.jpg
│   ├── Profilepanelbg.webp
│   ├── react.svg
│   └── vite.svg
├── components/
│   ├── auth/
│   │   ├── AuthModal.css
│   │   └── AuthModal.tsx
│   ├── event/
│   │   ├── AIPanel.css
│   │   ├── AIPanel.tsx
│   │   ├── EventCard.css
│   │   └── EventCard.tsx
│   ├── layout/
│   │   ├── AuroraBackground.css
│   │   ├── AuroraBackground.tsx
│   │   ├── CategorySidebar.css
│   │   ├── CategorySidebar.tsx
│   │   ├── Footer.css
│   │   ├── Footer.tsx
│   │   ├── Hyperspeed.tsx
│   │   ├── index.ts
│   │   ├── MobileDock.css
│   │   ├── MobileDock.tsx
│   │   ├── navbar-animation-freeze.css
│   │   ├── navbar-animation.css
│   │   ├── Navbar.css
│   │   ├── Navbar.tsx
│   │   ├── PageShell.tsx
│   │   ├── SpaceBackground.css
│   │   └── SpaceBackground.tsx
│   ├── portfolio/
│   │   └── TagsInput.tsx
│   └── ui/
│       ├── CancelRefundModal.css
│       ├── CancelRefundModal.tsx
│       ├── CursorGlow.tsx
│       ├── dropdown-menu.css
│       ├── dropdown-menu.tsx
│       ├── PageLoader.tsx
│       ├── Skeletons.css
│       ├── Skeletons.tsx
│       ├── SplitText.tsx
│       ├── TeamCard.tsx
│       └── TeamDetailModal.tsx
├── hooks/
│   ├── useAuth.ts
│   ├── useBookings.ts
│   ├── useEvents.ts
│   ├── usePortfolio.ts
│   └── useUser.ts
├── lib/
│   ├── api.ts
│   ├── banks.ts
│   ├── constants.ts
│   ├── notifications.ts
│   ├── supabase.ts
│   └── utils.ts
├── pages/
│   ├── AdminDashboard.css
│   ├── AdminDashboard.tsx
│   ├── Booking.css
│   ├── Booking.tsx
│   ├── Community.css
│   ├── Community.tsx
│   ├── CreateEvent.css
│   ├── CreateEvent.tsx
│   ├── Dashboard.css
│   ├── Dashboard.tsx
│   ├── EditEvent.tsx
│   ├── EventDetails.css
│   ├── EventDetails.tsx
│   ├── Events.css
│   ├── Events.tsx
│   ├── Explore.css
│   ├── Explore.tsx
│   ├── Landing.css
│   ├── Landing.tsx
│   ├── MyProjects.css
│   ├── MyProjects.tsx
│   ├── OrganizerBookings.css
│   ├── OrganizerBookings.tsx
│   ├── OrganizerDashboard.css
│   ├── OrganizerDashboard.tsx
│   ├── OrganizerEvents.css
│   ├── OrganizerEvents.tsx
│   ├── Payment.css
│   ├── Payment.tsx
│   ├── PlaceholderPage.tsx
│   ├── Portfolio.css
│   ├── Portfolio.tsx
│   ├── SeatEditor.tsx
│   ├── SeatSelection.tsx
│   ├── SeatStyles.css
│   ├── Settings.css
│   ├── Settings.tsx
│   ├── StudentProfile.css
│   ├── StudentProfile.tsx
│   ├── Success.css
│   ├── Success.tsx
│   ├── TeamBuilder.css
│   └── TeamBuilder.tsx
├── services/
│   ├── bookingService.ts
│   ├── eventService.ts
│   └── userService.ts
├── stores/
│   ├── authStore.ts
│   └── uiStore.ts
└── types/
    ├── booking.ts
    ├── event.ts
    ├── index.ts
    └── user.ts
```

---

## 🛠️ Environment Setup & Installation

### Prerequisites
*   Node.js (>= 18.x)
*   npm (or pnpm/yarn)

### 1. Clone & Install
```bash
# Clone the repository
git clone https://github.com/your-username/PlutoCampus.git
cd pluto_web

# Install dependencies
npm install
```

### 2. Environment Variables
Create a `.env` file at the root of `pluto_web` and populate it with your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-supabase-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Start Development Server
```bash
# Start the lightning-fast Vite dev server
npm run dev
```

### 4. Build for Production
When deploying to a hosting provider (like Vercel, Netlify, or AWS), use:
```bash
# Build the application
npm run build

# Preview the production build locally
npm run preview
```

---

## 🧐 Linting & Code Quality

This project is configured with strict type-aware ESLint rules. To run the linter and catch potential errors before pushing:

```bash
npm run lint
```
