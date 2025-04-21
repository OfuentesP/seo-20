async function ejecutarLighthouse(url, carpeta) {
    const { default: lighthouse } = await import('lighthouse');
    const chromeLauncher = await import('chrome-launcher');
  
    const chrome = await chromeLauncher.launch({
      chromeFlags: [
        '--headless',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--single-process',
        '--no-zygote'
      ],
      executablePath: '/home/seo_user/.cache/puppeteer/chrome/linux-135.0.7049.84/chrome-linux64/chrome'
    });
  
    const result = await lighthouse(url, {
      port: chrome.port, // ✅ PORT AGREGADO
      output: 'json',
      logLevel: 'info'
    });
  
    await chrome.kill();
  
    const outputPath = path.join(carpeta, 'lighthouse.json');
    fs.writeFileSync(outputPath, result.report);
    console.log(`📊 Lighthouse guardado en: ${outputPath}`);
  }
  