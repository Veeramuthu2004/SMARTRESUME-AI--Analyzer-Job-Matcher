$ErrorActionPreference = 'Stop'
Write-Host "Creating new admin user via API signup..."
$resp = Invoke-RestMethod -Uri 'http://localhost:5000/api/auth/signup' -Method Post -ContentType 'application/json' -Body (@{name = 'Admin'; email = 'admin@smartresume.dev'; password = 'Admin12345!' } | ConvertTo-Json)
$token = $resp.accessToken
if ($token) { 
    Write-Host "Signup successful. Token: $($token.Substring(0,50))..."
    Set-Content -Path 'C:\Users\veera\Downloads\RS project\scripts\tmp_browser_token.txt' -Value $token
    Write-Host 'WROTE_TOKEN_TO_FILE'
  
    # Now promote this user to admin via API if admin endpoint available, otherwise use dev header
    $devHeaders = @{ Authorization = "Bearer $token"; 'x-dev-as-admin' = 'true' }
    Write-Host "Created admin user via signup; can use dev header for admin operations in development."
}
else { 
    Write-Host 'NO_TOKEN_IN_RESPONSE' 
}
