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
:: Check npm is installed (comes with Node.js)
:: -----------------------------------------------
where npm >nul 2>&1
if errorlevel 1 (
    echo  [ERROR] npm nahi mila!
    echo  Node.js install karte waqt npm bhi aa jata hai.
    echo  https://nodejs.org
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

:: Show Node version
for /f "delims=" %%v in ('node --version') do set "NODE_VER=%%v"
echo  Node.js version: %NODE_VER%
echo.

:: -----------------------------------------------
:: Install server dependencies (only first time)
:: -----------------------------------------------
if not exist "%SERVER%\node_modules\" (
    echo  [INSTALL] Server ki dependencies install ho rahi hain...
    echo  (Pehli baar me kuch minute lag sakte hain. Wait karo.)
    echo.
    pushd "%SERVER%"
    call npm install
    popd
    if errorlevel 1 (
        echo.
        echo  [ERROR] Server install fail ho gaya!
        echo  Internet se connect raho aur dobara run karo.
        echo.
        pause
        exit /b 1
    )
    echo.
    echo  [DONE] Server dependencies ready.
) else (
    echo  [OK] Server dependencies already installed.
)

:: -----------------------------------------------
:: Install client dependencies (only first time)
:: -----------------------------------------------
if not exist "%CLIENT%\node_modules\" (
    echo  [INSTALL] Client ki dependencies install ho rahi hain...
    echo  (Pehli baar me kuch minute lag sakte hain. Wait karo.)
    echo.
    pushd "%CLIENT%"
    call npm install
    popd
    if errorlevel 1 (
        echo.
        echo  [ERROR] Client install fail ho gaya!
        echo  Internet se connect raho aur dobara run karo.
        echo.
        pause
        exit /b 1
    )
    echo.
    echo  [DONE] Client dependencies ready.
) else (
    echo  [OK] Client dependencies already installed.
)

:: -----------------------------------------------
:: Check server/.env (informational only, app works
:: even without it - backups go to server\backups)
:: -----------------------------------------------
echo.
if exist "%SERVER%\.env" (
    echo  [OK] server\.env mila.
) else (
    echo  [WARN] server\.env nahi mila.
    echo   Agar .env add karna hai toh usse "%SERVER%" folder me rakhna.
    echo   Bina .env ke bhi app chalega (default backup: server\backups).
)

:: -----------------------------------------------
:: Start Server in a new window
:: -----------------------------------------------
echo.
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