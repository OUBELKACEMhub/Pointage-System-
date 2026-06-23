$code = @"
using System;
using System.Diagnostics;
using System.IO;

class ZKPointe {
    static void Main() {
        string baseDir = @"C:\Users\safiy\OneDrive\Documents\Pointage_Sys";

        // Backend Laravel
        var backend = new ProcessStartInfo {
            FileName = "cmd.exe",
            Arguments = "/c php artisan serve --host=0.0.0.0 --port=8000",
            WorkingDirectory = baseDir + @"\backend",
            WindowStyle = ProcessWindowStyle.Minimized,
            UseShellExecute = true
        };
        Process.Start(backend);

        // Frontend serve
        var frontend = new ProcessStartInfo {
            FileName = @"C:\Program Files\nodejs\node.exe",
            Arguments = "\"C:\\Users\\safiy\\AppData\\Roaming\\npm\\node_modules\\serve\\build\\main.js\" -s \"" + baseDir + "\\frontend\\dist\" -p 3000",
            WorkingDirectory = baseDir + @"\frontend\dist",
            WindowStyle = ProcessWindowStyle.Minimized,
            UseShellExecute = true
        };
        Process.Start(frontend);

        // Attendre que le serveur soit prêt
        System.Threading.Thread.Sleep(4000);

        // Ouvrir le navigateur
        var browser = new ProcessStartInfo {
            FileName = "http://localhost:3000",
            UseShellExecute = true
        };
        Process.Start(browser);
    }
}
"@

Add-Type -TypeDefinition $code -Language CSharp -OutputAssembly "C:\Users\safiy\OneDrive\Documents\Pointage_Sys\ZKPointe.exe" -OutputType ConsoleApplication

Write-Host "ZKPointe.exe cree avec succes !" -ForegroundColor Green
Write-Host "Emplacement: C:\Users\safiy\OneDrive\Documents\Pointage_Sys\ZKPointe.exe"
