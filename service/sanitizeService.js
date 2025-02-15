import sanitizeHtml from 'sanitize-html';

const sanitizeInput = (input) => {
    if (typeof input !== 'string') return input; // Ako nije string, ne menjaj
    return sanitizeHtml(input, {
        allowedTags: ['b', 'i', 'em', 'strong', 'a', 'p', 'ul', 'li'],
        allowedAttributes: {
            'a': ['href']
        }
    });
};

const sanitizeObject = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    const sanitizedObj = {};
    for (let key in obj) {
        sanitizedObj[key] = typeof obj[key] === 'string' ? sanitizeInput(obj[key]) : obj[key];
    }
    return sanitizedObj;
};

export { sanitizeInput, sanitizeObject };
