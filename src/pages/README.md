# Pages

This directory contains the main page components that serve as the entry points for different routes in the application.

## Main Pages

- `Index.tsx` - Landing page and main entry point
- `Dashboard.tsx` - User dashboard showing analysis history and reports
- `AnalysisDetail.tsx` - Detailed view of a specific analysis
- `BusinessIntelligenceDetail.tsx` - Business intelligence reports and insights
- `MarketResearchDetail.tsx` - Market research findings and data
- `Auth.tsx` - Authentication page (sign in/sign up)
- `Contact.tsx` - Contact information and support
- `FAQ.tsx` - Frequently asked questions
- `Pricing.tsx` - Pricing plans and features

## Authentication Flow

- `SignIn.tsx` - User sign-in form
- `SignUp.tsx` - User registration form
- `AuthCallback.tsx` - OAuth callback handler

## Routing

- `ReportRouter.tsx` - Handles routing for different report types

## Development Notes

- Each page should be a self-contained component
- Use layout components from `../components/layout` for consistent structure
- Keep business logic in custom hooks when possible
- Use TypeScript interfaces for props and state

## Best Practices

1. Keep page components focused on composition
2. Move reusable logic to custom hooks
3. Use lazy loading for better performance
4. Add proper error boundaries
5. Implement proper loading states
