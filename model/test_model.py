from ultralytics import YOLO
import cv2
import os

ruta_modelo = 'results/plantify_model_v1/weights/best.pt'

if not os.path.exists(ruta_modelo):
    print(f"❌ Error: No encuentro el modelo en '{ruta_modelo}'")
    print("Por favor, edita el script y pon la ruta correcta a tu archivo best.pt")
    exit()

model = YOLO(ruta_modelo)

# 2. DEFINIR LA IMAGEN A PROBAR
# Pon aquí la ruta de una foto de una planta para probar (puede ser una bajada de Google)
ruta_imagen = 'test.jpg' 

# (Opcional) Si no tienes foto, el script intentará usar la webcam
usar_webcam = False 

if usar_webcam:
    # MODO WEBCAM (Para probar en vivo)
    cap = cv2.VideoCapture(0)
    print("Presiona 'q' para salir...")
    while True:
        ret, frame = cap.read()
        if not ret: break
        
        # Inferencia
        results = model(frame)
        
        # Pintar resultados en el video
        annotated_frame = results[0].plot()
        cv2.imshow("Prueba Modelo Plantas", annotated_frame)
        
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break
    cap.release()
    cv2.destroyAllWindows()

else:
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
        nombre_planta = results[0].names[top1]
        
        print("\n" + "="*30)
        print(f"🌿 PLANTA DETECTADA: {nombre_planta}")
        print(f"🌿 PLANTA DETECTADA: {nombre_planta.upper()}")
        print(f"📊 Confianza: {confianza:.2%}")
        print("="*30 + "\n")
        
        # Mostrar la imagen con el resultado
        results[0].show()