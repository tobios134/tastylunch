@echo off
rem Abre la web en tu computadora para probarla (necesita Python instalado).
cd /d "%~dp0"
start "" http://localhost:8080/index.html
python -m http.server 8080
