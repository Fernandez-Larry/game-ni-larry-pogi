<#
Setup script to enable the repository's versioned hooks directory.
Usage (PowerShell):
  ./scripts/setup-hooks.ps1

This will set `core.hooksPath` to `.githooks` so that the `post-commit`
hook in the repository is used. Ensure you have a remote named `origin`
and credentials (SSH key or credential helper) configured to allow pushing.
#>

Write-Host "Configuring repository to use .githooks for Git hooks..."
git config core.hooksPath .githooks
if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to set core.hooksPath. Run this script from the repo root and ensure Git is installed."
    exit 1
}

Write-Host "Hooks path configured. Verify by running: git config core.hooksPath"
Write-Host "Note: The hook will attempt to push to remote 'origin' on every commit."
Write-Host "Ensure you have push access and credentials are available (SSH key or credential helper)."
