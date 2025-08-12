from bs4 import BeautifulSoup
import requests
import json
import time
import re

def extract_watering_period(watering_text):
    if not watering_text:
        return None
    
    # Patrones para extraer frecuencias de riego
    patterns = [
        r'(\d+)\s*times?\s*per\s*(week|day|month)',
        r'once\s*every\s*(\d+)\s*(weeks?|days?|months?)',
        r'every\s*(\d+)\s*(weeks?|days?|months?)',
        r'(\d+)-(\d+)\s*times?\s*per\s*(week|day|month)'
    ]
    
    for pattern in patterns:
        match = re.search(pattern, watering_text.lower())
        if match:
            if 'times per' in pattern:
                frequency = match.group(1)
                unit = match.group(2)
                return {
                    "watering_period": {
                        "value": frequency,
                        "unit": unit
                    }
                }
            elif 'every' in pattern:
                interval = match.group(1)
                unit = match.group(2).rstrip('s')  # Remove plural
                return {
                    "watering_period": {
                        "value": interval,
                        "unit": unit
                    }
                }
    
    return None

# Abre el fichero HTML
with open("./perenual.html", "r", encoding="utf-8") as f:
    html = f.read()

soup = BeautifulSoup(html, "html.parser")

# Encuentra el div por id
container = soup.find("div", id="search-container-display")

# Extrae todos los href de los <a> dentro del div
hrefs = [a["href"] for a in container.find_all("a", href=True)]
plants = []
for href in hrefs:
    if 'start_time' not in locals():
        start_time = time.time()
    elapsed = time.time() - start_time
    minutes = int(elapsed // 60)
    seconds = int(elapsed % 60)
    print(f"Scraping plant data from: {href} | Elapsed time: {minutes}m {seconds}s")
    ficha_resp = requests.get(href)
    ficha_soup = BeautifulSoup(ficha_resp.text, "html.parser")
    nombre_comun_elem = ficha_soup.find("h1", class_="text-5xl font-bold")
    nombre_comun = nombre_comun_elem.get_text(strip=True) if nombre_comun_elem else ""
    nombre_cientifico_elem = ficha_soup.find("h2", class_="italic main-t-c my-2")
    nombre_cientifico = nombre_cientifico_elem.get_text(strip=True) if nombre_cientifico_elem else ""
    
    # Lista de campos a extraer y su conversión a lenguaje natural
    fields = [
        "care_level", "cones", "cuisine", "cycle", "drought_tolerant", "edible_fruit",
        "edible_leaf", "flowering_season", "flowers", "fruiting_season", "fruits",
        "growth_rate", "harvest_method", "harvest_season", "indoor", "invasive", "leaf",
        "maintenance", "medicinal", "pest_susceptibility", "poisonous_to_humans",
        "poisonous_to_pets", "pruning_month", "rare", "salt_tolerant", "soil",
        "sunlight", "thorny", "tropical", "watering", "sun", "edible", "hardiness"
    ]

    def snake_to_title(s):
        return s.replace("_", " ").capitalize()

    plant_data = {}

    for field in fields:
        section_name = " ".join(word.capitalize() for word in field.split("_")) + ":"
        section = ficha_soup.find("h3", string=section_name)
        value = None
        if section:
            # Buscar el siguiente elemento hermano <p> después del <h3>
            p = section.find_next_sibling("p")
            if p:
                value = p.get_text(strip=True)
        plant_data[field] = value

    # Extraer la URL de la imagen principal
    img_elem = ficha_soup.find("img", class_="w-full rounded")
    img_src = img_elem["src"] if img_elem and img_elem.has_attr("src") else None
    plant_data["image"] = img_src
    
    watering_section = ficha_soup.find("h3", string="watering")
    watering_info = None
    if watering_section:
        parent_div = watering_section.find_parent("div", class_="rounded-md shadow p-3")
        if parent_div:
            watering_p = parent_div.find("p")
            if watering_p:
                watering_info = watering_p.get_text(strip=True)
                
    sunlight_info = None
    sunlight_section = ficha_soup.find("h3", string="sunlight")
    if sunlight_section:
        parent_div = sunlight_section.find_parent("div", class_="rounded-md shadow p-3")
        if parent_div:
            sunlight_p = parent_div.find("p")
            if sunlight_p:
                sunlight_info = sunlight_p.get_text(strip=True)

    pruning_info = None
    pruning_section = ficha_soup.find("h3", string="pruning")
    if pruning_section:
        parent_div = pruning_section.find_parent("div", class_="rounded-md shadow p-3")
        if parent_div:
            pruning_p = parent_div.find("p")
            if pruning_p:
                pruning_info = pruning_p.get_text(strip=True)
                
    plant_data["common_name"] = nombre_comun
    plant_data["scientific_name"] = nombre_cientifico
    plant_data["watering_long"] = watering_info
    plant_data["sunlight"] = sunlight_info
    plant_data["pruning"] = pruning_info
    plants.append(plant_data)

    with open("plants.json", "w", encoding="utf-8") as outfile:
        json.dump(plants, outfile, ensure_ascii=False, indent=2)
    