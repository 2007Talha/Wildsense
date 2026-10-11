# 🌿 WildSense — An Offline-First AI Nature Companion

> **"Less screen time. More world discovered."**
> Built for the *"Touch Grass"* Open-Source AI Hackathon.

WildSense is an AI-powered outdoor exploration companion designed to help people disconnect from notifications and reconnect with the natural world through guided, mindful outdoor missions. Unlike traditional apps that keep your eyes glued to the glass, WildSense prepares an outdoor experience, tracks your immersion, and encourages you to slip your phone into your pocket.

---

## ✨ Key Features

### 🧭 1. Adaptive Outdoor Expeditions & Missions
- **Tailored Exploration**: Choose from 6 rich domains (**Birds**, **Plants & Trees**, **Insects**, **Forests & Woodlands**, **Mindfulness**, and **General Exploration**).
- **Flexible Duration & Pacing**: Pick from 5-minute sensory breaths, 15-minute neighborhood strolls, 30-minute deep walks, or 60-minute wilderness expeditions.
- **Difficulty Modes**: Beginner (gentle observation), Intermediate (active tracking), and Adventurous (deep immersion).
- **Sensory Observation Tips**: Every mission provides non-visual cues (listening for territorial calls, feeling bark textures, tracking wind directions).
- **Natural History & Ecological Insights**: Curated facts detailing ecological roles, symbiotic fungi, and pollinator networks.

### 📵 2. Guided Adventure & Screen-Rest Mode
- **Task-by-Task Checklist**: Step-by-step real-world activities to accomplish outdoors.
- **Screen-Rest Mode**: Turn your phone face-down or switch into ambient low-power mode with an audio chime when your immersion period completes.
- **Honest Immersion Tracking**: Tracks cumulative real-world minutes spent outside rather than active screen time.
- **Post-Mission Reflection**: Prompts thoughtful reflection on overlooked nature details and logs new discoveries.

### 🔬 3. Nature Identification Lab (Offline Vision & Taxonomy)
- **Offline Botanical & Wildlife Classifier**: Analyzes species morphology (leaf lobes, bird coloration, insect structure) without sending images over the web.
- **Sample Specimen Gallery**: Test the identification lab immediately with built-in botanical specimens (Oak leaf, American Robin, Western Honeybee, Forest Fern).
- **Manual Observation Studio**: Capture field attributes (habitat, margin patterns, behavior) to match against the offline taxonomic database.
- **Strict Safety Protocols**: Prominent safety disclaimers reminding explorers never to forage or touch unfamiliar species based on AI suggestions.
- **One-Click Field Journal Sync**: Save identified species directly into your permanent journal with auto-populated traits.

### 📓 4. Nature Discovery Journal
- **Field Notes & Photo Records**: Capture and persist observations with field notes, categories, tags, locations, and photos.
- **IndexedDB Local-First Persistence**: Powered by Dexie.js; zero cloud dependencies, full offline capability.
- **Search & Filter**: Search by species name, notes, locations, or filter across categories.
- **Data Portability**: Full JSON export and backup support.

### 🏆 5. Commendations & Field Badges
- **14 Unlockable Badges**: Spanning milestones (*First Footsteps*, *Golden Hour*, *Nature Marathon*), categories (*Bird Detective*, *Curious Botanist*, *Bug Hunter*), consistency streaks (*Nature Regular*), and field craft (*Screen-Free Explorer*, *Renaissance Naturalist*).
- **Real-Time Evaluation**: Dynamically evaluates badge requirements upon mission completion and observation logging.
- **7-Day Immersion Chart**: Visualizes daily outdoor minutes disconnected from digital feeds.

---

## 🤖 Local-First AI Strategy

WildSense prioritizes privacy, offline autonomy, and resilience in remote areas with zero cell reception:

```
┌─────────────────────────────────────────────────────────────┐
│                      AI ROUTER CASCADE                      │
├─────────────────────────────────────────────────────────────┤
│  1. Ollama (Local on-device)                                │
│     • Fully offline inference via localhost:11434           │
│     • Tested with gemma2:2b, llama3.2, mistral              │
│     • Structured JSON schema enforcement & sanitation       │
├─────────────────────────────────────────────────────────────┤
│  2. Curated Offline Library (Always Available)              │
│     • 50+ handcrafted, botanically verified missions        │
│     • Categorized across birds, plants, insects, forests    │
│     • Zero network requests, instant generation (<10ms)     │
└─────────────────────────────────────────────────────────────┘
```

> **Honest AI Labeling**: Every mission clearly indicates whether it was generated via local Ollama inference (`🧠 Ollama (Local)`) or curated by naturalists (`📋 Curated Library`).

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v20+ recommended)
- (Optional for Local AI generation) [Ollama](https://ollama.com/)

### 1. Installation
```bash
git clone https://github.com/your-username/wildsense.git
cd wildsense
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 3. (Optional) Run Local AI with Ollama
If you want dynamic AI-generated missions:
```bash
# Pull lightweight model (2.2 GB)
ollama pull gemma2:2b

# Start the Ollama server
ollama serve
```
Vite proxies `/ollama` requests directly to `http://localhost:11434` without CORS friction. You can verify and test your Ollama connection inside the app under **Settings > Ollama Configuration**.

If Ollama is not running, WildSense seamlessly falls back to its comprehensive **50+ mission offline library**.

---

## 🚀 Deploying to Render (render.com)

WildSense is fully optimized for **Render** with a zero-dependency production server, automated healthchecks, and a preconfigured `render.yaml` Blueprint.

### Option 1: 1-Click Blueprint (Recommended)
1. Push your repository to **GitHub**.
2. Go to your [Render Dashboard](https://dashboard.render.com/) and click **New > Blueprint**.
3. Select your repository. Render will automatically read [`render.yaml`](./render.yaml).
4. (Optional) In the Environment Variables section, add:
   - `GEMINI_API_KEY`: Your Gemini API key.
5. Click **Apply**. Render will install, build, and deploy your live URL with automatic healthchecks!

### Option 2: Render Web Service (Manual)
- **Environment**: `Node`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Health Check Path**: `/healthz`
- **Environment Variables**:
  - `NODE_ENV` = `production`
  - `GEMINI_API_KEY` = your API key

### Option 3: Render Static Site (Free Global CDN)
If you prefer a static CDN deployment:
- **Build Command**: `npm install && npm run build`
- **Publish Directory**: `dist`
- **Redirects/Rewrites**:
  - **Type**: `Rewrite`
  - **Source**: `/*`
  - **Destination**: `/index.html` *(Essential for React Router SPA routes like `/explore` and `/settings`)*

---

## 🛠 Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Core Framework** | React 19 + TypeScript | Component architecture & strict type safety |
| **Bundler** | Vite 8 | Ultra-fast HMR and build pipeline |
| **Styling** | Tailwind CSS v4 | Curated organic nature palette (`--forest`, `--sage`, `--cream`, `--terracotta`) |
| **State Management** | Zustand | Global application state & badge evaluation |
| **Database** | Dexie.js (IndexedDB) | 100% offline-first local storage for missions and journal |
| **Routing** | React Router v7 | Seamless client-side navigation |
| **Icons** | Lucide React | Elegant, tree-shaken UI iconography |
| **Validation** | Zod | Runtime AI JSON validation & sanitation |
| **PWA** | vite-plugin-pwa | Installable service worker with asset precaching |

---

## 🎨 Design Philosophy & Aesthetics

- **Organic Nature Palette**: Deep forest green (`#183D32`), moss green (`#4A6741`), soft cream backdrop (`#F7F5EC`), and warm terracotta highlights (`#C87956`).
- **Serif Display Typography**: Headlines styled with *Playfair Display* for a classic naturalist field guide atmosphere, paired with *Inter* for clean legibility.
- **Micro-Interactions**: Subtle button springs, badge celebration toasts, and progress bar animations.
- **Accessibility & Respect**: Honors `prefers-reduced-motion` and provides high-contrast typography.

---

## 📜 License & Acknowledgments

Created with ❤️ for nature explorers and screen-fatigued minds everywhere.
Open source under the [MIT License](LICENSE).
