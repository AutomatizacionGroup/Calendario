# 📅 Calendario Empresarial, Itinerarios & Notificaciones WhatsApp

Aplicación web portátil en un solo archivo `index.html` lista para publicarse en **GitHub Pages** sin necesidad de servidores o bases de datos externas.

---

## 🚀 Cómo subir este proyecto a GitHub Pages en 2 Minutos

### Paso 1: Crear un nuevo repositorio en GitHub
1. Entra a [github.com/new](https://github.com/new).
2. Nombra tu repositorio (ejemplo: `calendario-empresariales`).
3. Selecciona **Public** y haz clic en **Create repository**.

### Paso 2: Subir los archivos desde tu computadora
Abre la terminal en la carpeta del proyecto y ejecuta los siguientes comandos:

```bash
git init
git add .
git commit -m "Inicializar Calendario Empresarial"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/TU_REPOSITORIO.git
git push -u origin main
```

*(Reemplaza `TU_USUARIO` y `TU_REPOSITORIO` con tus datos de GitHub).*

### Paso 3: Activar GitHub Pages (Gratis)
1. En tu repositorio en GitHub, ve a la pestaña **Settings** (Configuración).
2. En el menú lateral izquierdo, haz clic en **Pages**.
3. En **Build and deployment > Branch**, selecciona `main` y la carpeta `/ (root)`.
4. Haz clic en **Save**.
5. ¡Listo! En 1 minuto tu aplicación estará publicada y en vivo en una URL como:
   `https://TU_USUARIO.github.io/TU_REPOSITORIO/`

---

## 🔥 Funcionalidades Incluidas

- **Google Calendar Style**: Vistas de **Día, Semana, Mes e Itinerario**.
- **Indicador de Hora Actual**: Línea roja pulsante en tiempo real sobre el día de hoy.
- **Selección por Arrastre**: Haz clic y arrastra sobre cualquier franja horaria para seleccionar el rango a agendar.
- **Asignaciones en Paralelo**: Si dos trabajadores coinciden a la misma hora, las tareas se acomodan en paralelo automáticamente.
- **Bloqueo de Horario**: Impide que al mismo empleado se le empalmen 2 tareas a la misma hora.
- **Simulador de WhatsApp**: Historial de mensajes automáticos estilo WhatsApp Web.
- **Persistencia LocalStorage**: Tus tareas, usuarios y mensajes se guardan automáticamente en el navegador.
