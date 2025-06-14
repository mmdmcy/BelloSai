# BelloSai Setup Instructies - Bible Kitty SaaS Integratie

Dit document beschrijft hoe je het BelloSai project opzet met het berichtensysteem en Stripe integratie gebaseerd op de Bible Kitty SaaS template.

## 📋 Overzicht van Nieuwe Features

Het project is uitgebreid met:
- **User Messages Tracking**: Track alle berichten van gebruikers
- **Stripe Integratie**: Volledige abonnement en betalingssysteem
- **Auth Context**: Verbeterde authenticatie management
- **Custom Hooks**: `useMessages` en `useSubscription` voor eenvoudig gebruik
- **React Components**: `MessageTracker` en `SubscriptionManager`

## 🗄️ Database Setup

### 1. Database Schema Toepassen

Het database schema is al uitgebreid met de nieuwe tabellen. Voer het uit in je Supabase SQL editor:

```sql
-- Het schema in database/schema.sql bevat nu:
-- - user_messages tabel voor message tracking
-- - stripe_customers tabel voor Stripe klanten
-- - stripe_subscriptions tabel voor abonnementen
-- - stripe_orders tabel voor bestellingen
-- - Alle benodigde RLS policies
-- - Database views voor veilige data toegang
```

### 2. Supabase Migratie

Als je Supabase CLI gebruikt:

```bash
# Reset database met nieuwe schema
npx supabase db reset

# Of maak een nieuwe migratie
npx supabase db diff --schema public > supabase/migrations/add_bible_kitty_features.sql
npx supabase db push
```

## 🔧 Environment Variables Setup

Kopieer `env.example` naar `.env` en vul de waarden in:

```bash
cp env.example .env
```

### Vereiste Variabelen:

```env
# Supabase (verplicht)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Stripe (voor betalingen)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe Price IDs (maak deze aan in je Stripe Dashboard)
VITE_STRIPE_PRICE_ID_MONTHLY=price_...
VITE_STRIPE_PRICE_ID_YEARLY=price_...
```

## 💳 Stripe Setup

### 1. Stripe Account Configuratie

1. Maak een [Stripe account](https://stripe.com) aan
2. Ga naar je Stripe Dashboard
3. Maak producten en prijzen aan:
   - **Premium Maandelijks**: €9.99/maand
   - **Premium Jaarlijks**: €99.99/jaar

### 2. Webhook Endpoint Setup

1. Ga naar Stripe Dashboard > Webhooks
2. Voeg een nieuwe endpoint toe: `https://your-domain.com/functions/v1/stripe-webhook`
3. Selecteer deze events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Kopieer de webhook secret naar je environment variables

## 🚀 Supabase Edge Functions Deployment

### 1. Deploy Edge Functions

```bash
# Deploy alle Stripe functions
npx supabase functions deploy stripe-checkout
npx supabase functions deploy stripe-webhook
npx supabase functions deploy stripe-customer-portal

# Controleer deployment
npx supabase functions list
```

### 2. Environment Variables voor Edge Functions

Stel environment variables in voor je Edge Functions in Supabase Dashboard:

```bash
# Via Supabase CLI
npx supabase secrets set STRIPE_SECRET_KEY=sk_test_...
npx supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
npx supabase secrets set SUPABASE_URL=https://your-project.supabase.co
npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## 🎯 Frontend Integratie

### 1. Auth Context Setup

Wrap je app met de AuthProvider:

```tsx
// In je main.tsx of App.tsx
import { AuthProvider } from './contexts/AuthContext'

function App() {
  return (
    <AuthProvider>
      {/* Je app componenten */}
    </AuthProvider>
  )
}
```

### 2. Components Gebruiken

```tsx
// Message tracking gebruiken
import { MessageTracker } from './components/MessageTracker'

function Dashboard() {
  return (
    <div>
      <MessageTracker />
    </div>
  )
}

// Subscription management gebruiken
import { SubscriptionManager } from './components/SubscriptionManager'

function Settings() {
  return (
    <div>
      <SubscriptionManager />
    </div>
  )
}
```

### 3. Hooks Gebruiken

```tsx
// Message tracking hook
import { useMessages } from './hooks/useMessages'

function MyComponent() {
  const { messages, trackMessage, messageCount } = useMessages()
  
  const handleSendMessage = async (text: string) => {
    await trackMessage(text)
  }
  
  return (
    <div>
      <p>Berichten: {messageCount}</p>
      {/* Render messages */}
    </div>
  )
}

// Subscription hook
import { useSubscription } from './hooks/useSubscription'

function PremiumFeature() {
  const { hasActiveSubscription, createCheckoutSession } = useSubscription()
  
  if (!hasActiveSubscription) {
    return (
      <button onClick={() => createCheckoutSession('price_monthly')}>
        Upgrade naar Premium
      </button>
    )
  }
  
  return <div>Premium content</div>
}
```

## 🔍 Testing

### 1. Database Testing

Test de database functies:

```sql
-- Test user messages
SELECT * FROM user_messages WHERE user_id = auth.uid();

-- Test subscription view
SELECT * FROM stripe_user_subscriptions;
```

### 2. Stripe Testing

1. Gebruik Stripe test mode
2. Test checkout flow met test kaarten
3. Test webhook events met Stripe CLI:

```bash
stripe listen --forward-to localhost:54321/functions/v1/stripe-webhook
```

### 3. Frontend Testing

1. Test authenticatie flow
2. Test message tracking
3. Test subscription upgrade/downgrade
4. Test customer portal

## 📝 Belangrijke Aandachtspunten

### Security
- ✅ RLS policies zijn ingeschakeld op alle tabellen
- ✅ Service role key wordt alleen gebruikt in Edge Functions
- ✅ Webhook signatures worden geverifieerd

### Error Handling
- ✅ Alle services hebben proper error handling
- ✅ User feedback wordt getoond bij errors
- ✅ Loading states zijn geïmplementeerd

### Performance
- ✅ Database queries zijn geoptimaliseerd met indexes
- ✅ React hooks gebruiken proper dependency arrays
- ✅ Components zijn geoptimaliseerd voor re-renders

## 🚀 Deployment Checklist

### Database
- [ ] Schema is toegepast in productie database
- [ ] RLS policies zijn actief
- [ ] Test data is verwijderd

### Stripe
- [ ] Productie Stripe account is geconfigureerd
- [ ] Webhook endpoint is ingesteld
- [ ] Price IDs zijn correct in environment variables

### Edge Functions
- [ ] Alle functions zijn deployed
- [ ] Environment variables zijn ingesteld
- [ ] Functions zijn getest

### Frontend
- [ ] Environment variables zijn ingesteld
- [ ] Build werkt zonder errors
- [ ] Components zijn getest

## 🆘 Troubleshooting

### Database Issues
- Check RLS policies als queries falen
- Controleer user authenticatie
- Bekijk Supabase logs

### Stripe Issues
- Controleer webhook logs in Stripe Dashboard
- Test met Stripe test mode eerst
- Verificeer environment variables

### Edge Function Issues
- Check function logs in Supabase Dashboard
- Controleer CORS headers
- Test authenticatie tokens

## 📚 Documentatie Links

- [Supabase Docs](https://supabase.com/docs)
- [Stripe Docs](https://stripe.com/docs)
- [Bible Kitty SaaS Guide](./TECHNISCHE_GIDS_BIBLE_KITTY_SAAS.md)

---

**Succes met je BelloSai implementatie! 🎉** 