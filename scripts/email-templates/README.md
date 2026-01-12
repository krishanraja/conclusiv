# Conclusiv Email Templates for Supabase

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
- `{{ .ConfirmationURL }}` - The confirmation/reset link (automatically replaced by Supabase)
- `{{ .Email }}` - User's email address (if needed)

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
```bash
node scripts/generate-email-templates.js
```
