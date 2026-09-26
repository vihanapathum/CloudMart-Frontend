# CloudMart — Frontend

**Live URL:** [ADD YOUR CLOUD RUN URL HERE AFTER DEPLOYING]

## Project Description

Plain HTML/CSS/JavaScript frontend for CloudMart - no build step, no
framework. It calls the API Gateway directly to prove all three backend
microservices (Product, Order, User) are reachable and working end to end.
UI design is intentionally minimal per the module guidelines (UI is not
evaluated - functional API consumption is).

## Technology Stack

- HTML5 / CSS3 / vanilla JavaScript (`fetch`)
- Nginx (Alpine) container
- Deployed to Google Cloud Run (PaaS / Serverless, as required)

## Setup / Getting Started

### Run locally

Just open `index.html` in a browser, or serve the folder with any static
file server. Make sure the backend (API Gateway on :8080) is running, or
edit `config.js` to point elsewhere.

### Before deploying

Edit `config.js` and set `API_BASE_URL` to your deployed Load Balancer /
API Gateway address.

### Build and deploy to Cloud Run

```bash
gcloud builds submit --tag gcr.io/<YOUR_GCP_PROJECT_ID>/cloudmart-frontend
gcloud run deploy cloudmart-frontend \
  --image gcr.io/<YOUR_GCP_PROJECT_ID>/cloudmart-frontend \
  --platform managed \
  --allow-unauthenticated \
  --region <YOUR_REGION>
```

Copy the resulting URL into this README's "Live URL" line above **and**
into this repository's GitHub "About" description, as required by the
module guidelines.

## Student Information

- **Student Name:** A.G.Vihana Pathum Piyasiri
- **Student Number:** 2301692038
- **Slack Handle:** vihana_piyasiri
- **GCP Project ID:** project-1023ef7b-f75c-4e17-ab5
