# Whatcoommerce-bot

<<<<<<< HEAD
## Descripción
Framework para integración de WhatsApp Web con WooCommerce.

## Instalación
1. Clona este repositorio
2. Ejecuta `npm install` para instalar las dependencias
3. Configura las variables de entorno en el archivo `.env`

## Uso
Ejecuta `npm start` para iniciar el bot.

## Dependencias
=======
Framework profesional para integración de WhatsApp Web con WooCommerce y panel de administración avanzado.

## Características principales
- Integración con WhatsApp Web para automatización y respuestas automáticas.
- Panel de administración moderno y personalizable.
- Gestión de nodos de respuesta automática (crear, editar, eliminar).
- Subida de archivos para consulta: soporta CSV, Excel, TXT y PDF.
- Búsqueda de productos, contactos o cualquier dato en archivos subidos vía comandos de WhatsApp.
- Estadísticas y filtros avanzados en el panel.

## Instalación

1. Clona este repositorio:
   ```bash
   git clone https://github.com/Bystalloths/Whatcoommerce-bot.git
   cd Whatcoommerce-bot
   ```
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Configura las variables de entorno en el archivo `.env` (ver ejemplo en `.env.example`).
4. Inicia el bot:
   ```bash
   npm start
   ```

## Uso

- Accede al panel de administración en `http://localhost:4000`.
- Sube archivos CSV, Excel, TXT o PDF desde el panel para que el bot pueda consultarlos.
- Usa comandos de WhatsApp como:
  - `/buscar producto Televisor`
  - `/buscar contacto Juan`
- El bot responderá con la información encontrada en el archivo subido más reciente.

## Subida y consulta de archivos
- Desde el panel puedes subir archivos `.csv`, `.xlsx`, `.xls`, `.txt` o `.pdf`.
- El bot detecta automáticamente el tipo de archivo y realiza la búsqueda correspondiente.

## Dependencias principales
>>>>>>> 08b99f6 (Actualización de README y licencia MIT)
- whatsapp-web.js
- qrcode-terminal
- @woocommerce/woocommerce-rest-api
- openai
- deepseek
<<<<<<< HEAD
=======
- csv-parse
- xlsx
- pdf-parse

## Licencia
Ver archivo LICENSE.
>>>>>>> 08b99f6 (Actualización de README y licencia MIT)
