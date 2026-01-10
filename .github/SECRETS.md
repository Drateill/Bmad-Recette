# GitHub Secrets Configuration

This document outlines all required secrets and variables for the BMad Recette CI/CD pipelines.

## Required Secrets

Configure these secrets in GitHub repository settings: **Settings → Secrets and variables → Actions**

### Staging Environment Secrets

| Secret Name | Description | Example Value | Required For |
|------------|-------------|---------------|--------------|
| `DATABASE_URL_STAGING` | PostgreSQL connection string for staging | `postgresql://user:pass@host:5432/db` | Deployment |
| `REDIS_URL_STAGING` | Redis connection string for staging | `redis://host:6379` | Deployment |
| `JWT_SECRET_STAGING` | JWT signing secret for staging | `random-32-char-string` | Deployment |
| `RAILWAY_TOKEN` | Railway CLI authentication token | `<railway-token>` | Railway deployment |
| `RENDER_API_KEY` | Render API key for deployments | `<render-api-key>` | Render deployment |
| `RENDER_SERVICE_ID_STAGING` | Render service ID for staging API | `srv-xxxxx` | Render deployment |

### Future Production Secrets (Story 1.10+)

| Secret Name | Description |
|------------|-------------|
| `DATABASE_URL_PRODUCTION` | PostgreSQL connection string for production |
| `REDIS_URL_PRODUCTION` | Redis connection string for production |
| `JWT_SECRET_PRODUCTION` | JWT signing secret for production |
| `RENDER_SERVICE_ID_PRODUCTION` | Render service ID for production API |

### Optional Secrets (for enhanced features)

| Secret Name | Description | Required |
|------------|-------------|----------|
| `CODECOV_TOKEN` | Codecov upload token for private repos | Optional |
| `SLACK_WEBHOOK_URL` | Slack webhook for deployment notifications | Optional |
| `TURBO_TOKEN` | Turborepo remote cache token | Optional |

## Required Variables

Configure these variables in GitHub repository settings: **Settings → Secrets and variables → Actions → Variables**

| Variable Name | Description | Example Value |
|--------------|-------------|---------------|
| `DEPLOYMENT_PLATFORM` | Hosting platform (railway or render) | `railway` |
| `STAGING_API_URL` | Base URL for staging API | `https://api-staging.bmadrecette.com` |

## How to Add Secrets

### Via GitHub UI

1. Navigate to repository **Settings**
2. Click **Secrets and variables → Actions**
3. Click **New repository secret**
4. Enter name and value
5. Click **Add secret**

### Via GitHub CLI

```bash
# Add a secret
gh secret set SECRET_NAME --body "secret-value"

# Add a secret from file
gh secret set SECRET_NAME < secret-file.txt

# List all secrets
gh secret list
```

## Secret Rotation Schedule

| Secret Type | Rotation Frequency | Next Rotation Date |
|------------|-------------------|-------------------|
| JWT_SECRET | Every 90 days | TBD |
| DATABASE_URL | On password change | As needed |
| API Keys | Every 180 days | TBD |

## Security Best Practices

1. **Never commit secrets to version control**
   - Use `.env` files locally (already in `.gitignore`)
   - Use GitHub Secrets for CI/CD
   - Use 1Password/Vault for team secret sharing

2. **Use strong, random secrets**
   - JWT_SECRET: minimum 32 characters, cryptographically random
   - Database passwords: minimum 16 characters, mixed case/numbers/symbols

3. **Limit secret access**
   - Use environment-specific secrets (staging vs production)
   - Review who has repository admin access (can view secret names)

4. **Monitor secret usage**
   - Enable GitHub secret scanning alerts
   - Review workflow logs for accidental secret leaks
   - Rotate secrets immediately if compromised

5. **Use least privilege**
   - API keys should have minimal required permissions
   - Use service-specific tokens when possible

## Troubleshooting

### Workflow fails with "secret not found"

**Solution**: Ensure secret is added to repository (not organization) and name matches exactly (case-sensitive).

### Deployment fails with authentication error

**Solution**:
1. Verify secret value is correct
2. Check if token has expired
3. Ensure service/resource exists in hosting platform

### Database migration fails

**Solution**: Verify `DATABASE_URL_STAGING` is correct and database is accessible from GitHub Actions runners (check firewall rules).

## Adding New Secrets

When adding new secrets for future features:

1. Update this document first
2. Add secret to GitHub repository
3. Update workflow files to use the secret
4. Test in a PR before merging
5. Document any setup required in deployment docs

## Contact

For questions about secrets or access issues, contact the project maintainer or DevOps lead.
