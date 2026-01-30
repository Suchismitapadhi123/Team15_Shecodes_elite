# Launch uvicorn in a new PowerShell window using venv python (keeps window open)
Set-Location -Path $PSScriptRoot

if (-Not (Test-Path .\venv\Scripts\python.exe)) {
    Write-Host "Virtual environment not found. Create it first: python -m venv venv; then install requirements: pip install -r requirements.txt"
    exit 1
}

$python = Join-Path $PSScriptRoot "venv\Scripts\python.exe"
$cmd = "& '$python' -m uvicorn main:app --host 127.0.0.1 --port 8000 --log-level debug"
Write-Host "Launching uvicorn in a new PowerShell window. Command: $cmd"
Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit", "-Command", $cmd -WorkingDirectory $PSScriptRoot
Write-Host "New window launched. Check the new PowerShell window for server logs."