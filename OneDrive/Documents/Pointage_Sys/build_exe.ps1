Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

$code = @"
using System;
using System.Diagnostics;
using System.IO;
using System.Windows.Forms;
using System.Drawing;
using System.Threading;

class ZKPointe {
    [STAThread]
    static void Main() {
        string baseDir = Path.GetDirectoryName(System.Reflection.Assembly.GetExecutingAssembly().Location);

        // Splash screen
        Form splash = new Form();
        splash.FormBorderStyle = FormBorderStyle.None;
        splash.StartPosition = FormStartPosition.CenterScreen;
        splash.Width = 480;
        splash.Height = 280;
        splash.BackColor = Color.FromArgb(76, 175, 80);
        splash.TopMost = true;

        // Logo
        string logoPath = Path.Combine(baseDir, "logo.png");
        if (File.Exists(logoPath)) {
            PictureBox pic = new PictureBox();
            pic.Image = Image.FromFile(logoPath);
            pic.SizeMode = PictureBoxSizeMode.Zoom;
            pic.Dock = DockStyle.Fill;
            splash.Controls.Add(pic);
        } else {
            Label lbl = new Label();
            lbl.Text = "ZKPointe";
            lbl.Font = new Font("Arial", 36, FontStyle.Bold);
            lbl.ForeColor = Color.White;
            lbl.TextAlign = ContentAlignment.MiddleCenter;
            lbl.Dock = DockStyle.Fill;
            splash.Controls.Add(lbl);
        }

        // Lancer les services en arriere-plan
        Thread t = new Thread(() => {
            string phpPath = @"C:\xampp\php\php.exe";

            var backend = new ProcessStartInfo {
                FileName = "cmd.exe",
                Arguments = "/c \"" + phpPath + "\" artisan serve --host=0.0.0.0 --port=8000",
                WorkingDirectory = Path.Combine(baseDir, "backend"),
                WindowStyle = ProcessWindowStyle.Hidden,
                UseShellExecute = true
            };
            Process.Start(backend);

            var frontend = new ProcessStartInfo {
                FileName = "cmd.exe",
                Arguments = "/c cd /d \"" + Path.Combine(baseDir, "frontend", "dist") + "\" && serve --single -p 3000",
                WindowStyle = ProcessWindowStyle.Hidden,
                UseShellExecute = true
            };
            Process.Start(frontend);

            var sync = new ProcessStartInfo {
                FileName = "cmd.exe",
                Arguments = "/c python sync.py 2>nul || py sync.py",
                WorkingDirectory = Path.Combine(baseDir, "zkteco-sync"),
                WindowStyle = ProcessWindowStyle.Hidden,
                UseShellExecute = true
            };
            Process.Start(sync);

            Thread.Sleep(4000);

            splash.Invoke(new Action(() => {
                Process.Start(new ProcessStartInfo {
                    FileName = "http://localhost:3000",
                    UseShellExecute = true
                });
                splash.Close();
            }));
        });
        t.IsBackground = true;
        t.Start();

        Application.Run(splash);
    }
}
"@

$refs = @(
    "System.Windows.Forms",
    "System.Drawing"
)

$exePath = Join-Path $scriptDir "ZKPointe.exe"

Add-Type -TypeDefinition $code `
         -Language CSharp `
         -OutputAssembly $exePath `
         -OutputType WindowsApplication `
         -ReferencedAssemblies $refs

Write-Host "ZKPointe.exe cree avec succes !" -ForegroundColor Green
Write-Host "Emplacement: $exePath"
