from ultralytics import YOLO
import torch

if __name__ == '__main__':
    print(f"Usando GPU: {torch.cuda.get_device_name(0)}")

    model = YOLO('yolo11s-cls.pt') 

    results = model.train(
        data='C:/Users/danix/Documents/Master/Segundo/TFM/diseaseDataset', # <--- ¡CAMBIA ESTO!
        
        epochs=50,          # 50 vueltas completas al dataset
        imgsz=224,          # Tamaño estándar para móviles
        batch=64,           # Tu 3060 Ti puede con esto en modo Nano.
        device=0,           # Usa tu NVIDIA
        workers=8,          # Hilos de la CPU para cargar datos
        project='./results_disease', # Carpeta donde se guardará todo
        name='plantify_disease_model_v1',         # Subcarpeta del experimento
        exist_ok=True             # Sobrescribir si ya existe
    )