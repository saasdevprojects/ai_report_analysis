# Components

This directory contains reusable React components used throughout the application.

## Structure

- `AnalysisList.tsx` - Displays a list of analyses with search and filter capabilities
- `ProductAnalyzer.tsx` - Main component for product analysis functionality
- `layout/` - Layout-related components (headers, footers, navigation)
- `ui/` - Reusable UI components built with shadcn-ui

## Usage

Components in this directory should be:
- Reusable across multiple pages
- Stateless when possible
- Well-documented with PropTypes or TypeScript interfaces
- Styled using Tailwind CSS classes

## Adding New Components

1. Create a new `.tsx` file in the appropriate subdirectory
2. Export the component as a named export
3. Add PropTypes or TypeScript interfaces
4. Document the component's props and usage with JSDoc comments
