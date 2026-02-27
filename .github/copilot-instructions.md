# GitHub Copilot Instructions for Medusa Monorepo

## Overview
This document provides guidance for AI agents working on the Medusa monorepo, which includes both the backend and storefront components. It aims to ensure consistency, quality, and adherence to best practices.

## Coding Conventions
- Follow standard JavaScript/TypeScript syntax as applicable.
- Use ES6+ features where supported.
- Ensure code readability: meaningful variable/function names and consistent indentation.
- Adhere to the team's stylistic standards and linters (e.g., ESLint, Prettier).

## Commands
- **Starting the Development Server**:  Use `npm start` for the backend and `npm run dev` for the storefront.
- **Building the Project**: Use `npm run build` for production builds.
- **Running Migrations**: Use `npm run migrate` to apply database changes.

## Docker Usage
- To build Docker images, use the command: `docker-compose build`.
- To run the application with Docker: `docker-compose up`.
- Ensure to check for the correct version of Docker installed.

## Environment Handling
- Use a `.env` file for local environment variables.
- Make sure sensitive information (API keys, passwords) is not shared publicly.
- Use environment-specific configuration with fallbacks when necessary.

## Testing
- Use `npm test` to run the unit and integration tests.
- Ensure all new code has associated tests.
- Follow TDD practices where applicable.

## Pull Request Checklist
- [ ] Code is properly documented.
- [ ] All tests pass.
- [ ] Changes have been tested locally.
- [ ] No console logs or commented-out code.
- [ ] PR description is clear and mentions relevant issues or features.
- [ ] All code reviews have been completed before merging.

---

For further clarification, please refer to the project's main documentation or reach out for help.
