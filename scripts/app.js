// App State
const state = {
    domainPapers: {
        domain1: [],
        domain2: [],
        domain3: []
    },
    connections: [],
    hypotheses: [],
    user: null,
    subscription: null
};

// Initialize App
document.addEventListener('DOMContentLoaded', async () => {
    await initializeApp();
    setupEventListeners();
    setupAuthListeners();
});

// Initialize application
async function initializeApp() {
    // Initialize Stripe
    await subscriptionManager.initialize();
    
    // Check if returning from successful payment
    const urlParams = new URLSearchParams(window.location.search);
    const paymentSuccess = urlParams.get('success');
    
    // Check if user is logged in
    if (authManager.isAuthenticated()) {
        state.user = authManager.getCurrentUser();
        
        // Always fetch fresh user data from server
        await state.user.fetch();
        
        // If returning from payment, clear the success parameter from URL
        if (paymentSuccess === 'true') {
            window.history.replaceState({}, document.title, window.location.pathname);
        }
        
        // All logged-in users can access the app (free tier or paid)
        showMainApp();
        updateUserMenu();
    } else {
        showAuthSection();
    }
}

// Show different sections
function showAuthSection() {
    document.getElementById('auth-section').style.display = 'block';
    document.getElementById('subscription-section').style.display = 'none';
    document.getElementById('main-app').style.display = 'none';
    document.getElementById('notebooks-view').style.display = 'none';
}

function showSubscriptionRequired() {
    document.getElementById('auth-section').style.display = 'none';
    document.getElementById('subscription-section').style.display = 'block';
    document.getElementById('main-app').style.display = 'none';
    document.getElementById('notebooks-view').style.display = 'none';
    updateUserMenu();
}

function showMainApp() {
    document.getElementById('auth-section').style.display = 'none';
    document.getElementById('subscription-section').style.display = 'none';
    document.getElementById('main-app').style.display = 'block';
    document.getElementById('notebooks-view').style.display = 'none';
    updateUserMenu();
}

function showNotebooksView() {
    document.getElementById('auth-section').style.display = 'none';
    document.getElementById('subscription-section').style.display = 'none';
    document.getElementById('main-app').style.display = 'none';
    document.getElementById('notebooks-view').style.display = 'block';
    loadNotebooksList();
}

// Update user menu
function updateUserMenu() {
    const user = authManager.getCurrentUser();
    if (!user) return;
    
    // Create user menu if it doesn't exist
    if (!document.getElementById('user-menu')) {
        const menu = document.createElement('div');
        menu.id = 'user-menu';
        menu.className = 'user-menu';
        menu.innerHTML = `
            <button class="user-button" id="user-menu-btn">
                <span id="user-name">${user.get('name') || user.get('email')}</span>
                <span>▼</span>
            </button>
            <div class="user-dropdown" id="user-dropdown">
                <div class="usage-indicator">
                    <div id="usage-text">Loading...</div>
                    <div class="usage-bar">
                        <div class="usage-bar-fill" id="usage-bar-fill"></div>
                    </div>
                </div>
                <div class="user-dropdown-item" id="view-notebooks">📚 My Notebooks</div>
                <div class="user-dropdown-item" id="manage-subscription">Manage Subscription</div>
                <div class="user-dropdown-item" id="logout-btn">Sign Out</div>
            </div>
        `;
        document.body.appendChild(menu);
        
        // Add event listeners
        document.getElementById('user-menu-btn').addEventListener('click', () => {
            document.getElementById('user-dropdown').classList.toggle('show');
        });
        
        document.getElementById('view-notebooks').addEventListener('click', () => {
            showNotebooksView();
        });
        
        document.getElementById('manage-subscription').addEventListener('click', async () => {
            try {
                showLoading('Opening subscription portal...');
                await subscriptionManager.createPortalSession();
            } catch (error) {
                hideLoading();
                showToast('Failed to open portal: ' + error.message, 'error');
            }
        });
        
        document.getElementById('logout-btn').addEventListener('click', async () => {
            await authManager.logOut();
            location.reload();
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('#user-menu')) {
                document.getElementById('user-dropdown').classList.remove('show');
            }
        });
    }
    
    // Update usage stats
    updateUsageStats();
}

// Update usage statistics
async function updateUsageStats() {
    try {
        const user = Parse.User.current();
        if (!user) return;
        
        await user.fetch();
        const subscriptionStatus = user.get('subscriptionStatus');
        const usageTextEl = document.getElementById('usage-text');
        
        if (subscriptionStatus === 'active') {
            usageTextEl.textContent = '✨ Premium Member';
            document.getElementById('usage-bar-fill').style.width = '100%';
            document.getElementById('usage-bar-fill').style.background = 'linear-gradient(90deg, var(--secondary), var(--primary))';
        } else {
            // Free tier - show notebook count
            const notebooks = await notebookManager.loadNotebooks();
            const notebookCount = notebooks.length;
            const percentage = (notebookCount / 3) * 100;
            
            usageTextEl.textContent = `Free Tier: ${notebookCount} / 3 notebooks`;
            document.getElementById('usage-bar-fill').style.width = `${percentage}%`;
            document.getElementById('usage-bar-fill').style.background = 'var(--primary)';
        }
    } catch (error) {
        console.error('Error fetching usage stats:', error);
    }
}

// Setup auth event listeners
function setupAuthListeners() {
    // Login
    document.getElementById('login-btn').addEventListener('click', async () => {
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;
        
        if (!email || !password) {
            showToast('Please fill in all fields', 'error');
            return;
        }
        
        showLoading('Signing in...');
        const result = await authManager.logIn(email, password);
        hideLoading();
        
        if (result.success) {
            state.user = result.user;
            showMainApp();
        } else {
            showToast(result.error, 'error');
        }
    });
    
    // Signup
    document.getElementById('signup-btn').addEventListener('click', async () => {
        const name = document.getElementById('signup-name').value.trim();
        const email = document.getElementById('signup-email').value.trim();
        const password = document.getElementById('signup-password').value;
        
        if (!name || !email || !password) {
            showToast('Please fill in all fields', 'error');
            return;
        }
        
        if (password.length < 6) {
            showToast('Password must be at least 6 characters', 'error');
            return;
        }
        
        showLoading('Creating account...');
        const result = await authManager.signUp(email, password, name);
        hideLoading();
        
        if (result.success) {
            state.user = result.user;
            showMainApp();
            showToast('🎉 Welcome! You have 3 free notebooks to get started.', 'success');
        } else {
            showToast(result.error, 'error');
        }
    });
    
    // Subscribe
    document.getElementById('subscribe-btn').addEventListener('click', async () => {
        try {
            showLoading('Redirecting to checkout...');
            await subscriptionManager.createCheckoutSession();
        } catch (error) {
            hideLoading();
            showToast('Error: ' + error.message, 'error');
        }
    });
    
    // Toggle views
    document.getElementById('show-signup').addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('login-view').style.display = 'none';
        document.getElementById('signup-view').style.display = 'block';
    });
    
    document.getElementById('show-login').addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('signup-view').style.display = 'none';
        document.getElementById('login-view').style.display = 'block';
    });
    
    // Forgot password
    document.getElementById('forgot-password').addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('forgot-password-modal').style.display = 'flex';
        document.getElementById('reset-email').value = '';
        document.getElementById('reset-email').focus();
    });
    
    // Send reset email
    document.getElementById('send-reset-btn').addEventListener('click', async () => {
        const email = document.getElementById('reset-email').value.trim();
        if (!email) {
            showToast('Please enter your email address', 'error');
            return;
        }
        
        document.getElementById('forgot-password-modal').style.display = 'none';
        showLoading('Sending reset email...');
        const result = await authManager.resetPassword(email);
        hideLoading();
        
        if (result.success) {
            showToast('Password reset email sent!', 'success');
        } else {
            showToast(result.error, 'error');
        }
    });
    
    // Cancel reset
    document.getElementById('cancel-reset-btn').addEventListener('click', () => {
        document.getElementById('forgot-password-modal').style.display = 'none';
    });
    
    // Close modal on outside click
    document.getElementById('forgot-password-modal').addEventListener('click', (e) => {
        if (e.target.id === 'forgot-password-modal') {
            document.getElementById('forgot-password-modal').style.display = 'none';
        }
    });
}

// Event Listeners
function setupEventListeners() {
    const discoverBtn = document.getElementById('discover-btn');
    const findAnalogiesBtn = document.getElementById('find-analogies-btn');
    const generateHypothesesBtn = document.getElementById('generate-hypotheses-btn');
    const extractPatternsBtn = document.getElementById('extract-patterns-btn');
    const saveNotebookBtn = document.getElementById('save-notebook-btn');
    const backToAppBtn = document.getElementById('back-to-app-btn');
    const papersSlider = document.getElementById('papers-per-domain');
    
    if (discoverBtn) discoverBtn.addEventListener('click', discoverConnections);
    if (findAnalogiesBtn) findAnalogiesBtn.addEventListener('click', findDeepAnalogies);
    if (generateHypothesesBtn) generateHypothesesBtn.addEventListener('click', generateHypotheses);
    if (extractPatternsBtn) extractPatternsBtn.addEventListener('click', extractPatterns);
    if (saveNotebookBtn) saveNotebookBtn.addEventListener('click', saveCurrentNotebook);
    if (backToAppBtn) backToAppBtn.addEventListener('click', showMainApp);
    
    // Update papers count display when slider changes
    if (papersSlider) {
        papersSlider.addEventListener('input', (e) => {
            document.getElementById('papers-count').textContent = e.target.value;
        });
    }
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
    
    // Check if user can create a new notebook (free tier limit)
    const canCreate = await notebookManager.canCreateNotebook();
    if (!canCreate.allowed) {
        if (canCreate.reason === 'free_tier_limit') {
            showUpgradeModal(canCreate.message);
        } else {
            showToast(canCreate.message || 'Cannot create notebook', 'error');
        }
        return;
    }
    
    showLoading('Searching across domains...');
    
    try {
        const papersPerDomain = document.getElementById('papers-per-domain').value;
        
        // Initialize new notebook session
        const domainInfo = searches.map(s => ({
            area: s.category,
            query: s.query
        }));
        notebookManager.startNewNotebook(domainInfo);
        
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
    // Check if user can generate more (free tier limit)
    const canGenerate = await notebookManager.canGenerateMore('analogies');
    if (!canGenerate.allowed) {
        if (canGenerate.reason === 'free_tier_limit') {
            showUpgradeModal(canGenerate.message);
        } else {
            showToast(canGenerate.message || 'Cannot generate analogies', 'error');
        }
        return;
    }
    
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
        
        // Track in notebook
        console.log('Adding analogies to notebook:', newConnections.length);
        notebookManager.addAnalogies(newConnections);
        console.log('Current notebook state:', notebookManager.getCurrentNotebook());
        
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
    
    // Check if user can generate more (free tier limit)
    const canGenerate = await notebookManager.canGenerateMore('hypotheses');
    if (!canGenerate.allowed) {
        if (canGenerate.reason === 'free_tier_limit') {
            showUpgradeModal(canGenerate.message);
        } else {
            showToast(canGenerate.message || 'Cannot generate hypotheses', 'error');
        }
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
        
        // Track in notebook
        notebookManager.addHypotheses(newHypotheses);
        
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
    
    // Check if user can generate more (free tier limit)
    const canGenerate = await notebookManager.canGenerateMore('patterns');
    if (!canGenerate.allowed) {
        if (canGenerate.reason === 'free_tier_limit') {
            showUpgradeModal(canGenerate.message);
        } else {
            showToast(canGenerate.message || 'Cannot extract patterns', 'error');
        }
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
        
        // Track in notebook
        notebookManager.addPatterns(result.patterns);
        
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

// OpenAI API Call via Back4App Cloud Function
async function callOpenAI(messages, temperature = 0.7) {
    // Check authentication
    if (!authManager.isAuthenticated()) {
        throw new Error('Must be logged in');
    }
    
    try {
        // Call Back4App Cloud Function (which proxies to OpenAI with your API key)
        const result = await Parse.Cloud.run('callOpenAI', {
            messages: messages,
            temperature: temperature
        });
        
        // Update usage stats in UI
        updateUsageStats();
        
        return result.content;
    } catch (error) {
        throw new Error(error.message || 'AI request failed');
    }
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

// Show upgrade modal for free tier limits
function showUpgradeModal(message) {
    const modal = document.getElementById('upgrade-modal');
    const messageEl = document.getElementById('upgrade-message');
    
    if (message) {
        messageEl.textContent = message;
    }
    
    modal.style.display = 'flex';
    
    // Set up event listeners if not already set
    if (!modal.dataset.listenersSet) {
        document.getElementById('upgrade-now-btn').addEventListener('click', async () => {
            modal.style.display = 'none';
            try {
                await subscriptionManager.createCheckoutSession();
            } catch (error) {
                showToast('Failed to start checkout: ' + error.message, 'error');
            }
        });
        
        document.getElementById('close-upgrade-modal').addEventListener('click', () => {
            modal.style.display = 'none';
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
        
        modal.dataset.listenersSet = 'true';
    }
}

// Notebook Management Functions
async function saveCurrentNotebook() {
    if (!notebookManager.hasContent()) {
        showToast('No content to save. Generate some discoveries first!', 'warning');
        return;
    }

    const result = await notebookManager.saveNotebook();
    if (result.success) {
        showToast('✅ Notebook saved successfully!', 'success');
        // Update usage stats to reflect new notebook count
        await updateUsageStats();
    } else {
        showToast(`❌ Failed to save: ${result.error}`, 'error');
    }
}

async function loadNotebooksList() {
    const container = document.getElementById('notebooks-list');
    container.innerHTML = '<div class="loading-text">Loading notebooks...</div>';

    try {
        const notebooks = await notebookManager.loadNotebooks();
        
        if (notebooks.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>📚 No notebooks yet</p>
                    <p class="hint">Start discovering connections and save your first notebook!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = notebooks.map(nb => `
            <div class="notebook-card" data-id="${nb.id}">
                <div class="notebook-header">
                    <h3>${escapeHtml(nb.title)}</h3>
                    <div class="notebook-actions">
                        <button class="btn-icon view-notebook" data-id="${nb.id}" title="View">👁️</button>
                        <button class="btn-icon delete-notebook" data-id="${nb.id}" title="Delete">🗑️</button>
                    </div>
                </div>
                <div class="notebook-meta">
                    <span>📅 ${new Date(nb.createdAt).toLocaleDateString()}</span>
                    <span>🔗 ${nb.analogies.length} analogies</span>
                    <span>💭 ${nb.hypotheses.length} hypotheses</span>
                    <span>🧩 ${nb.patterns.length} patterns</span>
                </div>
            </div>
        `).join('');

        // Add event listeners
        container.querySelectorAll('.view-notebook').forEach(btn => {
            btn.addEventListener('click', () => viewNotebook(btn.dataset.id));
        });

        container.querySelectorAll('.delete-notebook').forEach(btn => {
            btn.addEventListener('click', () => deleteNotebook(btn.dataset.id));
        });
    } catch (error) {
        container.innerHTML = `<div class="error-message">Failed to load notebooks: ${error.message}</div>`;
    }
}

async function viewNotebook(notebookId) {
    showLoading('Loading notebook...');
    
    try {
        const notebook = await notebookManager.loadNotebook(notebookId);
        
        // Load notebook data into state
        state.connections = notebook.analogies || [];
        state.hypotheses = notebook.hypotheses || [];
        
        // Switch to main app view
        showMainApp();
        
        // Display notebook content
        if (state.connections.length > 0) {
            document.getElementById('discovery-section').style.display = 'block';
            displayConnections();
        }
        
        if (state.hypotheses.length > 0) {
            document.getElementById('hypotheses-section').style.display = 'block';
            displayHypotheses();
        }
        
        if (notebook.patterns && notebook.patterns.length > 0) {
            document.getElementById('patterns-section').style.display = 'block';
            displayPatterns(notebook.patterns);
        }
        
        document.getElementById('action-section').style.display = 'block';
        updateStats();
        
        showToast(`📚 Loaded: ${notebook.title}`, 'success');
    } catch (error) {
        showToast(`Failed to load notebook: ${error.message}`, 'error');
        console.error('Load notebook error:', error);
    } finally {
        hideLoading();
    }
}

async function deleteNotebook(notebookId) {
    if (!confirm('Are you sure you want to delete this notebook?')) {
        return;
    }

    const result = await notebookManager.deleteNotebook(notebookId);
    if (result.success) {
        showToast('🗑️ Notebook deleted', 'success');
        loadNotebooksList();
    } else {
        showToast(`Failed to delete: ${result.error}`, 'error');
    }
}
