param(
    [string]$Mode = 'both'
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$modeName = $Mode.ToLowerInvariant()

if ([string]::IsNullOrWhiteSpace($modeName)) {
    $modeName = 'both'
}

if ($modeName -in @('api', 'backend')) {
    $modeName = 'backend'
} elseif ($modeName -in @('web', 'frontend')) {
    $modeName = 'frontend'
} elseif ($modeName -ne 'both') {
    Write-Error 'Usage: start.bat [backend|api|frontend|web|both]'
    exit 2
}

$pythonPath = $null
if ($modeName -in @('backend', 'both')) {
    $pythonPath = Join-Path $root '.venv\Scripts\python.exe'
    if (-not (Test-Path $pythonPath)) {
        $pythonCommand = Get-Command python.exe -CommandType Application -ErrorAction SilentlyContinue |
            Select-Object -First 1
        if ($null -eq $pythonCommand) {
            Write-Error 'Python was not found. Install Python or create .venv\ first.'
            exit 1
        }
        $pythonPath = $pythonCommand.Source
    }
}

$frontendCommand = $null
$frontendArgs = $null
if ($modeName -in @('frontend', 'both')) {
    $bunCommand = Get-Command bun.exe -CommandType Application -ErrorAction SilentlyContinue |
        Select-Object -First 1
    $npmCommand = Get-Command npm.cmd -CommandType Application -ErrorAction SilentlyContinue |
        Select-Object -First 1

    if ($null -ne $bunCommand) {
        $frontendCommand = $bunCommand.Source
        $frontendArgs = 'run dev'
    } elseif ($null -ne $npmCommand) {
        $frontendCommand = $env:ComSpec
        $frontendArgs = "/d /s /c `"npm run dev`""
    } else {
        Write-Error 'Neither Bun nor npm was found.'
        exit 1
    }
}

$backendDirectory = Join-Path $root 'backend'
$frontendDirectory = Join-Path $root 'frontend'
$processes = @()

try {
    if ($modeName -in @('backend', 'both')) {
        $processes += Start-Process -FilePath $pythonPath -ArgumentList @('manage.py', 'runserver', '0.0.0.0:8000') -WorkingDirectory $backendDirectory -NoNewWindow -PassThru
    }

    if ($modeName -in @('frontend', 'both')) {
        $processes += Start-Process -FilePath $frontendCommand -ArgumentList $frontendArgs -WorkingDirectory $frontendDirectory -NoNewWindow -PassThru
    }

    if ($modeName -ne 'both') {
        $processes[0].WaitForExit()
        exit $processes[0].ExitCode
    }

    while ($true) {
        foreach ($process in $processes) {
            $process.Refresh()
            if ($process.HasExited) {
                exit $process.ExitCode
            }
        }
        Start-Sleep -Milliseconds 500
    }
} finally {
    foreach ($process in $processes) {
        $process.Refresh()
        if (-not $process.HasExited) {
            & taskkill.exe /PID $process.Id /T /F 2>$null | Out-Null
        }
    }
}