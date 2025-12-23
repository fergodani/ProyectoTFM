from bing_image_downloader import downloader
import os
import shutil
import random

# CONFIGURACIÓN
origen = "C:/Users/danix/Documents/Master/Segundo/TFM/Fotos"        # Donde se bajaron las fotos
destino = "C:/Users/danix/Documents/Master/Segundo/TFM/Dataset"       # Donde se guardará ordenado
ratios = (0.7, 0.2, 0.1)

def descargar_plantas():
    # Lista optimizada para búsqueda precisa
    plantas_top_20 = [
        "Begonia", 
        "Dracaena sanderiana", 
        "Dieffenbachia seguine", 
        "Aglaonema commutatum", 
        "Calluna vulgaris", 
        "Ficus lyrata", 
        "Beaucarnea recurvata", 
        "Codiaeum variegatum", 
        "Chlorophytum comosum 'Vittatum'", 
        "Epipremnum aureum", 
        "Anthurium andraeanum", 
        "Euphorbia milii", 
        "Calathea lancifolia", 
        "Dracaena fragrans", 
        "Aspidistra elatior", 
        "Clivia miniata", 
        "Aloe vera", 
        "Aechmea fasciata", 
        "Alocasia amazonica", 
        "Dieffenbachia seguine", 
    ]

    for planta in plantas_top_20:
        print(f"--- Descargando: {planta} ---")
        downloader.download(
            planta, 
            limit=150,          # 150 fotos x 20 plantas = 3000 fotos (Tamaño perfecto)
            output_dir='C:/Users/danix/Documents/Master/Segundo/TFM/Fotos', 
            adult_filter_off=True, 
            force_replace=False, 
            timeout=60
        )
        print("-------------------------------")
        
def limpiar_nombre(nombre):
    return nombre.lower().replace(" ", "_")

def organizar():
    if not os.path.exists(origen):
        print(f"❌ No encuentro la carpeta '{origen}'.")
        return

    # Limpiar dataset anterior si existe para evitar mezclas
    if os.path.exists(destino):
        shutil.rmtree(destino)

    # Crear carpetas principales
    for tipo in ['train', 'val', 'test']:
        os.makedirs(os.path.join(destino, tipo), exist_ok=True)

    carpetas_plantas = [d for d in os.listdir(origen) if os.path.isdir(os.path.join(origen, d))]

    for carpeta in carpetas_plantas:
        nombre_clase = limpiar_nombre(carpeta)
        ruta_origen_clase = os.path.join(origen, carpeta)
        
        # Filtrar solo imágenes
        imagenes = [f for f in os.listdir(ruta_origen_clase) 
                    if f.lower().endswith(('.png', '.jpg', '.jpeg', '.webp'))]
        
        random.shuffle(imagenes) # Mezclar para que sea aleatorio
        
        total = len(imagenes)
        n_train = int(total * ratios[0])
        n_val = int(total * ratios[1])
        # El resto va a test (para asegurar que sume 100% aunque haya decimales)
        
        imgs_train = imagenes[:n_train]
        imgs_val = imagenes[n_train:n_train + n_val]
        imgs_test = imagenes[n_train + n_val:]
        
        print(f"--> {nombre_clase}: {len(imgs_train)} Train | {len(imgs_val)} Val | {len(imgs_test)} Test")

        # Mover los archivos a su sitio
        divisiones = [('train', imgs_train), ('val', imgs_val), ('test', imgs_test)]
        
        for carpeta_destino, lista_imgs in divisiones:
            ruta_final = os.path.join(destino, carpeta_destino, nombre_clase)
            os.makedirs(ruta_final, exist_ok=True)
            for img in lista_imgs:
                shutil.copy2(
                    os.path.join(ruta_origen_clase, img),
                    os.path.join(ruta_final, img)
                )

    print(f"\n✅ ¡Dataset organizado con carpeta TEST incluida!")
    
if __name__ == '__main__':
    #descargar_plantas()
    organizar()