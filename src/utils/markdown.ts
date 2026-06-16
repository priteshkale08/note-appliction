/**
 * Tiny, dependency-free Markdown renderer.
 * HTML is escaped BEFORE any formatting is applied, so user content cannot inject markup (XSS-safe).
 * Supports: headings, bold, italic, inline code, fenced code, links, unordered/ordered lists, line breaks.
 */
function escapeHtml(input: string): string {
    return input
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function inline(text: string): string {
    return text
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/\*([^*]+)\*/g, '<em>$1</em>')
        .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
}

export function renderMarkdown(markdown: string): string {
    const escaped = escapeHtml(markdown ?? '');
    const lines = escaped.split('\n');
    const html: string[] = [];
    let inCode = false;
    let listType: 'ul' | 'ol' | null = null;

    const closeList = () => {
        if (listType) {
            html.push(`</${listType}>`);
            listType = null;
        }
    };

    for (const line of lines) {
        if (line.trim().startsWith('```')) {
            if (inCode) {
                html.push('</code></pre>');
                inCode = false;
            } else {
                closeList();
                html.push('<pre><code>');
                inCode = true;
            }
            continue;
        }
        if (inCode) {
            html.push(line + '\n');
            continue;
        }

        const heading = /^(#{1,6})\s+(.*)$/.exec(line);
        if (heading) {
            closeList();
            const level = heading[1].length;
            html.push(`<h${level}>${inline(heading[2])}</h${level}>`);
            continue;
        }

        const ulItem = /^\s*[-*]\s+(.*)$/.exec(line);
        if (ulItem) {
            if (listType !== 'ul') {
                closeList();
                html.push('<ul>');
                listType = 'ul';
            }
            html.push(`<li>${inline(ulItem[1])}</li>`);
            continue;
        }

        const olItem = /^\s*\d+\.\s+(.*)$/.exec(line);
        if (olItem) {
            if (listType !== 'ol') {
                closeList();
                html.push('<ol>');
                listType = 'ol';
            }
            html.push(`<li>${inline(olItem[1])}</li>`);
            continue;
        }

        if (line.trim() === '') {
            closeList();
            continue;
        }

        closeList();
        html.push(`<p>${inline(line)}</p>`);
    }

    closeList();
    if (inCode) html.push('</code></pre>');
    return html.join('\n');
}
