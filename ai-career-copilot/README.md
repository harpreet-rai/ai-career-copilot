# CareerPilot AI — Resume Analyzer

A responsive resume analysis web app built for the ApnoAI AI/ML internship task. It compares resume text with a job description and returns an approximate match score, strengths, missing keywords, and actionable improvements using Gemini.

## Features
- Responsive HTML/CSS interface
- Resume vs. job-description analysis
- JSON-structured Gemini output
- Input length validation and helpful error messages
- Server-side Gemini API call through a Vercel function
- API key stored in a server environment variable, not in browser code
- Escapes AI-generated strings before inserting them into the page

## Run / deploy
1. Create a private or public GitHub repository and upload `index.html`, `package.json`, and the `api/` folder.
2. Import the repository into Vercel.
3. In Vercel → Project Settings → Environment Variables, add:
   - Name: `GEMINI_API_KEY`
   - Value: your Gemini API key from https://aistudio.google.com/
   - Environments: Production, Preview, Development (as needed)
4. Redeploy the project after adding the variable.
5. Open the deployment URL and test with sample resume text and a job description.

## Important security notes
- Never commit a real API key to GitHub or put it in `index.html`.
- Do not use real resumes without permission; sample or anonymized resumes are safer for testing.
- Free-tier model availability and quotas can change.
- The match score is an AI-generated estimate, not an official ATS score, hiring prediction, or guarantee.

## Customization
The system prompt in `index.html` is tailored to students, fresh graduates, internships, and entry-level technology roles. You can adjust the prompt without changing the backend API route.
