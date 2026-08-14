import React from 'react';
import { Box, Typography, Divider } from '@mui/material';

const FormattedMarkdownText = ({ text }) => {
  if (!text) return null;

  const lines = String(text).split('\n');

  const renderInlineFormatted = (content) => {
    // Process **bold** text
    const parts = content.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} style={{ fontWeight: 700, color: '#0f172a' }}>
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, width: '100%' }}>
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <Box key={idx} sx={{ height: 4 }} />;

        // Dividers: --- or ***
        if (trimmed === '---' || trimmed === '***') {
          return <Divider key={idx} sx={{ my: 1, borderColor: '#e2e8f0' }} />;
        }

        // Section Headers: ### Header or ## Header or # Header
        if (trimmed.startsWith('#')) {
          const headerText = trimmed.replace(/^#+\s*/, '');
          return (
            <Typography
              key={idx}
              variant="subtitle1"
              sx={{
                fontWeight: 800,
                color: '#1b5e20',
                mt: idx === 0 ? 0 : 1,
                mb: 0.25,
                fontSize: '0.95rem',
                letterSpacing: '-0.2px',
              }}
            >
              {renderInlineFormatted(headerText)}
            </Typography>
          );
        }

        // Bullet list items: * item or - item or 1. item
        if (/^(\*|-|\d+\.)\s+/.test(trimmed)) {
          const bulletText = trimmed.replace(/^(\*|-|\d+\.)\s+/, '');
          return (
            <Box key={idx} sx={{ display: 'flex', gap: 1, pl: 1, alignItems: 'flex-start' }}>
              <Typography variant="body2" component="span" sx={{ color: '#2e7d32', fontWeight: 800, lineHeight: 1.5 }}>
                •
              </Typography>
              <Typography variant="body2" sx={{ color: '#334155', lineHeight: 1.5, flex: 1, fontSize: '0.875rem' }}>
                {renderInlineFormatted(bulletText)}
              </Typography>
            </Box>
          );
        }

        // Standard text paragraph
        return (
          <Typography key={idx} variant="body2" sx={{ color: '#334155', lineHeight: 1.5, fontSize: '0.875rem' }}>
            {renderInlineFormatted(line)}
          </Typography>
        );
      })}
    </Box>
  );
};

export default FormattedMarkdownText;
