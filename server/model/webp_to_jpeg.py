import os
from pathlib import Path
from PIL import Image

# --- RUTA DE TUS DATOS ---
data_dir = 'C:/Users/danix/Documents/Master/Segundo/TFM/Dataset'
# -------------------------

print(f"Comenzando la conversión de WebP a JPG en: {data_dir}")
converted_count = 0
errors = 0

# Recorremos todas las imágenes
for filepath in Path(data_dir).rglob("*"):
    if filepath.is_file():
        try:
            # Intentamos abrir la imagen con Pillow
            with Image.open(filepath) as img:
                current_format = img.format
                
                # CONDICIÓN: Si es WebP (o cualquier cosa que no sea JPEG/PNG/BMP)
                # O si la extensión dice .jpg pero el formato interno es WebP
                is_disguised_webp = (filepath.suffix.lower() in ['.jpg', '.jpeg']) and (current_format == 'WEBP')
                is_explicit_webp = (current_format == 'WEBP')

                if is_disguised_webp or is_explicit_webp:
                    print(f"[CONVIRTIENDO] {filepath.name} (Formato real: {current_format})")
                    
                    # 1. Convertir a RGB (WebP admite transparencia, JPG no)
                    rgb_im = img.convert('RGB')
                    
                    # 2. Definir nuevo nombre (asegurar extensión .jpg)
                    new_path = filepath.with_suffix('.jpg')
                    
                    # 3. Guardar como JPG estándar
                    rgb_im.save(new_path, quality=95)
                    
                    # 4. Si el archivo original tenía otro nombre o extensión, borrarlo
                    # (Si se llamaba .jpg y era WebP, el save() de arriba ya lo sobrescribió correctamente,
                    # pero si era .webp, hay que borrar el viejo).
                    if str(filepath) != str(new_path):
                        os.remove(filepath)
                    
                    converted_count += 1

        except Exception as e:
            print(f"[ERROR] No se pudo procesar {filepath.name}: {e}")
            errors += 1

print("---")
print(f"Proceso terminado.")
print(f"Imágenes convertidas: {converted_count}")