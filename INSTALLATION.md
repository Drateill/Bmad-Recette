# Installation Instructions

## Known Issue: Workspace Symlink Error

Due to filesystem limitations in some environments (particularly shared/mounted filesystems), you may encounter this error during `npm install`:

```
npm error code EIO
npm error syscall symlink
npm error path ../../apps/web
npm error dest /mnt/shared/bmad-try/bmad-recette/node_modules/@bmad/web
npm error errno -5
npm error EIO: i/o error, symlink
```

### Workarounds

**Option 1: Install on Local Filesystem**
Clone the repository to a local filesystem (not a mounted/shared drive):
```bash
git clone <repo-url> ~/bmad-recette
cd ~/bmad-recette
npm install
```

**Option 2: Use Legacy Peer Deps Flag**
```bash
npm install --legacy-peer-deps
```

**Option 3: Manual Package Installation**
If workspace symlinks continue to fail, install each package individually:
```bash
# Install root dependencies
npm install --prefix . turbo prettier husky lint-staged eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin --legacy-peer-deps

# Install each app/package separately
cd apps/api && npm install --legacy-peer-deps && cd ../..
cd apps/web && npm install --legacy-peer-deps && cd ../..
cd apps/mobile && npm install --legacy-peer-deps && cd ../..
cd packages/shared && npm install --legacy-peer-deps && cd ../..
cd packages/ui && npm install --legacy-peer-deps && cd ../..
```

## Post-Installation

After dependencies are installed successfully:

1. **Initialize Husky**:
   ```bash
   npx husky install
   ```

2. **Build shared packages**:
   ```bash
   npm run build
   ```

3. **Run development servers**:
   ```bash
   npm run dev
   ```

4. **Verify installation**:
   ```bash
   npm run lint
   npm run type-check
   npm run test
   ```

## Environment Setup

See README.md for full environment configuration instructions.
