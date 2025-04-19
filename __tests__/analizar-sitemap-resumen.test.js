const analizarResumenSitemap = require('../analizar-sitemap-resumen');
const axios = require('axios');

jest.mock('axios');

describe('analizarResumenSitemap', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should process URLs and count test, prueba, and 404 errors correctly', async () => {
    const urls = [
      'https://www.example.com/test1',
      'https://www.example.com/prueba1',
      'https://www.example.com/page1',
      'https://www.example.com/test2',
      'https://www.example.com/prueba2',
      'https://www.example.com/404-error',
      'https://www.example.com/ok',
    ];    axios.head.mockImplementation((url) => {
       if (url.includes('404-error')) {
        return Promise.reject({ response: { status: 404 } });
      
      }
      return Promise.resolve({ status: 200 });
    });

    const result = await analizarResumenSitemap(urls);

    expect(result.total).toBe(7);
    expect(result.conTest).toBe(2);
    expect(result.conPrueba).toBe(2);
    expect(result.conError404).toBe(1);
  });

  it('should handle empty URL list', async () => {
    const result = await analizarResumenSitemap([]);
    expect(result.total).toBe(0);
    expect(result.conTest).toBe(0);
    expect(result.conPrueba).toBe(0);
    expect(result.conError404).toBe(0);
  });

  it('should handle no test url', async () => {
    const urls = [
      'https://www.example.com/404-error',
      'https://www.example.com/ok',
      'https://www.example.com/error'
    ];

    axios.head.mockImplementation((url) => {
      if (url.includes('404-error')) {
        return Promise.reject({ response: { status: 404 } });
      } else if (url.includes('error')) {
        return Promise.reject(new Error('Simulated network error'));
      }
      return Promise.resolve({ status: 200 });
    });

    const result = await analizarResumenSitemap(urls);
    expect(result.total).toBe(3);    expect(result.conTest).toBe(0);
    expect(result.conPrueba).toBe(0);
    expect(result.conError404).toBe(0);
  });



  it('should handle no errors url', async () => {
    const urls = ['https://www.example.com/page1', 'https://www.example.com/ok'];
    axios.head.mockImplementation(() => {
      return Promise.resolve({ status: 200 });
    });
    const result = await analizarResumenSitemap(urls);
    expect(result.total).toBe(2);
    expect(result.conTest).toBe(0);
    expect(result.conPrueba).toBe(0);
    expect(result.conError404).toBe(0);
  });

  it('should log errors when processing URLs', async () => {
  const urls = ['https://www.example.com/404-error'];
  axios.head.mockImplementation((url) => {
    if (url.includes('404-error')) {
      return Promise.reject({ response: { status: 404 } });
    }
    return Promise.resolve({ status: 200 });
  
    });
    const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => { });
    expect(mockConsoleError).toHaveBeenCalledTimes(1);
    expect(mockConsoleError).toHaveBeenNthCalledWith(
      1,
      '❌ Error al procesar la URL: https://www.example.com/404-error. Error: undefined',
    );
  });
});