$ErrorActionPreference = 'Stop'
$api = 'http://localhost:5000/api'
$ts = Get-Random
$adminEmail = "e2e_admin_$ts@example.com"
$adminPass = 'Password123!'
Write-Host "Signing up test admin user: $adminEmail"
$signup = Invoke-RestMethod -Uri "$api/auth/signup" -Method Post -ContentType 'application/json' -Body (@{ name = 'E2E Admin'; email = $adminEmail; password = $adminPass } | ConvertTo-Json)
$token = $signup.accessToken
if (-not $token) { throw 'Failed to obtain token from signup' }
Write-Host 'Token acquired from signup.'
# write token for browser automation
Set-Content -Path .\tmp_browser_token.txt -Value $token
Write-Host "TOKEN:$token"

# use dev header to promote this user to admin for the following requests
$devHeaders = @{ Authorization = "Bearer $token"; 'x-dev-as-admin' = 'true' }

# Create a job
$job = @{ title = 'E2E Admin Job'; company = 'Acme E2E'; location = 'Remote'; description = 'Test job'; skills = @('node', 'mongodb'); featured = $false }
$createdJob = Invoke-RestMethod -Uri "$api/admin/jobs" -Method Post -ContentType 'application/json' -Headers $devHeaders -Body ($job | ConvertTo-Json -Depth 5)
Write-Host 'Created job:' ($createdJob | ConvertTo-Json -Depth 3)

# List jobs
$jobs = Invoke-RestMethod -Uri "$api/admin/jobs" -Method Get -Headers $devHeaders
Write-Host 'Jobs count:' ($jobs.jobs.Length)

# Create an admin notification
$note = @{ title = 'E2E Notice'; message = 'This is a test notification'; type = 'info' }
$createdNote = Invoke-RestMethod -Uri "$api/admin/notifications" -Method Post -ContentType 'application/json' -Headers $devHeaders -Body ($note | ConvertTo-Json)
Write-Host 'Created notification:' ($createdNote | ConvertTo-Json -Depth 2)

# List notifications
$notes = Invoke-RestMethod -Uri "$api/admin/notifications" -Method Get -Headers $devHeaders
Write-Host 'Notifications count:' ($notes.notifications.Length)

# If there are support tickets, mark first as resolved
$tickets = Invoke-RestMethod -Uri "$api/admin/support" -Method Get -Headers $devHeaders
if ($tickets.tickets.Length -gt 0) {
    $first = $tickets.tickets[0]
    Write-Host 'Resolving ticket:' $first._id
    Invoke-RestMethod -Uri "$api/admin/support/$($first._id)" -Method Patch -ContentType 'application/json' -Headers $devHeaders -Body (@{ status = 'resolved'; message = 'Resolved via E2E script' } | ConvertTo-Json)
    Write-Host 'Ticket resolved.'
}
else {
    Write-Host 'No support tickets found.'
}

Write-Host 'E2E admin actions completed.'
