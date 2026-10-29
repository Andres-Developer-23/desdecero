"""
urllib.robotparser para el simulador del curso.

Lee el archivo robots.txt de un sitio y responde si un robot puede visitar
una URL. Sigue las mismas reglas que el módulo de CPython: el primer grupo
User-agent que coincide decide, y dentro del grupo gana la primera regla
Allow o Disallow cuyo comienzo coincide con la ruta.
"""

import urllib.parse

import _web

__all__ = ["RobotFileParser"]


class RobotFileParser:
    def __init__(self, url=""):
        self.entries = []
        self.sitemaps = []
        self.default_entry = None
        self.disallow_all = False
        self.allow_all = False
        self.last_checked = 0
        self.set_url(url)

    def mtime(self):
        return self.last_checked

    def modified(self):
        self.last_checked = 1

    def set_url(self, url):
        """Indica la dirección del robots.txt."""
        self.url = url
        self.host, self.path = urllib.parse.urlparse(url)[1:3]

    def read(self):
        """Descarga el robots.txt y lo interpreta."""
        data = _web.fetch(self.url, {"User-Agent": "Python-urllib/3.12"}, True)
        if "error" in data:
            raise IOError(data["message"])
        status = data["status"]
        if status in (401, 403):
            self.disallow_all = True
        elif 400 <= status < 500:
            self.allow_all = True
        elif status < 400:
            self.parse(data["body"].splitlines())

    def _add_entry(self, entry):
        if "*" in entry.useragents:
            if self.default_entry is None:
                self.default_entry = entry
        else:
            self.entries.append(entry)

    def parse(self, lines):
        """Interpreta las líneas de un robots.txt."""
        state = 0
        entry = Entry()
        self.modified()
        for line in lines:
            if not line:
                if state == 1:
                    entry = Entry()
                    state = 0
                elif state == 2:
                    self._add_entry(entry)
                    entry = Entry()
                    state = 0
            comment = line.find("#")
            if comment >= 0:
                line = line[:comment]
            line = line.strip()
            if not line:
                continue
            parts = line.split(":", 1)
            if len(parts) != 2:
                continue
            key = parts[0].strip().lower()
            value = urllib.parse.unquote(parts[1].strip())
            if key == "user-agent":
                if state == 2:
                    self._add_entry(entry)
                    entry = Entry()
                entry.useragents.append(value)
                state = 1
            elif key == "disallow":
                if state != 0:
                    entry.rulelines.append(RuleLine(value, False))
                    state = 2
            elif key == "allow":
                if state != 0:
                    entry.rulelines.append(RuleLine(value, True))
                    state = 2
            elif key == "crawl-delay":
                if state != 0:
                    if value.strip().isdigit():
                        entry.delay = int(value)
                    state = 2
            elif key == "sitemap":
                self.sitemaps.append(value)
        if state == 2:
            self._add_entry(entry)

    def can_fetch(self, useragent, url):
        """True si un robot con ese User-Agent puede visitar la URL."""
        if self.disallow_all:
            return False
        if self.allow_all:
            return True
        if not self.last_checked:
            return False
        parsed = urllib.parse.urlparse(urllib.parse.unquote(url))
        url = urllib.parse.urlunparse(("", "", parsed.path, parsed.params, parsed.query, parsed.fragment))
        url = urllib.parse.quote(url)
        if not url:
            url = "/"
        for entry in self.entries:
            if entry.applies_to(useragent):
                return entry.allowance(url)
        if self.default_entry:
            return self.default_entry.allowance(url)
        return True

    def crawl_delay(self, useragent):
        """Segundos que el sitio pide esperar entre peticiones, o None."""
        if not self.mtime():
            return None
        for entry in self.entries:
            if entry.applies_to(useragent):
                return entry.delay
        if self.default_entry:
            return self.default_entry.delay
        return None

    def site_maps(self):
        return self.sitemaps or None

    def __str__(self):
        entries = self.entries
        if self.default_entry is not None:
            entries = entries + [self.default_entry]
        return "\n\n".join(str(entry) for entry in entries)


class RuleLine:
    def __init__(self, path, allowance):
        if path == "" and not allowance:
            allowance = True
        path = urllib.parse.urlunparse(urllib.parse.urlparse(path))
        self.path = urllib.parse.quote(path)
        self.allowance = allowance

    def applies_to(self, filename):
        return self.path == "*" or filename.startswith(self.path)

    def __str__(self):
        return ("Allow" if self.allowance else "Disallow") + ": " + self.path


class Entry:
    def __init__(self):
        self.useragents = []
        self.rulelines = []
        self.delay = None

    def applies_to(self, useragent):
        useragent = useragent.split("/")[0].lower()
        for agent in self.useragents:
            if agent == "*":
                return True
            if agent.lower() in useragent:
                return True
        return False

    def allowance(self, filename):
        for line in self.rulelines:
            if line.applies_to(filename):
                return line.allowance
        return True

    def __str__(self):
        lines = ["User-agent: " + agent for agent in self.useragents]
        if self.delay is not None:
            lines.append("Crawl-delay: " + str(self.delay))
        lines.extend(str(line) for line in self.rulelines)
        return "\n".join(lines)
