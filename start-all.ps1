$deployDir = "C:\ahha-deploy"
$logDir = "$deployDir\logs"
if (-not (Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir -Force | Out-Null }

$services = @(
    @{ Name = "admin"; Script = "dist\apps\admin\src\main.js" },
    @{ Name = "user-admin"; Script = "dist\apps\user-admin\src\main.js" },
    @{ Name = "user-consumer"; Script = "dist\apps\user-consumer\src\main.js" },
    @{ Name = "loyalty-admin"; Script = "dist\apps\loyalty-admin\src\main.js" },
    @{ Name = "loyalty-consumer"; Script = "dist\apps\loyalty-consumer\src\main.js" },
    @{ Name = "product-admin"; Script = "dist\apps\product-admin\src\main.js" },
    @{ Name = "product-consumer"; Script = "dist\apps\product-consumer\src\main.js" },
    @{ Name = "redistro"; Script = "dist\apps\redistro\src\main.js" }
)

# Start backend services
foreach ($svc in $services) {
    Start-Process -FilePath "node" `
        -ArgumentList $svc.Script `
        -WorkingDirectory $deployDir `
        -RedirectStandardOutput "$logDir\$($svc.Name).log" `
        -RedirectStandardError "$logDir\$($svc.Name).err.log" `
        -WindowStyle Hidden
}

# Start frontend server
Start-Process -FilePath "node" `
    -ArgumentList "frontend-servers.js" `
    -WorkingDirectory $deployDir `
    -RedirectStandardOutput "$logDir\frontend.log" `
    -RedirectStandardError "$logDir\frontend.err.log" `
    -WindowStyle Hidden

Write-Output "All 8 backend microservices and 2 frontend servers have been launched."
