# Configuración de Base de Datos - Django

Este proyecto está configurado para usar diferentes bases de datos según el entorno:

- **Desarrollo**: SQLite (por defecto)
- **Producción**: PostgreSQL

## 🚀 Configuración Inicial

### 1. Instalar Dependencias

```bash
pip install -r requirements.txt
```

### 2. Configurar Entornos

Los archivos de configuración ya están creados:
- `.env.development` - Variables para desarrollo (SQLite)
- `.env.production` - Variables para producción (PostgreSQL)

## 📝 Uso

### Desarrollo (SQLite) - Por defecto

Para trabajar en desarrollo (usa SQLite automáticamente):

```powershell
# Windows PowerShell
.\switch-environment.ps1 development

# O directamente
python manage.py runserver
```

### Producción (PostgreSQL)

Para cambiar a producción:

```powershell
# Windows PowerShell
.\switch-environment.ps1 production
```

**⚠️ IMPORTANTE para Producción:**

1. **Instalar PostgreSQL** en tu sistema
2. **Configurar las credenciales** en `.env.production`:
   ```
   DB_NAME=nombre_de_tu_bd
   DB_USER=tu_usuario
   DB_PASSWORD=tu_password_seguro
   DB_HOST=localhost  # o tu servidor
   DB_PORT=5432
   SECRET_KEY=clave-secreta-super-segura
   ```

3. **Crear la base de datos** en PostgreSQL:
   ```sql
   CREATE DATABASE nombre_de_tu_bd;
   CREATE USER tu_usuario WITH ENCRYPTED PASSWORD 'tu_password_seguro';
   GRANT ALL PRIVILEGES ON DATABASE nombre_de_tu_bd TO tu_usuario;
   ```

4. **Ejecutar migraciones**:
   ```bash
   python manage.py migrate
   ```

## 🔄 Cambiar entre Entornos

### Opción 1: Script PowerShell (Recomendado)
```powershell
# Desarrollo
.\switch-environment.ps1 development

# Producción  
.\switch-environment.ps1 production
```

### Opción 2: Variable de Entorno Manual
```powershell
# Desarrollo
$env:ENVIRONMENT = "development"

# Producción
$env:ENVIRONMENT = "production"
```

## 📋 Verificar Configuración

Para verificar qué base de datos está usando:

```python
# En el shell de Django
python manage.py shell

from django.conf import settings
print(settings.DATABASES)
```

## 🛠️ Migraciones

### Para Desarrollo (SQLite)
```bash
python manage.py makemigrations
python manage.py migrate
```

### Para Producción (PostgreSQL)
```bash
# Asegúrate de estar en modo producción
.\switch-environment.ps1 production

# Ejecutar migraciones
python manage.py makemigrations
python manage.py migrate

# Crear superusuario si es necesario
python manage.py createsuperuser
```

## 🔍 Troubleshooting

### Error: "Import dotenv could not be resolved"
```bash
pip install python-dotenv
```

### Error de conexión a PostgreSQL
1. Verificar que PostgreSQL esté ejecutándose
2. Verificar credenciales en `.env.production`
3. Verificar que la base de datos existe

### Los cambios no se aplican
1. Reiniciar el servidor Django
2. Verificar que el archivo `.env` tiene el entorno correcto
3. Verificar la variable `ENVIRONMENT`

## 📁 Estructura de Archivos

```
server/
├── .env                    # Variable de entorno actual
├── .env.development        # Config para desarrollo
├── .env.production         # Config para producción
├── switch-environment.ps1  # Script para cambiar entornos
├── plants/settings.py      # Configuración Django
└── requirements.txt        # Dependencias
```