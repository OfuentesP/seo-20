const { main } = require('../seo20.js');
const commander = require('commander');

jest.mock('commander');
jest.mock('../generar-insights-ai');
jest.mock('../analizar-sitemap');
jest.mock('../analizar-sitemap-resumen');
jest.mock('../generar-informe-unificado-con-gemini');
jest.mock('../extraer-urls-sitemap');
jest.mock('../scrape');
jest.mock('../detect-404');

describe('seo20', () => {
  it('should throw an error if no URL is provided', async () => {
    commander.parse.mockReturnValue({ args: [] });
    await expect(main()).rejects.toThrow('No URL provided');
  });

  it('should process a valid URL and show a result', async () => {
    const consoleLogMock = jest.spyOn(console, 'log').mockImplementation(() => {});
    commander.parse.mockReturnValue({ args: ['https://www.example.com'] });

    await main('https://www.example.com');

    expect(consoleLogMock).toHaveBeenCalledWith('url received: https://www.example.com');
    consoleLogMock.mockRestore();
  });
});