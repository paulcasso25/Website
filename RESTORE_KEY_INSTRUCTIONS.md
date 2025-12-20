# How to Restore git-crypt Key from Base64

## Paul Casso Website - Encryption Key Recovery

If you need to restore the git-crypt key from the base64 string later, use this PowerShell script:

```powershell
# Restore the git-crypt key from base64
$base64Key = "PASTE_YOUR_BASE64_KEY_HERE"

# Decode the base64 string to bytes
$keyBytes = [Convert]::FromBase64String($base64Key)

# Write the decoded bytes to the key file
[System.IO.File]::WriteAllBytes("$env:USERPROFILE\git-crypt-key-paul-casso", $keyBytes)

Write-Host "Key restored to: $env:USERPROFILE\git-crypt-key-paul-casso" -ForegroundColor Green
```

## Steps to Restore:

1. **Copy the base64 key** (from your secure backup location)
2. **Replace** `"PASTE_YOUR_BASE64_KEY_HERE"` with your actual base64 key string
3. **Run the script** in PowerShell
4. **Verify** the key file was created:
   ```powershell
   Test-Path "$env:USERPROFILE\git-crypt-key-paul-casso"
   ```

## Unlock the Repository:

After restoring the key, unlock the repository:

```powershell
cd C:\AI_JOB_Search\Paul_Casso_Website
& "$env:USERPROFILE\bin\git-crypt.exe" unlock "$env:USERPROFILE\git-crypt-key-paul-casso"
```

---

## Why Base64?

Base64 encoding makes the key:
- ✅ Easy to store in password managers
- ✅ Easy to copy/paste via email or text
- ✅ Easy to print for physical backup
- ✅ Safe to store in text files (no binary corruption)

The key is the same - just in a different format for easier storage and transfer.

---

**Last Updated**: December 2025  
**Website**: Paul Casso Art

