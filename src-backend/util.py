import datetime
import xml.etree.ElementTree as ET
import re

def timestamp_filename(filename: str):
    # Split the filename into name and extension
    name, ext = filename.rsplit(".", 1)

    # Remove any non-alphanumeric characters from the name, sanitation for s3 objects
    if not name.isalnum():
        name = "".join([c for c in name if c.isalnum()])

    # Truncate the name to 32 characters (incase there are limits I don't know about)
    if len(name) > 32:
        name = name[:32]

    # Get the current timestamp
    timestamp = datetime.datetime.now(tz=datetime.timezone.utc).strftime(
        "%Y%m%d_%H%M%S"
    )

    # Combine the parts to create the new filename
    new_filename = f"{name}_{timestamp}.{ext}"

    return new_filename

def xml_to_dict(xml_string):

    def _process_text(text):
        """Process text to convert bullet lists to array representation"""
        if not text or not text.strip():
            return None
            
        # Check if the text contains bullet points
        if '•' in text:
            # Split by bullet point and clean up
            items = re.split(r'\s*•\s*', text)
            # Remove empty items (like the part before the first bullet)
            items = [item.strip() for item in items if item.strip()]
            if items:
                return items
                
        return text.strip()
    
    def _element_to_dict(element):
        result = {}
        
        # Add attributes if present
        if element.attrib:
            result["@attributes"] = element.attrib
            
        # Process child elements
        children = list(element)
        if children:
            child_dicts = {}
            for child in children:
                child_dict = _element_to_dict(child)
                
                # Handle multiple children with same tag
                if child.tag in child_dicts:
                    # Convert to list if not already
                    if not isinstance(child_dicts[child.tag], list):
                        child_dicts[child.tag] = [child_dicts[child.tag]]
                    child_dicts[child.tag].append(child_dict[child.tag])
                else:
                    child_dicts.update(child_dict)
            
            result[element.tag] = child_dicts
        else:
            # Handle text content with bullet point processing
            result[element.tag] = _process_text(element.text)
                
        return result
    
    try:
        root = ET.fromstring(xml_string)
        result = _element_to_dict(root)
        # return json.dumps(result, indent=2)
        return result
    except Exception as e:
        # return json.dumps({"error": f"Failed to parse XML: {str(e)}"})
        return {"error": f"Failed to parse XML: {str(e)}"}
    