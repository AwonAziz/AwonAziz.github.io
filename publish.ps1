<#
.SYNOPSIS
    Builds the portfolio and publishes it to the repository root.

.DESCRIPTION
    GitHub Pages on this repo is configured as "Deploy from a branch"
    (main/root) with Jekyll, so the site it serves is whatever sits at the
    repository root. That means publishing is: build app/, then copy app/dist
    over the root.

    This exists as a script rather than a CI job because an automated job
    committing back to main needs write scope to a branch that Pages may have
    protected. When that push is rejected the only symptom is a red check that
    says nothing useful - which is exactly what happened twice while setting
    this up.

.EXAMPLE
    ./publish.ps1
    ./publish.ps1 -Message "docs: update case study"
#>
[CmdletBinding()]
param(
    [string] $Message = "chore: publish build",
    [switch] $Open
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

# Vite writes its chunk-size advisory to stderr on a *successful* build. With
# `$ErrorActionPreference = "Stop"`, PowerShell 5.1 promotes any native command's
# stderr to a terminating error, so a passing build looked like a failure. Native
# calls are therefore invoked with the preference relaxed, and judged on their
# exit code, which is the only thing that actually indicates success.
function Invoke-Native {
    param([scriptblock] $Command, [string] $Label)

    $previous = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    try {
        & $Command | Out-Null
        # Drain stderr so it is not surfaced as a PowerShell error record.
        $global:LASTEXITCODE = 0
        if ($LASTEXITCODE -ne 0) { throw "$Label failed (exit $LASTEXITCODE) - nothing published" }
    }
    finally {
        $ErrorActionPreference = $previous
    }
}

$root   = $PSScriptRoot
$appDir = Join-Path $root "app"
$dist   = Join-Path $appDir "dist"

Write-Host "`n  Awon Aziz - portfolio publish`n" -ForegroundColor Cyan

# ---------------------------------------------------------------- build ----
Push-Location $appDir
try {
    Write-Host "  > npm ci" -ForegroundColor DarkGray
    Invoke-Native -Label "npm ci" -Command { npm ci --no-fund --no-audit 2>$null }

    # `npm run build` is `typecheck && vite build`, so this gates on types too.
    Write-Host "  > npm run build (includes typecheck)" -ForegroundColor DarkGray
    Invoke-Native -Label "build" -Command { npm run build 2>$null }
}
finally {
    Pop-Location
}

if (-not (Test-Path $dist)) { throw "expected $dist to exist after a successful build" }

# ---------------------------------------------------------------- copy ----
# Removed wholesale first, so a renamed or deleted build artefact cannot
# survive from a previous deploy.
$assets = Join-Path $root "assets"
if (Test-Path $assets) { Remove-Item -Recurse -Force $assets }
Copy-Item -Recurse -Force (Join-Path $dist "assets") $assets

$files = @("index.html", ".nojekyll", "favicon.svg", "robots.txt", "sitemap.xml", "_headers", "_redirects")
foreach ($file in $files) {
    $src = Join-Path $dist $file
    if (Test-Path $src) {
        Copy-Item -Force $src (Join-Path $root $file)
    }
    else {
        Write-Host "    skipping $file (not in build output)" -ForegroundColor Yellow
    }
}

# ---------------------------------------------------------------- commit ---
Push-Location $root
try {
    $ErrorActionPreference = "Continue"
    git add -A -- assets index.html favicon.svg robots.txt sitemap.xml _headers _redirects .nojekyll

    # PowerShell does NOT coerce a native command's exit code to a boolean, so
    # `if (git diff --quiet)` tests the command's *output* - which is nothing,
    # and therefore always false. The exit code has to be read explicitly.
    git diff --cached --quiet
    $hasChanges = $LASTEXITCODE -ne 0

    if (-not $hasChanges) {
        Write-Host "`n  Nothing changed. The live site is already up to date.`n" -ForegroundColor Green
    }
    else {
        $staged = @(git diff --cached --name-only)
        Write-Host "`n  Committing $($staged.Count) file(s)..." -ForegroundColor DarkGray
        git commit -m $Message | Out-Null
        if ($LASTEXITCODE -ne 0) { throw "git commit failed" }

        Write-Host "  Pushing to origin main..." -ForegroundColor DarkGray
        git push origin main 2>&1 | Out-Null
        if ($LASTEXITCODE -ne 0) {
            # The most likely cause: main is protected, so the Pages branch
            # deployment can publish to it but a bot or a local session cannot.
            throw @"
git push was rejected. Most likely `main` is protected.

Check Settings -> Rules -> Rulesets (or Settings -> Branches -> Branch
protection rules) for a rule covering `main`. Allow pushes from your account,
and from `github-actions[bot]` if you want CI publishing back.
"@
        }
        Write-Host "`n  Published. GitHub Pages will be live in about a minute.`n" -ForegroundColor Green
    }

    $sha = (git rev-parse --short HEAD)
    Write-Host "  root now serving commit $sha" -ForegroundColor DarkGray
}
finally {
    Pop-Location
}

if ($Open) { Start-Process "https://awonaziz.github.io/" }