# Nur-e-Qulb (Light of the Heart) 🌙

Welcome to **Nur-e-Qulb**, a beautiful, modern, and comprehensive Islamic companion web application. Designed with a premium interface, it helps Muslims around the world track their daily prayers, read the Quran with Tajweed, manage Wazeefahs (Dhikr), and connect with a supportive community.

![Nur-e-Qulb](/public/icons/icon-512x512.png) *(Note: Replace with actual screenshot of dashboard if available)*

---

## ✨ Features

Nur-e-Qulb is packed with features tailored to enrich your spiritual journey:

- 🕌 **Prayer Tracking & Heatmap**: Log your 5 daily prayers (Completed, Qaza, Missed, or Excused). Visualize your consistency with a beautiful GitHub-style 365-day heatmap.
- 📖 **Quran & Tajweed Engine**: Read the Holy Quran with dynamic, color-coded Tajweed rules automatically applied to the Arabic text for accurate recitation.
- 📿 **Wazeefah (Dhikr) Manager**: Create, track, and manage your daily Dhikr or special Wazeefahs with progress bars and streak counters.
- 🧭 **Qibla Compass**: A built-in Qibla direction compass using your device's location to help you pray wherever you are.
- 💬 **Community Forum**: Engage with other Muslims. Ask questions, share reflections, request support, and upvote helpful answers.
- 🩸 **Period Tracking for Women**: A specialized tracker that intelligently marks prayers as "Excused" during menstruation cycles, respecting Islamic jurisprudence.
- 🎨 **Premium UI & Themes**: Built with a gorgeous, animated user interface. Switch between Dark and Light modes, or choose premium accent colors like Gold, Rose, and Indigo.
-📱 **Progressive Web App (PWA)**: Install Nur-e-Qulb directly to your phone or desktop home screen like a native app for instant access!

---

## 👥 Usage Guide (For Non-Developers & Users)

You don't need to be a programmer to use Nur-e-Qulb! Here is how you can get started:

### 1. Access the App
Simply visit the website URL provided by the host. You can browse the Quran and Community forums as a guest, but you'll need an account to track your personal prayers.

### 2. Create an Account
Click **Sign In** and create an account using your Email and a secure password.

### 3. Install on your Phone (PWA)
For the best experience, install Nur-e-Qulb as an app!
- **On iPhone (Safari):** Tap the "Share" button at the bottom, then scroll down and tap **"Add to Home Screen"**.
- **On Android (Chrome):** Tap the three dots menu at the top right, then tap **"Install App"** or **"Add to Home screen"**.

### 4. Tracking Prayers
Navigate to the **Prayers** tab. Click on a prayer (Fajr, Dhuhr, Asr, Maghrib, Isha) to cycle its status (Pending ➡️ Completed ➡️ Qaza ➡️ Missed ➡️ Excused). Your Annual Heatmap on the dashboard will automatically update!

---

## 💻 Developer Guide (Local Setup & Deployment)

Want to contribute or run your own instance of Nur-e-Qulb? Follow these instructions to get the codebase running on your local machine.

### Tech Stack
- **Framework:** [Next.js 14/15](https://nextjs.org/) (App Router)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/) & [Shadcn UI](https://ui.shadcn.com/)
- **Database:** [MongoDB](https://www.mongodb.com/) & Mongoose
- **Authentication:** [NextAuth.js](https://next-auth.js.org/)
- **Icons & Animations:** Lucide React, Framer Motion, Anime.js

### Prerequisites
- [Node.js](https://nodejs.org/en/) (v18 or higher)
- A [MongoDB URI](https://www.mongodb.com/cloud/atlas/register) (Local or MongoDB Atlas)
- Git

### 1. Clone the Repository
```bash
git clone https://github.com/hadeedhussainmemon/nur-e-qulb.git
cd nur-e-qulb
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables
Create a `.env.local` file in the root directory and add the following variables:

```env
# MongoDB Connection String
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/nurequlb?retryWrites=true&w=majority

# NextAuth Secret (Generate one using: openssl rand -base64 32)
NEXTAUTH_SECRET=your_super_secret_string

# Base URL (Use localhost for development)
NEXTAUTH_URL=http://localhost:3000
```

### 4. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to see the app running locally! The page auto-updates as you edit the files.

### 5. Production Build & Deployment
To test the production build locally:
```bash
npm run build
npm run start
```

**Deploying to Vercel (Recommended):**
The easiest way to deploy Nur-e-Qulb is to link your GitHub repository to [Vercel](https://vercel.com/). 
1. Create a new project on Vercel and import your repository.
2. In the Vercel dashboard, go to the Environment Variables settings and add `MONGODB_URI` and `NEXTAUTH_SECRET`.
3. Click **Deploy**. Vercel will automatically build and host your application!

---

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/hadeedhussainmemon/nur-e-qulb/issues).

## 📜 License
This project is open-source and available under the [MIT License](LICENSE).
