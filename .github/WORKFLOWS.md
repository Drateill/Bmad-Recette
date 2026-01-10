# CI/CD Workflows Documentation

This document describes the GitHub Actions workflows configured for the BMad Recette project.

## Overview

The project uses two primary workflows for continuous integration and deployment:

1. **PR Validation** ([.github/workflows/pr-validation.yml](workflows/pr-validation.yml)) - Validates code quality on every pull request
2. **Deploy to Staging** ([.github/workflows/deploy-staging.yml](workflows/deploy-staging.yml)) - Automatically deploys to staging when code is merged to main

## Workflow 1: PR Validation

**Trigger**: Automatically runs on:
- Every push to any branch (except main/master)
- Pull request creation, update, or reopening

**Purpose**: Ensure code quality and prevent broken code from reaching main branch

### Jobs

#### 1. Install Dependencies
- Sets up Node.js 20 LTS
- Runs `npm ci` to install dependencies
- Caches `node_modules` for subsequent jobs

#### 2. Lint Code (runs in parallel)
- Restores dependency cache
- Runs ESLint on API codebase
- **Fails if**: Linting errors are found

#### 3. TypeScript Type Check (runs in parallel)
- Restores dependency cache
- Runs TypeScript compiler in check mode
- **Fails if**: Type errors are found

#### 4. Run Tests (runs in parallel)
- Spins up PostgreSQL and Redis test databases
- Runs database migrations
- Executes unit and integration tests
- Generates code coverage report
- **Fails if**:
  - Any test fails
  - Coverage drops below 70% threshold (branches, functions, lines, statements)
- Uploads coverage to Codecov (optional)

#### 5. Build Application (runs in parallel)
- Restores dependency cache
- Builds API application
- Uploads build artifacts
- **Fails if**: Build errors occur

### Expected Run Time

- **Without cache**: ~5-7 minutes
- **With cache**: ~3-4 minutes

### Required Status Checks

The following checks must pass before PRs can be merged:

- ✅ Lint Code
- ✅ TypeScript Type Check
- ✅ Run Tests
- ✅ Build Application

Configure these as required status checks in:
**Settings → Branches → Branch protection rules for `main`**

## Workflow 2: Deploy to Staging

**Trigger**: Automatically runs on:
- Push to `main` or `master` branch
- Manual workflow dispatch (via GitHub UI)

**Purpose**: Automatically deploy tested code to staging environment

### Jobs

#### 1. Build Application
- Installs dependencies
- Builds API application
- Uploads build artifacts for deployment

#### 2. Deploy API to Staging
- Downloads build artifacts
- Deploys to Railway or Render (based on `DEPLOYMENT_PLATFORM` variable)
- Runs database migrations on staging database
- Performs health check to verify deployment success
- **Fails if**:
  - Deployment command fails
  - Database migrations fail
  - Health check fails after 10 retries

### Deployment Platforms

The workflow supports two hosting platforms:

**Railway** (default):
```yaml
vars:
  DEPLOYMENT_PLATFORM: railway
secrets:
  RAILWAY_TOKEN: <your-token>
```

**Render**:
```yaml
vars:
  DEPLOYMENT_PLATFORM: render
secrets:
  RENDER_API_KEY: <your-key>
  RENDER_SERVICE_ID_STAGING: <service-id>
```

### Health Check

After deployment, the workflow performs a health check:
- Waits 30 seconds for deployment to stabilize
- Polls `/api/health` endpoint every 10 seconds
- Retries up to 10 times (total ~2 minutes)
- Verifies `status: "ok"` in response
- **Fails deployment** if health check never succeeds

### Expected Run Time

- **Build**: ~2-3 minutes
- **Deploy + Migrations**: ~3-5 minutes
- **Total**: ~5-8 minutes

## Running Checks Locally

Before pushing code, run checks locally to catch issues early:

```bash
# Lint code
npm run lint --workspace=@bmad/api

# Type check
npm run type-check --workspace=@bmad/api

# Run tests
npm run test --workspace=@bmad/api

# Run tests with coverage
npm run test:cov --workspace=@bmad/api

# Build application
npm run build --workspace=@bmad/api

# Run all checks
npm run lint --workspace=@bmad/api && \
npm run type-check --workspace=@bmad/api && \
npm run test:cov --workspace=@bmad/api && \
npm run build --workspace=@bmad/api
```

## Debugging Failed Workflows

### 1. View Workflow Logs

1. Go to **Actions** tab in GitHub
2. Click on the failed workflow run
3. Click on the failed job
4. Expand the failed step to view logs

### 2. Common Failures

**Linting Errors**:
```bash
# Fix locally
npm run lint --workspace=@bmad/api
# Commit and push
```

**Type Errors**:
```bash
# Check types locally
npm run type-check --workspace=@bmad/api
# Fix errors and commit
```

**Test Failures**:
```bash
# Run tests locally
npm run test --workspace=@bmad/api
# Fix failing tests and commit
```

**Coverage Below Threshold**:
```bash
# Check current coverage
npm run test:cov --workspace=@bmad/api
# Add missing tests to increase coverage
```

**Build Errors**:
```bash
# Build locally
npm run build --workspace=@bmad/api
# Fix build errors and commit
```

**Deployment Failures**:
- Check secrets are configured correctly in GitHub
- Verify DATABASE_URL_STAGING is accessible
- Check Railway/Render platform status
- Review deployment logs in hosting platform dashboard

### 3. Running Workflows Locally (Advanced)

Use [act](https://github.com/nektos/act) to run GitHub Actions locally:

```bash
# Install act
brew install act  # macOS
# or
curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash

# Run PR validation workflow
act pull_request

# Run specific job
act -j lint

# Use custom secrets
act -s RAILWAY_TOKEN=<token>
```

**Note**: Local workflow execution has limitations (no access to GitHub secrets, different environment).

## Branch Protection Rules

Configure in **Settings → Branches → Add rule for `main`**:

### Required Settings

- ✅ **Require a pull request before merging**
- ✅ **Require approvals**: 1 (or 0 for solo development)
- ✅ **Require status checks to pass before merging**:
  - `Lint Code`
  - `TypeScript Type Check`
  - `Run Tests`
  - `Build Application`
- ✅ **Require branches to be up to date before merging**
- ✅ **Do not allow bypassing the above settings**

### Optional Settings

- ⚠️ **Require conversation resolution before merging** (recommended)
- ⚠️ **Require linear history** (use squash/rebase, no merge commits)
- ⚠️ **Require signed commits** (adds friction, optional)

## CI/CD Performance Optimization

### Caching Strategy

The workflows implement multiple caching layers:

1. **npm cache**: Speeds up `npm ci` (handled by `actions/setup-node`)
2. **node_modules cache**: Shared across jobs in PR validation
3. **Build artifacts**: Uploaded after build, downloaded for deployment

### Turborepo Remote Caching (Future Enhancement)

For further optimization, enable Turborepo remote caching:

```yaml
- name: Configure Turborepo cache
  run: |
    npx turbo login --token=${{ secrets.TURBO_TOKEN }}
    npx turbo link
```

**Expected improvement**: Reduce CI time to ~1-2 minutes when only some packages change.

## Monitoring

### GitHub Actions Dashboard

Monitor workflow performance:
- **Actions** tab → **All workflows**
- Track success/failure rates
- Monitor average run times
- Set up notifications for failures

### Metrics to Track

- **PR Validation run time**: Target < 5 minutes
- **Deployment run time**: Target < 10 minutes
- **Test success rate**: Target > 95%
- **Deployment success rate**: Target > 90%

## Cost Considerations

### GitHub Actions Free Tier

- **Public repos**: Unlimited minutes
- **Private repos**: 2,000 minutes/month

### Current Usage Estimate

- ~50 PRs/month × 5 minutes = 250 minutes
- ~50 deployments/month × 8 minutes = 400 minutes
- **Total**: ~650 minutes/month (well within free tier)

### Optimization Tips

1. Skip deployment for documentation-only changes:
   ```yaml
   paths-ignore:
     - '**/*.md'
     - 'docs/**'
   ```

2. Use self-hosted runners if exceeding free tier

3. Limit artifact retention (currently 7 days for deployments)

## Future Enhancements

### Planned Improvements (Future Stories)

1. **Production Deployment Workflow** (Story 1.10)
   - Manual approval required
   - Blue-green deployment
   - Automated rollback on failure

2. **E2E Testing** (Future)
   - Nightly Playwright tests for web
   - Nightly Detox tests for mobile

3. **Dependency Updates** (Future)
   - Dependabot auto-merge for minor/patch updates
   - Weekly PR for major updates

4. **Performance Monitoring** (Future)
   - Lighthouse CI for web performance
   - Bundle size tracking
   - API response time monitoring

## Troubleshooting Checklist

**PR validation fails on first run but passes locally?**
- ❏ Committed all files (including lockfile)?
- ❏ `.env` file not committed (should be in `.gitignore`)?
- ❏ Tests passing with real database/Redis?

**Deployment fails with "Health check failed"?**
- ❏ Deployment actually completed in Railway/Render?
- ❏ Database migrations succeeded?
- ❏ Environment variables set correctly in hosting platform?
- ❏ STAGING_API_URL variable matches actual deployment URL?

**Coverage threshold failing?**
- ❏ New code has corresponding tests?
- ❏ Coverage hasn't regressed from refactoring?
- ❏ Coverage threshold set correctly in `jest.config.js`?

## Contact

For CI/CD issues or questions:
- Check workflow logs first
- Review this documentation
- Open an issue in the repository
- Contact DevOps lead (if applicable)

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Jest Coverage Configuration](https://jestjs.io/docs/configuration#coveragethreshold-object)
- [Railway CLI Documentation](https://docs.railway.app/develop/cli)
- [Render API Documentation](https://api-docs.render.com/)
