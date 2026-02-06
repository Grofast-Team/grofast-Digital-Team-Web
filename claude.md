# GROFAST TEAM MANAGEMENT SYSTEM — MASTER BLUEPRINT

---

## 0. RESEARCH-FIRST APPROACH

**IMPORTANT: Before building any feature, Claude MUST research first.**

### Research Protocol

1. **Study Existing Platforms** — Before implementing, research these team management tools:
   - Microsoft Teams (UI/UX, chat, meetings, channels)
   - Slack (messaging, integrations, notifications)
   - Asana (task management, project tracking)
   - Monday.com (dashboard, reports, workflows)
   - ClickUp (productivity features, time tracking)
   - Notion (knowledge base, documentation)
   - Basecamp (team collaboration, scheduling)
   - Zoho People (HR, attendance, employee management)

2. **Analyze Best Practices** — For each feature, research:
   - How top platforms implement it
   - Modern UI/UX patterns
   - User experience best practices
   - Accessibility standards
   - Performance optimizations

3. **Document Findings** — Before coding:
   - Note which patterns work best
   - Identify features users love
   - Avoid common pitfalls
   - Adapt best ideas for GROFAST

### Research Areas by Feature

| Feature | Research Focus |
|---------|----------------|
| Dashboard | KPI cards, data visualization, quick actions |
| Attendance | Biometric alternatives, geolocation, selfie verification |
| Work Updates | Time tracking UX, hourly logging patterns |
| Learning | LMS platforms, progress tracking, certifications |
| Chat | Real-time messaging, threads, reactions, file sharing |
| Meetings | Calendar integration, video conferencing, scheduling |
| Reports | Data export, charts, filtering, date ranges |

### Web Search Requirements

Before implementing each major feature:
1. Use WebSearch to find current best practices (2024-2026)
2. Review at least 3-5 competitor implementations
3. Check for latest UI/UX trends in SaaS dashboards
4. Look for open-source implementations for reference

### Goal

Create a **best-in-class, fully functional** team management system by learning from industry leaders and avoiding their mistakes.

---

## 1. PURPOSE OF THIS SYSTEM

This is NOT a normal website.

It is a **private internal SaaS-style software** for:
- Tracking employee work & learning
- Managing attendance & productivity
- Providing chat, meetings, and reports
- Giving CEO/Admin full visibility
- Running your digital marketing agency operations

**Company:** Grofast Digital Marketing Agency

---

## 2. CORE ARCHITECTURE

```
Frontend UI  →  Supabase Backend  →  n8n Automation  →  Google Sheets Backup
```

### Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Vite/React with Tailwind CSS, Microsoft-Teams-style layout |
| **Backend** | Supabase (Postgres DB, Auth, Storage, Realtime) |
| **Automation** | n8n (Welcome emails, Google Sheets backup, Notifications) |
| **Hosting** | GitHub → Vercel (recommended) OR GitHub Pages |

---

## 3. USER ROLES

### Admin (CEO / Founder)
Full control:
- View all employees
- Reports (today / 7 days / monthly)
- Attendance analytics
- Work & learning analytics
- Activate / deactivate employees
- Project & task overview

### Employee
Limited to:
- Mark attendance
- Hourly work update
- Hourly learning update
- View tasks
- Chat with team
- Join meetings
- View calendar

---

## 4. MAIN FEATURES

### 4.1 Dashboard
Shows summary only:
- Today work hours
- Today learning hours
- Attendance status
- Active tasks
- Quick stats

> **Note:** No forms here — display only.

### 4.2 Activity
Timeline of:
- Work updates
- Learning updates
- Attendance
- Task changes

### 4.3 Work Update (HOURLY)
Employee must log:
- Hour slot
- Work description
- Optional file/image

**Stored in:** `work_updates` table

### 4.4 Learning Update (HOURLY)
Employee logs:
- Topic learned
- Notes
- Hour

**Stored in:** `learning_updates` table

### 4.5 Attendance
Check-in / Check-out with:
- Time
- Optional selfie image

**Stored in:** `attendance` table + storage bucket

### 4.6 Chat (Microsoft Teams style)
Must support:
- 1-to-1 chat
- Department channels
- File attachments
- Message history
- Online status

**Tables:** `messages`, `channels`

### 4.7 Meetings
Features:
- Create meeting
- Auto Google Meet link
- Calendar entry

**Table:** `meetings`

### 4.8 Calendar
Shows:
- Meetings
- Tasks
- Attendance
- Deadlines

### 4.9 Reports (Admin Only)
Filters:
- Today
- Last 7 days
- Monthly

Download formats:
- CSV
- PDF

Includes:
- Work hours
- Learning hours
- Attendance
- Productivity

---

## 5. DATABASE SCHEMA (SUPABASE)

### employees
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| name | text | Employee name |
| email | text | Email address |
| role | text | 'admin' or 'employee' |
| department | text | Department name |
| status | text | 'active' or 'inactive' |
| created_at | timestamp | Creation date |

### attendance
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| employee_id | uuid | FK to employees |
| check_in | timestamp | Check-in time |
| check_out | timestamp | Check-out time |
| image_url | text | Selfie storage URL |
| date | date | Attendance date |

### work_updates
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| employee_id | uuid | FK to employees |
| hour | text | Hour slot (e.g., "9:00-10:00") |
| description | text | Work description |
| file_url | text | Optional attachment |
| created_at | timestamp | Creation date |

### learning_updates
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| employee_id | uuid | FK to employees |
| hour | text | Hour slot |
| topic | text | Topic learned |
| notes | text | Learning notes |
| created_at | timestamp | Creation date |

### channels
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| name | text | Channel name |
| type | text | 'department' or 'direct' |
| created_at | timestamp | Creation date |

### messages
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| sender_id | uuid | FK to employees |
| channel_id | uuid | FK to channels |
| content | text | Message content |
| file_url | text | Optional attachment |
| created_at | timestamp | Creation date |

### meetings
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| title | text | Meeting title |
| meet_link | text | Google Meet URL |
| datetime | timestamp | Meeting date/time |
| created_by | uuid | FK to employees |
| attendees | uuid[] | Array of employee IDs |

### tasks
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| title | text | Task title |
| description | text | Task details |
| assigned_to | uuid | FK to employees |
| status | text | 'pending', 'in_progress', 'completed' |
| due_date | date | Deadline |
| created_at | timestamp | Creation date |

---

## 6. AUTOMATION FLOWS (n8n)

### Flow 1: Employee Creation
```
Admin creates employee
→ Supabase insert trigger
→ n8n webhook
→ Send welcome email
→ Save to Google Sheet
```

### Flow 2: Daily Logs Backup
```
Work / Learning / Attendance updates
→ n8n webhook trigger
→ Append to Google Sheets
```

### Flow 3: Notification System
```
New task assigned / Meeting created
→ n8n webhook
→ Send email notification
→ (Optional) Push notification
```

---

## 7. UI/UX DESIGN SYSTEM

### Style
- AI SaaS aesthetic
- Dark navy background (#0f172a)
- Indigo → blue gradients
- Glassmorphism cards
- Microsoft Teams sidebar layout

### Feature Accent Colors
| Feature | Color | Hex |
|---------|-------|-----|
| Dashboard | Indigo | #6366f1 |
| Activity | Cyan | #06b6d4 |
| Work | Blue | #3b82f6 |
| Learning | Purple | #a855f7 |
| Chat | Sky | #0ea5e9 |
| Calendar | Teal | #14b8a6 |
| Meetings | Green | #22c55e |
| Reports | Orange | #f97316 |

### Layout Structure
```
┌─────────────────────────────────────────────────────┐
│  Logo  │           Top Navigation Bar              │
├────────┼────────────────────────────────────────────┤
│        │                                            │
│  Side  │           Main Content Area               │
│  bar   │                                            │
│        │                                            │
│  Nav   │                                            │
│        │                                            │
└────────┴────────────────────────────────────────────┘
```

---

## 8. DEPLOYMENT STRATEGY

### Recommended: Vercel
- Auto builds Vite
- Zero config
- Fast & stable
- Environment variables support

### Alternative: GitHub Pages
Requires:
- `npm run build`
- Deploy `/dist` folder
- Correct `vite.config.js` base path

---

## 9. DEVELOPMENT ROADMAP

### Phase 1 — Core System
- [ ] Set up Supabase project
- [ ] Create database schema
- [ ] Implement authentication (Supabase Auth)
- [ ] Build work updates feature
- [ ] Build learning updates feature
- [ ] Build attendance feature

### Phase 2 — Productivity
- [ ] Admin reports dashboard
- [ ] Analytics with charts
- [ ] File uploads to Supabase Storage
- [ ] CSV/PDF export

### Phase 3 — Collaboration
- [ ] Real-time chat with Supabase Realtime
- [ ] Meeting creation with Google Meet integration
- [ ] Calendar view

### Phase 4 — Automation
- [ ] Set up n8n instance
- [ ] Welcome email flow
- [ ] Google Sheets backup flow
- [ ] Notification system

---

## 10. ENVIRONMENT VARIABLES

```env
# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# n8n Webhooks
VITE_N8N_WEBHOOK_EMPLOYEE=your_n8n_webhook_url
VITE_N8N_WEBHOOK_BACKUP=your_n8n_backup_webhook_url
```

---

## 11. FILE STRUCTURE

```
grofast-team-management/
├── public/
│   └── favicon.ico
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.jsx
│   │   │   ├── Topbar.jsx
│   │   │   └── Layout.jsx
│   │   ├── dashboard/
│   │   ├── attendance/
│   │   ├── work/
│   │   ├── learning/
│   │   ├── chat/
│   │   ├── meetings/
│   │   ├── calendar/
│   │   └── reports/
│   ├── pages/
│   │   ├── Dashboard.jsx
│   │   ├── Activity.jsx
│   │   ├── WorkUpdate.jsx
│   │   ├── LearningUpdate.jsx
│   │   ├── Attendance.jsx
│   │   ├── Chat.jsx
│   │   ├── Meetings.jsx
│   │   ├── Calendar.jsx
│   │   └── Reports.jsx
│   ├── lib/
│   │   └── supabase.js
│   ├── hooks/
│   │   └── useAuth.js
│   ├── context/
│   │   └── AuthContext.jsx
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── supabase/
│   └── migrations/
├── package.json
├── vite.config.js
├── tailwind.config.js
└── claude.md
```

---

## 12. INSTRUCTIONS FOR CLAUDE

### Research-First Development Rules

1. **NEVER start coding without research** — Always use WebSearch first
2. **Study competitors** before implementing any feature
3. **Find existing solutions** — Don't reinvent the wheel
4. **Check latest trends** — Use 2024-2026 sources only
5. **Document learnings** — Note what works and what doesn't
6. **Adapt, don't copy** — Take best ideas and improve them
7. **Verify functionality** — Ensure every feature works completely
8. **Test thoroughly** — No half-built features allowed

### Technical Implementation Rules

1. **Always use Supabase** for database, auth, storage, and realtime features
2. **Follow the Microsoft Teams-style layout** with sidebar navigation
3. **Use Tailwind CSS** with the defined color scheme
4. **Keep components modular** and reusable
5. **Implement role-based access** — Admin sees everything, Employee sees limited views
6. **Use Supabase Realtime** for chat and live updates
7. **All forms should validate** before submitting to database
8. **Export features** should support CSV and PDF formats
9. **n8n webhooks** should be triggered on employee creation and daily log entries
10. **Mobile responsive** — ensure all views work on mobile devices

### Quality Standards

- Every feature must be **fully functional** before moving to the next
- Code must be **clean, readable, and well-organized**
- UI must be **polished and professional** — no placeholder designs
- All edge cases must be **handled gracefully**
- Performance must be **optimized** — fast loading, smooth interactions

### How to Operate

**1. Look for existing tools first**
Before building anything new, check `tools/` folder based on what your workflow requires. Only create new scripts when nothing exists for that task.

**2. Learn and adapt when things fail**
When you hit an error:
- Read the full error message and trace
- Fix the script and retest (if it uses paid API calls or credits, check with user before running again)
- Document what you learned in the workflow (rate limits, timing quirks, unexpected behavior)
- Example: You get rate-limited on an API → dig into docs → discover batch endpoint → refactor tool → verify it works → update workflow

**3. Keep workflows current**
- Workflows should evolve as you learn
- When you find better methods, discover constraints, or encounter recurring issues, update the workflow
- **DO NOT** create or overwrite workflows without asking unless explicitly told to
- These are instructions that need to be preserved and refined, not discarded after one use

---

## 13. QUICK START COMMANDS

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

**Last Updated:** February 2026
**Project Owner:** Grofast Digital Marketing Agency
