# FOUNDLY Mobile App Rules

## Project

Foundly is a modern Lost & Found platform that helps people:

- Report lost items
- Upload found items
- Search nearby items
- Claim ownership securely
- Earn rewards for returning items
- Build trust through successful returns

The application should feel premium, trustworthy, fast and minimal.

Never redesign the product.

Follow the Figma design as closely as possible.

---

# Tech Stack

Framework:
- React Native
- Expo SDK 54

Language:
- JavaScript ONLY

Navigation:
- React Navigation Native Stack

Styling:
- React Native StyleSheet

Icons:
- Expo Vector Icons (when needed)

Image handling:
- ImageBackground
- Image
- Expo Image only if already installed

No TypeScript.

No NativeWind.

No UI libraries unless requested.

---

# Folder Structure

assets/
    images/
    icons/

components/
    common/
    buttons/
    cards/
    inputs/

constants/

hooks/

navigation/

screens/

services/

utils/

Never create duplicate folders.

Never change this structure.

---

# Navigation Rules

Current navigation must remain intact.

Never rename routes.

Never rename navigation files.

Never break navigation.

If a new screen is needed,
add it to the existing navigator only.

---

# Coding Style

Always use:

Functional Components

Example:

export default function HomeScreen() {}

Use Hooks only.

No class components.

No inline styles unless absolutely necessary.

Use descriptive variable names.

Keep components small.

Extract reusable UI into components.

---

# File Size

Maximum preferred file size:

250 lines

If a screen becomes large:

Extract sections into components.

Example:

components/

HeroSection.js

SearchCard.js

CategoryCard.js

BottomCTA.js

---

# Styling Rules

Always use:

StyleSheet.create()

Example:

const styles = StyleSheet.create({})

Never use:

inline style objects everywhere

Never hardcode repeated colors.

Use constants/colors.js.

---

# Color Palette

Primary

#2563EB

Primary Dark

#1D4ED8

Background

#F8FAFC

White

#FFFFFF

Text Primary

#111827

Text Secondary

#6B7280

Border

#E5E7EB

Danger

#EF4444

Success

#22C55E

Warning

#F59E0B

---

# Border Radius

Cards

24

Buttons

18

Inputs

16

Small

12

Pills

999

---

# Shadows

Keep shadows soft.

Avoid heavy Android shadows.

Prefer subtle elevation.

---

# Typography

Large Title

36

Screen Title

30

Heading

24

Subheading

20

Body

16

Caption

14

Tiny

12

Font Weight

400

500

600

700

---

# Spacing

Base spacing:

8

Use multiples:

8

12

16

20

24

32

40

48

Avoid random spacing values.

---

# Buttons

Primary

Blue background

White text

Rounded corners

Secondary

White background

Blue border

Ghost

Transparent

Text only

---

# Inputs

Rounded

Light border

16px padding

Large touch target

---

# Cards

Rounded corners

Soft shadow

White background

Padding 20-24

---

# Images

Store images only in:

assets/images

Never download images automatically.

Use require().

---

# Assets

Icons:

assets/icons

Images:

assets/images

Logos:

assets/images/logo.png

Never reference external image URLs.

---

# Naming Convention

Screen

LoginScreen.js

HomeScreen.js

SearchScreen.js

Component

PrimaryButton.js

SearchCard.js

ItemCard.js

Helper

formatDate.js

api.js

---

# API

All API calls belong inside:

services/

Never fetch directly inside UI if it can be avoided.

---

# State

Local state:

useState

Shared state later:

Context API

Never introduce Redux.

---

# Animations

Keep animations simple.

Fade

Slide

Scale

No complex animation libraries unless requested.

---

# Performance

Avoid unnecessary re-renders.

Memoize reusable components if needed.

Avoid deeply nested Views.

Use FlatList for lists.

Never use ScrollView for hundreds of items.

---

# Code Quality

Write production-ready code.

No placeholder hacks.

No duplicated code.

No console.log left in production.

No unused imports.

No commented-out code.

---

# Installation Rules

Never modify package.json unless instructed.

Never upgrade Expo.

Never install packages automatically.

Always ask first if a package is required.

---

# Git Rules

Do not rename folders.

Do not move files.

Do not delete files.

Only modify files required for the requested task.

---

# Working Rules

Implement ONE screen at a time.

Do not build multiple screens unless requested.

Do not invent extra features.

Do not redesign UI.

Match the Figma design as closely as possible.

If something is missing from the design, ask before assuming.

---

# Response Format

When generating code:

1. List every file that will be created.
2. List every file that will be modified.
3. Explain briefly what changed.
4. Then provide the complete code.
5. Never provide partial snippets unless requested.

---

# Goal

The goal is to build a clean, scalable, production-ready React Native application that matches the Figma design while keeping the codebase modular, maintainable, and easy to extend.



Splash ✅
git commit

Onboarding ✅
git commit

Login ✅
git commit

Signup ✅
git commit

Home ✅
git commit