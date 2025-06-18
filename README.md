# BelloSai - AI Chat Assistant

A modern, open-source AI chat application built with React, TypeScript, and Supabase. Features multiple AI models including DeepSeek and Gemini, real-time streaming responses, user authentication, and an AI Feud game.

## Live Demo

**Website**: [bellosai.com](https://bellosai.com)

## Features

### AI Models
- **DeepSeek V3** - Advanced general purpose chat model
- **DeepSeek R1** - Reasoning model optimized for complex problem solving
- **Gemini 2.5 Pro** - State-of-the-art reasoning with large context
- **Gemini 2.5 Flash** - Fast preview with broad multimodal input
- **Gemini 2.0 Flash** - Fast large context with tool use support
- Real-time streaming responses
- Conversation history and context
- Model switching during conversations

### Authentication & User Management
- Secure user authentication via Supabase Auth
- Anonymous usage with message limits
- User profiles and conversation management
- Subscription tier support with Stripe integration

### Chat Features
- Real-time streaming AI responses
- Markdown rendering with syntax highlighting
- Message regeneration with different models
- Conversation search functionality
- Chat history with conversation titles
- Responsive design for mobile and desktop
- Chat sharing capabilities

### AI Feud Game
- Interactive game similar to Family Feud
- AI-generated questions and answers
- Real-time scoring and multiplayer support
- Flexible answer matching system

### Customization
- Light/Dark theme toggle
- Custom color schemes and gradients
- Font family selection
- Drag-and-drop layout designer
- Mobile-optimized layouts
- Customizable UI elements

### Search Functionality
- Search through conversation titles
- Search within message content
- Real-time search results
- Quick navigation to conversations

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **React Markdown** for message rendering
- **React Router** for navigation
- Responsive grid-based layout system

### Backend
- **Supabase** for database and authentication
- **Supabase Edge Functions** for AI integrations
- **PostgreSQL** with Row Level Security
- Real-time subscriptions and data synchronization

### AI Integration
- **DeepSeek API** for advanced AI responses
- **Gemini API** for Google's AI models
- Streaming support for real-time responses
- Message limit enforcement
- Error handling and fallbacks

### Deployment
- **Vercel** for frontend hosting
- **Supabase** for backend services
- Environment-based configuration

## Quick Start

### Prerequisites
- Node.js 18 or higher
- npm or yarn package manager
- Supabase account
- DeepSeek API key
- Gemini API key (optional)

### 1. Clone the repository
```bash
git clone https://github.com/mmdmcy/BelloSai.git
cd BelloSai
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up environment variables
Create a `.env.local` file in the root directory:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Set up Supabase

#### Database Setup
1. Create a new Supabase project
2. Run the database migrations:
```bash
supabase db push
```

#### Edge Functions Setup
1. Install Supabase CLI
2. Login to Supabase:
```bash
supabase login
```
3. Deploy the Edge Functions:
```bash
supabase functions deploy deepseek-chat --project-ref your_project_ref
supabase functions deploy gemini-chat --project-ref your_project_ref
```
4. Set API keys as secrets:
```bash
supabase secrets set DEEPSEEK_API_KEY=your_deepseek_api_key
supabase secrets set GEMINI_API_KEY=your_gemini_api_key
```

### 5. Start development server
```bash
npm run dev
```

Visit `http://localhost:5173` to see the application.

## Project Structure

```
BelloSai/
├── src/
│   ├── components/          # React components
│   │   ├── ChatView.tsx     # Main chat interface
│   │   ├── MainContent.tsx  # Welcome screen
│   │   ├── ModelSelector.tsx # AI model selection
│   │   ├── Sidebar.tsx      # Navigation sidebar
│   │   ├── GameSection.tsx  # AI Feud game
│   │   └── ...
│   ├── lib/                 # Utilities and services
│   │   ├── supabase.ts      # Supabase client configuration
│   │   ├── chat-features.ts # Chat functionality
│   │   ├── ai-feud.ts       # Game logic
│   │   ├── auth.ts          # Authentication helpers
│   │   └── ...
│   ├── pages/               # Page components
│   │   ├── Game.tsx         # Game page
│   │   ├── Pricing.tsx      # Subscription pricing
│   │   └── ...
│   └── App.tsx              # Main application component
├── supabase/
│   ├── functions/           # Edge Functions
│   │   ├── deepseek-chat/   # DeepSeek AI integration
│   │   ├── gemini-chat/     # Gemini AI integration
│   │   ├── stripe-*/        # Stripe payment functions
│   │   └── ...
│   ├── migrations/          # Database migrations
│   └── config.toml          # Supabase configuration
├── database/
│   └── schema.sql           # Database schema
└── ...
```

## Configuration

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
supabase secrets set GEMINI_API_KEY=your_gemini_api_key
supabase secrets set STRIPE_SECRET_KEY=your_stripe_secret_key
supabase secrets set STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
```

### Customization Options
- **Themes**: Light and dark mode with custom colors
- **Typography**: Multiple font family options
- **Layout**: Drag-and-drop designer for custom layouts
- **Features**: Toggle various UI elements and functionality
- **AI Models**: Easy addition of new AI providers

## Deployment

### Vercel Deployment
1. Fork or clone the repository
2. Connect your repository to Vercel
3. Set environment variables in Vercel dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy automatically on push to main branch

### Supabase Setup
1. Create a new Supabase project
2. Run database migrations using Supabase CLI
3. Deploy Edge Functions for AI integrations
4. Set up authentication providers (email, OAuth)
5. Configure Row Level Security policies
6. Set up Stripe webhooks for subscription management

## Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

### Code Style
- TypeScript for type safety
- ESLint for code quality
- Tailwind CSS for consistent styling
- Component-based architecture
- Custom hooks for reusable logic

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

### Development Workflow
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Commit your changes (`git commit -m 'Add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

### Areas for Contribution
- New AI model integrations
- UI/UX improvements
- Game features and modes
- Performance optimizations
- Documentation improvements
- Bug fixes

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- **Supabase** for providing an excellent backend platform
- **DeepSeek** for AI model access and API
- **Google** for Gemini AI models
- **Vercel** for hosting and deployment platform
- **React** team for the amazing framework
- **Tailwind CSS** for the utility-first CSS framework

## Support

- **Issues**: [GitHub Issues](https://github.com/mmdmcy/BelloSai/issues)
- **Website**: [bellosai.com](https://bellosai.com)

---

Built by mmdmcy 