# Socios Club - Online Deployment Guide

## 🚀 Deployment Options

This online version is configured for deployment on multiple platforms. Choose the one that best fits your needs:

### 1. Railway (Recommended)
**Best for**: Full-stack Next.js apps with database
- ✅ Free tier available
- ✅ Automatic deployments from GitHub
- ✅ Built-in database support
- ✅ Easy environment variable management

**Deployment Steps:**
1. Go to [Railway.app](https://railway.app)
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your `Socios26-online` repository
5. Add environment variables in Railway dashboard
6. Deploy!

### 2. Render
**Best for**: Reliable hosting with good free tier
- ✅ Free tier with 750 hours/month
- ✅ Automatic deployments
- ✅ Built-in SSL certificates
- ✅ Good performance

**Deployment Steps:**
1. Go to [Render.com](https://render.com)
2. Sign up with GitHub
3. Click "New" → "Web Service"
4. Connect your `Socios26-online` repository
5. Use the `render.yaml` configuration
6. Add environment variables
7. Deploy!

### 3. Netlify
**Best for**: Static sites and serverless functions
- ✅ Excellent free tier
- ✅ Global CDN
- ✅ Form handling
- ⚠️ Limited for full-stack apps

**Deployment Steps:**
1. Go to [Netlify.com](https://netlify.com)
2. Sign up with GitHub
3. Click "New site from Git"
4. Select your `Socios26-online` repository
5. Use the `netlify.toml` configuration
6. Add environment variables
7. Deploy!

## 🔧 Required Environment Variables

Set these in your deployment platform:

```bash
# Supabase Database (Required)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# MailChimp Integration (Optional)
MAILCHIMP_API_KEY=your_mailchimp_api_key
MAILCHIMP_SERVER_PREFIX=your_server_prefix
MAILCHIMP_AUDIENCE_ID=your_audience_id

# Google Drive Integration (Optional)
GOOGLE_DRIVE_CLIENT_EMAIL=your_service_account_email
GOOGLE_DRIVE_PRIVATE_KEY=your_private_key
GOOGLE_DRIVE_FOLDER_ID=your_folder_id
```

## 📊 Database Setup

This online version uses **Supabase** (not SQLite). You need to:

1. **Create Supabase Project**: Go to [supabase.com](https://supabase.com)
2. **Create Tables**: Run this SQL in Supabase SQL Editor:

```sql
-- Create members_2025 table
CREATE TABLE members_2025 (
  id SERIAL PRIMARY KEY,
  member_number VARCHAR(50) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50),
  amount_paid DECIMAL(10,2) DEFAULT 35.00,
  year INTEGER DEFAULT 2025,
  is_active BOOLEAN DEFAULT true,
  source VARCHAR(20) DEFAULT '2025_list',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create members_2026 table
CREATE TABLE members_2026 (
  id SERIAL PRIMARY KEY,
  member_number VARCHAR(50) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50),
  amount_paid DECIMAL(10,2) DEFAULT 35.00,
  year INTEGER DEFAULT 2026,
  is_active BOOLEAN DEFAULT true,
  source VARCHAR(20) DEFAULT 'form',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create mailchimp_sync table
CREATE TABLE mailchimp_sync (
  id SERIAL PRIMARY KEY,
  member_id INTEGER NOT NULL,
  mailchimp_id VARCHAR(255),
  audience_id VARCHAR(255),
  tags TEXT, -- JSON array of tags
  synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (member_id) REFERENCES members_2026 (id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_members_2025_member_number ON members_2025(member_number);
CREATE INDEX idx_members_2025_email ON members_2025(email);
CREATE INDEX idx_members_2026_member_number ON members_2026(member_number);
CREATE INDEX idx_members_2026_email ON members_2026(email);
CREATE INDEX idx_mailchimp_sync_member_id ON mailchimp_sync(member_id);
```

## 🔄 Key Differences from Local Version

| Feature | Local Version | Online Version |
|---------|---------------|----------------|
| Database | SQLite (better-sqlite3) | Supabase |
| File Storage | Local filesystem | Supabase Storage |
| Dependencies | Includes SQLite packages | Supabase only |
| Environment | `.env.local` | Platform environment vars |
| Deployment | `npm run dev` | Platform-specific |

## 🆘 Troubleshooting

**Build Errors:**
- Make sure all environment variables are set
- Check that Supabase tables exist
- Verify API keys are correct

**Database Connection Issues:**
- Check Supabase URL and key
- Ensure tables are created
- Verify RLS policies if enabled

**Deployment Failures:**
- Check platform logs
- Verify build commands
- Ensure all dependencies are in package.json

## 📱 Features Available Online

- ✅ Member search and management
- ✅ Import Excel files
- ✅ Transfer members between 2025/2026 lists
- ✅ Admin panel
- ✅ MailChimp integration (if configured)
- ✅ Multi-language support
- ✅ Responsive design
- ✅ Real-time database updates

---

**Ready to deploy?** Choose your platform and follow the steps above! 🎉























