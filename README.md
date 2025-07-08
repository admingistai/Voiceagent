# Divine Halo Voice Agent - Cartesia & LiveKit

An enchanting voice assistant with mesmerizing audio visualizations, built on LiveKit's [Voice Pipeline Agent](https://docs.livekit.io/agents/voice-agent/voice-pipeline/) using [Cartesia](https://www.cartesia.ai/) TTS, GPT-4o-mini, and divine halo animations.

Experience real-time voice conversations with stunning visual feedback that responds to every word.

## ✨ Features

### 🎨 Three Stunning Visualization Modes

1. **Divine Halo** - Radiant purple rings that expand and pulse with your voice
2. **Particles** - Circular wave patterns with flowing gradient particles  
3. **Wave** - Dynamic dual waveforms with floating particle effects

### 🎯 Interactive Controls

- **Face Image Upload** - Place your photo in the center of the halo
- **Sensitivity Control** - Fine-tune responsiveness (10-200%, default 2%)
- **Real-time Mode Switching** - Seamlessly transition between visualizations
- **Dark Theme** - Sleek interface with purple accents

## Live Demo

https://cartesia-assistant.vercel.app/

![Screenshot of the Divine Halo Voice Agent](.github/screenshot.png)

## 🚀 Running the Example

### Prerequisites

- Node.js 14+
- Python 3.9-3.12
- LiveKit Cloud account (or OSS LiveKit server)
- Cartesia API key (for speech synthesis)
- OpenAI API key (for LLM)
- Deepgram API key (for speech-to-text)
- Modern web browser with Canvas support

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Copy `.env.example` to `.env.local` and configure:
```bash
cp .env.example .env.local
```

3. Set your environment variables in `.env.local`:
```
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret
NEXT_PUBLIC_LIVEKIT_URL=wss://your-project.livekit.cloud
```

4. Install dependencies and run:
```bash
npm install
npm run dev
```

The frontend will be available at `http://localhost:3000`

### Agent Setup

1. Navigate to the agent directory:
```bash
cd agent
```

2. Copy `.env.example` to `.env` and configure:
```bash
cp .env.example .env
```

3. Set your environment variables in `.env`:
```
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret
CARTESIA_API_KEY=your_cartesia_api_key
OPENAI_API_KEY=your_openai_api_key
DEEPGRAM_API_KEY=your_deepgram_api_key
```

4. Create virtual environment and install dependencies:
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

5. Run the agent:
```bash
python main.py dev
```

## 🎮 Using the Voice Agent

1. **Start a Conversation** - Click "Start a conversation" to begin
2. **Choose Visualization** - Select between Divine Halo, Particles, or Wave modes
3. **Adjust Sensitivity** - Use the slider to control animation responsiveness
4. **Upload Your Photo** - Click "Upload Face Image" to personalize the center
5. **Select Voice** - Choose from available Cartesia voices in the side panel

### Visualization Details

- **Divine Halo Mode**: Features multiple concentric rings that expand based on voice amplitude. When speaking, rays of light emanate from the center, creating an ethereal effect.

- **Particles Mode**: 200 particles arranged in a circle perform smooth wave motions. The wave amplitude and particle size respond to voice input, creating a mesmerizing flow.

- **Wave Mode**: Combines a circular waveform with a linear spectrum display. Floating particles add depth to the visualization.

## 🛠 Technical Architecture

### Audio Processing
- Real-time frequency analysis using Web Audio API
- Multi-band frequency processing with LiveKit
- Normalized amplitude calculation with dynamic range compression

### Visualization Engine
- Canvas-based rendering at 60 FPS
- Hardware-accelerated animations
- Responsive design for mobile and desktop

### Voice Pipeline
- **Speech-to-Text**: Deepgram
- **LLM**: OpenAI GPT-4o-mini
- **Text-to-Speech**: Cartesia Sonic v2
- **WebRTC**: LiveKit for ultra-low latency

## 🎨 Customization

### Adjust Visualization Parameters

Edit sensitivity and thresholds in `DivineHaloVisualizer.tsx`:
```typescript
const noiseFloor = 0.001;    // Minimum threshold
const normalSpeech = 0.01;   // Normal speaking level
const loudSpeech = 0.03;     // Loud speaking level
```

### Change Color Scheme

Modify the color values in the visualization classes:
```typescript
// Purple theme colors
'rgba(138, 43, 226, alpha)'  // Primary purple
'rgba(186, 85, 211, alpha)'  // Light purple
'rgba(230, 230, 250, alpha)' // Lavender
```

## 📝 License

This project is licensed under the Apache License 2.0 - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built on [LiveKit](https://livekit.io) real-time communication infrastructure
- Powered by [Cartesia](https://cartesia.ai) for natural voice synthesis
- Uses [Deepgram](https://deepgram.com) for accurate speech recognition
- Enhanced with divine visualization inspired by audio reactive art

---

*Experience the future of voice interaction with stunning visual feedback* ✨