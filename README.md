# CampusKind MVP

CampusKind is a HackDavis-style campus mutual-aid prototype. It lets switchable demo users request/offer small voluntary assists, review AI-style safety checks, use ConsentShare for contact-sharing consent, use SafeMeet for public meetup suggestions, and view an admin safety dashboard.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Build check

```bash
npm run build
npm start
```

## Docker / Vultr

```bash
docker compose up -d --build
```

Open http://YOUR_SERVER_IP:3000 and make sure TCP port 3000 is open in the Vultr firewall.
