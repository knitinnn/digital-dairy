# 📖 Digital Diary

> 🌐 **Live Application:** [https://knitinnn.github.io/digital-dairy/](https://knitinnn.github.io/digital-dairy/)

![Digital Diary Banner](logo.png)

A personal journaling web application designed for capturing thoughts, tracking moods, managing reminders, remembering important milestones, and protecting private notes. Built with pure **HTML5**, **CSS3**, and **Vanilla JavaScript** — fast, responsive, and private with 100% client-side storage.

---

## 🌟 Key Features

### 1. 🔐 User Authentication & Account Recovery
- **Username & Password Authentication:** Quick and secure registration with unique Username, Full Name, and Password.
- **Account Recovery:** Multi-step wizard with personalized security questions and answers to reset forgotten passwords without external servers.
- **Session Management:** Auto-session verification and secure logout with instant state synchronization.

### 2. 📝 Personal Diary & Journaling
- **Rich Editor:** Compose daily diary entries with inline formatting tools (Bold, Italic, Bullet Lists, Horizontal Dividers, Date insertion).
- **Mood Tagging:** Attach one of 6 distinct moods (Happy, Excited, Calm, Productive, Tired, Sad) to any entry.
- **Tag Management:** Add interactive tag chips for quick categorization (e.g., `#gratitude`, `#travel`, `#goals`).
- **Autosave Protection:** Automatic draft saving prevents accidental loss of thoughts.
- **Character & Length Counters:** Real-time character counter with gentle warning indicators.
- **Grid & List Views:** Toggle between card grid and detailed list perspectives.

### 3. 🔐 PIN-Protected Private Vault
- **4-Digit PIN Security:** Keep confidential notes and private secrets locked away from casual viewers.
- **Session-Only Access:** Automatically locks on session restart or manual lock button.
- **PIN Customization:** Built-in PIN change and confirmation workflow.

### 4. 📅 Interactive Calendar & Day Inspector
- **Monthly Overview:** Color-coded status dots displaying diary entries, important dates, and pending reminders on each day.
- **Selected Day Panel:** Click any date to view all associated entries, events, and reminders in one place.
- **Mini Calendar Widget:** Compact widget embedded right on the dashboard for quick navigation.

### 5. ⏰ Smart Reminders & Tasks
- **Task Organization:** Track pending vs. completed tasks with priority levels (High, Medium, Low).
- **Overdue Detection:** Visual alerts for overdue deadlines.
- **In-App Reminder Popups:** Browser-style toast notifications for due tasks.

### 6. 🎂 Important Dates & Milestones
- **Event Tracking:** Track Birthdays, Anniversaries, Achievements, and Custom annual events.
- **Dynamic Countdowns:** Real-time countdown tags (*"Tomorrow"*, *"In 5 days"*, *"Today! 🎉"*).
- **Year Milestones:** Automatically computes elapsed years and milestone anniversaries.

### 7. 😊 Mood Tracker & Emotional Analytics
- **One-Tap Mood Logging:** Quick-log daily feelings directly from the dashboard or dedicated mood tracker page.
- **Monthly Distribution Chart:** Interactive bar chart visualizing emotional trends over the current month.
- **All-Time Analytics & History:** Detailed log history and most common mood insights.

### 8. 🔍 Instant Full-Text Search
- **Multi-Field Filtering:** Search across entry titles, full content, and tags simultaneously.
- **Date Filter:** Target specific calendar dates.
- **Live Search Highlighting:** Matching terms are highlighted in real-time.

### 9. 🎨 Themes & Customization
- **Light & Dark Themes:** Curated, soothing warm aesthetic with a high-contrast dark mode.
- **Custom Display Name:** Personalize how the dashboard and sidebar greet you.
- **Glassmorphism & Micro-animations:** Fluid transitions, card hover effects, and spring animations.

### 10. 📦 100% Privacy & Data Portability
- **Zero Server Storage:** All entries, notes, and credentials stay exclusively inside your browser's `localStorage`.
- **JSON Backup & Restore:** Export your complete journal archive as a JSON file and restore it anytime.
- **Danger Zone:** One-click data wipe option with safety confirmation.

### 11. 📱 Fully Responsive Mobile Experience
- **Touch-Optimized:** Mobile drawer navigation with swipe gestures, touch-friendly buttons, and responsive layouts for smartphones, tablets, and desktops.

---

## 🛠️ Technology Stack

- **Markup:** HTML5 (Semantic elements, Accessibility roles, SEO meta tags)
- **Styling:** Vanilla CSS3 (Custom CSS design tokens, Glassmorphism, Flexbox, CSS Grid, Responsive Media Queries)
- **Scripting:** Pure JavaScript ES6+ (Modular architecture, LocalStorage API, DOM Mutation Observers)
- **External Dependencies:** **None** (Zero third-party frameworks or external backend dependencies)

---

## 📂 Project Structure

```text
digital-dairy/
├── logo.png               # Project logo & favicon emblem
├── index.html             # Root redirect to html/index.html (GitHub Pages compatible)
├── README.md              # Project documentation
│
├── html/                  # All application HTML pages
│   ├── index.html         # Login page
│   ├── signup.html        # Registration page
│   ├── forgot-password.html # Account recovery page
│   ├── dashboard.html     # Main dashboard overview
│   ├── diary.html         # Journal entries & writing studio
│   ├── calendar.html      # Interactive monthly calendar
│   ├── reminders.html     # Reminders & task manager
│   ├── important-dates.html # Anniversaries & milestone tracker
│   ├── mood-tracker.html  # Mood logging & analytics
│   ├── vault.html         # PIN-locked private vault
│   ├── search.html        # Full-text diary search
│   └── settings.html      # Appearance, profile & data management
│
├── css/                   # Stylesheets & themes
│   ├── style.css          # Design system, layout, sidebar & common utilities
│   ├── auth.css           # Authentication pages styling
│   ├── dashboard.css      # Dashboard grid, statistics & widgets
│   ├── diary.css          # Journal cards, editor modal & toolbar
│   └── calendar.css       # Calendar grid, dates, reminders & vault styles
│
└── js/                    # Client-side JavaScript modules
    ├── app.js             # Core storage engine, sidebar, themes & reminders
    ├── auth.js            # Authentication logic & session storage
    ├── login.js           # Login controller & validation
    ├── signup.js          # Signup controller & credential validation
    ├── forgot-password.js # Password reset wizard
    ├── diary.js           # Diary CRUD, draft autosave & tag management
    ├── calendar.js        # Calendar rendering & day panel
    ├── reminders.js       # Reminders CRUD & filtering
    ├── vault.js           # Private vault PIN security & notes
    └── settings.js        # Profile, theme & JSON import/export
```

---


## 👨‍💻 Developed By

**Nitin Kumar**  
- Portfolio: [https://knitinnn.github.io/portfolio/](https://knitinnn.github.io/portfolio/)  
- GitHub: [@knitinnn](https://github.com/knitinnn)

---

## 📄 License

This project is licensed under the MIT License — feel free to use and customize it for your personal journal journey!
