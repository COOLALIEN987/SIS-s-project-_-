@echo off
color 0A
title SIS CRM

echo =================================================================
echo                 SIS CRM                       
echo =================================================================
echo.
echo Make sure you have the following running/configured:
echo 1. PostgreSQL running locally (or Supabase URL in server/.env)
echo 2. Redis Connection String in server/.env
echo 3. GEMINI_API_KEY added to server/.env
echo.
echo Installing concurrently...
call npm install concurrently --save-dev >nul 2>&1

echo.
echo Starting Backend (Express/Node) and Frontend (Vite/React)...
echo.
npm run dev

pause
