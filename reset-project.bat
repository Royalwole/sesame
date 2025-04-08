@echo off
echo Starting full project reset...

echo Stopping any running Node.js processes...
taskkill /f /im node.exe 2>NUL

echo Removing build folders...
if exist .next rmdir /s /q .next
if exist out rmdir /s /q out

echo Removing node_modules folder...
if exist node_modules rmdir /s /q node_modules

echo Removing package-lock.json...
if exist package-lock.json del package-lock.json

echo Clearing npm cache...
npm cache clean --force

echo Installing compatible Next.js and Clerk versions...
call npm install --save-exact next@13.4.12 react@18.2.0 react-dom@18.2.0 @clerk/nextjs@4.23.2

echo Installing remaining dependencies...
call npm install

echo Project reset completed successfully!
echo.
echo You can now run 'npm run dev' to start the development server.
