# OAuth Provider Setup Guide

This guide explains how to configure Google OAuth 2.0 and Apple Sign In for the BMad Recette application.

## Google OAuth Setup

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to "APIs & Services" > "Credentials"

### 2. Configure OAuth Consent Screen

1. Click "OAuth consent screen" in the left sidebar
2. Select "External" user type (or "Internal" if using Google Workspace)
3. Fill in required fields:
   - App name: `BMad Recette`
   - User support email: Your email
   - Developer contact email: Your email
4. Add scopes:
   - `userinfo.email`
   - `userinfo.profile`
5. Add test users (for development)
6. Save and continue

### 3. Create OAuth 2.0 Credentials

1. Go to "Credentials" > "Create Credentials" > "OAuth 2.0 Client ID"
2. Application type: **Web application**
3. Name: `BMad Recette Web Client`
4. Authorized JavaScript origins:
   - Development: `http://localhost:5173`
   - Production: `https://app.bmadrecette.com`
5. Authorized redirect URIs:
   - Development: `http://localhost:3001/api/auth/google/callback`
   - Production: `https://api.bmadrecette.com/api/auth/google/callback`
6. Click "Create"
7. Copy the **Client ID** and **Client Secret**

### 4. Add Credentials to Environment

Add to `apps/api/.env`:

```bash
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3001/api/auth/google/callback
```

For production, update `GOOGLE_CALLBACK_URL` to:
```bash
GOOGLE_CALLBACK_URL=https://api.bmadrecette.com/api/auth/google/callback
```

---

## Apple Sign In Setup

### 1. Apple Developer Account Requirements

- Active Apple Developer Program membership ($99/year)
- Access to [Apple Developer Portal](https://developer.apple.com/account)

### 2. Create App ID

1. Go to "Certificates, Identifiers & Profiles"
2. Click "Identifiers" > "+" to create new identifier
3. Select "App IDs" and click "Continue"
4. Select "App" and click "Continue"
5. Fill in details:
   - Description: `BMad Recette`
   - Bundle ID: `com.bmadrecette.app` (or your chosen ID)
6. Enable "Sign in with Apple" capability
7. Click "Continue" and "Register"

### 3. Create Services ID

1. Go to "Identifiers" > "+" to create new identifier
2. Select "Services IDs" and click "Continue"
3. Fill in details:
   - Description: `BMad Recette Sign In`
   - Identifier: `com.bmadrecette.signin`
4. Click "Continue" and "Register"
5. Click on the newly created Service ID
6. Enable "Sign in with Apple"
7. Click "Configure" next to "Sign in with Apple"
8. Configure Web Authentication:
   - Primary App ID: Select your App ID from step 2
   - Domains and Subdomains:
     - Development: `localhost` (Note: Apple doesn't support http://localhost in production)
     - Production: `api.bmadrecette.com`
   - Return URLs:
     - Development: `http://localhost:3001/api/auth/apple/callback`
     - Production: `https://api.bmadrecette.com/api/auth/apple/callback`
9. Click "Save", then "Continue", then "Register"

### 4. Create Private Key

1. Go to "Keys" > "+" to create new key
2. Key Name: `BMad Recette Sign In Key`
3. Enable "Sign in with Apple"
4. Click "Configure" and select your Primary App ID
5. Click "Save", then "Continue"
6. Click "Register"
7. **Download the key file** (you can only download it once!)
8. Note the **Key ID** (e.g., `ABC123XYZ`)

### 5. Get Team ID

1. Go to "Membership" in the Apple Developer Portal
2. Copy your **Team ID** (e.g., `ABC123XYZ`)

### 6. Add Credentials to Environment

1. Open the downloaded private key file (`.p8` extension)
2. Copy the entire content including headers

Add to `apps/api/.env`:

```bash
APPLE_CLIENT_ID=com.bmadrecette.signin
APPLE_TEAM_ID=ABC123XYZ
APPLE_KEY_ID=KEY123ABC
APPLE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFA...\n-----END PRIVATE KEY-----
APPLE_CALLBACK_URL=http://localhost:3001/api/auth/apple/callback
```

**Important Notes:**
- Keep the private key secure (never commit to git)
- Use `\n` for newlines in the private key string
- For production, update `APPLE_CALLBACK_URL` to HTTPS endpoint

---

## Frontend Configuration

Add to frontend `.env`:

```bash
FRONTEND_URL=http://localhost:5173
```

For production:
```bash
FRONTEND_URL=https://app.bmadrecette.com
```

---

## Testing OAuth Flow

### Google OAuth Test

1. Start the API server: `npm run dev` (in apps/api)
2. Navigate to: `http://localhost:3001/api/auth/google`
3. Sign in with your Google account
4. You should be redirected to: `http://localhost:5173/auth/success?token=<jwt_token>`
5. Check browser cookies for `refreshToken` (httpOnly)

### Apple Sign In Test

1. Start the API server: `npm run dev` (in apps/api)
2. Navigate to: `http://localhost:3001/api/auth/apple`
3. Sign in with your Apple ID
4. You should be redirected to: `http://localhost:5173/auth/success?token=<jwt_token>`
5. Check browser cookies for `refreshToken` (httpOnly)

**Note:** Apple Sign In requires HTTPS in production and doesn't work well with `http://localhost` in some cases. For local testing, you may need to use ngrok or similar tunneling service.

---

## GitHub Secrets (CI/CD)

For GitHub Actions, add these secrets:

```
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
GOOGLE_CALLBACK_URL
APPLE_CLIENT_ID
APPLE_TEAM_ID
APPLE_KEY_ID
APPLE_PRIVATE_KEY
APPLE_CALLBACK_URL
```

Go to: Repository Settings > Secrets and variables > Actions > New repository secret

---

## Troubleshooting

### Google OAuth

**Error:** "redirect_uri_mismatch"
- **Solution:** Ensure the redirect URI in your Google Cloud Console exactly matches the one in your `.env` file (including protocol and port)

**Error:** "Access blocked: This app's request is invalid"
- **Solution:** Configure the OAuth consent screen and add your email as a test user

### Apple Sign In

**Error:** "invalid_client"
- **Solution:** Verify your Service ID, Team ID, and Key ID are correct

**Error:** "invalid_request"
- **Solution:** Check that your return URL is configured correctly in the Services ID settings

**Error:** Private key format error
- **Solution:** Ensure the private key includes `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----` headers and uses `\n` for newlines

---

## Security Checklist

- [ ] OAuth credentials stored in environment variables (never in code)
- [ ] `.env` files added to `.gitignore`
- [ ] Private keys never committed to repository
- [ ] Production callback URLs use HTTPS
- [ ] OAuth consent screens configured with accurate information
- [ ] Test users added for development
- [ ] GitHub Secrets configured for CI/CD

---

## Additional Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Apple Sign In Documentation](https://developer.apple.com/sign-in-with-apple/)
- [Passport.js Google Strategy](https://www.passportjs.org/packages/passport-google-oauth20/)
- [Passport.js Apple Strategy](https://www.npmjs.com/package/passport-apple)
