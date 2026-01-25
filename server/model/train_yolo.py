from ultralytics import YOLO
import torch

if __name__ == '__main__':
    print(f"Usando GPU: {torch.cuda.get_device_name(0)}")

    model = YOLO('yolo11s-cls.pt') 

    results = model.train(
        data='C:/Users/danix/Documents/Master/Segundo/TFM/Dataset',
        
        epochs=50,
        imgsz=224, 
        batch=64,
        device=0,
        workers=8,
        project='./results',
        name='plantify_model_v1',
        exist_ok=True
    )
    
    
    
    
    