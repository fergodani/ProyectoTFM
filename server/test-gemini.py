from google import genai
from google.genai import types
from dotenv import load_dotenv
import os

load_dotenv()
api_key = os.getenv('GEMINI_API_KEY')

# The client gets the API key from the environment variable `GEMINI_API_KEY`.
client = genai.Client(api_key=api_key)

image_path = r"C:\Users\danix\Pictures\lettuce.jpg"
with open(image_path, 'rb') as image_file:
    image_data = image_file.read()

response = client.models.generate_content(
    model='gemini-2.5-flash',
    contents=[
      types.Part.from_bytes(
        data=image_data,
        mime_type='image/jpeg',
      ),
      '''Identify this plant and provide only the scientific names. List 3-5 potential identifications with their complete scientific names only, one per line, without numbers, formatting, or additional text.'''
    ]
  )

print(response.text)