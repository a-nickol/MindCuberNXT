<#
.SYNOPSIS
    Reads the white balance calibration values from mccfg.dat.

.DESCRIPTION
    The mccfg.dat file stores three 32-bit integers representing the 
    calibration multipliers for the Red, Green, and Blue channels.
    This script safely reads the binary file and outputs the values.

.EXAMPLE
    .\read_mccfg.ps1
#>

$FilePath = Join-Path $PSScriptRoot "mccfg.dat"

if (-not (Test-Path $FilePath)) {
    Write-Error "Could not find $FilePath"
    exit 1
}

try {
    # If the file is locked by the NXT software, we need to copy it first to read it
    $TempPath = Join-Path $PSScriptRoot "mccfg_temp.dat"
    Copy-Item $FilePath $TempPath -Force -ErrorAction Stop

    $Bytes = [System.IO.File]::ReadAllBytes($TempPath)
    
    if ($Bytes.Length -lt 12) {
        Write-Error "File is too small to contain valid calibration data."
        exit 1
    }

    $Red = [System.BitConverter]::ToInt32($Bytes, 0)
    $Green = [System.BitConverter]::ToInt32($Bytes, 4)
    $Blue = [System.BitConverter]::ToInt32($Bytes, 8)

    Write-Host "--- MindCuber White Balance Calibration ---"
    Write-Host "Red Multiplier:   $Red"
    Write-Host "Green Multiplier: $Green"
    Write-Host "Blue Multiplier:  $Blue"
    
    Write-Host ""
    if ($Red -gt 1000 -or $Green -gt 1000 -or $Blue -gt 1000) {
        Write-Host "Note: A value of 1024 (or close to it) indicates the weakest channel during calibration." -ForegroundColor Yellow
        Write-Host "If Blue is 1024, it means the sensor saw very little blue during calibration," -ForegroundColor Yellow
        Write-Host "which often happens if a red, orange, or yellow face was accidentally used instead of white." -ForegroundColor Yellow
    }

} catch {
    Write-Error "Failed to read configuration file: $_"
} finally {
    if (Test-Path $TempPath) {
        Remove-Item $TempPath -Force -ErrorAction SilentlyContinue
    }
}
