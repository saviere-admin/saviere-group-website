from pathlib import Path
import re

PAGES = [
    "index.html",
    "about.html",
    "governance.html",
    "active-operations.html",
    "roadmap.html",
    "press.html",
]

PEOPLE_DESKTOP = '<a href="people.html" class="nav-link">People</a>'
PEOPLE_MOBILE = '<a href="people.html" class="text-black mobile-link">People</a>'

CORPORATE_FOOTER = """
<div class="max-w-[90rem] mx-auto border-b border-gray-200 pb-8 mb-8">
    <div class="grid md:grid-cols-3 gap-6 font-sans text-xs text-gray-500 leading-relaxed">
        <div>
            <p class="font-ui text-[9px] font-bold uppercase tracking-widest text-saviere-gold mb-2">Registered Office</p>
            <p>Saviere Group Private Limited</p>
            <p>4th Floor, Queen's Plaza, Sardar Patel Rd</p>
            <p>Patigadda, Begumpet, Hyderabad – 500016</p>
            <p>Telangana, India</p>
        </div>
        <div>
            <p class="font-ui text-[9px] font-bold uppercase tracking-widest text-saviere-gold mb-2">Corporate</p>
            <p>CIN: U20237TS2026PTC224122</p>
            <p>Incorporated: 8 October 2026</p>
            <p><a href="mailto:connect@savieregroup.com" class="hover:text-saviere-crimson transition-colors">connect@savieregroup.com</a></p>
        </div>
        <div>
            <p class="font-ui text-[9px] font-bold uppercase tracking-widest text-saviere-gold mb-2">Online</p>
            <p><a href="index.html" class="hover:text-saviere-crimson transition-colors">savieregroup.com</a></p>
            <p>Building thoughtful businesses from India.</p>
        </div>
    </div>
</div>
""".strip()


def add_people_to_desktop_nav(html, filename):
    if 'href="people.html"' in html:
        return html

    # Only operate inside the first desktop nav.
    nav_match = re.search(
        r'(<nav[^>]*class="[^"]*hidden lg:flex[^"]*"[^>]*>)(.*?)(</nav>)',
        html,
        flags=re.DOTALL | re.IGNORECASE,
    )

    if not nav_match:
        raise RuntimeError(f"{filename}: desktop navigation not found")

    nav = nav_match.group(0)

    # Insert after About. This is deliberately limited to the nav block.
    about_match = re.search(
        r'(<a\s+href="about\.html"[^>]*>.*?</a>)',
        nav,
        flags=re.DOTALL | re.IGNORECASE,
    )

    if not about_match:
        raise RuntimeError(f"{filename}: About desktop navigation item not found")

    replacement = about_match.group(1) + "\n                " + PEOPLE_DESKTOP

    nav = nav[:about_match.start()] + replacement + nav[about_match.end():]

    return html[:nav_match.start()] + nav + html[nav_match.end():]


def add_people_to_mobile_nav(html, filename):
    if 'href="people.html"' in html:
        return html

    menu_match = re.search(
        r'(<div\s+id="mobile-menu"[^>]*>.*?<nav[^>]*>)(.*?)(</nav>)',
        html,
        flags=re.DOTALL | re.IGNORECASE,
    )

    if not menu_match:
        raise RuntimeError(f"{filename}: mobile navigation not found")

    nav = menu_match.group(0)

    about_match = re.search(
        r'(<a\s+href="about\.html"[^>]*>.*?</a>)',
        nav,
        flags=re.DOTALL | re.IGNORECASE,
    )

    if not about_match:
        raise RuntimeError(f"{filename}: About mobile navigation item not found")

    # Preserve the existing About link and its exact classes.
    replacement = about_match.group(1) + "\n            " + PEOPLE_MOBILE

    nav = nav[:about_match.start()] + replacement + nav[about_match.end():]

    return html[:menu_match.start()] + nav + html[menu_match.end():]


def add_corporate_footer(html, filename):
    if "Registered Office" in html and "U20237TS2026PTC224122" in html:
        return html

    marker = re.search(
        r'(<div\s+class="[^"]*max-w-\[90rem\][^"]*text-center[^"]*text-\[10px\][^"]*tracking-widest[^"]*"[^>]*>\s*<p>.*?</p>\s*</div>)',
        html,
        flags=re.DOTALL | re.IGNORECASE,
    )

    if not marker:
        raise RuntimeError(f"{filename}: copyright footer block not found")

    insertion = CORPORATE_FOOTER + "\n        " + marker.group(1)

    html = html[:marker.start()] + insertion + html[marker.end():]

    return html


def validate(html, filename):
    checks = {
        "<html": 1,
        "</html>": 1,
        "<head>": 1,
        "</head>": 1,
        "<body": 1,
        "</body>": 1,
        "<main": 1,
        "</main>": 1,
        "<footer": 1,
        "</footer>": 1,
    }

    for token, expected in checks.items():
        count = html.count(token)
        if count != expected:
            raise RuntimeError(
                f"{filename}: expected {expected} occurrence of {token}, found {count}"
            )

    people_count = html.count('href="people.html"')
    if people_count != 2:
        raise RuntimeError(
            f"{filename}: expected exactly 2 People links, found {people_count}"
        )


for filename in PAGES:
    path = Path(filename)

    original = path.read_text(encoding="utf-8")
    html = original

    html = add_people_to_desktop_nav(html, filename)
    html = add_people_to_mobile_nav(html, filename)
    html = add_corporate_footer(html, filename)

    validate(html, filename)

    path.write_text(html, encoding="utf-8")

    print(f"PATCHED  {filename}")

print()
print("All existing pages patched successfully.")
print("No <main>, <header>, <footer>, or <script> blocks were replaced wholesale.")
