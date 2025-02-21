import base64
from datetime import datetime, timezone
import io
import json
import re
from fastapi import BackgroundTasks, FastAPI, Form, File, Header, UploadFile, status, Response

# MULTI-MODAL INTELLIGENT DOCUMENT SUMMARIZATION : MIDS
from anthropic import Anthropic
from fastapi.responses import FileResponse
from supabase import create_client
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

import os

from util import timestamp_filename, xml_to_dict
import pymupdf
import pymupdf4llm
from dotenv import load_dotenv
from models import DBFile
from copy import deepcopy


from PIL import Image

from download import generate_typst_file_text

import typst

load_dotenv()

# Initialize Anthropic client using the API key from environment variables
ANTHROPIC = Anthropic(api_key=os.getenv("ANTHROPIC_KEY"))

# Define the model to be used
MODEL = "claude-3-5-sonnet-20240620"

# Maximum image pixels
MAX_PIXELS = 1568

# Initialize FastAPI app
app = FastAPI()

# Initialize Supabase client using environment variables
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    raise ValueError("Missing Supabase credentials. Check your .env file.")

# Create Supabase client
SUPABASE = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# Access Supabase storage
STORAGE = SUPABASE.storage

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return {"status": True}


PREAMBLE = {
    "type": "text",
    "text": "You are tasked with generating detailed comprehensive summaries for a document while capturing key information. The document may contain both text and images, or may be completely presented as images. Your goal is to provide a clear, concise summary that highlights the most important points and any relevant information.\nThe filetype of the document is {filetype}\n\nHere is the document text (extracted):\n<document_text>\n{text}\n</document_text>\n\nHere are the document pages as images:\n<document_pages>",
}


def preamble(text: str, filetype="application/pdf"):
    _preamble = deepcopy(PREAMBLE)
    _preamble["text"] = _preamble["text"].format(text=text, filetype=filetype)
    return _preamble


image_struct = {
    "type": "image",
    "source": {
        "type": "base64",
        "media_type": "image/jpeg",
        "data": "<base64_encoded_image>",
    },
}


def get_processed_image(b64_image: str):
    if not b64_image:
        return {"type": "text", "text": "<empty_image />"}
    copy_image_struct = deepcopy(image_struct)
    copy_image_struct["source"]["data"] = b64_image
    return copy_image_struct




def background_task(text: str, db_file_response: dict, pages_b64_images: list[str], filetype="application/pdf"):
    message = ANTHROPIC.messages.create(
        model="claude-3-5-sonnet-20241022",
        max_tokens=8192,
        temperature=0.25,
        messages=[
            {
                "role": "user",
                "content": [
                    preamble(text),
                    *[
                        get_processed_image(b64_image)
                        for b64_image in pages_b64_images
                    ],
                    {
                        "type": "text",
                        "text": "</document_pages>\n\nFollow these steps to analyze the document and generate summaries:\n\n1. Text Analysis:\n   - Read through the entire document text carefully.\n   - Identify the main topics, themes, and key points in each section.\n   - Note any important facts, figures, or statistics.\n   - Pay attention to the document's structure (e.g., introduction, main body, conclusion).\n\n2. Image Analysis (if applicable):\n   - Examine each image in the document.\n   - Describe the content of each image briefly.\n   - Identify any text, labels, or captions within the images.\n   - Explain how the images relate to or support the text content.\n\n3. Generate Summaries:\n   - Create a high-level summary of the entire document in 2-3 paragraphs.\n   - Provide more detailed summaries for each main section of the document.\n   - Ensure that each summary captures the essential information from both text and images.\n\n4. Capture Key Information:\n   - Highlight important quotes, statistics, or findings using bullet points.\n   - Identify and explain any crucial concepts or terminology.\n   - Note any significant conclusions or recommendations made in the document.\n\n5. Format Your Response:\n   Present your analysis and summaries in the following structure:\n\n   <document_summary>\n   [Insert your 2-3 paragraph high-level summary here]\n   </document_summary>\n\n   <section_summaries>\n   [For each main section of the document, include:]\n   <section>\n   <section_title>[Insert section title or topic]</section_title>\n   <summary>[Insert 4-8 sentence summary of the section]</summary>\n   </section>\n   [Repeat for each section]\n   </section_summaries>\n\n   <key_information>\n   <key_points>\n   [List 4-8 bullet points of crucial information, quotes, or statistics]\n   </key_points>\n   <key_concepts>\n   [List and briefly explain 4-6 important concepts or terms]\n   </key_concepts>\n   </key_information>\n\n   <image_analysis>\n   [If images are present and do not consist of page screenshots, include for each image:]\n   <image>\n   <description>[Brief description of the image content]</description>\n   <relevance>[Explain how the image relates to the text]</relevance>\n   </image>\n   [Repeat for each image]\n   </image_analysis>\n\n   <conclusion>\n   [Provide a brief conclusion summarizing the main takeaways and significance of the document]\n   </conclusion>\n\nRemember to maintain objectivity and accuracy in your summaries. Focus on capturing the most important information while providing a clear and concise overview of the entire document. You may use domain-specific language and terminology as needed to accurately represent the content. DO NOT NUMBER THE BULLET POINTS, USE ONLY • . Always stick to the output format, no matter the input. <image> tags are required. ",
                    },
                ],
            },
            {
                "role": "assistant",
                "content": [
                    {"type": "text", "text": "<document_summary>"}
                ]
            }
        ],
    )
    
    summary = "<document_summary>" + message.content[0].text
    
    db_file = DBFile.model_validate(db_file_response)
    db_file.summary = summary
    db_file.status = "completed"
    
    SUPABASE.table("files").upsert(db_file.model_dump(mode="json")).execute()
    
    print(f"{db_file.id} process_successful")
    return True


@app.post("/upload_file")
def upload_file(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    # filename = timestamp_filename(file.filename)

    filetype = file.content_type
    metadata = {"filename": file.filename, "content-type":filetype}
    
    attached_images = []
    
    if filetype == "application/pdf":
        document = pymupdf.open(stream=file.file.read())
        file.file.seek(0)
        text = pymupdf4llm.to_markdown(document)
        text = text[:100_000]
        for page_number, page in enumerate(document):
            pix = page.get_pixmap(matrix=pymupdf.Matrix(300/72, 300/72))
            img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
            
            if img.width > MAX_PIXELS or img.height > MAX_PIXELS:
                # Calculate scaling factor to fit within max dimensions
                scale_factor = min(MAX_PIXELS / img.width, MAX_PIXELS / img.height)
                new_width = int(img.width * scale_factor)
                new_height = int(img.height * scale_factor)
                img = img.resize((new_width, new_height), Image.LANCZOS)

            buffer = io.BytesIO()
            img.save(buffer, format="JPEG", quality=85)
            buffer.seek(0)
            
            base64_string = base64.standard_b64encode(buffer.getvalue()).decode("utf-8")

            attached_images.append(base64_string)
            
            metadata['num_pages'] = len(attached_images)
            
            
    elif filetype.startswith("image"):
        img = Image.open(file.file)
        buffer = io.BytesIO()
        if img.mode in ("RGBA", "P"):
            img = img.convert("RGB")
        img.save(buffer, format="JPEG", quality=85)
        buffer.seek(0)
        attached_images.append(base64.standard_b64encode(buffer.getvalue()).decode("utf-8"))
        text = "<provided_as_image />"
        metadata['num_pages'] = 1

    elif filetype.startswith("text"):
        text = file.file.read().decode("utf-8")
        # attached_images.append("")
        metadata['num_pages'] = 1
        

        
    db_file = DBFile(
        id=None,
        created_at=datetime.now(timezone.utc).astimezone(),
        status="processing",
        location="<not_available>",
        text=text,
        summary="",
        metadata=metadata,
    )

    db_file_response = (
        SUPABASE.table("files")
        .insert(db_file.model_dump(mode="json", exclude={"id"}))
        .execute()
    )

    # Send to background function
    background_tasks.add_task(background_task, text, db_file_response.data[0], attached_images, filetype)

    return {"id": db_file_response.data[0]["id"]}

class TextUploadRequest(BaseModel):
    text: str

@app.post("/upload_text")
def upload_text(background_tasks: BackgroundTasks, text_input: TextUploadRequest):
    text = text_input.text
    db_file = DBFile(
        id=None,
        created_at=datetime.now(timezone.utc).astimezone(),
        status="failed",
        location="<not_available>",
        text=text,
        summary="",
        metadata={"num_pages": 1, "filename": "TextInput", "content-type": "text/plain"},
    )

    db_file_response = (
        SUPABASE.table("files")
        .insert(db_file.model_dump(mode="json", exclude={"id"}))
        .execute()
    )
    

    # Send to background function
    background_tasks.add_task(background_task, text, db_file_response.data[0], [], "text/plain")

    return {"id": db_file_response.data[0]["id"]}


@app.get("/files")
async def get_all_files():
    all_files = SUPABASE.table("files").select("id,filename: metadata->filename, status, created_at").order("created_at", desc=True).eq("status", "completed").execute().data
    for file in all_files:
        if file["filename"] is None:
            file["filename"] = "TextInput" # We do a funny here
        
    return all_files


@app.get("/status/{id}")
async def get_status(id: str):
    db_file = SUPABASE.table("files").select("status").eq("id", id).execute().data[0]
    return {"status": db_file["status"]}


@app.get("/result/{id}")
def get_result(id: str):
    try:
        db_file = SUPABASE.table("files").select("*").eq("id", id).execute().data[0]
        if db_file["status"] == "completed":
            _parsed_xml = xml_to_dict("<document>"+re.sub(r"\s\>\s", " &gt; ", re.sub(r"\s\<\s", " &lt; ", db_file["summary"].replace("&", "&amp;")))+"</document>")
            
            parsed_xml = deepcopy(_parsed_xml)['document']            
            
            
            if type(parsed_xml['section_summaries']) is str:
                parsed_xml['section_summaries'] = [{"section_title": "Initial Section", "summary": parsed_xml['section_summaries']}]
            elif type(parsed_xml['section_summaries']) is dict:
                parsed_xml['section_summaries'] = [parsed_xml['section_summaries']['section'],] if type(parsed_xml['section_summaries']['section']) is not list else parsed_xml['section_summaries']['section']
            else:
                parsed_xml['section_summaries'] = parsed_xml['section_summaries']['section']                
            
            
            if type(parsed_xml['key_information']['key_points']) is str:
                parsed_xml['key_information']['key_points'] = [parsed_xml['key_information']['key_points'],]
            if type(parsed_xml['key_information']['key_concepts']) is str:
                parsed_xml['key_information']['key_concepts'] = [parsed_xml['key_information']['key_concepts'],]
            
            if parsed_xml.get('image_analysis') is None:
                parsed_xml['image_analysis'] = [{"description": "No images", "relevance": "No attached images were found with this document."}]
            elif type(parsed_xml['image_analysis']) is str:
                parsed_xml['image_analysis'] = [{"description": parsed_xml['image_analysis'], "relevance": ""}]
            elif type(parsed_xml['image_analysis']) is dict:
                parsed_xml['image_analysis'] = [parsed_xml['image_analysis']['image'],] if type(parsed_xml['image_analysis']['image']) is not list else parsed_xml['image_analysis']['image']
            else:
                parsed_xml['image_analysis'] = parsed_xml['image_analysis']['image']
                
            if db_file["metadata"].get("filename") is None:
                db_file["metadata"]["filename"] = "TextInput"
            return {
                "status": db_file["status"],
                "summary": parsed_xml,
                **db_file["metadata"],
            }
    except IndexError as e:
        return Response("404 NOT FOUND", status_code=status.HTTP_404_NOT_FOUND)
        
    return {"status": "processing"}


@app.get("/download/{id}")
def download_file(id: str):
    data = get_result(id)
    if type(data) is Response or data["status"] != "completed":
        return data

    typst_file = generate_typst_file_text(
        filename=data["filename"],
        id=id,
        filetype=data.get("content-type", "text/plain"),
        summary=data["summary"]["document_summary"],
        section_details=data["summary"]["section_summaries"],
        key_points=data["summary"]["key_information"]["key_points"],
        key_concepts=data["summary"]["key_information"]["key_concepts"],
        image_analysis=data["summary"]["image_analysis"],
        conclusion=data["summary"]["conclusion"]
    )
    
    with open(f"c2V4-{id}.typ", "w", encoding="utf-8") as f:
        f.write(re.sub(r'(?<!")@', r'\@', typst_file).replace("<", r" \u{003C} ").replace(">", r" \u{003E} "))
        
    typst.compile(f"c2V4-{id}.typ", f"c2V4-{id}.pdf")
    
    return FileResponse(f"c2V4-{id}.pdf", filename=f"{id}.pdf", media_type="application/pdf")
    
    


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", "42069")))