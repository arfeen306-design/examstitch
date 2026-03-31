# Promo Video Skill — New User Setup Guide

Create professional AI-powered promotional videos using Remotion, ElevenLabs voiceover, and background music — all from inside Antigravity (Claude Code).

---

## Step 1: Install Required Dependencies

You need **4 tools** installed on your machine before the skill will work.

---

### 1. Node.js (v18 or higher)

Used to build the Remotion video project.

**Mac (Step 1 of 2): Install Homebrew**

Homebrew is a package manager required to install Node.js on Mac. If you don't have it yet, run this in your Terminal:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

> Verify Homebrew installed correctly by running: `brew --version`
> After installation, follow any on-screen instructions (it may ask you to add Homebrew to your PATH). Then proceed to Step 2 of 2 below.

**Mac (Step 2 of 2): Install Node.js via Homebrew**

```bash
brew install node
```

**Windows:**
Download the LTS installer from **https://nodejs.org** and run it.

**Linux:**
```bash
sudo apt install nodejs npm
```

Verify:
```bash
node --version
```

---

### 2. Python 3.x

Used to run the voiceover generation script.

**Mac:**
```bash
brew install python
```

**Windows:**
Download from **[https://python.org](https://www.python.org/downloads/release/python-31311/)**
> During install, check **"Add Python to PATH"** — this is required.

**Linux:**
```bash
sudo apt install python3 python3-pip
```

Verify:
```bash
python --version       # Windows
python3 --version      # Mac / Linux
```

---

### 3. ffmpeg

Used to mix voiceover audio with background music and produce the final video.

**Mac:**
```bash
brew install ffmpeg
```

**Windows:**
```powershell
winget install ffmpeg
```
Or download manually from **https://ffmpeg.org/download.html**, extract the zip, and add the `bin/` folder to your system PATH.

**Linux:**
```bash
sudo apt install ffmpeg
```

Verify:
```bash
ffmpeg -version
```

---

### 4. Whisper (Python package)

Used to transcribe the generated voiceover and verify it is correctly timed with the video scenes.

**Windows:**
```powershell
pip install openai-whisper
```

**Mac / Linux:**
```bash
pip3 install openai-whisper
```

Verify:
```bash
python -c "import whisper; print('Whisper OK')"     # Windows
python3 -c "import whisper; print('Whisper OK')"    # Mac / Linux
```

---

## Step 2: Install Antigravity

Download and install **Antigravity** from:
**https://antigravity.google/download**

This is the AI agent that runs the skill for you.

---

## Step 3: Install the Skill

Open your terminal and run:

```bash
npx skills add divakarwl12/skills
npx skills add remotion-dev/skills
```

> Works on Mac, Windows (PowerShell / Git Bash), and Linux.

---

## Step 4: Get an ElevenLabs API Key (Free)

The skill uses ElevenLabs to generate the AI voiceover.

1. Go to **https://elevenlabs.io** and sign up for free
2. Click your profile icon → **API Keys** → **Create API Key**
3. Copy the key

> When you run the skill, it will **automatically create a `.env` file** in your project folder.
> You just open that file and paste your API key in. No manual setup needed.

---

## Step 5: Verify Everything is Ready

Run this single command to check all 4 tools at once:

**Windows (PowerShell):**
```powershell
node --version; python --version; ffmpeg -version; python -c "import whisper; print('Whisper OK')"
```

**Mac / Linux:**
```bash
node --version && python3 --version && ffmpeg -version && python3 -c "import whisper; print('Whisper OK')"
```

All four should print version numbers / "Whisper OK" with no errors. If anything fails, install that tool first.

---

## Step 6: Run the Skill in Antigravity

Open Antigravity, go to your project folder, and type:

```
/promo-video
```

The skill will:
1. Ask you questions about your product (brand name, features, target audience, CTA)
2. Ask for video duration (30s / 60s / 90s), theme (light/dark), and voice
3. Build the full Remotion video with animations and transitions
4. Generate AI voiceover using ElevenLabs (Liam voice by default)
5. Mix in background music at 10% volume
6. Render the final MP4 video

---

## What You Do NOT Need to Install Manually

- **Remotion** — automatically downloaded by `npx` when the skill creates the video project
- **React / TypeScript** — included inside the Remotion project automatically
- **npm packages (lucide-react, etc.)** — installed automatically inside the project folder

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `node: command not found` | Install Node.js from https://nodejs.org |
| `python: command not found` | Install Python from https://python.org (check "Add to PATH") |
| `ffmpeg: command not found` | Install ffmpeg — Windows: `winget install ffmpeg`, Mac: `brew install ffmpeg` |
| `ModuleNotFoundError: No module named 'whisper'` | Run `pip install openai-whisper` (Win) or `pip3 install openai-whisper` (Mac) |
| `.env file not found / API key error` | Open the `.env` file created in your project folder and paste your ElevenLabs key |
| `brew: command not found` (Mac) | Install Homebrew first — see Step 1 above for the install command |
| Empty project folders being created repeatedly | A stray `.git` folder exists in your home directory. Delete it: `rm -rf ~/.git` |
| Interactive prompts appear during project creation | Press **Enter** to accept each default — the skill handles this automatically |

---

## Available Voices

| Voice | Style | Voice ID |
|-------|-------|----------|
| **Liam** *(Recommended)* | Natural, conversational male | `TX3LPaxmHKxFdv7VOQHJ` |
| Adam | Deep, confident male | `pNInz6obpgDQGcFmaJgB` |
| Bella | Warm, expressive female | `hpp4J3VqNfWAUOO0d1Us` |
| Alice | Clear, professional female | `Xb7hH8MSUJpSbSDYk0k2` |

---

## Available Background Music (Royalty-Free)

All tracks are bundled with the skill — no download needed:

| Track | Style |
|-------|-------|
| Upbeat Corporate | Energetic, inspiring, corporate feel |
| Motivational Day | Uplifting, commercial, background |
| Inspired Ambient | Ambient, beautiful, advertising feel |

---

*Built with Remotion + ElevenLabs + ffmpeg + Whisper*
