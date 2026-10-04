import re
from urllib.parse import urlparse
from fastapi import FastAPI
from pydantic import BaseModel, Field

app = FastAPI(title="CyberGuard AI Service", version="1.1.0")

class AnalyzeRequest(BaseModel):
    kind: str
    content: str = Field(max_length=20000)

class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)

@app.get("/health")
def health():
    return {"ok": True, "service": "cyberguard-ai"}

@app.post("/analyze")
def analyze(req: AnalyzeRequest):
    text, findings, score = req.content, [], 10
    if req.kind == "url":
        parsed = urlparse(text)
        host = parsed.hostname or ""
        if not host:
            score = 90; findings.append("Invalid URL.")
        else:
            if parsed.scheme != "https": score += 20; findings.append("URL does not use HTTPS.")
            if "xn--" in host: score += 20; findings.append("Punycode hostname detected.")
            if "@" in text: score += 15; findings.append("Credential-like URL syntax detected.")
    elif req.kind == "email":
        for p in [r"urgent", r"verify", r"password", r"payment", r"click\s+here", r"login"]:
            if re.search(p, text, re.I):
                score += 12; findings.append(f"Suspicious language indicator: {p}")
        score = min(score, 95)
    else:
        findings.append("Generic defensive analysis completed.")
    sev = "CRITICAL" if score >= 85 else "HIGH" if score >= 65 else "MEDIUM" if score >= 40 else "LOW"
    return {"score": min(score, 100), "severity": sev, "verdict": "SUSPICIOUS" if score >= 55 else "LOW RISK",
            "findings": findings, "explanation": " ".join(findings) or "No strong heuristic indicators were detected."}

# Replace this rule-based reply with an LLM call (e.g. OPENAI_API_KEY) when ready.
@app.post("/chat")
def chat(req: ChatRequest):
    q = req.message.lower()
    if "phish" in q: r = "Phishing is a fake message or site that tricks you into sharing logins or money. Check the sender, avoid urgent links, and scan URLs first."
    elif "password" in q: r = "Use a password manager, long unique passphrases, and MFA on important accounts."
    elif "improve" in q or "secur" in q: r = "Enable MFA, replace reused passwords, and keep devices updated."
    else: r = "I can help with phishing, passwords, malware and account safety."
    return {"reply": r, "source": "rules"}
