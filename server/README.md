# Server

## Dependencies

The server currently uses these npm packages:

- `bcrypt`: hashes passwords before storage and compares login passwords safely.
- `cookie-parser`: reads cookies from incoming requests, typically for auth tokens or session-related values.
- `cors`: allows the frontend client to call the API from a different origin.
- `dotenv`: loads environment variables from a `.env` file into `process.env`.
- `express`: provides the HTTP server, routing, middleware pipeline, and request/response handling.
- `express-mongo-sanitize`: strips MongoDB operator characters like `$` and `.` from user input to reduce query injection risk.
- `express-rate-limit`: limits repeated requests to sensitive endpoints such as login or OTP routes.
- `helmet`: sets common security-related HTTP headers.
- `jsonwebtoken`: creates and verifies JWTs for authentication and authorization flows.
- `mongoose`: connects to MongoDB and defines/query models and schemas.
- `morgan`: logs incoming HTTP requests for debugging and monitoring.
- `ms`: converts human-readable durations like `15m` or `7d` into milliseconds and back.
- `nodemon`: restarts the server automatically during development when files change.
- `uuid`: generates unique identifiers where a database ObjectId is not the right fit.
- `zod`: validates and parses request payloads in a structured way.

## Scripts

- `npm run dev` starts the server with `nodemon`
- `npm start` starts the server with Node.js
- `npm run build` prints the placeholder build message because the server has no build step

## FastAPI Model Bridge

The diagnosis endpoint now forwards uploaded images to a FastAPI model service.

Required environment variables:

- `FASTAPI_URL` default: `http://127.0.0.1:8000`
- `FASTAPI_TIMEOUT_MS` default: `15000`

Flow:

1. React uploads `leafImage` to Node endpoint `POST /api/predict/diagnose`.
2. Node forwards the image to FastAPI `POST /predict`.
3. FastAPI returns disease prediction and confidence.
4. Node stores diagnosis in MongoDB and returns it to React.
