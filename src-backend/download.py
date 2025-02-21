PREAMBLE = """
#import "@preview/basic-resume:0.2.3": *

#let name = "{filename}"
#let phone = [#link("https://sit-novate-stackgurus.vercel.app/") \\ ID: {id} | Content-Type: {filetype}]

#show: resume.with(
  author: name,
  phone: phone,
  accent-color: "#26428b",
  paper: "a4",
  author-position: left,
  personal-info-position: left,
)

== Overview

{summary}

== Section Details

{section_details}

== Key Points

{key_points}

== Key Concepts

{key_concepts}

== Image Analysis

{image_analysis}

== Conclusion

{conclusion}
"""

SECTION_DETAILS = """
*{section_title}*

{summary}
"""

KEY_POINT = "- {key_point}\n"

KEY_CONCEPT = "- {key_concept}\n"

IMAGE_ANALYSIS = "- *{description}*: {relevance}\n"


def generate_typst_file_text(filename: str, id: str, filetype: str, summary: str, section_details: list[dict[str, str]], key_points: list[str], key_concepts: list[str], image_analysis: list[dict[str, str]], conclusion: str) -> str:
    key_points_str = "".join([KEY_POINT.format(key_point=key_point) for key_point in key_points])
    key_concepts_str = "".join([KEY_CONCEPT.format(key_concept=key_concept) for key_concept in key_concepts])
    _section_details = "".join([SECTION_DETAILS.format(section_title=section['section_title'], summary=section['summary']) for section in section_details])
    image_analysis_str = "".join([IMAGE_ANALYSIS.format(description=image['description'], relevance=image['relevance']) for image in image_analysis])
    
    typst_file = PREAMBLE.format(
        filename=filename,
        id=id,
        filetype=filetype,
        summary=summary,
        section_details=_section_details,
        key_points=key_points_str,
        key_concepts=key_concepts_str,
        image_analysis=image_analysis_str,
        conclusion=conclusion
    )

    return typst_file
