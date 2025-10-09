# Socios Club - Online Version

This is the online deployment version of the Socios Club application, configured for cloud hosting platforms like Railway, Render, or Netlify.

## 🚀 Quick Deployment

This version is ready for deployment on multiple platforms. See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

### Supported Platforms:
- **Railway** (Recommended) - Full-stack hosting
- **Render** - Reliable cloud hosting  
- **Netlify** - Static site hosting

## 🔧 Key Features

- ✅ **Supabase Database** - Cloud-hosted PostgreSQL
- ✅ **Member Management** - Search, import, and transfer members
- ✅ **Multi-language Support** - Dutch, French, Spanish
- ✅ **MailChimp Integration** - Email marketing automation
- ✅ **Google Drive Integration** - File management
- ✅ **Responsive Design** - Works on all devices
- ✅ **Admin Panel** - Complete management interface

## 📊 Database

This version uses **Supabase** instead of local SQLite:
- Cloud-hosted PostgreSQL database
- Real-time updates
- Built-in authentication (if needed)
- Automatic backups

## 🌐 Environment Variables

Required for deployment:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
```

Optional integrations:
```bash
MAILCHIMP_API_KEY=your_mailchimp_key
GOOGLE_DRIVE_CLIENT_EMAIL=your_service_account
```

## 📁 Project Structure

```
src/
├── app/                 # Next.js app router
├── components/          # React components
├── lib/                # Services (Supabase, MailChimp, etc.)
├── locales/            # Translation files
└── types/              # TypeScript definitions
```

## 🔄 Differences from Local Version

| Feature | Local | Online |
|---------|-------|--------|
| Database | SQLite | Supabase |
| Storage | Local files | Cloud storage |
| Dependencies | SQLite packages | Supabase only |
| Environment | .env.local | Platform vars |

## 🚀 Getting Started

1. **Choose a platform** from [DEPLOYMENT.md](./DEPLOYMENT.md)
2. **Set up Supabase** database
3. **Configure environment variables**
4. **Deploy!**

## 📱 Available Pages

- `/` - Home page
- `/search` - Member search
- `/admin` - Admin panel
- `/import` - Excel import
- `/status` - System status

---

**Ready to deploy?** Check out [DEPLOYMENT.md](./DEPLOYMENT.md) for step-by-step instructions! 🎉