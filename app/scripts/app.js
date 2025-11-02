// App State
const state = {
    apiKey: localStorage.getItem('openai_api_key') || '',
    domainPapers: {
        domain1: [],
        domain2: [],
        domain3: []
    },
    connections: [],
    hypotheses: []
};

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    if (state.apiKey) {
        showMainApp();
    }
    setupEventListeners();
});

// Event Listeners
function setupEventListeners() {
    document.getElementById('save-api-key').addEventListener('click', saveApiKey);
    document.getElementById('discover-btn').addEventListener('click', discoverConnections);
    document.getElementById('find-analogies-btn').addEventListener('click', findDeepAnalogies);
    document.getElementById('generate-hypotheses-btn').addEventListener('click', generateHypotheses);
    document.getElementById('extract-patterns-btn').addEventListener('click', extractPatterns);
}

// API Key Management
function saveApiKey() {
    const input = document.getElementById('api-key-input');
    const key = input.value.trim();
    
    if (!key.startsWith('sk-')) {
        showToast('Invalid API key format', 'error');
        return;
    }
    
    state.apiKey = key;
    localStorage.setItem('openai_api_key', key);
    showToast('API key saved successfully', 'success');
    showMainApp();
}

function showMainApp() {
    document.getElementById('api-key-section').style.display = 'none';
    document.getElementById('main-app').style.display = 'block';
}

// Cross-Domain Discovery
async function discoverConnections() {
    const domains = [1, 2, 3];
    const searches = [];
    
    for (const domainNum of domains) {
        const category = document.querySelector(`.domain-category[data-domain="${domainNum}"]`).value;
        const query = document.querySelector(`.domain-query[data-domain="${domainNum}"]`).value.trim();
        
        if (category && query) {
            searches.push({ domainNum, category, query });
        }
    }
    
    if (searches.length < 2) {
        showToast('Please fill in at least 2 domains', 'error');
        return;
    }
    
    showLoading('Searching across domains...');
    
    try {
        const papersPerDomain = document.getElementById('papers-per-domain').value;
        
        // Search each domain
        for (const search of searches) {
            const papers = await searchArxiv(search.category, search.query, papersPerDomain);
            state.domainPapers[`domain${search.domainNum}`] = papers.map(p => ({
                ...p,
                domain: search.domainNum,
                domainName: search.category,
                searchQuery: search.query
            }));
        }
        
        displayPapersByDomain();
        hideLoading();
        showToast('Papers loaded! Now discovering connections...', 'success');
        
        // Show action buttons and update stats
        document.getElementById('action-section').style.display = 'block';
        updateStats();
        
        // Auto-start finding analogies
        setTimeout(() => findDeepAnalogies(), 1000);
        
    } catch (error) {
        hideLoading();
        showToast('Error: ' + error.message, 'error');
        console.error(error);
    }
}

// Search arXiv
async function searchArxiv(category, query, maxResults) {
    const searchQuery = `cat:${category} AND all:${query}`;
    const url = `https://export.arxiv.org/api/query?search_query=${encodeURIComponent(searchQuery)}&start=0&max_results=${maxResults}&sortBy=relevance&sortOrder=descending`;
    
    const response = await fetch(url);
    const xmlText = await response.text();
    
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
    const entries = xmlDoc.querySelectorAll('entry');
    
    return Array.from(entries).map(entry => ({
        id: entry.querySelector('id').textContent,
        title: entry.querySelector('title').textContent.trim(),
        authors: Array.from(entry.querySelectorAll('author name')).map(a => a.textContent),
        abstract: entry.querySelector('summary').textContent.trim(),
        published: entry.querySelector('published').textContent,
        link: entry.querySelector('id').textContent
    }));
}

// Display Papers by Domain
function displayPapersByDomain() {
    const container = document.getElementById('papers-by-domain');
    container.innerHTML = '';
    
    for (const [key, papers] of Object.entries(state.domainPapers)) {
        if (papers.length === 0) continue;
        
        const section = document.createElement('div');
        section.className = 'domain-papers-section';
        
        const domainInfo = papers[0];
        section.innerHTML = `
            <h3>Domain ${domainInfo.domain}: ${domainInfo.domainName} - "${domainInfo.searchQuery}"</h3>
            <div class="domain-papers-list" id="papers-${key}"></div>
        `;
        
        container.appendChild(section);
        
        const papersList = document.getElementById(`papers-${key}`);
        papers.forEach(paper => {
            const card = document.createElement('div');
            card.className = 'mini-paper-card';
            card.innerHTML = `
                <div class="paper-title">${escapeHtml(paper.title)}</div>
                <div class="paper-authors">${paper.authors.slice(0, 2).join(', ')}${paper.authors.length > 2 ? ' et al.' : ''}</div>
            `;
            papersList.appendChild(card);
        });
    }
    
    document.getElementById('results-section').style.display = 'block';
}

// Find Deep Analogies
async function findDeepAnalogies() {
    showLoading('Discovering deep analogical connections with AI...');
    
    try {
        const activeDomains = Object.values(state.domainPapers).filter(d => d.length > 0);
        
        if (activeDomains.length < 2) {
            showToast('Need at least 2 domains', 'error');
            hideLoading();
            return;
        }
        
        // Prepare domain summaries
        const domainSummaries = activeDomains.map((papers, idx) => {
            const sample = papers.slice(0, 5);
            return {
                domain: papers[0].domain,
                name: papers[0].domainName,
                query: papers[0].searchQuery,
                papers: sample.map(p => ({
                    title: p.title,
                    abstract: p.abstract.substring(0, 500)
                }))
            };
        });
        
        // Add context about existing connections to find NEW ones
        const existingConnectionsContext = state.connections.length > 0 
            ? `\n\nIMPORTANT: You have already found these connections:\n${state.connections.map(c => `- ${c.mechanism}`).join('\n')}\n\nFind DIFFERENT analogies that explore other aspects, mechanisms, or perspectives. Do not repeat these.`
            : '';
        
        const prompt = `You are an expert at discovering deep analogical connections across scientific domains. Analyze these research domains and find surprising, non-obvious analogies.${existingConnectionsContext}

${domainSummaries.map((d, i) => `
DOMAIN ${d.domain}: ${d.name} (Topic: "${d.query}")
Papers:
${d.papers.map((p, j) => `${j + 1}. "${p.title}"\n   Abstract: ${p.abstract}`).join('\n\n')}
`).join('\n\n')}

Find 3-5 DEEP analogical connections where:
1. The same underlying mechanism, principle, or pattern appears in different domains
2. The connection is NOT obvious (avoid surface-level keyword matches)
3. The analogy reveals structural or functional similarities
4. The insight could lead to novel research directions

For each connection, provide:
- Strength score (0-100) based on how deep and surprising the analogy is
- Type of analogy (e.g., "Structural", "Functional", "Mechanistic", "Dynamical")
- The domains involved
- The core mechanism/principle that's analogous
- Detailed explanation of WHY this connection matters
- Specific evidence from the papers
- Potential scientific implications

Return JSON:
{
  "connections": [
    {
      "strength": 95,
      "type": "Mechanistic",
      "domains": [1, 2],
      "mechanism": "Brief name of the shared mechanism",
      "explanation": "Detailed explanation of the analogy",
      "domain1_manifestation": "How it appears in domain 1",
      "domain2_manifestation": "How it appears in domain 2",
      "why_it_matters": "Scientific significance",
      "evidence": ["Evidence point 1", "Evidence point 2"],
      "implications": "Potential research directions"
    }
  ]
}`;
        
        const response = await callOpenAI([
            { role: 'system', content: 'You are a world-class research scientist specializing in cross-domain analogical reasoning and scientific discovery. You excel at finding deep structural similarities that others miss.' },
            { role: 'user', content: prompt }
        ], 0.8);
        
        const result = parseJSONResponse(response);
        
        // Append new connections instead of replacing
        const newConnections = result.connections.filter(newConn => 
            !state.connections.some(existing => existing.mechanism === newConn.mechanism)
        );
        
        if (newConnections.length === 0) {
            hideLoading();
            showToast('No new analogies found. Try searching different domains.', 'info');
            return;
        }
        
        state.connections = [...state.connections, ...newConnections];
        
        displayConnections();
        updateStats();
        hideLoading();
        showToast(`Found ${newConnections.length} new analogies!`, 'success');
        
        // Scroll to connections section
        document.getElementById('discovery-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
        
    } catch (error) {
        hideLoading();
        showToast('Error finding analogies: ' + error.message, 'error');
        console.error(error);
    }
}

// Display Connections
function displayConnections() {
    const container = document.getElementById('connections-container');
    container.innerHTML = '';
    
    if (state.connections.length === 0) {
        container.innerHTML = '<p>No connections found</p>';
        return;
    }
    
    state.connections.forEach((conn, idx) => {
        const card = document.createElement('div');
        card.className = 'connection-card';
        
        const domainBadges = conn.domains.map(d => {
            const papers = state.domainPapers[`domain${d}`];
            if (papers && papers.length > 0) {
                return `<div class="domain-badge">Domain ${d}: ${papers[0].domainName}</div>`;
            }
            return '';
        }).join('');
        
        card.innerHTML = `
            <div class="connection-header">
                <div class="connection-strength">${conn.strength}%</div>
                <div class="connection-type">${conn.type} Analogy</div>
            </div>
            
            <div class="connection-domains">
                ${domainBadges}
            </div>
            
            <div class="analogy-explanation">
                <h4>🔗 Core Mechanism: ${escapeHtml(conn.mechanism)}</h4>
                <p>${escapeHtml(conn.explanation)}</p>
            </div>
            
            <div class="mechanism-comparison">
                <div class="mechanism-box">
                    <h5>In Domain ${conn.domains[0]}</h5>
                    <p>${escapeHtml(conn.domain1_manifestation)}</p>
                </div>
                <div class="arrow">⟷</div>
                <div class="mechanism-box">
                    <h5>In Domain ${conn.domains[1]}</h5>
                    <p>${escapeHtml(conn.domain2_manifestation || conn.domain3_manifestation || 'N/A')}</p>
                </div>
            </div>
            
            <div class="analogy-explanation">
                <h4>💡 Why This Matters</h4>
                <p>${escapeHtml(conn.why_it_matters)}</p>
            </div>
            
            <div class="evidence-section">
                <h4>📋 Supporting Evidence</h4>
                <div class="evidence-list">
                    ${conn.evidence.map(e => `<div class="evidence-item">${escapeHtml(e)}</div>`).join('')}
                </div>
            </div>
            
            <div class="analogy-explanation" style="background: rgba(16, 185, 129, 0.1); border-left: 4px solid var(--secondary);">
                <h4>🚀 Research Implications</h4>
                <p>${escapeHtml(conn.implications)}</p>
            </div>
        `;
        
        container.appendChild(card);
    });
    
    document.getElementById('discovery-section').style.display = 'block';
}

// Generate Hypotheses
async function generateHypotheses() {
    if (state.connections.length === 0) {
        showToast('Find analogies first', 'error');
        return;
    }
    
    showLoading('Generating research hypotheses...');
    
    try {
        const connectionsText = state.connections.map((c, i) => `
Connection ${i + 1}: ${c.mechanism}
- Type: ${c.type}
- Strength: ${c.strength}%
- Explanation: ${c.explanation}
- Implications: ${c.implications}
`).join('\n');
        
        const prompt = `Based on these cross-domain analogical connections, generate 3-5 novel, testable research hypotheses.

${connectionsText}

Each hypothesis should:
1. Be specific and testable
2. Leverage insights from the cross-domain connections
3. Suggest a concrete research direction
4. Have clear scientific value
5. Include testable predictions

Return JSON:
{
  "hypotheses": [
    {
      "title": "Brief hypothesis title",
      "statement": "Full hypothesis statement",
      "rationale": "Why this hypothesis follows from the connections",
      "novelty": "What makes this hypothesis novel",
      "testable_predictions": ["Prediction 1", "Prediction 2", "Prediction 3"],
      "methodology": "Suggested experimental or computational approach",
      "impact": "Potential scientific impact if validated"
    }
  ]
}`;
        
        const response = await callOpenAI([
            { role: 'system', content: 'You are a visionary research scientist who generates bold, testable hypotheses based on cross-domain insights.' },
            { role: 'user', content: prompt }
        ], 0.9);
        
        const result = parseJSONResponse(response);
        
        // Append new hypotheses instead of replacing
        const newHypotheses = result.hypotheses.filter(newHyp => 
            !state.hypotheses.some(existing => existing.title === newHyp.title)
        );
        
        if (newHypotheses.length === 0) {
            hideLoading();
            showToast('No new hypotheses generated. Try finding more analogies first.', 'info');
            return;
        }
        
        state.hypotheses = [...state.hypotheses, ...newHypotheses];
        
        displayHypotheses();
        updateStats();
        hideLoading();
        showToast(`Generated ${newHypotheses.length} new hypotheses!`, 'success');
        
        // Scroll to hypotheses section
        document.getElementById('hypotheses-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
        
    } catch (error) {
        hideLoading();
        showToast('Error generating hypotheses: ' + error.message, 'error');
        console.error(error);
    }
}

// Display Hypotheses
function displayHypotheses() {
    const container = document.getElementById('hypotheses-container');
    container.innerHTML = '';
    
    if (state.hypotheses.length === 0) {
        container.innerHTML = '<p>No hypotheses generated</p>';
        return;
    }
    
    state.hypotheses.forEach((hyp, idx) => {
        const card = document.createElement('div');
        card.className = 'hypothesis-card';
        
        card.innerHTML = `
            <div class="hypothesis-header">
                <div class="hypothesis-number">${idx + 1}</div>
                <div class="hypothesis-title">${escapeHtml(hyp.title)}</div>
            </div>
            
            <div class="hypothesis-content">
                <strong>Hypothesis:</strong> ${escapeHtml(hyp.statement)}
            </div>
            
            <div class="hypothesis-rationale">
                <h4>🧠 Rationale</h4>
                <p>${escapeHtml(hyp.rationale)}</p>
            </div>
            
            <div class="hypothesis-content">
                <strong>💎 Novelty:</strong> ${escapeHtml(hyp.novelty)}
            </div>
            
            <div class="testable-predictions">
                <h4>🔬 Testable Predictions</h4>
                <ul class="predictions-list">
                    ${hyp.testable_predictions.map(p => `<li>${escapeHtml(p)}</li>`).join('')}
                </ul>
            </div>
            
            <div class="hypothesis-content">
                <strong>🛠️ Suggested Methodology:</strong> ${escapeHtml(hyp.methodology)}
            </div>
            
            <div class="hypothesis-content" style="background: rgba(16, 185, 129, 0.1); border-left: 4px solid var(--secondary);">
                <strong>🌟 Potential Impact:</strong> ${escapeHtml(hyp.impact)}
            </div>
        `;
        
        container.appendChild(card);
    });
    
    document.getElementById('hypotheses-section').style.display = 'block';
}

// Extract Patterns
async function extractPatterns() {
    if (state.connections.length === 0) {
        showToast('Find analogies first', 'error');
        return;
    }
    
    showLoading('Extracting cross-domain patterns...');
    
    try {
        const connectionsText = state.connections.map(c => `
- ${c.mechanism}: ${c.explanation}
`).join('\n');
        
        const prompt = `Identify recurring patterns, principles, or mechanisms that appear across these connections:

${connectionsText}

Extract 3-5 fundamental patterns that transcend specific domains. These could be:
- Mathematical structures (e.g., power laws, phase transitions)
- Information processing principles (e.g., feedback loops, hierarchical organization)
- Optimization strategies (e.g., gradient descent, evolutionary algorithms)
- Dynamical patterns (e.g., oscillations, synchronization)

Return JSON:
{
  "patterns": [
    {
      "name": "Pattern name",
      "description": "What the pattern is",
      "universality": "Why it appears across domains",
      "instances": [
        {"domain": "Domain name", "manifestation": "How it appears"}
      ],
      "mathematical_form": "Mathematical description if applicable",
      "implications": "What this universality tells us"
    }
  ]
}`;
        
        const response = await callOpenAI([
            { role: 'system', content: 'You are an expert at identifying universal patterns and principles in science.' },
            { role: 'user', content: prompt }
        ], 0.7);
        
        const result = parseJSONResponse(response);
        displayPatterns(result.patterns);
        updateStats();
        hideLoading();
        showToast('Patterns extracted!', 'success');
        
    } catch (error) {
        hideLoading();
        showToast('Error extracting patterns: ' + error.message, 'error');
        console.error(error);
    }
}

// Display Patterns
function displayPatterns(patterns) {
    const container = document.getElementById('patterns-container');
    container.innerHTML = '';
    
    if (patterns.length === 0) {
        container.innerHTML = '<p>No patterns found</p>';
        return;
    }
    
    patterns.forEach(pattern => {
        const card = document.createElement('div');
        card.className = 'pattern-card';
        
        card.innerHTML = `
            <div class="pattern-name">${escapeHtml(pattern.name)}</div>
            <p><strong>Description:</strong> ${escapeHtml(pattern.description)}</p>
            <p><strong>Why Universal:</strong> ${escapeHtml(pattern.universality)}</p>
            ${pattern.mathematical_form ? `<p><strong>Mathematical Form:</strong> ${escapeHtml(pattern.mathematical_form)}</p>` : ''}
            <div class="pattern-instances">
                <strong>Instances Across Domains:</strong>
                ${pattern.instances.map(inst => `
                    <div class="pattern-instance">
                        <strong>${escapeHtml(inst.domain)}:</strong> ${escapeHtml(inst.manifestation)}
                    </div>
                `).join('')}
            </div>
            <p style="margin-top: 12px;"><strong>Implications:</strong> ${escapeHtml(pattern.implications)}</p>
        `;
        
        container.appendChild(card);
    });
    
    document.getElementById('patterns-section').style.display = 'block';
    
    // Scroll to patterns section
    document.getElementById('patterns-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// OpenAI API Call
async function callOpenAI(messages, temperature = 0.7) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${state.apiKey}`
        },
        body: JSON.stringify({
            model: 'gpt-4o',
            messages: messages,
            temperature: temperature
        })
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'OpenAI API error');
    }
    
    const data = await response.json();
    return data.choices[0].message.content;
}

// Parse JSON Response (handles markdown wrapping)
function parseJSONResponse(response) {
    // Remove markdown code blocks if present
    let cleaned = response.trim();
    
    // Remove ```json and ``` wrappers
    if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '');
        cleaned = cleaned.replace(/\n?```\s*$/, '');
    }
    
    return JSON.parse(cleaned.trim());
}

// Update Stats
function updateStats() {
    document.getElementById('connections-count').textContent = state.connections.length;
    document.getElementById('hypotheses-count').textContent = state.hypotheses.length;
    
    // Update button text based on state
    const analogiesBtn = document.getElementById('find-analogies-btn');
    const hypothesesBtn = document.getElementById('generate-hypotheses-btn');
    const patternsBtn = document.getElementById('extract-patterns-btn');
    
    if (state.connections.length === 0) {
        analogiesBtn.textContent = '🔗 Find Deep Analogies';
    } else {
        analogiesBtn.textContent = '🔗 Find More Analogies';
    }
    
    if (state.hypotheses.length === 0) {
        hypothesesBtn.textContent = '💭 Generate Hypotheses';
    } else {
        hypothesesBtn.textContent = '💭 Generate More Hypotheses';
    }
    
    // Check if patterns have been extracted
    const patternsSection = document.getElementById('patterns-section');
    if (patternsSection.style.display === 'block') {
        patternsBtn.textContent = '🧩 Extract More Patterns';
    } else {
        patternsBtn.textContent = '🧩 Extract Patterns';
    }
}

// UI Utilities
function showLoading(text = 'Loading...') {
    document.getElementById('loading-text').textContent = text;
    document.getElementById('loading-overlay').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loading-overlay').style.display = 'none';
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
