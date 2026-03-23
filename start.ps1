$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$apiDir = Join-Path $repoRoot 'api'
$frontendDir = Join-Path $repoRoot 'pro'
$runtimeDir = Join-Path $repoRoot '.runtime'
$logDir = Join-Path $runtimeDir 'logs'

$apiPidFile = Join-Path $runtimeDir 'api.pid'
$frontendPidFile = Join-Path $runtimeDir 'frontend.pid'

$apiOutLog = Join-Path $logDir 'api.out.log'
$apiErrLog = Join-Path $logDir 'api.err.log'
$frontendOutLog = Join-Path $logDir 'frontend.out.log'
$frontendErrLog = Join-Path $logDir 'frontend.err.log'

function Ensure-Directory {
    param([string]$Path)

    if (!(Test-Path $Path)) {
        New-Item -ItemType Directory -Path $Path | Out-Null
    }
}

function Remove-StalePidFile {
    param([string]$PidFile)

    if (!(Test-Path $PidFile)) {
        return
    }

    $pid = Get-Content $PidFile | Select-Object -First 1
    if (!$pid) {
        Remove-Item $PidFile -Force
        return
    }

    if (!(Get-Process -Id $pid -ErrorAction SilentlyContinue)) {
        Remove-Item $PidFile -Force
    }
}

function Ensure-File {
    param([string]$Path)

    if (!(Test-Path $Path)) {
        New-Item -ItemType File -Path $Path | Out-Null
    }
}

function Ensure-Dependencies {
    param(
        [string]$WorkingDirectory,
        [string]$Label
    )

    $nodeModules = Join-Path $WorkingDirectory 'node_modules'
    if (Test-Path $nodeModules) {
        Write-Host "$Label dependencies already installed."
        return
    }

    Write-Host "Installing $Label dependencies..."
    Push-Location $WorkingDirectory
    try {
        & npm.cmd install
    }
    finally {
        Pop-Location
    }
}

function Start-ServiceProcess {
    param(
        [string]$Name,
        [string]$WorkingDirectory,
        [string]$PidFile,
        [string]$StdOutLog,
        [string]$StdErrLog
    )

    Remove-StalePidFile -PidFile $PidFile

    if (Test-Path $PidFile) {
        $existingPid = Get-Content $PidFile | Select-Object -First 1
        Write-Host "$Name already running with PID $existingPid"
        return
    }

    Ensure-File -Path $StdOutLog
    Ensure-File -Path $StdErrLog

    $process = Start-Process -FilePath 'npm.cmd' -ArgumentList @('run', 'start') -WorkingDirectory $WorkingDirectory -RedirectStandardOutput $StdOutLog -RedirectStandardError $StdErrLog -PassThru
    Set-Content -Path $PidFile -Value $process.Id
    Write-Host "Started $Name with PID $($process.Id)"
}

Ensure-Directory -Path $runtimeDir
Ensure-Directory -Path $logDir

$apiEnv = Join-Path $apiDir '.env'
$apiEnvExample = Join-Path $apiDir '.env.example'
$frontendEnv = Join-Path $frontendDir '.env'

if (!(Test-Path $apiEnv) -and (Test-Path $apiEnvExample)) {
    Copy-Item $apiEnvExample $apiEnv
    Write-Host 'Created api/.env from api/.env.example. Review the values before using it outside local development.'
}

if (!(Test-Path $frontendEnv)) {
    Set-Content -Path $frontendEnv -Value 'REACT_APP_BACKEND_URL=http://localhost:5000'
    Write-Host 'Created pro/.env with the default backend URL.'
}

Ensure-Dependencies -WorkingDirectory $apiDir -Label 'backend'
Ensure-Dependencies -WorkingDirectory $frontendDir -Label 'frontend'

Start-ServiceProcess -Name 'backend' -WorkingDirectory $apiDir -PidFile $apiPidFile -StdOutLog $apiOutLog -StdErrLog $apiErrLog
Start-ServiceProcess -Name 'frontend' -WorkingDirectory $frontendDir -PidFile $frontendPidFile -StdOutLog $frontendOutLog -StdErrLog $frontendErrLog

Write-Host ''
Write-Host 'Sync-Not-Net services are starting.'
Write-Host 'Frontend: http://localhost:3000'
Write-Host 'Backend:  http://localhost:5000'
Write-Host "Logs: $logDir"
Write-Host 'To start again later, run .\start.cmd or .\start.ps1 from the repo root.'