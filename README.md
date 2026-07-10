# Dry Run — Browser-Based 6-DOF Robotic Arm Simulator & Control Suite

**Team Straw Hat · Techathon 2026 Final Round (IUT Robotics Society)**

> 🔗 **Live demo:** _coming soon_ · 🎥 **Demo video:** _coming soon_

One motion-control pipeline, five ways to drive it: dashboard, joystick, keyboard, voice, and a fully autonomous PIN-typing sequence — all in the browser, no hardware required.

## Problem summary

_(to be completed — see docs/problem-statement.pdf)_

## Architecture

_(diagrams + rationale to be added: one pipeline / five triggers, safety gate, DLS IK planner)_

## The MotionCommand contract

_(spec to be added)_

## Inverse kinematics

_(DLS method description to be added)_

## Voice control

_(grammar table to be added)_

## Agentic voice layer (Phase 3B)

_(model, prompt design, safety gate description to be added)_

## Electrical schematic (Wokwi)

_(link, screenshot, power budget to be added — see hardware/)_

## Run locally

```bash
npm install
npm run dev
```

Optional: `cp .env.example .env.local` and add a Groq key to enable the agentic voice layer.

## Tech stack & attribution

three.js (MIT) · urdf-loader by gkjohnson (MIT) · Web Speech API · Groq API · Vite · Tailwind CSS · zustand · zod · Wokwi

## Team contributions

_(table to be completed)_

## Challenges & future scope

_(to be completed)_
