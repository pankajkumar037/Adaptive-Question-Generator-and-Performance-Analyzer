

from langchain_community.document_loaders import PyPDFLoader

loader = PyPDFLoader("NEP_Final_English_0.pdf")
pages = loader.load()


data = "\n\n".join(page.page_content for page in pages)

with open("NEP_adaptive_data.txt", "w", encoding="utf-8") as f:
    f.write(data)

#print("PDF content has been saved to 'extracted_text.txt'")