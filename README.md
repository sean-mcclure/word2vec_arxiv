# LatentLink

**Discover deep connections across research domains**

LatentLink is a cross-domain scientific discovery tool that helps researchers uncover surprising analogical connections between disparate fields. Using AI-powered semantic analysis, it identifies latent similarities in how different domains discuss concepts, mechanisms, and patterns—enabling novel insights that traditional keyword searches would miss.

## What It Does

- **Cross-Domain Search**: Query 2-3 different research areas simultaneously (e.g., AI + Biology + Materials Science)
- **Deep Analogical Reasoning**: Discover non-obvious structural and functional similarities across fields
- **Hypothesis Generation**: Generate novel, testable research hypotheses based on cross-domain insights
- **Pattern Extraction**: Identify universal principles that transcend specific domains

## Inspiration

This application was inspired by the Nature [article](https://perssongroup.lbl.gov/papers/dagdelen-2019-word-embeddings.pdf) titled **Unsupervised word embeddings capture latent knowledge from materials science literature**, and the Medium article [Automating Analogy: Using AI to Help Researchers Make Discoveries](https://medium.com/data-science/automating-analogy-using-ai-to-help-researchers-make-discoveries-1ca04e9b620).

## Technology

- Pure vanilla JavaScript (no frameworks)
- OpenAI GPT-4o for analogical reasoning
- arXiv API for paper retrieval
- Client-side only (no backend required)

## Running the Application

### Start web server

```bash
python3 -m http.server 8888 --directory app
```

### Open Browser

Navigate to `http://localhost:8888/`

### Setup

1. Enter your OpenAI API key (stored locally in browser)
2. Select research domains and topics
3. Click "Discover Connections" to find analogies

## Features

- **Find Deep Analogies**: Discover structural similarities between domains
- **Generate Hypotheses**: Create testable research directions
- **Extract Patterns**: Identify universal mechanisms across fields

## Example Use Cases

- Finding optimization techniques from finance applicable to molecular dynamics
- Discovering biological mechanisms analogous to computational algorithms
- Identifying phase transition patterns across physics, chemistry, and social systems

## Support

For questions or support, please reach out via GitHub issues or contact the project author. 