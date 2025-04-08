@echo off
echo Fixing Next.js and Clerk compatibility...

echo Stopping any running Node.js processes...
taskkill /f /im node.exe 2>NUL

echo Removing next.js cache folders...
if exist .next rmdir /s /q .next
if exist .turbo rmdir /s /q .turbo

echo Removing node_modules folder...
if exist node_modules rmdir /s /q node_modules

echo Removing package-lock.json...
if exist package-lock.json del package-lock.json

echo Installing specific compatible versions...
call npm install --no-save --save-exact next@13.4.12 react@18.2.0 react-dom@18.2.0
call npm install --no-save --save-exact @clerk/nextjs@4.23.2

echo Installing remaining dependencies...
call npm install

echo Creating empty .env.local file if it doesn't exist...
if not exist .env.local (
  echo # Clerk environment variables > .env.local
  echo NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY >> .env.local
  echo CLERK_SECRET_KEY=sk_test_YOUR_SECRET_KEY >> .env.local
)

echo Next.js and Clerk compatibility fixed!
echo.
echo IMPORTANT: Make sure to set your Clerk API keys in .env.local
echo.
echo You can now run 'npm run dev' to start the development server.
