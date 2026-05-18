# Plant Disease Diagnosis - Dependencies Guide

This document explains the purpose of each dependency used in this project.

## Client dependencies

| Dependency | Use in project |
| --- | --- |
| `react` | Core UI library used to build the frontend component tree. |
| `react-dom` | Renders React components into the browser DOM. |
| `@mui/material` | Main Material UI component library for buttons, forms, layout, cards, and other UI elements. |
| `@mui/icons-material` | Ready-to-use Material UI icon set used across UI actions and status indicators. |
| `@emotion/react` | CSS-in-JS runtime used by MUI for styling components and theme-based styles. |
| `@emotion/styled` | Styled API for creating reusable styled components, especially with MUI. |
| `@reduxjs/toolkit` | Standard Redux toolkit for state management, slices, and async logic setup. |
| `react-redux` | React bindings for Redux, providing hooks like `useSelector` and `useDispatch`. |

## Client dev dependencies

| Dependency | Use in project |
| --- | --- |
| `vite` | Development server and build tool for fast frontend development and optimized production builds. |
| `@vitejs/plugin-react` | Enables React support in Vite, including JSX transform and fast refresh. |
| `eslint` | Linting engine used to detect code quality issues and enforce style rules. |
| `@eslint/js` | Official base JavaScript rule presets for ESLint flat config. |
| `eslint-plugin-react-hooks` | Enforces correct React Hooks usage and dependency rules. |
| `eslint-plugin-react-refresh` | Lint rules that help keep files compatible with React Fast Refresh behavior. |
| `globals` | Predefined global variables for browser/node environments in ESLint configs. |
| `@types/react` | Type definitions for React (useful for editor IntelliSense and type-aware tooling). |
| `@types/react-dom` | Type definitions for ReactDOM APIs. |

## Server dependencies

| Dependency | Use in project |
| --- | --- |
| `express` | Main web framework for API routes and middleware pipeline. |
| `mongoose` | ODM for MongoDB schemas, models, validation, and database access. |
| `dotenv` | Loads environment variables from `.env` files into `process.env`. |
| `cors` | Enables and controls cross-origin requests from the frontend. |
| `cookie-parser` | Parses cookies from incoming request headers. |
| `jsonwebtoken` | Creates and verifies JWT tokens for authentication/authorization flows. |
| `bcrypt` | Hashes and compares passwords securely. |
| `zod` | Schema-based runtime validation for request payloads and data shapes. |
| `helmet` | Sets secure HTTP headers to harden API responses. |
| `express-rate-limit` | Limits request rates to reduce abuse and brute-force attempts. |
| `express-mongo-sanitize` | Prevents MongoDB operator injection via request sanitization. |
| `morgan` | HTTP request logger for debugging and request monitoring. |
| `uuid` | Generates unique identifiers where stable random IDs are needed. |
| `ms` | Utility for parsing and formatting time strings like `15m` or `7d`. |
| `nodemon` | Auto-restarts the backend server when files change during development. |

## Note

`nodemon` is currently listed under server runtime dependencies, but it is usually a development-only dependency (`devDependencies`).
