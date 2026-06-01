$ErrorActionPreference = "Stop"

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$backend = Join-Path $root "backend"
$backendExe = Join-Path $backend "dist\cims-backend.exe"

Get-CimInstance Win32_Process |
    Where-Object { $_.Name -in @("cims-backend.exe", "cims.exe") } |
    ForEach-Object { Stop-Process -Id $_.ProcessId -Force }

Remove-Item -LiteralPath $backendExe -Force -ErrorAction SilentlyContinue

Push-Location $backend
try {
    python -m pip install -r requirements.txt
    if ($LASTEXITCODE -ne 0) {
        throw "pip install failed with exit code $LASTEXITCODE"
    }

    python -m PyInstaller `
        --clean `
        --noconfirm `
        --onefile `
        --name cims-backend `
        --collect-submodules cims `
        --collect-submodules warehouse `
        --collect-submodules django `
        desktop_server.py
    if ($LASTEXITCODE -ne 0) {
        throw "PyInstaller failed with exit code $LASTEXITCODE"
    }
}
finally {
    Pop-Location
}
