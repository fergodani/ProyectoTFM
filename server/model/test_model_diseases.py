from ultralytics import YOLO
import cv2
import os

ruta_modelo = 'results_disease/plantify_disease_model_v1/weights/best.pt'

if not os.path.exists(ruta_modelo):
    print(f"❌ Error: No encuentro el modelo en '{ruta_modelo}'")
    print("Por favor, edita el script y pon la ruta correcta a tu archivo best.pt")
    exit()

model = YOLO(ruta_modelo)

# 2. DEFINIR LA IMAGEN A PROBAR
# Pon aquí la ruta de una foto de una planta para probar (puede ser una bajada de Google)
ruta_imagen = 'C:/Users/danix/Documents/Master/Segundo/TFM/diseaseDataset/test/TomatoHealthy3.JPG' 

# MODO FOTO ÚNICA
if not os.path.exists(ruta_imagen):
    print(f"❌ No encuentro la imagen '{ruta_imagen}'. Pon una foto ahí para probar.")
else:
    print(f"🔍 Analizando imagen: {ruta_imagen}...")
    
    # Hacer la predicción
    results = model(ruta_imagen)
    
    # Obtener el resultado más probable
    top1 = results[0].probs.top1
    confianza = results[0].probs.top1conf.item()
    nombre_disease = results[0].names[top1]
    
    print("\n" + "="*30)
    print(f"🌿 ENFERMEDAD DETECTADA: {nombre_disease}")
    print(f"🌿 ENFERMEDAD DETECTADA: {nombre_disease.upper()}")
    print(f"📊 Confianza: {confianza:.2%}")
    print("="*30 + "\n")
    
    # Mostrar la imagen con el resultado
    results[0].show()