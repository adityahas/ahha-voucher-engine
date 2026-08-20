param (
    [string[]]$TargetServices = @()
)

$deployDir = "C:\ahha-deploy"
$logDir = "$deployDir\logs"
$stateFile = "$deployDir\changed-services.json"

if (-not (Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir -Force | Out-Null }

$allServices = @(
    @{ Name = "admin"; Script = "dist\apps\admin\src\main.js" },
    @{ Name = "user-admin"; Script = "dist\apps\user-admin\src\main.js" },
    @{ Name = "user-consumer"; Script = "dist\apps\user-consumer\src\main.js" },
    @{ Name = "loyalty-admin"; Script = "dist\apps\loyalty-admin\src\main.js" },
    @{ Name = "loyalty-consumer"; Script = "dist\apps\loyalty-consumer\src\main.js" },
    @{ Name = "product-admin"; Script = "dist\apps\product-admin\src\main.js" },
    @{ Name = "product-consumer"; Script = "dist\apps\product-consumer\src\main.js" },
    @{ Name = "redistro"; Script = "dist\apps\redistro\src\main.js" }
)

# Determine services to restart
$backendToStart = @()
$restartFrontend = $false

if ($TargetServices.Count -gt 0) {
    $backendToStart = $allServices | Where-Object { $TargetServices -contains $_.Name }
    $restartFrontend = ($TargetServices -contains "frontend-cms") -or ($TargetServices -contains "frontend-consumer")
} elseif (Test-Path $stateFile) {
    try {
        $json = Get-Content $stateFile | ConvertFrom-Json
        if ($json.deployAll -eq $true) {
            $backendToStart = $allServices
            $restartFrontend = $true
        } else {
            $backendToStart = $allServices | Where-Object { $json.backend -contains $_.Name }
            $restartFrontend = ($json.frontend -contains "frontend-cms") -or ($json.frontend -contains "frontend-consumer")
        }
    } catch {
        $backendToStart = $allServices
        $restartFrontend = $true
    }
} else {
    $backendToStart = $allServices
    $restartFrontend = $true
}

Write-Output "Restarting target services: $($backendToStart.Name -join ', ')"

# Stop and restart specified backend microservices
foreach ($svc in $backendToStart) {
    $scriptPattern = "*$($svc.Script.Replace('\', '/'))*"
    Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like "*$($svc.Script)*" } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
    
    Start-Process -FilePath "node" `
        -ArgumentList $svc.Script `
        -WorkingDirectory $deployDir `
        -RedirectStandardOutput "$logDir\$($svc.Name).log" `
        -RedirectStandardError "$logDir\$($svc.Name).err.log" `
        -WindowStyle Hidden
}

# Restart frontend server if frontends were rebuilt
if ($restartFrontend) {
    Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like "*frontend-servers.js*" } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
    
    Start-Process -FilePath "node" `
        -ArgumentList "frontend-servers.js" `
        -WorkingDirectory $deployDir `
        -RedirectStandardOutput "$logDir\frontend.log" `
        -RedirectStandardError "$logDir\frontend.err.log" `
        -WindowStyle Hidden
}

Write-Output "Selective service startup completed."
