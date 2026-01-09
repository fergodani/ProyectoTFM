# Despliegue con Docker

Instrucciones básicas para levantar la app usando Docker Compose.

1) Copia el ejemplo de entorno:

```bash
cp .env.example .env
# Edita .env y pon SECRET_KEY y credenciales seguras
```

2) Construir y levantar servicios:

```bash
docker compose build
docker compose up -d
```

3) Ver logs y correr comandos:

```bash
docker compose logs -f web
docker compose exec web python manage.py createsuperuser
```

Notas:
- Si tu backend usa modelos pesados (torch, ultralytics), la imagen puede ser grande.
- Para producción en cloud/VM considera usar volumes persistentes para `postgres` y backups.
