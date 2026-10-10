# RETDEMQUEST

A working personal nursing-practice website inspired by the supplied reference design. Built with React, TypeScript, Vite, and Lucide icons. All fonts and illustrations are included locally; the app does not require API keys, a database, or an image service.

## Run the website

Use Node.js 24 (tested), or a Node version supported by the pinned Vite package.

```sh
cd /workspace/RETDEMCHECK
npm ci
npm run dev
```

Vite prints the development address. On your own computer, open it in a browser. In the Codex cloud environment, the server is used for internal validation; the onboarding UI does not provide a web preview.

## What works

- Three six-question procedures: NGT tube feeding, wound dressing, and vital signs assessment.
- Answer selection, submission, immediate feedback, explanations, and six-step navigation.
- Completed-run review and replay. Earn 50 points per correct answer; only the best run score for each procedure contributes to the total.
- Procedure search, personal records, answer accuracy, recent practice, day streaks, and earned achievements.
- Profile name editing, completion notifications, and a confirmed progress reset.
- Progress persists through page reloads using this browser’s local storage.
- Responsive layouts, keyboard controls, focus-trapped dialogs, and reduced-motion support.

The leaderboard page shows **your personal records**. There are no accounts, server storage, instructor tools, or synchronization across devices. Clearing browser data removes the saved progress. History retains the latest 100 completed runs and 365 practice days; best scores and procedure completion remain saved independently. Accuracy is calculated from retained completed runs and your current incomplete runs.

## Change the practice content

Edit `src/data.ts` to change the procedures, patient details, questions, answer options, and explanations. The `correct` field is the zero-based index of the correct choice: `0` for A, `1` for B, `2` for C. The current UI expects three procedures with six questions and three choices each.

`src/App.tsx` contains the screens and practice interactions. `src/storage.ts` manages saved progress and metrics. `src/styles.css` controls the design, and `public/` contains the original SVG illustrations.

These are **demonstration educational scenarios**. Have a qualified nursing instructor review and approve the content before formal teaching or assessment. Follow current institutional protocols for real patient care.

## Verify the website

```sh
npm run build
npm test
```

The browser tests cover correct and incorrect answers, all three completed procedures, replay scoring, reload persistence, search and navigation, profile updates and reset, corrupt-storage recovery, mobile overflow, and keyboard/dialog behavior. Tests use `/usr/bin/chromium` when it exists. On another computer, first run `npx playwright install chromium`, or set `PLAYWRIGHT_CHROMIUM_EXECUTABLE` to your Chromium executable.

## Put it online

```sh
npm run build
```

Deploy the generated `dist/` directory to a static host such as Netlify or Vercel. Use `npm run build` as the build command and `dist` as the output directory. This configuration assumes the site is hosted at the domain root. No server-side secrets are needed. Deployment has not been performed automatically.

For shared student accounts, cloud progress, or an actual class leaderboard, add a backend with authentication and a database in a separate development step.
