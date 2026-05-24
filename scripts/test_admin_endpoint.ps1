$ErrorActionPreference = 'Stop'
$token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2YTBkY2UwMDZmM2I1MDg2YjQyNmYwYmYiLCJyb2xlIjoidXNlciIsImVtYWlsIjoiYWRtaW5Ac21hcnRyZXN1bWUuZGV2IiwiaWF0IjoxNzc5Mjg5NjAwLCJleHAiOjE3NzkyOTA1MDB9.q8Mv_qzuWHRCHZgCpQg4IbuuI7tc2uzdeKdTNFHzQCw'
$headers = @{Authorization = "Bearer $token"; 'x-dev-as-admin' = 'true' }
Try {
    $users = Invoke-RestMethod -Uri 'http://localhost:5000/api/admin/users' -Method Get -Headers $headers
    Write-Host "Admin endpoint works! Users count: " ($users.users.Length)
    Write-Host ($users | ConvertTo-Json -Depth 2)
}
Catch {
    Write-Host "Admin endpoint failed: " $_
}
