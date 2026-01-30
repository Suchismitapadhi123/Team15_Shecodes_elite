# Helper script to start the TailGuard backend reliably on Windows
# Usage: Right-click -> Run with PowerShell, or `.























Write-Host "If you need to stop the server, use 'Stop-Process -Name uvicorn' or stop it in Task Manager."Write-Host "uvicorn started. Use 'Get-Content -Path $logFile -Wait' to tail logs." Start-Process -FilePath "$env:VIRTUAL_ENV\Scripts\uvicorn.exe" -ArgumentList "main:app --host 127.0.0.1 --port 8000" -NoNewWindow -RedirectStandardOutput $logFile -RedirectStandardError $logFile -PassThru | Out-NullWrite-Host ("Starting uvicorn. Logs will be written to {0}" -f $logFile)$logFile = Join-Path $PSScriptRoot "backend.log"# Start uvicorn and redirect output to a log filepip install -r requirements.txtWrite-Host "Installing/updating dependencies (non-destructive)..."# Ensure dependencies are installed}    exit 1    Write-Host "Virtual environment not found. Create one: python -m venv venv; then install requirements: pip install -r requirements.txt"} else {    .\venv\Scripts\Activate.ps1    Write-Host "Activating virtual environment..."if (Test-Path .\venv\Scripts\Activate.ps1) {# Activate venvSet-Location -Path $PSScriptRoot# Change to repo dir (script expected to be in backend/)un_backend.ps1` in PowerShell (may need ExecutionPolicy change)