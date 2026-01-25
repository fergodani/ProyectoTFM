import os
import imghdr
from pathlib import Path

# --- RUTA DE TUS DATOS ---
data_dir = 'C:/Users/danix/Documents/Master/Segundo/TFM/Dataset'
# -------------------------

print(f"Analizando la verdad oculta de los archivos en: {data_dir}...")

files_deleted = 0
errors_found = 0

# Extensiones que TensorFlow acepta sin problemas
valid_formats = ['jpeg', 'png', 'bmp', 'gif']

for filepath in Path(data_dir).rglob("*"):
    if filepath.is_file():
        # 1. Ignorar archivos ocultos conocidos
        if filepath.name.startswith(".") or filepath.name == "Thumbs.db" or filepath.name == "desktop.ini":
            continue

        try:
            # Leemos el formato REAL mirando los bytes del archivo
            real_format = imghdr.what(filepath)

            # Caso A: El archivo no es una imagen reconocida (es None)
            if real_format is None:
                print(f"[BASURA] No es imagen o está vacía: {filepath}")
                # os.remove(filepath)  <-- Descomenta para borrar
                errors_found += 1
            
            # Caso B: Es una imagen, pero no una que TF soporte (ej. WebP, TIFF)
            elif real_format not in valid_formats:
                print(f"[NO SOPORTADO] Dice ser {filepath.suffix}, pero es realmente un: {real_format.upper()} -> {filepath.name}")
                # os.remove(filepath)  <-- Descomenta para borrar
                errors_found += 1
                
            # Caso C: Es un JPEG válido, pero verifiquemos si está truncado (descarga incompleta)
            elif real_format == 'jpeg':
                with open(filepath, 'rb') as f:
                    f.seek(-2, 2) # Ir al final del archivo
                    if f.read() != b'\xff\xd9': # Byte final estándar de JPG
                        print(f"[TRUNCADO] JPG incompleto (corrupto): {filepath}")
                        # os.remove(filepath) <-- Descomenta para borrar
                        errors_found += 1

        except Exception as e:
            print(f"[ERROR DE LECTURA] No se pudo acceder a {filepath}: {e}")

print("---")
print(f"Escaneo finalizado. Archivos problemáticos encontrados: {errors_found}")