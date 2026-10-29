import requests
from bs4 import BeautifulSoup

sopa = BeautifulSoup(requests.get("https://libreria.example/").text, "html.parser")

# Usa select() y select_one()
