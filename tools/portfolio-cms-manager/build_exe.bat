@echo off
setlocal
title Build Topium Portfolio Manager
cd /d "%~dp0"

echo ============================================================
echo Topium Portfolio Manager - EXE Builder
echo ============================================================
echo.

if not exist .venv (
  echo Creating virtual environment...
  py -m venv .venv
)

call .venv\Scripts\activate.bat

echo Installing dependencies...
python -m pip install --upgrade pip
pip install -r requirements.txt

echo.
echo Building EXE...
pyinstaller --noconfirm --onefile --windowed --name "Topium Portfolio Manager" portfolio_manager_app.py

echo.
echo Done.
echo EXE location:
echo %cd%\dist\Topium Portfolio Manager.exe
echo.
pause
