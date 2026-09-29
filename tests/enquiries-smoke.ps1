param(
  [string]$ProjectUrl = 'https://zyuvvqvbsojathbzcfzi.supabase.co',
  [string]$AnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5dXZ2cXZic29qYXRoYnZjZnppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ4OTA3MjgsImV4cCI6MjEwMDQ2NjcyOH0.dud6yghnqeozK0Yap5uNEBhQiUrYXm6cQmjjeR7EnS0',
  [switch]$KeepRecords
)

$supabaseSource = Get-Content -Raw (Join-Path $PSScriptRoot '..\lib\supabase.ts')
$AnonKey = [regex]::Match($supabaseSource, "'([^']+)'\s*,").Groups[1].Value

$email = Read-Host 'Admin email'
$password = Read-Host 'Admin password' -AsSecureString
$passwordText = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($password))
$headers = @{ apikey = $AnonKey; 'Content-Type' = 'application/json' }
$token = Invoke-RestMethod -Method Post -Uri "$ProjectUrl/auth/v1/token?grant_type=password" -Headers $headers -Body (@{ email = $email; password = $passwordText } | ConvertTo-Json)
$sessionHeaders = @{ apikey = $AnonKey; Authorization = "Bearer $($token.access_token)"; 'Content-Type' = 'application/json'; Prefer = 'return=representation' }
$runId = [DateTime]::UtcNow.ToString('yyyyMMddHHmmss')
$types = @('rental', 'contact', 'bulk', 'availability')
$created = @()

foreach ($type in $types) {
  $payload = @{ type = $type; product = "Smoke test $runId"; name = "Smoke test $type"; phone = '+18005550199'; email = "smoke-$type-$runId@baemeds.com"; message = "Repeatable smoke test for $type"; status = 'new' }
  $row = Invoke-RestMethod -Method Post -Uri "$ProjectUrl/rest/v1/enquiries" -Headers $sessionHeaders -Body ($payload | ConvertTo-Json)
  $created += $row.id
  Write-Host "$type: PASS ($($row.id))" -ForegroundColor Green
}

$query = ($created -join ',')
$verified = Invoke-RestMethod -Method Get -Uri "$ProjectUrl/rest/v1/enquiries?select=id,type,status&id=in.($query)" -Headers $sessionHeaders
if ($verified.Count -ne $types.Count) { throw "Expected $($types.Count) records, found $($verified.Count)." }
Write-Host "Database verification: PASS ($($verified.Count) records)" -ForegroundColor Green

if (-not $KeepRecords) {
  foreach ($id in $created) {
    Invoke-RestMethod -Method Delete -Uri "$ProjectUrl/rest/v1/enquiries?id=eq.$id" -Headers $sessionHeaders | Out-Null
  }
  Write-Host 'Test records removed.' -ForegroundColor Yellow
} else {
  Write-Host 'Test records kept because -KeepRecords was supplied.' -ForegroundColor Yellow
}
