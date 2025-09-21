import sys
import json
import re
import requests
import time

def read_file(file):
    try:
        with open(file, 'r', encoding='utf-8') as archivo:
            contenido = archivo.read()
            contenido.replace('\n', ' ')
            return contenido
    except FileNotFoundError:
        print("No se ha encontrado el archivo ", file)
        return ""

def send_mistral(text, prompt):
    prompt = prompt.replace("${TEXT}", text)
    url = "http://localhost:11434/api/generate"
    data = {
        "model": "gemma3:12b",
        "prompt": prompt,
        "stream": False
    }

    with requests.post(url, json=data, stream=True) as response:
        if not response.ok:
            raise Exception(f"Error en la llamada: {response.text}")
        result = ""
        for line in response.iter_lines():
            if line:
                # Cada línea es un fragmento JSON con la clave 'response'
                try:
                    partial = json.loads(line)
                    chunk = partial.get("response", "")
                    #print(chunk, end="", flush=True)  # Muestra el progreso
                    result += chunk
                except Exception:
                    pass
        print()  # Salto de línea al final
        return result


def extract_and_save_json(texto, nombre_fichero):
    # Utiliza una expresión regular para encontrar el JSON en el texto
    patron = re.compile(r'\{.*\}', re.DOTALL)
    coincidencia = patron.search(texto)

    if coincidencia:
        json_texto = coincidencia.group()
        try:
            # Convierte el JSON encontrado en un diccionario de Python para validar
            resultado_json = json.loads(json_texto)

            # Escribe el JSON en un fichero
            with open(nombre_fichero, 'w', encoding='utf-8') as file:
                json.dump(resultado_json, file, indent=4)

            print(f"El JSON ha sido guardado en {nombre_fichero}")
        except json.JSONDecodeError:
            print("Error al decodificar el JSON.")
    else:
        print("No se encontró JSON en el texto proporcionado.")

if __name__ == '__main__':
    prompt = read_file("./prompt_plant_type.txt")
    # Leer el JSON con el array de plantas
    with open("../../plants_results.json", "r", encoding="utf-8") as f:
        plants_data = json.load(f)

    # Suponiendo que el array de plantas está bajo la clave "plants"

    count = 0
    for plant in plants_data:
        if 'start_time' not in locals():
            start_time = time.time()
        # Cambia 'campo' por el nombre real del campo que quieres usar como content
        content = plant.get("common_name", "")
        if content:
            result = send_mistral(content, prompt).rstrip('\n')
            try:
                # Extraer solo el JSON del resultado usando expresión regular
                if result is not None:
                    plant["type"] = result
                    with open("../../plants_results.json", "w", encoding="utf-8") as outfile:
                        json.dump(plants_data, outfile, ensure_ascii=False, indent=2)
                    count = count + 1

                    elapsed = time.time() - start_time
                    minutes = int(elapsed // 60)
                    seconds = int(elapsed % 60)
                    print(f"Number of plants: {count} | Elapsed time: {minutes}m {seconds}s")
            except Exception as e:
                print(f"Error al procesar el JSON de respuesta: {e}")
