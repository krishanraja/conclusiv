/**
 * Generate Conclusiv-branded email templates for Supabase
 * 
 * Run with: node scripts/generate-email-templates.js
 * 
 * This script generates 5 email template HTML files in the scripts/email-templates/ directory
 * that you can copy into your Supabase dashboard.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Conclusiv brand colors - Green/Teal gradient matching the logo
// Based on actual CSS variables: --primary: 78 100% 83%, --shimmer-end: 157 35% 28%
const BRAND_COLORS = {
  primary: '#E2FFC4',      // Light yellowish-green (HSL: 78 100% 83%)
  primaryDark: '#C0E9A0',  // Slightly darker green for hover
  secondary: '#35745C',    // Dark teal-green (HSL: 157 35% 28%)
  background: '#050505',   // Deep dark (HSL: 0 0% 2%)
  card: '#0A0A0A',         // Elevated surfaces (HSL: 0 0% 4%)
  text: '#FAFAFA',         // Primary text (HSL: 0 0% 98%)
  textMuted: '#B8B8B8',    // Muted text (HSL: 0 0% 72%)
  border: '#1F1F1F',       // Border color (HSL: 0 0% 12%)
  white: '#FFFFFF',
  shimmerStart: '#E2FFC4', // Light yellowish-green - start of gradient
  shimmerEnd: '#35745C',   // Dark teal-green - end of gradient
};

// Read and embed the actual logo as base64
const logoPath = path.join(__dirname, '../src/assets/conclusiv-logo.png');
let LOGO_BASE64 = '';
try {
  const logoBuffer = fs.readFileSync(logoPath);
  LOGO_BASE64 = logoBuffer.toString('base64');
} catch (error) {
  console.warn('Warning: Could not read logo file. Using placeholder.');
  LOGO_BASE64 = null;
}

// Base email template structure with proper branding
const baseTemplate = (content, title, description, buttonText, buttonLink, excitementCopy) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: ${BRAND_COLORS.background};
      color: ${BRAND_COLORS.text};
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      padding: 0;
      margin: 0;
    }
    
    .email-wrapper {
      background-color: ${BRAND_COLORS.background};
      padding: 40px 20px;
      min-height: 100vh;
    }
    
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: ${BRAND_COLORS.card};
      border-radius: 16px;
      overflow: hidden;
      border: 1px solid ${BRAND_COLORS.border};
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
    }
    
    .email-header {
      background: ${BRAND_COLORS.background};
      padding: 40px 32px;
      text-align: center;
      position: relative;
      overflow: hidden;
    }
    
    .email-header::before {
      content: '';
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle, rgba(226, 255, 196, 0.08) 0%, transparent 70%);
      animation: shimmer 3s ease-in-out infinite;
      pointer-events: none;
    }
    
    .email-header::after {
      content: '';
      position: absolute;
      bottom: -2px;
      left: 0;
      right: 0;
      height: 2px;
      background: linear-gradient(90deg, 
        ${BRAND_COLORS.shimmerStart} 0%, 
        ${BRAND_COLORS.shimmerEnd} 25%,
        ${BRAND_COLORS.shimmerStart} 50%,
        ${BRAND_COLORS.shimmerEnd} 75%,
        ${BRAND_COLORS.shimmerStart} 100%);
      background-size: 200% 100%;
      animation: border-shimmer 2.5s ease-in-out infinite;
    }
    
    @keyframes shimmer {
      0%, 100% { transform: translate(0, 0) rotate(0deg); }
      50% { transform: translate(20px, 20px) rotate(180deg); }
    }
    
    @keyframes border-shimmer {
      0% { background-position: 0% 50%; }
      100% { background-position: 200% 50%; }
    }
    
    .email-logo-container {
      position: relative;
      z-index: 1;
      margin-bottom: 8px;
    }
    
    .email-logo {
      height: 32px;
      width: auto;
      display: inline-block;
      /* Logo is already colored with green/teal gradient - no filter needed */
    }
    
    .email-tagline {
      font-size: 13px;
      color: ${BRAND_COLORS.textMuted};
      letter-spacing: 0.5px;
      margin-top: 8px;
      position: relative;
      z-index: 1;
      opacity: 0.9;
    }
    
    .email-body {
      padding: 48px 40px;
    }
    
    .email-title {
      font-size: 28px;
      font-weight: 700;
      color: ${BRAND_COLORS.text};
      margin-bottom: 16px;
      line-height: 1.2;
      letter-spacing: -0.5px;
    }
    
    .email-description {
      font-size: 17px;
      color: ${BRAND_COLORS.textMuted};
      margin-bottom: 32px;
      line-height: 1.6;
    }
    
    .email-content {
      font-size: 16px;
      color: ${BRAND_COLORS.text};
      margin-bottom: 40px;
      line-height: 1.7;
    }
    
    .email-content p {
      margin-bottom: 16px;
    }
    
    .email-content strong {
      color: ${BRAND_COLORS.shimmerStart};
      font-weight: 600;
    }
    
    .excitement-copy {
      background: linear-gradient(135deg, rgba(226, 255, 196, 0.15) 0%, rgba(53, 116, 92, 0.15) 100%);
      border-left: 3px solid ${BRAND_COLORS.shimmerStart};
      padding: 20px 24px;
      margin: 32px 0;
      border-radius: 8px;
      font-size: 15px;
      line-height: 1.6;
      color: ${BRAND_COLORS.text};
    }
    
    .email-button-container {
      text-align: center;
      margin: 40px 0;
    }
    
    .email-button {
      display: inline-block;
      padding: 16px 40px;
      background: linear-gradient(135deg, ${BRAND_COLORS.shimmerStart} 0%, ${BRAND_COLORS.shimmerEnd} 100%);
      color: ${BRAND_COLORS.background};
      text-decoration: none;
      border-radius: 10px;
      font-weight: 600;
      font-size: 16px;
      text-align: center;
      transition: all 0.3s ease;
      box-shadow: 0 4px 16px rgba(226, 255, 196, 0.3);
      letter-spacing: 0.3px;
    }
    
    .email-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(226, 255, 196, 0.4);
    }
    
    .email-link {
      color: ${BRAND_COLORS.shimmerStart};
      text-decoration: none;
      word-break: break-all;
      border-bottom: 1px solid rgba(226, 255, 196, 0.4);
    }
    
    .email-link:hover {
      border-bottom-color: ${BRAND_COLORS.shimmerStart};
    }
    
    .email-footer {
      padding: 32px 40px;
      border-top: 1px solid ${BRAND_COLORS.border};
      text-align: center;
      font-size: 13px;
      color: ${BRAND_COLORS.textMuted};
      background-color: ${BRAND_COLORS.background};
    }
    
    .email-footer p {
      margin-bottom: 8px;
    }
    
    .email-footer strong {
      color: ${BRAND_COLORS.text};
    }
    
    @media only screen and (max-width: 600px) {
      .email-wrapper {
        padding: 20px 12px;
      }
      
      .email-body {
        padding: 32px 24px;
      }
      
      .email-header {
        padding: 32px 24px;
      }
      
      .email-title {
        font-size: 24px;
      }
      
      .email-description,
      .email-content {
        font-size: 15px;
      }
      
      .email-button {
        display: block;
        width: 100%;
        padding: 14px 32px;
      }
      
      .email-footer {
        padding: 24px;
      }
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="email-container">
      <div class="email-header">
        <div class="email-logo-container">
          ${LOGO_BASE64 ? `
            <img src="data:image/png;base64,${LOGO_BASE64}" alt="conclusiv" class="email-logo" style="height: 32px; width: auto; display: inline-block;">
          ` : `
            <!-- Logo not found - using text fallback -->
            <div style="font-size: 24px; font-weight: 700; color: ${BRAND_COLORS.background}; letter-spacing: -0.5px;">conclusiv</div>
          `}
        </div>
        <div class="email-tagline">Transform research into narratives</div>
      </div>
      
      <div class="email-body">
        <h1 class="email-title">${title}</h1>
        <p class="email-description">${description}</p>
        
        <div class="email-content">
          ${content}
        </div>
        
        ${excitementCopy ? `
          <div class="excitement-copy">
            ${excitementCopy}
          </div>
        ` : ''}
        
        ${buttonText && buttonLink ? `
          <div class="email-button-container">
            <a href="{{ .ConfirmationURL }}" class="email-button">${buttonText}</a>
          </div>
        ` : ''}
        
        ${buttonLink && !buttonText ? `
          <div style="text-align: center; margin: 32px 0;">
            <a href="{{ .ConfirmationURL }}" class="email-link" style="word-break: break-all; font-size: 14px;">{{ .ConfirmationURL }}</a>
          </div>
        ` : ''}
      </div>
      
      <div class="email-footer">
        <p><strong>conclusiv</strong> — Transform research into compelling narratives in seconds</p>
        <p style="margin-top: 12px; font-size: 12px;">
          If you didn't request this, you can safely ignore this email.
        </p>
      </div>
    </div>
  </div>
</body>
</html>
`;

// Template 1: Confirm sign up
const confirmSignUpTemplate = baseTemplate(
  `
    <p>You're one click away from turning your research into compelling narratives.</p>
    <p>Confirm your email to activate your account and start building presentations in under 60 seconds.</p>
  `,
  'Welcome to conclusiv',
  'You\'re about to eliminate hours of presentation formatting. Let\'s get you started.',
  'Confirm & Get Started',
  '{{ .ConfirmationURL }}',
  '<strong>What happens next:</strong> Once confirmed, you can paste research, upload documents, or speak your ideas. We\'ll generate a professional narrative presentation in seconds—no design skills required.'
);

// Template 2: Invite user
const inviteUserTemplate = baseTemplate(
  `
    <p>You've been invited to join <strong>conclusiv</strong>.</p>
    <p>Someone on your team wants you to experience what it's like to transform research into presentations in seconds, not hours.</p>
  `,
  'You\'re invited to conclusiv',
  'Join your team and start turning research into compelling narratives instantly.',
  'Accept Invitation',
  '{{ .ConfirmationURL }}',
  '<strong>What you\'ll get:</strong> Voice or paste your research, and get a polished narrative presentation in under 60 seconds. No formatting. No design work. Just your insights, beautifully structured.'
);

// Template 3: Magic link
const magicLinkTemplate = baseTemplate(
  `
    <p>Click below to sign in to your conclusiv account. No password needed—this link is your key.</p>
    <p>This link expires in 1 hour for security.</p>
  `,
  'Sign in to conclusiv',
  'One-click access to your narratives. No password required.',
  'Sign In Now',
  '{{ .ConfirmationURL }}',
  '<strong>Quick access:</strong> Your narratives are waiting. Sign in and pick up where you left off—or start something new in seconds.'
);

// Template 4: Change email address
const changeEmailTemplate = baseTemplate(
  `
    <p>You've requested to change your email address for your conclusiv account.</p>
    <p>Click below to verify your new email and complete the change. Your narratives and settings will remain exactly as they are.</p>
  `,
  'Verify your new email',
  'Confirm your new email address to keep your account secure and accessible.',
  'Verify New Email',
  '{{ .ConfirmationURL }}',
  '<strong>Note:</strong> If you didn\'t request this change, you can safely ignore this email. Your account remains secure.'
);

// Template 5: Reset password
const resetPasswordTemplate = baseTemplate(
  `
    <p>We received a request to reset your password for your conclusiv account.</p>
    <p>Click below to create a new password and regain access to your narratives. This link expires in 1 hour.</p>
  `,
  'Reset your password',
  'Get back to building narratives. Create a new password in seconds.',
  'Reset Password',
  '{{ .ConfirmationURL }}',
  '<strong>Security note:</strong> If you didn\'t request this reset, you can safely ignore this email. Your password remains unchanged, and your account is secure.'
);

// Create output directory
const outputDir = path.join(__dirname, 'email-templates');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Write templates to files
const templates = [
  { name: 'confirm-signup', content: confirmSignUpTemplate },
  { name: 'invite-user', content: inviteUserTemplate },
  { name: 'magic-link', content: magicLinkTemplate },
  { name: 'change-email', content: changeEmailTemplate },
  { name: 'reset-password', content: resetPasswordTemplate },
];

templates.forEach(({ name, content }) => {
  const filePath = path.join(outputDir, `${name}.html`);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`✅ Generated: ${filePath}`);
});

// Create README
const readme = `# Conclusiv Email Templates for Supabase

Beautiful, branded email templates that match the conclusiv aesthetic—dark, cinematic, and professional. These templates get users excited about using the tool with specific benefits and clear next steps.

## Generated Templates

1. **confirm-signup.html** - Welcome email with excitement about getting started
2. **invite-user.html** - Team invitation with clear value proposition
3. **magic-link.html** - Passwordless sign-in with quick access messaging
4. **change-email.html** - Email verification with security reassurance
5. **reset-password.html** - Password reset with clear security messaging

## How to Use

1. **Add to Supabase**:
   - Go to your [Supabase Dashboard](https://app.supabase.com)
   - Navigate to **Authentication** > **Email Templates**
   - For each template:
     - Open the corresponding HTML file from this directory
     - Copy the entire HTML content (logo is already embedded as base64)
     - Paste it into the corresponding template field in Supabase
     - Click **Save**

**Note:** The conclusiv logo is already embedded in each template as a base64 data URI, so no additional hosting is required.

## Template Variables

The templates use Supabase's built-in template variables:
- \`{{ .ConfirmationURL }}\` - The confirmation/reset link (automatically replaced by Supabase)
- \`{{ .Email }}\` - User's email address (if needed)

## Brand Colors

- Primary/Shimmer Start: Light yellowish-green (#E2FFC4) - HSL: 78 100% 83%
- Shimmer End/Accent: Dark teal-green (#35745C) - HSL: 157 35% 28%
- Background: Deep Dark (#050505) - HSL: 0 0% 2%
- Card: Elevated (#0A0A0A) - HSL: 0 0% 4%
- Text: Light (#FAFAFA) - HSL: 0 0% 98%
- Text Muted: (#B8B8B8) - HSL: 0 0% 72%

The brand uses a green-to-teal gradient that matches the conclusiv logo.

## Brand Voice

These templates use:
- **Specific benefits** - "60 seconds" not "quickly"
- **Clear value** - "Transform research into narratives" not generic messaging
- **Excitement** - Get users excited about what they'll unlock
- **No buzzwords** - Plain English, concrete benefits
- **Professional but energetic** - Match the conclusiv brand personality

## Regenerating Templates

To regenerate these templates, run:
\`\`\`bash
node scripts/generate-email-templates.js
\`\`\`
`;

fs.writeFileSync(path.join(outputDir, 'README.md'), readme, 'utf8');
console.log(`✅ Generated: ${path.join(outputDir, 'README.md')}`);

console.log('\n✨ All email templates generated successfully!');
console.log(`📁 Templates saved to: ${outputDir}`);
console.log('\n📋 Next steps:');
console.log('1. Open each HTML file in the email-templates/ directory');
console.log('2. Copy the HTML content');
console.log('3. Paste into Supabase Dashboard > Authentication > Email Templates');
console.log('4. Save each template\n');
