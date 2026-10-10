param(
    [string]$FirstArgument = '',
    [string]$SecondArgument = ''
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$firstArgument = $FirstArgument.ToLowerInvariant()
$secondArgument = $SecondArgument.ToLowerInvariant()
$environmentName = 'local'
$modeName = 'both'

if ($firstArgument -in @('local', 'production')) {
    $environmentName = $firstArgument
    if (-not [string]::IsNullOrWhiteSpace($secondArgument)) {
        $modeName = $secondArgument
    }
} elseif ($firstArgument -in @('api', 'backend', 'web', 'frontend', 'both')) {
    $modeName = $firstArgument
    if (-not [string]::IsNullOrWhiteSpace($secondArgument)) {
        if ($secondArgument -notin @('local', 'production')) {
            Write-Error 'Usage: start.bat [local|production] [backend|api|frontend|web|both]'
            exit 2
        }
        $environmentName = $secondArgument
    }
} elseif (-not [string]::IsNullOrWhiteSpace($firstArgument)) {
    Write-Error 'Usage: start.bat [local|production] [backend|api|frontend|web|both]'
    exit 2
}

if ($modeName -in @('api', 'backend')) {
    $modeName = 'backend'
} elseif ($modeName -in @('web', 'frontend')) {
    $modeName = 'frontend'
} elseif ($modeName -ne 'both') {
    Write-Error 'Usage: start.bat [local|production] [backend|api|frontend|web|both]'
    exit 2
}

$backendEnvFile = Join-Path $root "backend\.env\env.$environmentName"
$frontendEnvFile = Join-Path $root "frontend\.env\env.$environmentName"
if ($modeName -in @('backend', 'both') -and -not (Test-Path $backendEnvFile -PathType Leaf)) {
    Write-Error "Backend environment file not found: $backendEnvFile"
    exit 1
}
if ($modeName -in @('frontend', 'both') -and -not (Test-Path $frontendEnvFile -PathType Leaf)) {
    Write-Error "Frontend environment file not found: $frontendEnvFile"
    exit 1
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
$viteMode = if ($environmentName -eq 'local') { 'development' } else { $environmentName }
if ($modeName -in @('frontend', 'both')) {
    $bunCommand = Get-Command bun.exe -CommandType Application -ErrorAction SilentlyContinue |
        Select-Object -First 1
    $npmCommand = Get-Command npm.cmd -CommandType Application -ErrorAction SilentlyContinue |
        Select-Object -First 1

    if ($null -ne $bunCommand) {
        $frontendCommand = $bunCommand.Source
        $frontendArgs = "run dev -- --mode $viteMode"
    } elseif ($null -ne $npmCommand) {
        $frontendCommand = $env:ComSpec
        $frontendArgs = "/d /s /c `"npm run dev -- --mode $viteMode`""
    } else {
        Write-Error 'Neither Bun nor npm was found.'
        exit 1
    }
}

$backendDirectory = Join-Path $root 'backend'
$frontendDirectory = Join-Path $root 'frontend'
$processes = @()
$env:DJANGO_ENV = $environmentName

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
            & taskkill.exe /PID $process.Id /T 2>$null | Out-Null
        }
    }

    $shutdownDeadline = [DateTime]::UtcNow.AddSeconds(5)
    do {
        $runningProcesses = @()
        foreach ($process in $processes) {
            $process.Refresh()
            if (-not $process.HasExited) {
                $runningProcesses += $process
            }
        }

        if ($runningProcesses.Count -eq 0) {
            break
        }

        Start-Sleep -Milliseconds 200
    } while ([DateTime]::UtcNow -lt $shutdownDeadline)

    foreach ($process in $runningProcesses) {
        $process.Refresh()
        if (-not $process.HasExited) {
            & taskkill.exe /PID $process.Id /T /F 2>$null | Out-Null
        }
    }
}