
# MatchProAI Event Management System

A comprehensive web-based soccer facility and tournament management platform designed to streamline administrative workflows for sports organizations, with advanced event management and communication capabilities.

## Deployment on Replit

This application is configured for easy deployment on Replit. Follow these steps to deploy:

1. Make sure all your changes are committed and the application is working in development mode.
2. Run the deploy script:
   ```
   ./deploy.sh
   ```
3. Once the deploy script completes, hit the "Deploy" button in Replit.

### What the Deploy Script Does

The `deploy.sh` script prepares the application for production deployment by:

1. Building the frontend with Vite
2. Compiling TypeScript server code to JavaScript
3. Setting up the production server configuration
4. Ensuring static files are properly served in production

### Deployment Structure

- **Frontend**: Built to `dist/public/`
- **Backend**: Compiled to `server/index.js`
- **Static Assets**: Accessible from both `dist/public/` and `server/public`

### Environment Configuration

The application requires a PostgreSQL database. The database URL should be set in the `.env` file:

```
DATABASE_URL=postgres://username:password@host:port/database
```

## Development

To run the application in development mode:

1. Start the application using the Replit workflow named "Start application"
2. The server will start at `http://localhost:5000`

## Tech Stack

- **Frontend**: React with Vite, Tailwind CSS, Framer Motion
- **Backend**: Express.js, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Key Capabilities**: Multi-role admin management, secure role-based access control, granular permission handling, mobile-responsive design, flexible email configuration

## License

This software is proprietary and subject to the following terms:

1. This software is not for resale or redistribution except by the original author.
2. The software may be resold with customer-specific branding only upon explicit approval from the original author.
3. All rights reserved.

Copyright (c) 2024 MatchProAI

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## Third-Party Licenses

This project uses several third-party packages under their respective licenses. See `package.json` for a complete list of dependencies.
