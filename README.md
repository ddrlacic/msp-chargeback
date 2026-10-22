# MSP Chargeback

Shareable prototype for MSP chargebacks. Built with the MSP technology stack (Angular 21, zoneless, signals, Tailwind v4) and the menu-app look and feel.

Live: https://ddrlacic.github.io/msp-chargeback/

## Develop

```
npm ci
npx ng serve
```

Open http://localhost:4200/#.

To see the current MSP for reference, run it in a second terminal:

```
cd ../msp-ui && npx ng serve
```

Open http://localhost:8080/.

## Test and build

```
ng test
ng build
```

## Publish

Push to `main`. The workflow in `.github/workflows/deploy.yml` builds with `--base-href /msp-chargeback/` and deploys to GitHub Pages. Routing uses hash URLs, so any link works when shared.

## Workspace

Open `../msp-chargeback.code-workspace` to work on the prototype with `msp-ui` and `menu-app` alongside as references.
