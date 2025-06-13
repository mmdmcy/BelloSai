# 🤖 BelloSai - AI Chat Assistant

A modern, open-source ChatGPT-like application built with React, TypeScript, and Supabase. Features multiple AI models, real-time streaming, user authentication, and subscription management.

## 🌐 Live Demo

**Website**: [bellosai.com](https://bellosai.com)

## ✨ Features

### 🧠 AI Models
- **DeepSeek-V3** - Advanced chat model
- **DeepSeek-R1** - Reasoning model
- Real-time streaming responses
- Conversation history and context

### 🔐 Authentication & Users
- Secure user authentication via Supabase Auth
- User profiles and settings
- Message usage tracking
- Subscription tier management

### 💬 Chat Features
- Real-time streaming responses
- Code syntax highlighting
- Message regeneration with different models
- Conversation branching support
- Responsive design (mobile & desktop)

### 🎨 Customization
- Light/Dark theme toggle
- Custom color schemes and gradients
- Font family selection
- Drag-and-drop layout designer
- Mobile-optimized layouts

### 📊 Subscription System
- **Free Tier**: 100 messages/month
- **Pro Tier**: Extended limits
- **Enterprise**: Unlimited usage
- Stripe integration ready

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development
- **Tailwind CSS** for styling
- **Lucide React** for icons
- Responsive grid-based layout system

### Backend
- **Supabase** for database and authentication
- **Supabase Edge Functions** for AI integration
- **PostgreSQL** with Row Level Security
- Real-time subscriptions

### AI Integration
- **DeepSeek API** for AI responses
- Streaming support for real-time responses
- Message limit enforcement
- Error handling and fallbacks

### Deployment
- **Vercel** for frontend hosting
- **Supabase** for backend services
- **GitHub Actions** ready for CI/CD

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account
- DeepSeek API key

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/bellosai.git
cd bellosai
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up environment variables
Create a `.env.local` file:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Set up Supabase

#### Database Setup
1. Create a new Supabase project
2. Run the database schema:
```bash
supabase db push
```

#### Edge Functions Setup
1. Install Supabase CLI
2. Login to Supabase:
```bash
supabase login
```
3. Deploy the Edge Function:
```bash
supabase functions deploy deepseek-chat --project-ref your_project_ref
```
4. Set the DeepSeek API key as a secret:
```bash
supabase secrets set DEEPSEEK_API_KEY=your_deepseek_api_key
```

### 5. Start development server
```bash
npm run dev
```

Visit `http://localhost:5173` to see the application.

## 📁 Project Structure

```
bellosai/
├── src/
│   ├── components/          # React components
│   │   ├── ChatView.tsx     # Main chat interface
│   │   ├── MainContent.tsx  # Welcome screen
│   │   ├── DesignerMode.tsx # Layout designer
│   │   └── ...
│   ├── lib/                 # Utilities and services
│   │   ├── supabase.ts      # Supabase client
│   │   ├── supabase-chat.ts # Chat service
│   │   ├── auth.ts          # Authentication
│   │   └── ...
│   └── App.tsx              # Main application
├── supabase/
│   ├── functions/           # Edge Functions
│   │   └── deepseek-chat/   # AI chat function
│   └── config.toml          # Supabase configuration
├── database/
│   └── schema.sql           # Database schema
└── ...
```

## 🔧 Configuration

### Environment Variables

#### Frontend (.env.local)
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

#### Supabase Secrets
```bash
# Set via Supabase CLI
supabase secrets set DEEPSEEK_API_KEY=your_deepseek_api_key
```

### Customization Options
- **Colors**: Primary and secondary color themes
- **Fonts**: Multiple font family options
- **Layout**: Drag-and-drop designer mode
- **Features**: Toggle sample questions, gradients, etc.

## 🚀 Deployment

### Vercel Deployment
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Deploy automatically on push to main branch

### Supabase Setup
1. Create Supabase project
2. Deploy database schema
3. Deploy Edge Functions
4. Set up authentication providers
5. Configure RLS policies

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

### Code Style
- TypeScript for type safety
- ESLint + Prettier for code formatting
- Conventional commits for commit messages

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- **Supabase** for the amazing backend platform
- **DeepSeek** for AI model access
- **Vercel** for hosting and deployment
- **React** and **Vite** for the development experience

## 📞 Support

- **Website**: [bellosai.com](https://bellosai.com)
- **Issues**: [GitHub Issues](https://github.com/yourusername/bellosai/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/bellosai/discussions)

---

Built with ❤️ by the BelloSai team 