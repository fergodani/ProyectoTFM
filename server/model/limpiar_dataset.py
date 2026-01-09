import os
from PIL import Image # Necesitas Pillow: pip install pillow
import glob

# Ruta a tu dataset
dataset_path = 'C:/Users/danix/Documents/Master/Segundo/TFM/Dataset'

def limpiar_imagenes():
    print(f"🧹 Iniciando limpieza en '{dataset_path}'...")
    
    # Busca todas las imágenes recursivamente (jpg, jpeg, png, bmp, webp)
    # extensions = ['*.jpg', '*.jpeg', '*.png', '*.bmp', '*.webp']
    files = []
    for ext in ['*.jpg', '*.jpeg', '*.png', '*.bmp', '*.webp']:
        files.extend(glob.glob(os.path.join(dataset_path, '**', ext), recursive=True))

    corruptas = 0
    convertidas = 0

    for file_path in files:
        try:
            img = Image.open(file_path)
            
            # 1. Verificar si es válida forzando la carga de datos
            img.verify() 
            
            # Hay que reabrirla después de verify()
            img = Image.open(file_path) 
            
            # 2. Convertir a RGB si no lo es (ej: RGBA o Grayscale)
            if img.mode != 'RGB':
                # print(f"Convertido a RGB: {file_path}")
                rgb_img = img.convert('RGB')
                rgb_img.save(file_path) # Sobrescribimos
                convertidas += 1
            
            # Opcional: Redimensionar aquí si quisieras, pero TF lo hace luego.
            
        except (IOError, SyntaxError) as e:
            print(f"❌ Eliminando imagen corrupta: {file_path}")
            try:
                os.remove(file_path)
                corruptas += 1
            except:
                print(f"No se pudo borrar: {file_path}")

    print("\n" + "="*30)
    print("RESUMEN DE LIMPIEZA")
    print("="*30)
    print(f"✅ Imágenes revisadas: {len(files)}")
    print(f"🎨 Convertidas a RGB estándar: {convertidas}")
    print(f"🗑️ Corruptas eliminadas: {corruptas}")
    print("="*30)
    print("Ahora intenta entrenar de nuevo.")

if __name__ == '__main__':
    limpiar_imagenes()