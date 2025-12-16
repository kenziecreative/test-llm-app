### Requirement: Initial Project Setup

This specification SHALL outline the initial setup of the project, including the creation of the basic file structure and configuration.

#### Scenario: Initialize the project
WHEN a new project is created from this template
THEN the project SHALL have the following structure:
- `web/`: Next.js frontend application
- `packages/engine/`: Server-side logic engine
- `supabase/`: Supabase migrations
- `openspec/`: OpenSpec directory
