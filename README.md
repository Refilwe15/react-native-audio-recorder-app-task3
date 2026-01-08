VOICE RECORDER APP (REACT NATIVE + EXPO)

A modern Voice Recorder mobile application built using React Native, Expo, and TypeScript.
The app allows users to record audio, save recordings locally, play them back, search recordings, and delete recordings.

FEATURES

Record high-quality audio

Recording timer with animated waves

Save recordings with custom names

View all saved recordings

Play / Pause audio

Rewind & Fast-forward controls

Search recordings by name

Delete recordings

Persistent storage using AsyncStorage

Clean and modern UI

Android APK build support

TECH STACK

React Native

Expo

TypeScript

expo-av (Audio recording & playback)

AsyncStorage (Local storage)

React Navigation

Expo Vector Icons

PROJECT STRUCTURE

.
├── assets/
│ ├── landing.png
│ └── home.png
├── screens/
│ ├── LandingScreen.tsx
│ └── SavedRecordingsScreen.tsx
├── App.tsx
├── package.json
├── tsconfig.json
└── README.txt

GETTING STARTED

Install dependencies

npm install
OR
yarn install

Start the app

npx expo start

Scan the QR code using Expo Go on your Android device.

PERMISSIONS

The app requires Microphone access for recording audio.