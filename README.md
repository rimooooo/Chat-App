# 💬 ChitChat — Real-Time Chat Application

A full-stack real-time chat application built with **Next.js**, **Convex**, and **Clerk**. Supports 1-on-1 messaging, group chats, reactions, typing indicators, and more.

🔗 **Live Demo:** [chitchatapp-five.vercel.app](https://chitchatapp-five.vercel.app)

---

## ✨ Features

- 🔐 **Authentication** — Secure sign up / sign in via Clerk
- 💬 **Real-time Messaging** — Instant message delivery using Convex WebSockets
- 👥 **Group Chats** — Create groups with multiple participants
- 🟢 **Online Status** — Live online/offline indicators with heartbeat system
- ⌨️ **Typing Indicators** — Animated dots when someone is typing
- 😊 **Message Reactions** — React to messages with emojis (👍 ❤️ 😂 😮 😢)
- 🗑️ **Soft Delete** — Delete messages (shows "This message was deleted")
- 🔴 **Unread Badges** — Unread message counts per conversation
- 🔍 **Search** — Filter conversations and users by name
- 📱 **Mobile Responsive** — WhatsApp-style mobile layout with back navigation
- 🕐 **Smart Timestamps** — Contextual time formatting
- ⬇️ **Auto Scroll** — Smart scroll with "New messages" button

---

## 🛠 Tech Stack

| Technology | Purpose |
|---|---|
| [Next.js 15](https://nextjs.org/) | React framework with App Router |
| [Convex](https://convex.dev/) | Backend, database & real-time engine |
| [Clerk](https://clerk.com/) | Authentication & user management |
| [Tailwind CSS](https://tailwindcss.com/) | Utility-first styling |
| [TypeScript](https://www.typescriptlang.org/) | Type safety |

---

## 📁 Project Structure

```
chat-app/
├── app/
│   ├── page.tsx                          # Home page (sidebar)
│   ├── chat/[conversationId]/page.tsx    # Chat page
│   ├── (auth)/
│   │   ├── sign-in/                      # Sign in page
│   │   └── sign-up/                      # Sign up page
│   └── layout.tsx                        # Root layout with providers
├── components/
│   ├── ChatWindow.tsx                    # Main chat UI
│   ├── Sidebar.tsx                       # Conversations list
│   ├── MessageBubble.tsx                 # Individual message
│   ├── MessageInput.tsx                  # Message input box
│   ├── CreateGroupModal.tsx              # Group creation modal
│   ├── SyncUser.tsx                      # Syncs Clerk user to Convex
│   └── UnreadBadge.tsx                   # Unread count badge
├── convex/
│   ├── schema.ts                         # Database schema
│   ├── users.ts                          # User functions
│   ├── conversations.ts                  # Conversation functions
│   ├── messages.ts                       # Message functions
│   └── http.ts                           # Clerk webhook handler
└── middleware.ts                         # Clerk auth middleware
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- A [Convex](https://convex.dev/) account
- A [Clerk](https://clerk.com/) account

### 1. Clone the Repository

```bash
git clone https://github.com/rimooooo/Chat-App.git
cd Chat-App
npm install
```

### 2. Set Up Convex

```bash
npx convex dev
```

This will create a new Convex project and give you a deployment URL.

### 3. Set Up Clerk

1. Create a new application at [clerk.com](https://clerk.com)
2. Get your API keys from **Configure → API Keys**
3. Set up a webhook pointing to your Convex HTTP endpoint

### 4. Configure Environment Variables

Create a `.env.local` file in the root:

```env
NEXT_PUBLIC_CONVEX_URL=your_convex_deployment_url

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxx
CLERK_SECRET_KEY=sk_test_xxxxxx

NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/

CLERK_WEBHOOK_SECRET=whsec_xxxxxx
```

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🗄️ Database Schema

### Users
Stores user profiles synced from Clerk with online status tracking.

### Conversations
Supports both 1-on-1 and group conversations with participant arrays.

### Messages
Stores messages with soft delete, read status, and emoji reactions.

### Typing
Tracks active typing users with timestamps for real-time indicators.

---

## 🌐 Deployment

### Deploy Convex to Production
```bash
npx convex deploy
```

### Deploy to Vercel
1. Push code to GitHub
2. Import repository on [vercel.com](https://vercel.com)
3. Add all environment variables in Vercel project settings
4. Deploy!

---

## 📸 Screenshots

> Sign in → See all users → Start chatting in real-time!

---

## 🏗️ Architecture

```
Browser (Next.js)
      ↕ WebSocket (real-time)
   Convex Backend
      ↕ Webhook
   Clerk Auth
```

1. **User signs up** → Clerk creates auth user → Webhook fires → Convex stores user profile
2. **User sends message** → Convex mutation → All subscribers notified instantly
3. **Online status** → Heartbeat every 30s → `lastSeen` timestamp updated

---

## 👩‍💻 Author

**Rimjhim Bansal**

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
