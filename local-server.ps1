$port = 5500
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $port)

$contentTypes = @{
  ".html" = "text/html; charset=utf-8"
  ".css"  = "text/css; charset=utf-8"
  ".js"   = "application/javascript; charset=utf-8"
  ".json" = "application/json; charset=utf-8"
  ".png"  = "image/png"
  ".jpg"  = "image/jpeg"
  ".jpeg" = "image/jpeg"
  ".svg"  = "image/svg+xml"
  ".ico"  = "image/x-icon"
}

function Send-Response {
  param(
    [System.Net.Sockets.NetworkStream]$Stream,
    [int]$StatusCode,
    [string]$StatusText,
    [byte[]]$Body,
    [string]$ContentType = "text/plain; charset=utf-8"
  )

  $headerText = "HTTP/1.1 $StatusCode $StatusText`r`nContent-Type: $ContentType`r`nContent-Length: $($Body.Length)`r`nConnection: close`r`n`r`n"
  $headerBytes = [System.Text.Encoding]::ASCII.GetBytes($headerText)
  $Stream.Write($headerBytes, 0, $headerBytes.Length)
  if ($Body.Length -gt 0) {
    $Stream.Write($Body, 0, $Body.Length)
  }
}

try {
  $listener.Start()

  while ($true) {
    $client = $listener.AcceptTcpClient()

    try {
      $stream = $client.GetStream()
      $reader = [System.IO.StreamReader]::new($stream, [System.Text.Encoding]::ASCII, $false, 1024, $true)
      $requestLine = $reader.ReadLine()

      while ($reader.Peek() -ge 0) {
        $headerLine = $reader.ReadLine()
        if ([string]::IsNullOrEmpty($headerLine)) {
          break
        }
      }

      if ([string]::IsNullOrWhiteSpace($requestLine)) {
        $body = [System.Text.Encoding]::UTF8.GetBytes("Bad Request")
        Send-Response -Stream $stream -StatusCode 400 -StatusText "Bad Request" -Body $body
        continue
      }

      $requestTarget = ($requestLine -split " ")[1]
      if ([string]::IsNullOrWhiteSpace($requestTarget) -or $requestTarget -eq "/") {
        $requestTarget = "/index.html"
      }

      $relativePath = [Uri]::UnescapeDataString($requestTarget.Split("?")[0]).TrimStart("/")
      $relativePath = $relativePath -replace "/", "\"
      $targetPath = Join-Path $root $relativePath
      $resolvedRoot = [System.IO.Path]::GetFullPath($root)
      $resolvedTarget = [System.IO.Path]::GetFullPath($targetPath)

      if (-not $resolvedTarget.StartsWith($resolvedRoot)) {
        $body = [System.Text.Encoding]::UTF8.GetBytes("Forbidden")
        Send-Response -Stream $stream -StatusCode 403 -StatusText "Forbidden" -Body $body
        continue
      }

      if (-not (Test-Path -LiteralPath $resolvedTarget -PathType Leaf)) {
        $body = [System.Text.Encoding]::UTF8.GetBytes("Not Found")
        Send-Response -Stream $stream -StatusCode 404 -StatusText "Not Found" -Body $body
        continue
      }

      $extension = [System.IO.Path]::GetExtension($resolvedTarget).ToLowerInvariant()
      $contentType = $contentTypes[$extension]
      if (-not $contentType) {
        $contentType = "application/octet-stream"
      }

      $body = [System.IO.File]::ReadAllBytes($resolvedTarget)
      Send-Response -Stream $stream -StatusCode 200 -StatusText "OK" -Body $body -ContentType $contentType
    }
    finally {
      if ($reader) {
        $reader.Dispose()
      }
      if ($stream) {
        $stream.Dispose()
      }
      $client.Close()
    }
  }
}
finally {
  $listener.Stop()
}
