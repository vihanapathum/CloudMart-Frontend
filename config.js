// Base URL of the API Gateway (or the Load Balancer sitting in front of it).
// Local dev default below. AFTER you deploy the backend, update this to your
// Load Balancer's IP/domain or the Gateway's external IP, then rebuild and
// redeploy this frontend to Cloud Run.
const API_BASE_URL = "http://localhost:8080";
