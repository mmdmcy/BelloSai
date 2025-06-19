# BelloSai - AI Chat Assistant

A modern, open-source AI chat application built with React, TypeScript, and Supabase. Features multiple AI models including DeepSeek, Claude, and Mistral, real-time streaming responses, subscription management with Stripe, and an AI Feud game.

## Live Demo

**Website**: [bellosai.com](https://bellosai.com)

## Features

### AI Models
- **DeepSeek V3** - Advanced general purpose chat model (Free)
- **DeepSeek R1** - Reasoning model optimized for complex problem solving (Premium)
- **Claude Haiku 3** - Fast, cost-effective Claude model (Free)
- **Mistral Medium 3** - State-of-the-art performance, cost-efficient (Free)
- **Mistral Small 3.1** - Multimodal, multilingual capabilities (Free)
- **Codestral** - Specialized coding assistant supporting 80+ languages (Free)
- Real-time streaming responses
- Conversation history and context
- Model switching during conversations

### Authentication & User Management
- Secure user authentication via Supabase Auth
- Anonymous usage with daily message limits (10 messages/day)
- User profiles and conversation management
- Subscription tiers: Free (20 messages) and Pro (unlimited messages)
- Stripe integration for payment processing

### Chat Features
- Real-time streaming AI responses
- Markdown rendering with syntax highlighting
- Message regeneration with different models
- Conversation search functionality
- Chat history with automatic conversation titles
- Responsive design for mobile and desktop
- Chat sharing capabilities
- Message export functionality

### AI Feud Game
- Interactive game similar to Family Feud
- AI-generated questions and answers
- Real-time scoring system
- Flexible answer matching
- Multiple game modes

### Customization & Themes
- Light/Dark theme toggle
- Multiple preset themes (Modern Purple, Glassmorphism, Ocean Breeze, etc.)
- Custom color schemes and gradients
- Font family selection (Inter, Roboto, Poppins, etc.)
- Drag-and-drop layout designer
- Mobile-optimized responsive layouts
- Glass effects and modern UI elements

### Subscription Management
- Stripe-powered subscription system
- Free tier: 20 messages/month
- Pro tier: €6.99/month for unlimited messages
- Customer portal for subscription management
- Automated billing and renewal
- Payment success/failure handling

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for utility-first styling
- **Lucide React** for consistent iconography
- **React Markdown** with syntax highlighting
- **React Router** for client-side navigation
- Responsive grid-based layout system

### Backend
- **Supabase** for database, authentication, and real-time features
- **PostgreSQL** with Row Level Security (RLS)
- **Supabase Edge Functions** for AI integrations
- Real-time subscriptions and data synchronization

### AI Integration
- **DeepSeek API** for advanced reasoning and general chat
- **Claude API** for fast, efficient responses
- **Mistral API** for multilingual and coding tasks
- Streaming support for real-time responses
- Rate limiting and usage tracking
- Error handling and fallbacks

### Payment Processing
- **Stripe** for subscription management
- Webhook handling for real-time subscription updates
- Customer portal integration
- Secure payment processing

### Deployment
- **Vercel** for frontend hosting and edge deployment
- **Supabase** for backend services and database
- Environment-based configuration
- Automated CI/CD pipeline

## Quick Start

### Prerequisites
- Node.js 18 or higher
- npm or yarn package manager
- Supabase account
- DeepSeek API key
- Claude API key (optional)
- Mistral API key (optional)
- Stripe account for payments

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
supabase functions deploy claude-chat --project-ref your_project_ref
supabase functions deploy mistral-chat --project-ref your_project_ref
supabase functions deploy stripe-checkout --project-ref your_project_ref
supabase functions deploy stripe-webhook --project-ref your_project_ref
```
4. Set API keys as secrets:
```bash
supabase secrets set DEEPSEEK_API_KEY=your_deepseek_api_key
supabase secrets set CLAUDE_API_KEY=your_claude_api_key
supabase secrets set MISTRAL_API_KEY=your_mistral_api_key
supabase secrets set STRIPE_SECRET_KEY=your_stripe_secret_key
supabase secrets set STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
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
│   │   ├── ChatView.tsx     # Main chat interface component
│   │   ├── MainContent.tsx  # Welcome screen and onboarding
│   │   ├── ModelSelector.tsx # AI model selection dropdown
│   │   ├── Sidebar.tsx      # Navigation sidebar with conversations
│   │   ├── GameSection.tsx  # AI Feud game interface
│   │   ├── AccountMenu.tsx  # User account management
│   │   ├── SubscriptionManager.tsx # Stripe subscription handling
│   │   └── ...
│   ├── lib/                 # Core utilities and services
│   │   ├── supabase.ts      # Supabase client configuration
│   │   ├── supabase-chat.ts # Chat message handling
│   │   ├── stripeService.ts # Stripe payment integration
│   │   ├── anonymous-usage.ts # Anonymous user limits
│   │   ├── auth.ts          # Authentication helpers
│   │   ├── ai-feud.ts       # Game logic and mechanics
│   │   └── ...
│   ├── pages/               # Page-level components
│   │   ├── Game.tsx         # AI Feud game page
│   │   ├── Pricing.tsx      # Subscription pricing page
│   │   ├── Success.tsx      # Payment success page
│   │   └── ...
│   ├── contexts/            # React context providers
│   │   └── AuthContext.tsx  # Authentication state management
│   ├── hooks/               # Custom React hooks
│   │   ├── useMessages.ts   # Message state management
│   │   └── useSubscription.ts # Subscription status hooks
│   └── App.tsx              # Main application component
├── supabase/
│   ├── functions/           # Supabase Edge Functions
│   │   ├── deepseek-chat/   # DeepSeek AI integration
│   │   ├── claude-chat/     # Claude AI integration
│   │   ├── mistral-chat/    # Mistral AI integration
│   │   ├── stripe-checkout/ # Stripe checkout session creation
│   │   ├── stripe-webhook/  # Stripe webhook handling
│   │   └── ...
│   ├── migrations/          # Database schema migrations
│   └── config.toml          # Supabase project configuration
├── database/
│   └── schema.sql           # Complete database schema
└── package.json             # Project dependencies and scripts
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
supabase secrets set CLAUDE_API_KEY=your_claude_api_key
supabase secrets set MISTRAL_API_KEY=your_mistral_api_key
supabase secrets set STRIPE_SECRET_KEY=your_stripe_secret_key
supabase secrets set STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
```

### Usage Limits
- **Anonymous Users**: 10 messages per day (resets at 2 AM)
- **Free Tier**: 20 messages per month
- **Pro Tier**: Unlimited messages (€6.99/month)

### Customization Options
- **Themes**: Multiple preset themes with custom color schemes
- **Typography**: Inter, Roboto, Poppins, and more font options
- **Layout**: Drag-and-drop designer for custom grid layouts
- **Features**: Configurable UI elements and functionality
- **AI Models**: Easy integration of new AI providers

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
4. Set up authentication providers (email/password)
5. Configure Row Level Security policies
6. Set up Stripe webhooks for subscription management

## Development

### Available Scripts
- `npm run dev` - Start development server (http://localhost:5173)
- `npm run build` - Build for production
- `npm run lint` - Run ESLint code quality checks
- `npm run preview` - Preview production build locally

### Code Architecture
- **TypeScript** for type safety and developer experience
- **Component-based** React architecture with reusable components
- **Custom hooks** for state management and business logic
- **Service layer** for API interactions and data processing
- **Context providers** for global state management
- **Responsive design** with mobile-first approach

### Key Design Patterns
- Server-side rendering ready with Vite
- Real-time data synchronization with Supabase
- Optimistic UI updates for better user experience
- Error boundaries and graceful error handling
- Progressive Web App (PWA) capabilities
- Accessibility-first design principles

## Contributing

Contributions are welcome! This is an open-source project under the MIT license.

### Development Workflow
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes with proper TypeScript typing
4. Test your changes thoroughly
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Areas for Contribution
- **New AI model integrations** (OpenAI, Anthropic, etc.)
- **UI/UX improvements** and new themes
- **Game features** and additional game modes
- **Performance optimizations** and code quality
- **Documentation improvements** and tutorials
- **Bug fixes** and stability improvements
- **Accessibility enhancements**
- **Mobile app development** (React Native)

### Code Style Guidelines
- Use TypeScript for all new code
- Follow existing naming conventions
- Add JSDoc comments for public functions
- Write unit tests for new features
- Ensure responsive design compatibility
- Follow Tailwind CSS best practices

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- **Supabase** for providing an excellent backend-as-a-service platform
- **DeepSeek** for cutting-edge AI models and API access
- **Anthropic** for Claude AI integration
- **Mistral AI** for multilingual and coding capabilities
- **Stripe** for seamless payment processing
- **Vercel** for hosting and deployment platform
- **React** team for the amazing frontend framework
- **Tailwind CSS** for utility-first styling
- **TypeScript** for enhanced developer experience

## Support & Community

- **Issues**: [GitHub Issues](https://github.com/mmdmcy/BelloSai/issues)
- **Website**: [bellosai.com](https://bellosai.com)
- **Discussions**: [GitHub Discussions](https://github.com/mmdmcy/BelloSai/discussions)

---

Built with ❤️ by [mmdmcy](https://github.com/mmdmcy) 