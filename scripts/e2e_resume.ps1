$ErrorActionPreference = 'Stop'
$api = 'http://localhost:5000/api'
$email = "e2e_test_$(Get-Random)@example.com"
$pw = 'Password123!'
Write-Host "Using test email: $email"

Write-Host 'Signing up...'
$signup = Invoke-RestMethod -Uri "$api/auth/signup" -Method Post -ContentType 'application/json' -Body (@{name = 'E2E Tester'; email = $email; password = $pw } | ConvertTo-Json)
Write-Host 'Signup response:' ($signup | ConvertTo-Json -Depth 2)

Write-Host 'Logging in...'
Write-Host 'Acquiring token from signup or login...'
$token = $signup.accessToken
if (-not $token) {
    Write-Host 'No token returned from signup, logging in...'
    $login = Invoke-RestMethod -Uri "$api/auth/login" -Method Post -ContentType 'application/json' -Body (@{email = $email; password = $pw } | ConvertTo-Json)
    $token = $login.token
}
if (-not $token) { throw 'Failed to obtain auth token' }
Write-Host 'Token acquired.'

if (-not (Test-Path -Path './sample_resume.txt')) {
    @'
John Doe
Software Engineer

Experience:
- Built REST APIs in Node.js
- Worked with MongoDB, Express, React

Education:
BSc Computer Science
'@ | Out-File -Encoding utf8 -FilePath './sample_resume.txt'
}

Write-Host 'Uploading resume using curl.exe (multipart/form-data)...'
$uploadRaw = & curl.exe -s -H "Authorization: Bearer $token" -F "resume=@./sample_resume.txt" "$api/resumes/upload"
try { $upload = $uploadRaw | ConvertFrom-Json } catch { Write-Host 'Upload raw:'; Write-Host $uploadRaw; throw }
Write-Host 'Upload response:' ($upload | ConvertTo-Json -Depth 2)

$resumeId = $upload.resume._id
Write-Host "Uploaded resume id: $resumeId"

Write-Host 'Requesting analysis...'
$jobDesc = 'Looking for an experienced backend engineer with Node.js, Express, MongoDB experience. Must have strong API design and systems thinking. 5+ years preferred.'
$analysis = Invoke-RestMethod -Uri "$api/analyses" -Method Post -ContentType 'application/json' -Headers @{Authorization = "Bearer $token" } -Body (@{resumeId = $resumeId; roleTitle = 'Backend Engineer'; company = 'ACME Corp'; jobDescription = $jobDesc } | ConvertTo-Json)
Write-Host 'Analysis response:' ($analysis | ConvertTo-Json -Depth 3)

Write-Host 'E2E test completed.'
Write-Host "Analysis id: $($analysis.analysis._id)"
