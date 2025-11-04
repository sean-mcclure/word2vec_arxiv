// Notebook Management for LatentLink

class NotebookManager {
    constructor() {
        this.currentNotebook = {
            title: '',
            domains: [],
            connections: [],
            analogies: [],
            patterns: [],
            hypotheses: [],
            createdAt: new Date()
        };
    }

    // Initialize a new notebook session
    startNewNotebook(domains) {
        this.currentNotebook = {
            title: this.generateTitle(domains),
            domains: domains,
            connections: [],
            analogies: [],
            patterns: [],
            hypotheses: [],
            createdAt: new Date()
        };
    }

    // Generate a title from domains
    generateTitle(domains) {
        const domainNames = domains.map(d => d.area || d).filter(Boolean);
        if (domainNames.length === 0) return 'Untitled Discovery';
        return domainNames.join(' × ');
    }

    // Add connections to current notebook
    addConnections(connections) {
        this.currentNotebook.connections.push(...connections);
    }

    // Add analogies to current notebook
    addAnalogies(analogies) {
        this.currentNotebook.analogies.push(...analogies);
    }

    // Add patterns to current notebook
    addPatterns(patterns) {
        this.currentNotebook.patterns.push(...patterns);
    }

    // Add hypotheses to current notebook
    addHypotheses(hypotheses) {
        this.currentNotebook.hypotheses.push(...hypotheses);
    }

    // Save current notebook to Back4App
    async saveNotebook(customTitle = null) {
        try {
            const user = Parse.User.current();
            if (!user) {
                throw new Error('Must be logged in to save notebooks');
            }

            // Create Parse object
            const Notebook = Parse.Object.extend('Notebook');
            const notebook = new Notebook();

            notebook.set('title', customTitle || this.currentNotebook.title);
            notebook.set('domains', this.currentNotebook.domains);
            notebook.set('connections', this.currentNotebook.connections);
            notebook.set('analogies', this.currentNotebook.analogies);
            notebook.set('patterns', this.currentNotebook.patterns);
            notebook.set('hypotheses', this.currentNotebook.hypotheses);
            notebook.set('user', user);
            
            // Set ACL so only the user can read/write
            const acl = new Parse.ACL(user);
            notebook.setACL(acl);

            await notebook.save();
            
            return {
                success: true,
                notebookId: notebook.id,
                message: 'Notebook saved successfully'
            };
        } catch (error) {
            console.error('Save notebook error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Load all notebooks for current user
    async loadNotebooks() {
        try {
            const user = Parse.User.current();
            if (!user) {
                throw new Error('Must be logged in to view notebooks');
            }

            const Notebook = Parse.Object.extend('Notebook');
            const query = new Parse.Query(Notebook);
            query.equalTo('user', user);
            query.descending('createdAt');
            query.limit(100);

            const notebooks = await query.find();
            
            return notebooks.map(nb => ({
                id: nb.id,
                title: nb.get('title'),
                domains: nb.get('domains'),
                connections: nb.get('connections') || [],
                analogies: nb.get('analogies') || [],
                patterns: nb.get('patterns') || [],
                hypotheses: nb.get('hypotheses') || [],
                createdAt: nb.get('createdAt'),
                updatedAt: nb.get('updatedAt')
            }));
        } catch (error) {
            console.error('Load notebooks error:', error);
            throw error;
        }
    }

    // Load a specific notebook
    async loadNotebook(notebookId) {
        try {
            const Notebook = Parse.Object.extend('Notebook');
            const query = new Parse.Query(Notebook);
            const notebook = await query.get(notebookId);

            return {
                id: notebook.id,
                title: notebook.get('title'),
                domains: notebook.get('domains'),
                connections: notebook.get('connections') || [],
                analogies: notebook.get('analogies') || [],
                patterns: notebook.get('patterns') || [],
                hypotheses: notebook.get('hypotheses') || [],
                createdAt: notebook.get('createdAt'),
                updatedAt: notebook.get('updatedAt')
            };
        } catch (error) {
            console.error('Load notebook error:', error);
            throw error;
        }
    }

    // Delete a notebook
    async deleteNotebook(notebookId) {
        try {
            const Notebook = Parse.Object.extend('Notebook');
            const query = new Parse.Query(Notebook);
            const notebook = await query.get(notebookId);
            await notebook.destroy();
            
            return {
                success: true,
                message: 'Notebook deleted successfully'
            };
        } catch (error) {
            console.error('Delete notebook error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Get current notebook data
    getCurrentNotebook() {
        return this.currentNotebook;
    }

    // Check if current notebook has content
    hasContent() {
        return this.currentNotebook.connections.length > 0 ||
               this.currentNotebook.analogies.length > 0 ||
               this.currentNotebook.patterns.length > 0 ||
               this.currentNotebook.hypotheses.length > 0;
    }
}

// Export singleton instance
const notebookManager = new NotebookManager();
