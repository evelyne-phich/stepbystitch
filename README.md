# 🧶 StepByStitch

> **The smart crochet pattern reader and personal library.**  
> Transform PDF patterns and screenshots into interactive checklists, track your progress round-by-round, add custom notes, and translate crochet abbreviations (US / UK / FR) on demand.

---

## ✨ Features

- **📄 Smart Pattern Import**: Upload multi-page PDFs or image screenshots (JPEG, PNG, WebP) directly to your secure private library.
- **✅ Interactive Checklists**: Break down complex patterns into clear, checkable rounds and rows with live progress tracking and celebratory confetti.
- **🌐 Specialized Crochet Translation**: Convert technical crochet terms and stitch abbreviations seamlessly between US, UK, and French (e.g., `sc`, `dc`, `inc`, `dec` ↔ `ms`, `br`, `aug`, `dim`).
- **📝 Notes & Customization**: Edit pattern instructions, fix designer typos, and add custom notes to any individual row (hook size used, tension reminders, yarn colorways).
- **🔍 Side-by-Side Original Viewer**: Keep the original pattern diagrams, schematics, and images visible alongside your interactive checklist.
- **🔒 Privacy First**: All uploads are protected with Supabase Row Level Security (RLS) policies—only you have access to your patterns.
- **🌍 Internationalization (i18n)**: Fully bilingual interface with seamless switching between English and French.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router) & [React 19](https://react.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) & [Lucide Icons](https://lucide.dev/)
- **Database & Auth & Storage**: [Supabase](https://supabase.com/) (PostgreSQL + RLS)
- **Interactive UI**: Canvas Confetti, custom i18n dictionary system

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone git@github.com:evelyne-phich/stepbystitch.git
cd stepbystitch
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy the example environment file:

```bash
cp .env.example .env.local
```

Fill in your Supabase credentials in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 4. Database Setup

Apply the SQL migrations located in `supabase/migrations/` to your Supabase SQL Editor:
1. `20260818_initial_schema.sql`: Sets up profiles, projects, steps, notes, and RLS policies.
2. `20260818_storage_rls.sql`: Sets up private storage buckets for pattern PDFs and images.

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📂 Project Structure

```text
├── app/
│   ├── (auth)/                  # Login & Signup pages + auth server actions
│   ├── (dashboard)/             # Protected dashboard & pattern library
│   ├── guide-abbreviations-crochet/ # SEO stitch abbreviations reference guide
│   ├── comment-traduire-patron-crochet/ # SEO translation tutorial guide
│   ├── globals.css              # Global styles & design system tokens
│   ├── layout.tsx               # Root layout & i18n provider
│   └── page.tsx                 # Landing page
├── components/
│   ├── landing/                 # Hero, interactive demo, crochet FAQ, etc.
│   ├── layout/                  # Navbar, footer, language switchers
│   ├── seo/                     # JSON-LD structured data (FAQ, Software, HowTo)
│   └── ui/                      # Reusable UI elements
├── lib/
│   ├── i18n/                    # Context, EN and FR dictionaries
│   ├── supabase/                # Client, Server, and Middleware Supabase clients
│   └── types/                   # Database TypeScript interfaces
├── supabase/
│   └── migrations/              # PostgreSQL schema & Storage RLS scripts
└── scripts/                     # Security verification scripts
```

---

## 📜 Available Scripts

- `npm run dev`: Starts the Next.js development server.
- `npm run build`: Creates an optimized production build.
- `npm run start`: Runs the built production server.
- `npm run lint`: Runs ESLint checks.

---

## 📄 License

Private & Proprietary. All rights reserved.
