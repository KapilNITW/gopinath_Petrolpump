@echo off
title Petrol Pump Management
color 0A

echo.
echo  =============================================
echo    Petrol Pump Management System
echo  =============================================
echo.

:: -----------------------------------------------
:: Check Node is installed
:: -----------------------------------------------
where node >nul 2>&1
if errorlevel 1 (
    echo  [ERROR] Node.js nahi mila!
    echo  Please install Node.js from https://nodejs.org
    echo.
    pause
    exit /b 1
)

:: -----------------------------------------------
:: Resolve project folder (same folder as this .bat)
:: -----------------------------------------------
set "ROOT=%~dp0"
set "SERVER=%ROOT%server"
set "CLIENT=%ROOT%client"

:: -----------------------------------------------
:: Start Server in a new window
:: -----------------------------------------------
echo  [1/2] Server start ho raha hai...
start "Petrol Pump - Server" cmd /k "cd /d "%SERVER%" && node server.js"

:: Small delay so server gets a head start
timeout /t 2 /nobreak >nul

:: -----------------------------------------------
:: Start Client (Vite dev server) in a new window
:: -----------------------------------------------
echo  [2/2] Client (Vite) start ho raha hai...
start "Petrol Pump - Client" cmd /k "cd /d "%CLIENT%" && npm run dev"

:: -----------------------------------------------
:: Wait for Vite to boot, then open browser
:: -----------------------------------------------
echo.
echo  Thoda wait karo, browser khul raha hai...
timeout /t 4 /nobreak >nul

start "" "http://localhost:5173"

echo.
echo  =============================================
echo   App chal raha hai!
echo   Server : http://localhost:5000
echo   Client : http://localhost:5173
echo  =============================================
echo.
echo  Dono windows band karne se app band ho jaayega.
echo  Yeh window ab band ho sakti hai.
echo.
timeout /t 5 /nobreak >nul
exit
