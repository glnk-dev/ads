# Video Ads Demo

A React application demonstrating Google IMA SDK integration for serving video advertisements.

## Features

- 🎬 Google IMA SDK integration
- ▶️ Multiple ad types: Linear, Skippable, Redirect
- 📱 Responsive video player
- ⏱️ Real-time ad progress tracking
- 🔄 Automatic ad completion handling

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Usage

### Basic VideoAdPlayer Component

```tsx
import { VideoAdPlayer } from './components/VideoAdPlayer';

function App() {
  return (
    <VideoAdPlayer
      vastTagUrl="YOUR_VAST_TAG_URL"
      autoplay={true}
      width={640}
      height={360}
      onAdComplete={() => console.log('Ad finished')}
      onAdError={(error) => console.error(error)}
    />
  );
}
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `vastTagUrl` | `string` | Sample VAST | VAST tag URL for ad request |
| `autoplay` | `boolean` | `false` | Auto-start ad playback |
| `width` | `number` | `640` | Player width in pixels |
| `height` | `number` | `360` | Player height in pixels |
| `onAdComplete` | `() => void` | - | Called when ad finishes |
| `onAdError` | `(error: string) => void` | - | Called on ad error |
| `onAdStarted` | `() => void` | - | Called when ad starts |
| `onAdProgress` | `(remaining, duration) => void` | - | Called on progress update |

### Sample VAST Tags

The component includes Google's official test VAST tags:

```tsx
import { SAMPLE_VAST_TAGS } from './components/VideoAdPlayer';

// Available options:
SAMPLE_VAST_TAGS.linear    // 10-second linear ad
SAMPLE_VAST_TAGS.skippable // Skippable after 5 seconds
SAMPLE_VAST_TAGS.redirect  // Redirect-style ad
```

## Production Setup

For real video ads, you need:

1. **Google Ad Manager Account** - [Sign up here](https://admanager.google.com/)
2. **Create Ad Units** - Configure video ad inventory
3. **Generate VAST Tags** - Get your production VAST URLs
4. **Replace Sample Tags** - Use your VAST URLs in the component

## Tech Stack

- React 18
- TypeScript
- Vite
- Google IMA SDK

## Deployment

This project includes a GitHub Actions workflow for automatic deployment to GitHub Pages.

```bash
# Manual build
npm run build

# Preview production build
npm run preview
```

## License

MIT
