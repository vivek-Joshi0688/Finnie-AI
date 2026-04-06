import os
from openai import OpenAI
from dotenv import load_dotenv, find_dotenv


load_dotenv(find_dotenv())

class LLMService:
    def __init__(self, model: str = "gpt-4"):
        self.model = model
        self.client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    def generate_response(self, prompt):
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": prompt}]
        )
        return response.choices[0].message.content
    
    def summarize(self, text: str) -> str:
        prompt = f"Summarize the following:\n{text}"
        return self.generate_response(prompt)