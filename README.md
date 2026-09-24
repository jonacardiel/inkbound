<h1 align="center">Inkbound</h1>

<p align="center">A D&amp;D 5e character creator and character sheet for your phone, illustrated like an old engraved storybook.<br>Works offline. Your heroes stay on your device.</p>

<p align="center">
  <a href="https://github.com/jonacardiel/inkbound/releases/latest/download/Inkbound.apk">
    <img alt="Download for Android" src="https://img.shields.io/badge/Download%20for%20Android-APK-d4a24c?style=for-the-badge&logo=android&logoColor=white" height="64">
  </a>
  &nbsp;
  <a href="https://jonacardiel.github.io/inkbound/">
    <img alt="Open on iPhone" src="https://img.shields.io/badge/iPhone-Open%20in%20Safari-6b6b6b?style=for-the-badge&logo=apple&logoColor=white" height="64">
  </a>
</p>

## Android: install

1. Tap **Download for Android** above. The file is about 190 MB.
2. Open the downloaded **Inkbound.apk** (from the notification or your Downloads folder).
3. If your phone says it can't install apps from this source, tap **Settings**, turn on **Allow from this source**, then go back and tap **Install**.
4. If Play Protect warns about an unknown app, tap **More details**, then **Install anyway**. It warns because the app isn't from the Play Store.

To update, download and install again. Your heroes are kept.

## iPhone: add to your Home Screen

1. Open **[jonacardiel.github.io/inkbound](https://jonacardiel.github.io/inkbound/)** in **Safari**.
2. Tap the **Share** button, then **Add to Home Screen**.
3. Open Inkbound from the new icon. After the first visit it works offline too.

## What's inside

- A visual character creator: races, classes and backgrounds as illustrated cards.
- A live character sheet: HP, AC, skills, attacks, spells, inventory and level-ups.
- 3D dice with sounds.
- Backups: save your heroes to a file and restore them on another device.

---

<sub>Rules content from the System Reference Documents 5.1 and 5.2 by Wizards of the Coast LLC, licensed under CC BY 4.0. Inkbound is an unofficial fan tool, not affiliated with or endorsed by Wizards of the Coast.</sub>

<details>
<summary>For developers</summary>

Expo (React Native) app, TypeScript, routes in `src/app/`.

```bash
npm install
npx expo start
```

Checks: `npx tsc --noEmit`, `npx expo lint`, `npx jest`. Android APK: `npx eas-cli@latest build -p android --profile preview`. The web version deploys to GitHub Pages from `main` via `.github/workflows/deploy-web.yml`.

</details>
