# SEO20 - Despliegue y Actualización

## 🛠 Requisitos previos
- PM2 instalado
- Dominio apuntando al servidor (ej. seo20.dev)
- Certificado SSL configurado con Certbot
- Aplicación corriendo con PM2 (`pm2 start server.js --name seo20`)

---

## 🚀 Actualización de código en producción

Cada vez que subas cambios a GitHub, sigue estos pasos desde el servidor (usuario `seo_user`):

```bash
cd ~/seo-20
./actualizar.sh
